import React, { useState, useEffect, useRef } from 'react';
import { Upload, Sparkles, Loader2, Download, LayoutTemplate, ImageIcon, AlertCircle, History, X, ChevronLeft, Settings, Trash2 } from 'lucide-react';

// === Google Fonts ===
const GOOGLE_FONTS = `@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Cinzel:wght@700;900&family=Cormorant+Garamond:ital,wght@0,600;1,600&family=Montserrat:wght@300;800;900&family=Noto+Serif+TC:wght@400;700;900&family=Oswald:wght@500;700&family=Playfair+Display:ital,wght@0,700;0,900;1,700&family=Space+Mono:ital,wght@0,700;1,700&display=swap');`;

// === API 預設配置 (完全清空) ===
const DEFAULT_API_SETTINGS = {
  apiBase: "",
  apiKey: "", 
  model: ""
};

const COMMON_MODELS = [
  "gemini-2.5-pro-cli",
  "gemini-1.5-pro-latest",
  "gpt-4o",
  "gpt-4-turbo",
  "gpt-3.5-turbo",
  "claude-3-opus-20240229",
  "claude-3-sonnet-20240229"
];

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });

const fetchAi = async (payload, apiSettings, { requireJsonObject = false } = {}) => {
  const body = { model: apiSettings.model, ...payload };
  if (requireJsonObject) body.response_format = { type: "json_object" };
  const res = await fetch(`${apiSettings.apiBase.replace(/\/$/, '')}/chat/completions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiSettings.apiKey}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `API Error (${res.status})`);
  }
  return await res.json();
};

const normalizeMessageContent = (raw) => {
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (Array.isArray(raw)) {
    return raw
      .map((part) => {
        if (typeof part === "string") return part;
        if (part && typeof part === "object" && typeof part.text === "string") return part.text;
        return "";
      })
      .join("");
  }
  if (typeof raw === "object" && raw !== null && typeof raw.text === "string") return raw.text;
  return String(raw);
};

const parseAssistantJson = (apiRes) => {
  const raw = normalizeMessageContent(apiRes?.choices?.[0]?.message?.content);
  if (!raw.trim()) throw new Error("模型未回傳內容");
  const cleaned = raw.replace(/```json\n?/gi, "").replace(/```/g, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    throw new Error(`JSON 解析失敗: ${e.message}`);
  }
};

const toDisplayString = (v) => {
  if (v == null || v === "") return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return "";
  }
};

// 色彩亮度與對比度計算工具
const parseColorToLuminance = (colorStr) => {
  if (!colorStr || typeof colorStr !== 'string') return null;
  let s = colorStr.trim().toLowerCase();
  if (s === 'transparent' || s.startsWith('rgba(0,0,0,0)')) return null;

  let r, g, b;
  if (s.startsWith('#')) {
    let hex = s.substring(1);
    if (hex.length === 3 || hex.length === 4) {
      r = parseInt(hex[0]+hex[0], 16);
      g = parseInt(hex[1]+hex[1], 16);
      b = parseInt(hex[2]+hex[2], 16);
    } else if (hex.length === 6 || hex.length === 8) {
      r = parseInt(hex.substring(0,2), 16);
      g = parseInt(hex.substring(2,4), 16);
      b = parseInt(hex.substring(4,6), 16);
    }
  } else if (s.startsWith('rgb')) {
    let match = s.match(/[\d.]+/g);
    if (match && match.length >= 3) {
      r = parseFloat(match[0]);
      g = parseFloat(match[1]);
      b = parseFloat(match[2]);
    }
  }

  if (r !== undefined && g !== undefined && b !== undefined && !isNaN(r)) {
    let [Rs, Gs, Bs] = [r, g, b].map(c => {
      c /= 255;
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * Rs + 0.7152 * Gs + 0.0722 * Bs;
  }
  return null;
};

// === 頂尖設計流派配置 ===
const STYLES_CONFIG = [
  { id: 'minimal', name: 'Minimalist (極簡主義)', context: 'Kenya Hara style. Delicate fonts, immense negative space, ultra-thin lines. Colors: off-white, beige.' },
  { id: 'magazine', name: 'Magazine (時尚雜誌)', context: 'Vogue editorial style. Dramatic scaling, bold serifs, high-contrast text backgrounds.' },
  { id: 'cyberpunk', name: 'Cyberpunk (賽博龐克)', context: 'Advanced HUD UI. Neon colors. Tech crosshairs, grids. Chamfered diagonal cuts (polygons). Dark backgrounds.' },
  { id: 'corporate', name: 'Corporate (瑞士設計)', context: 'Swiss Design. Thick solid text blocks (red/black), strict grid alignment. Highly readable.' },
  { id: 'elegant', name: 'Elegant (古典奢華)', context: 'Didone typefaces. Thin gold frames, classical symmetry, sophisticated luxury.' },
  { id: 'popart', name: 'Pop Art (普普藝術)', context: 'Bright primary colors. Halftone dot backgrounds. Thick bold borders.' },
  { id: 'nature', name: 'Nature (自然有機)', context: 'Organic flowing blobs, earth tones. Soft, peaceful typography.' },
  { id: 'retro', name: 'Retro (復古膠片)', context: 'Vintage 70s aesthetics. Muted warm colors. Polaroid-style borders.' }
];

const SIZES = [
  { id: 'auto', aspect: 'auto', icon: '🖼️', labelKey: 'sizeAuto' },
  { id: '1/1', aspect: '1/1', icon: '■', labelKey: 'size11' },
  { id: '4/5', aspect: '4/5', icon: '▯', labelKey: 'size45' },
  { id: '9/16', aspect: '9/16', icon: '⌸', labelKey: 'size916' }
];

const TRANSLATIONS = {
  zh: {
    appTitle: 'DesignMind', appSub: 'PRO', langToggle: 'English',
    step1: '01 / 視覺與文案', uploadImage: '上傳視覺資產', changeImage: '更換主視覺',
    rawIdeaPlaceholder: '輸入您的靈感或段落...', exampleBtn: '範例文案', enrichBtn: '優化文案', ideaBtn: 'AI 發想',
    step2: '02 / 藝術指導風格', step3: '03 / 排版結構與模式',
    modeBg: '底圖模式', modeInset: '素材模式', generate: '開始演算排版',
    previewTitle: '高階渲染預覽', export: '匯出畫質', awaiting: '等待您的靈感輸入',
    errorNoAssets: '請確認上傳圖片並填寫文案', history: '歷史紀錄', noHistory: '尚無生成紀錄',
    sizeAuto: '原圖', size11: '1:1', size45: '4:5', size916: '9:16',
    recommendBtn: 'AI 推薦',
    settingsTitle: 'API 系統設定', settingsSave: '已自動儲存',
    delete: '刪除紀錄'
  },
  en: {
    appTitle: 'DesignMind', appSub: 'PRO', langToggle: '繁體中文',
    step1: '01 / Assets & Copy', uploadImage: 'Upload Visuals', changeImage: 'Change Visuals',
    rawIdeaPlaceholder: 'Enter your inspiration...', exampleBtn: 'Example', enrichBtn: 'Enhance', ideaBtn: 'Ideate',
    step2: '02 / Art Direction', step3: '03 / Canvas & Mode',
    modeBg: 'Full Bleed', modeInset: 'Geometric Inset', generate: 'Generate Layouts',
    previewTitle: 'Live Render Preview', export: 'Export HQ', awaiting: 'Awaiting Inspiration',
    errorNoAssets: 'Please upload image and enter text.', history: 'History', noHistory: 'No history yet',
    sizeAuto: 'Original', size11: '1:1', size45: '4:5', size916: '9:16',
    recommendBtn: 'Auto Suggest',
    settingsTitle: 'API Settings', settingsSave: 'Auto Saved',
    delete: 'Delete Record'
  }
};

const InlineSpinner = ({ className }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

export default function DesignMindApp({ onBackToRenderFlow }) {
  const [uiLang, setUiLang] = useState('zh');
  const t = TRANSLATIONS[uiLang];

  const [apiSettings, setApiSettings] = useState(DEFAULT_API_SETTINGS);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [originalRatio, setOriginalRatio] = useState('1/1');
  const [rawText, setRawText] = useState('');
  const [copyLang, setCopyLang] = useState('zh-TW'); 
  const [selectedStyle, setSelectedStyle] = useState(STYLES_CONFIG[0].id);
  const [layoutSize, setLayoutSize] = useState('auto');
  const [imageMode, setImageMode] = useState('inset'); 
  const [exportScale, setExportScale] = useState(2);
  
  const [aiOptions, setAiOptions] = useState([]);
  const [activeOptionIndex, setActiveOptionIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState('');

  const [recommendedStyle, setRecommendedStyle] = useState(null);
  const [recommendReasonText, setRecommendReasonText] = useState('');
  const [isRecommending, setIsRecommending] = useState(false);

  const [historyList, setHistoryList] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const previewRef = useRef(null);
  const containerRef = useRef(null);
  const [previewScale, setPreviewScale] = useState(1);

  // 初始化：變更 Key 以確保用戶載入到清空的預設值
  useEffect(() => {
    const saved = localStorage.getItem('designmind_api_settings_v3');
    if (saved) {
      setApiSettings(JSON.parse(saved));
    } else {
      setIsSettingsOpen(true); 
    }
    
    const savedHistory = localStorage.getItem('designmind_history');
    if (savedHistory) {
      setHistoryList(JSON.parse(savedHistory));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('designmind_api_settings_v3', JSON.stringify(apiSettings));
  }, [apiSettings]);

  useEffect(() => {
    localStorage.setItem('designmind_history', JSON.stringify(historyList));
  }, [historyList]);

  const handleApiSettingChange = (e) => {
    const { name, value } = e.target;
    setApiSettings(prev => ({ ...prev, [name]: value }));
  };

  const getCanvasSize = () => {
    let ratioStr = layoutSize === 'auto' ? originalRatio : SIZES.find(s => s.id === layoutSize)?.aspect;
    if (!ratioStr || !ratioStr.includes('/')) ratioStr = '1/1';
    const [rw, rh] = ratioStr.split('/').map(Number);
    return { w: 800, h: (800 / (rw || 1)) * (rh || 1) };
  };

  const { w: baseW, h: baseH } = getCanvasSize();

  const segmentText = (text) => {
    const isLatin = (ch) => /[a-zA-Z0-9]/.test(ch);
    const segments = [];
    let buffer = "";
    let lastIsLatin = null;
    for (const char of text) {
      const currentIsLatin = isLatin(char);
      if (lastIsLatin !== null && currentIsLatin !== lastIsLatin) {
        segments.push({ text: buffer, latin: lastIsLatin });
        buffer = char;
      } else { buffer += char; }
      lastIsLatin = currentIsLatin;
    }
    if (buffer) segments.push({ text: buffer, latin: lastIsLatin });
    return segments;
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.async = true;
    document.body.appendChild(script);
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        const { width, height } = entries[0].contentRect;
        setPreviewScale(Math.max(Math.min((width - 64) / baseW, (height - 64) / baseH, 1), 0.1));
      }
    });
    if (containerRef.current) observer.observe(containerRef.current);
    return () => { observer.disconnect(); if(document.body.contains(script)) document.body.removeChild(script); };
  }, [baseW, baseH]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      const img = new Image();
      img.onload = () => setOriginalRatio(`${img.naturalWidth}/${img.naturalHeight}`);
      img.src = URL.createObjectURL(file);
      setRecommendedStyle(null);
      setRecommendReasonText('');
    }
  };

  const checkApiKey = () => {
    if (!apiSettings.apiKey || !apiSettings.apiBase || !apiSettings.model) {
      setError("請先在右上角設定中輸入完整的 API 資訊");
      setIsSettingsOpen(true);
      return false;
    }
    return true;
  };

  const handleProcessText = async (mode) => {
    if (mode === "enrich" && !rawText.trim()) return;
    if (mode === "idea" && !imageFile) {
      setError("請先上傳圖片再使用 AI 發想");
      return;
    }
    if (!checkApiKey()) return;

    setIsProcessingText(true);
    setError("");
    try {
      const jsonHint = '只回傳一個 JSON 物件（不要 markdown），格式：{"options":["標語1","標語2","標語3"]}，陣列必須恰好 3 個字串。';
      const promptText = mode === "enrich"
          ? `你是視覺文案大師。將這段想法優化成 3 個不同側重的高級廣告標語。語系要求：${copyLang}。\n想法：${rawText.trim()}\n${jsonHint}`
          : `你是視覺文案大師。請根據使用者上傳的圖片，發想 3 個驚艷的廣告標語。語系要求：${copyLang}。\n${jsonHint}`;

      let payload = { messages: [{ role: "user", content: promptText }], temperature: 0.7 };
      if (mode === "idea" && imageFile) {
        const dataUrl = await fileToDataUrl(imageFile);
        payload.messages[0].content = [
          { type: "text", text: promptText },
          { type: "image_url", image_url: { url: dataUrl } },
        ];
      }

      const res = await fetchAi(payload, apiSettings, { requireJsonObject: false });
      const data = parseAssistantJson(res);
      if (!Array.isArray(data.options)) throw new Error('回傳格式錯誤');
      setRawText(data.options.slice(0, 3).join("\n\n"));
    } catch (e) { setError(`文案生成失敗: ${e.message}`); } finally { setIsProcessingText(false); }
  };

  const handleRecommendStyle = async () => {
    if (!imageFile) { setError(t.errorNoAssets); return; }
    if (!checkApiKey()) return;

    setIsRecommending(true); setError('');
    try {
      const dataUrl = await fileToDataUrl(imageFile);
      const styleList = STYLES_CONFIG.map(s => `${s.id}: ${s.name}`).join(', ');
      const promptText = `You are a world-class Art Director. Analyze this image and choose the ONE most suitable design style from the following list to match its vibe, colors, and composition:
      [${styleList}]
      Return ONLY a JSON object: {"recommended_id": "the_id", "reason": "A short 1-sentence reason in ${copyLang} explaining why this style fits the image perfectly."}`;

      const res = await fetchAi({
        messages: [{ role: "user", content: [{ type: "text", text: promptText }, { type: "image_url", image_url: { url: dataUrl } }] }],
        temperature: 0.5
      }, apiSettings, { requireJsonObject: false });
      
      const data = parseAssistantJson(res);
      if (data.recommended_id && STYLES_CONFIG.some(s => s.id === data.recommended_id)) {
        setRecommendedStyle(data.recommended_id);
        setSelectedStyle(data.recommended_id);
        setRecommendReasonText(toDisplayString(data.reason));
      }
    } catch (e) {
      setError(`風格推薦失敗: ${e?.message ?? String(e)}`);
    } finally {
      setIsRecommending(false);
    }
  };

  const handleGenerate = async () => {
    if (!imagePreview || !rawText.trim()) { setError("請先上傳圖片並輸入文案"); return; }
    if (!checkApiKey()) return;

    setError(''); setIsGenerating(true);
    const style = STYLES_CONFIG.find(s => s.id === selectedStyle);

    try {
      // 強化提示詞：強調邊界安全、放寬形狀限制、強調對比
      const prompt = `You are a world-class Art Director designing an award-winning poster.
      Style: ${style.name} (${style.context}).
      Source Text: """${rawText}""". Language: ${copyLang}.
      
      CRITICAL FIXES & RULES (DO NOT IGNORE):
      1. ANCHOR POINTS & BOUNDARIES (CRITICAL): 
         - For ALL elements ("image", "shapes", "texts"), keep "top" and "left" between 15% and 85% to NEVER bleed off the canvas!
         - For "texts", "left" defines the X-axis anchor based on textAlign.
      2. SEMANTIC LINE BREAKS (CRITICAL): Text containers have \`whiteSpace: 'pre'\` and will NEVER auto-wrap! You MUST manually insert '\\n' at punctuation or natural reading pauses to break lines gracefully. 
      3. SHAPES & MASKS: Choose "mask" (circle, square, blob, etc.) naturally based on the Style. Do not constrain to only squares. If using 1:1 masks like circle, provide ONLY "width".
      4. CONTRAST & LEGIBILITY (CRITICAL): Text MUST be readable. If placing text over an image without "textBgColor", you MUST use a highly contrasting "color". Do not use text shadows on flat solid backgrounds.
      5. NO OVERLAPPING TEXTS: Distribute text objects to different zones.
      6. OUTPUT EXACTLY 4 DIFFERENT LAYOUTS in the "layouts" array.
      
      Return ONLY a JSON object:
      {
        "layouts": [
          {
            "bgColor": "Hex string",
            "image": { "mask": "circle|pill|arch|blob|diamond|square", "top": "string%", "left": "string%", "width": "string%", "height": "string%", "filter": "CSS filter string or none" },
            "texts": [
              { "content": "Logical phrases\\nwith smart breaks", "top": "string%", "left": "string%", "width": "auto", "fontSize": number (0.02-0.20), "color": "Hex", "fontWeight": 400|700|900, "letterSpacing": "string", "textAlign": "left|center|right", "fontFamily": "Montserrat|Bebas Neue|Oswald", "textBgColor": "Hex or transparent", "textPadding": "string or 0px", "textShadow": "CSS string or none", "vertical": boolean }
            ],
            "shapes": [
              { "type": "box|circle|line", "top": "string%", "left": "string%", "width": "string%", "height": "string%", "backgroundColor": "Hex", "cssBackground": "gradient or none", "clipPath": "css or none", "zIndex": 2 }
            ]
          }
        ]
      }`;

      const res = await fetchAi({ messages: [{ role: "user", content: prompt }], temperature: 0.8 }, apiSettings, { requireJsonObject: false });
      const data = parseAssistantJson(res);
      let layouts = Array.isArray(data.layouts) ? data.layouts : (Array.isArray(data) ? data : [data]);
      
      while (layouts.length > 0 && layouts.length < 4) {
        let cloned = JSON.parse(JSON.stringify(layouts[layouts.length - 1]));
        if (cloned.bgColor) {
           cloned.bgColor = (cloned.bgColor.toLowerCase() === '#ffffff' || cloned.bgColor.toLowerCase() === '#fff') ? '#f0f0f0' : 
                            (cloned.bgColor.toLowerCase() === '#000000' || cloned.bgColor.toLowerCase() === '#111' ? '#222222' : '#ffffff');
        }
        layouts.push(cloned);
      }
      
      if (!layouts.length) throw new Error('解析版型失敗');
      
      const finalLayouts = layouts.slice(0, 4);
      setAiOptions(finalLayouts);
      setActiveOptionIndex(0);

      setHistoryList(prev => [{
        id: Date.now(),
        time: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
        imagePreview,
        imageFile,
        originalRatio,
        rawText,
        selectedStyle,
        layoutSize,
        imageMode,
        layouts: finalLayouts
      }, ...prev]);

    } catch (err) {
      setError(`演算失敗: ${err.message}`);
    } finally { setIsGenerating(false); }
  };

  const handleRestoreHistory = (hist) => {
    setImagePreview(hist.imagePreview);
    setImageFile(hist.imageFile);
    setOriginalRatio(hist.originalRatio);
    setRawText(hist.rawText);
    setSelectedStyle(hist.selectedStyle);
    setLayoutSize(hist.layoutSize);
    setImageMode(hist.imageMode);
    setAiOptions(hist.layouts);
    setActiveOptionIndex(0);
    setShowHistory(false);
  };

  const handleDeleteHistory = (e, id) => {
    e.stopPropagation();
    setHistoryList(prev => prev.filter(h => h.id !== id));
  };

  const handleDownload = async () => {
    if (!previewRef.current || !window.html2canvas) return;
    setIsDownloading(true);
    try {
      await document.fonts.ready;
      const canvas = await window.html2canvas(previewRef.current, { 
        useCORS: true, scale: exportScale, backgroundColor: null,
        width: baseW, height: baseH, windowWidth: baseW, windowHeight: baseH, logging: false
      });
      const link = document.createElement('a');
      link.download = `DesignMind_${selectedStyle}_x${exportScale}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (e) { setError("匯出失敗 / Export Error"); } finally { setIsDownloading(false); }
  };

  const renderText = (tObj, fSize, dynamicColor, dynamicTextShadow) => {
    const fonts = `"${tObj.fontFamily || 'Montserrat'}", sans-serif`;

    const style = {
      fontFamily: fonts, 
      color: dynamicColor || tObj.color || '#fff', 
      fontSize: `${fSize}px`, 
      fontWeight: tObj.fontWeight || 800,
      letterSpacing: tObj.letterSpacing || 'normal', 
      textAlign: tObj.textAlign || 'left',
      textShadow: dynamicTextShadow, 
      whiteSpace: 'pre', 
      lineHeight: 1.3 
    };

    if (tObj.vertical) {
      return (
        <div style={{ ...style, display: 'flex', flexDirection: 'row-reverse', gap: `${fSize * 0.4}px` }}>
          {String(tObj.content).split('\\n').map((line, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {segmentText(line).map((seg, si) => (
                seg.latin 
                  ? <span key={si} style={{ transform: 'rotate(90deg)', display: 'inline-block', margin: `${fSize*0.2}px 0` }}>{seg.text}</span>
                  : seg.text.split('').map((c, ci) => <span key={ci}>{c}</span>)
              ))}
            </div>
          ))}
        </div>
      );
    }
    return <div style={style}>{String(tObj.content).replace(/\\n/g, '\n')}</div>;
  };

  const renderLayout = (option, scaleOverride = null) => {
    if (!option) return null;
    const minDim = Math.min(baseW, baseH);
    const isBg = imageMode === 'bg';
    const safePercent = (val, fallback) => (val && String(val).includes('%')) ? val : fallback;

    const getClipPath = (mask) => {
      if (isBg) return 'none';
      switch(mask) {
        case 'circle': return 'circle(50% at 50% 50%)';
        case 'pill': return 'inset(0% 0% round 999px)';
        case 'arch': return 'inset(0% 0% 0% 0% round 999px 999px 0 0)';
        case 'blob': return 'polygon(15% 0%, 85% 0%, 100% 15%, 100% 85%, 85% 100%, 15% 100%, 0% 85%, 0% 15%)';
        case 'diamond': return 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)';
        case 'square': return 'none';
        default: return 'none';
      }
    };

    const containerStyle = { 
      width: baseW, height: baseH, position: 'relative', overflow: 'hidden', 
      backgroundColor: option.bgColor || '#111', boxSizing: 'border-box' 
    };

    if (scaleOverride) {
      containerStyle.transform = `scale(${scaleOverride})`;
      containerStyle.transformOrigin = 'top left';
    }

    const is1to1Shape = ['circle', 'square', 'blob'].includes(option.image?.mask);
    const imgWidthStr = safePercent(option.image?.width, '60%');
    const imgHeightStr = is1to1Shape ? 'auto' : safePercent(option.image?.height, '60%');
    const imgAspectRatio = is1to1Shape ? '1 / 1' : 'auto';

    return (
      <div style={containerStyle}>
        
        {isBg && (
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
            backgroundImage: `url("${imagePreview}")`, 
            backgroundSize: 'cover', backgroundPosition: 'center',
            filter: option.image?.filter && option.image?.filter !== 'none' ? option.image.filter : 'none',
            opacity: Math.max(0.7, option.image?.opacity ?? 1),
            zIndex: 1
          }} />
        )}

        {option.shapes?.map((s, i) => (
          <div key={`s-${i}`} style={{ 
            position: 'absolute', 
            top: safePercent(s.top, '50%'), 
            left: safePercent(s.left, '50%'), 
            transform: 'translate(-50%, -50%)', 
            width: safePercent(s.width, '10%'), 
            height: safePercent(s.height, '10%'), 
            backgroundColor: s.backgroundColor || s.color || 'transparent', 
            background: s.cssBackground || s.backgroundColor || s.color || 'transparent',
            border: s.border || 'none',
            borderRadius: s.type === 'circle' ? '50%' : '0', 
            clipPath: s.clipPath || 'none',
            boxShadow: s.boxShadow || 'none',
            mixBlendMode: s.mixBlendMode || 'normal',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: s.opacity ?? 0.8, 
            zIndex: s.zIndex ?? (isBg ? 2 : 2) 
          }}>
             {s.content && (
               <span style={{
                 color: s.textColor || '#fff', fontSize: s.fontSize || '12px', 
                 fontFamily: `"${s.fontFamily || 'Space Mono'}", monospace`,
                 whiteSpace: 'nowrap', letterSpacing: '0.1em'
               }}>{s.content}</span>
             )}
          </div>
        ))}
        
        {!isBg && (
          <div style={{ 
            position: 'absolute', 
            top: safePercent(option.image?.top, '50%'), 
            left: safePercent(option.image?.left, '50%'),
            transform: 'translate(-50%, -50%)', 
            width: imgWidthStr, 
            height: imgHeightStr,
            aspectRatio: imgAspectRatio, 
            filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))', 
            zIndex: 5,
            display: 'flex' 
          }}>
            <div style={{
              flex: 1, 
              backgroundImage: `url("${imagePreview}")`, 
              backgroundSize: 'cover', 
              backgroundPosition: 'center',
              clipPath: option.image?.clipPath && option.image?.clipPath !== 'none' ? option.image.clipPath : getClipPath(option.image?.mask), 
              border: option.image?.border || 'none',
              filter: option.image?.filter && option.image?.filter !== 'none' ? option.image.filter : 'none',
              opacity: Math.max(0.7, option.image?.opacity ?? 1),
              borderRadius: option.image?.mask === 'square' ? '12px' : '0'
            }} />
          </div>
        )}

        {option.texts?.map((t, i) => {
          const topVal = parseFloat(t.top) || 10;
          const leftVal = parseFloat(t.left) || 10;
          let leftStyle = `${leftVal}%`;
          let rightStyle = 'auto';
          
          let transformX = '0';
          let transformY = '0'; // 智慧 Y 軸錨定
          
          // X 軸智慧對齊
          if (t.textAlign === 'center') {
            transformX = '-50%';
          } else if (t.textAlign === 'right') {
            rightStyle = `${100 - leftVal}%`;
            leftStyle = 'auto';
          }

          // Y 軸智慧對齊 (防出界)：越靠下面，就以底邊向上生長
          if (topVal >= 70) {
            transformY = '-100%';
          } else if (topVal >= 40) {
            transformY = '-50%';
          }

          // 智能對比度檢測與動態護盾
          let textLum = parseColorToLuminance(t.color || '#ffffff');
          let bgLum = parseColorToLuminance(t.textBgColor);
          if (bgLum === null && imageMode !== 'bg') {
            bgLum = parseColorToLuminance(option.bgColor);
          }

          let dynamicTextShadow = t.textShadow && t.textShadow !== 'none' ? t.textShadow : 'none';
          let dynamicColor = t.color;

          // 1. 如果有明確底色，計算對比度並強制反轉顏色
          if (textLum !== null && bgLum !== null) {
            const lighter = Math.max(textLum, bgLum);
            const darker = Math.min(textLum, bgLum);
            const contrast = (lighter + 0.05) / (darker + 0.05);

            if (contrast < 3.0) {
                if (bgLum > 0.5) {
                    dynamicColor = '#111111'; // 強制變黑
                    dynamicTextShadow = 'none';
                } else {
                    dynamicColor = '#ffffff'; // 強制變白
                    dynamicTextShadow = '0px 2px 10px rgba(0,0,0,0.8)';
                }
            }
          } 
          // 2. 如果無法計算底色 (例如壓在複雜圖片上)，且沒給陰影，強制注入保護光暈
          else if (bgLum === null && dynamicTextShadow === 'none') {
            if (textLum !== null && textLum < 0.5) {
                // 如果文字偏暗，加白色發光
                dynamicTextShadow = '0px 0px 15px rgba(255,255,255,0.9), 0px 0px 30px rgba(255,255,255,0.7)';
            } else {
                // 如果文字偏亮，加黑色發光
                dynamicTextShadow = '0px 0px 15px rgba(0,0,0,0.9), 0px 0px 30px rgba(0,0,0,0.7)';
            }
          }

          return (
            <div key={`t-${i}`} style={{ 
              position: 'absolute', 
              top: `${topVal}%`, 
              left: leftStyle,
              right: rightStyle,
              transform: `translate(${transformX}, ${transformY})`, // 完全錨定
              width: 'max-content',
              backgroundColor: t.textBgColor && t.textBgColor !== 'transparent' ? t.textBgColor : 'transparent',
              padding: t.textPadding || '0px',
              borderRadius: t.textBgColor && t.textBgColor !== 'transparent' ? '8px' : '0px',
              zIndex: 10,
              display: 'flex', flexDirection: 'column', boxSizing: 'border-box'
            }}>
              {renderText(t, minDim * (t.fontSize || 0.08), dynamicColor, dynamicTextShadow)}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f7f6f3] text-slate-900 font-sans flex flex-col overflow-hidden relative">
      <style dangerouslySetInnerHTML={{__html: GOOGLE_FONTS}} />
      
      {/* === API 設定側邊欄 === */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-[200]" onClick={() => setIsSettingsOpen(false)}>
          <div 
            className="absolute top-0 left-0 w-80 h-full bg-white shadow-2xl flex flex-col transition-transform" 
            onClick={e => e.stopPropagation()}
          >
            <div className="px-6 py-5 border-b border-stone-100 flex justify-between items-center bg-stone-50">
              <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-stone-800">
                <Settings className="w-4 h-4" /> {t.settingsTitle}
              </h2>
              <button onClick={() => setIsSettingsOpen(false)} className="p-1.5 bg-stone-200 rounded-full hover:bg-stone-300 transition-colors">
                <X className="w-4 h-4 text-stone-600"/>
              </button>
            </div>
            
            <div className="p-6 flex-1 overflow-y-auto space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">API Base</label>
                <input
                  type="text"
                  name="apiBase"
                  value={apiSettings.apiBase}
                  onChange={handleApiSettingChange}
                  placeholder="https://api.openai.com/v1"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">API Key</label>
                <input
                  type="password"
                  name="apiKey"
                  value={apiSettings.apiKey}
                  onChange={handleApiSettingChange}
                  placeholder="sk-..."
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all font-mono"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-stone-500 uppercase tracking-wider">Model</label>
                <input
                  type="text"
                  name="model"
                  list="models-list"
                  value={apiSettings.model}
                  onChange={handleApiSettingChange}
                  placeholder="例如: gpt-4o"
                  className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm transition-all"
                />
                <datalist id="models-list">
                  {COMMON_MODELS.map(m => <option key={m} value={m} />)}
                </datalist>
              </div>
            </div>

            <div className="p-4 border-t border-stone-100 bg-stone-50 text-center">
              <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">{t.settingsSave}</p>
            </div>
          </div>
        </div>
      )}

      {/* === 歷史紀錄 Modal === */}
      {showHistory && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6 sm:p-12">
          <div className="bg-white w-full max-w-5xl max-h-full rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden">
            <div className="px-8 py-6 border-b border-stone-100 flex justify-between items-center bg-stone-50/50">
              <h2 className="text-sm font-black uppercase tracking-[0.2em] flex items-center gap-2"><History className="w-4 h-4"/> {t.history}</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 bg-stone-200 rounded-full hover:bg-stone-300 transition-colors"><X className="w-4 h-4"/></button>
            </div>
            <div className="p-8 overflow-y-auto flex-1 bg-stone-100 custom-scrollbar">
              {historyList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-stone-400">
                  <LayoutTemplate className="w-12 h-12 mb-4 opacity-50"/>
                  <p className="text-xs font-bold uppercase tracking-widest">{t.noHistory}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                  {historyList.map(hist => {
                     const thumbRatioW = 120;
                     const thumbRatioH = 120 * (baseH / baseW);
                     return (
                      <div key={hist.id} onClick={() => handleRestoreHistory(hist)} className="bg-white p-4 rounded-3xl shadow-sm border border-stone-200 hover:border-indigo-500 hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden">
                        
                        {/* 刪除按鈕 */}
                        <button 
                          onClick={(e) => handleDeleteHistory(e, hist.id)}
                          className="absolute top-3 left-3 bg-red-500 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10 hover:bg-red-600 shadow-md"
                          title={t.delete}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>

                        <div className="w-full aspect-square bg-stone-100 rounded-2xl overflow-hidden mb-4 relative flex items-center justify-center">
                           <div style={{ width: thumbRatioW, height: thumbRatioH, overflow: 'hidden', borderRadius: '8px' }}>
                             {renderLayout(hist.layouts[0], thumbRatioW / baseW)}
                           </div>
                           <div className="absolute top-2 right-2 bg-black/60 text-white text-[9px] px-2 py-1 rounded-full font-bold z-10">{hist.time}</div>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mb-1">{STYLES_CONFIG.find(s => s.id === hist.selectedStyle)?.name.split(' ')[0]}</p>
                        <p className="text-xs font-medium text-stone-600 line-clamp-2">{hist.rawText}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <header className="bg-white border-b border-stone-200 px-4 py-5 sm:px-8 flex justify-between items-center shadow-sm z-50 gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {onBackToRenderFlow ? (
            <button
              type="button"
              onClick={onBackToRenderFlow}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-stone-200 bg-white text-stone-700 shadow-sm transition-colors hover:border-indigo-200 hover:bg-indigo-50/50"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : null}
          <div className="flex min-w-0 items-center gap-3">
            <div className="inline-flex shrink-0 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 p-2.5 text-white shadow-lg shadow-indigo-500/25">
              <LayoutTemplate className="h-5 w-5" />
            </div>
            <div className="min-w-0 leading-tight">
              <h1 className="text-xl font-black tracking-tighter text-stone-900">
                DESIGN<span className="text-indigo-600">MIND</span>
              </h1>
              <p className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-neutral-400">{t.appSub}</p>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <button onClick={() => setShowHistory(true)} className="flex items-center gap-2 text-[10px] font-bold bg-stone-100 px-4 py-2 rounded-full uppercase tracking-widest text-stone-600 hover:bg-stone-200 transition-colors"><History className="w-3 h-3"/> {t.history}</button>
          <button onClick={() => setUiLang(uiLang==='zh'?'en':'zh')} className="text-[10px] font-bold bg-stone-100 px-4 py-2 rounded-full uppercase tracking-widest text-stone-500 hover:bg-stone-200 transition-colors border-l border-stone-300 ml-2">{t.langToggle}</button>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 transition-colors relative ml-1"
            title={t.settingsTitle}
          >
            <Settings className="h-4 w-4" />
            {(!apiSettings.apiKey || !apiSettings.apiBase || !apiSettings.model) && <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />}
          </button>
        </div>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row gap-6 p-6 h-[calc(100vh-85px)]">
        <section className="w-full lg:w-[380px] flex-shrink-0 flex flex-col gap-5 overflow-y-auto pr-2 custom-scrollbar">
          
          {/* STEP 1 */}
          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">{t.step1}</h3>
              <div className="flex items-center gap-1 bg-stone-50 p-1 rounded-lg">
                {['zh-TW', 'en', 'mix'].map(l => (
                  <button key={l} onClick={() => setCopyLang(l)} className={`px-2 py-1 rounded text-[9px] font-bold uppercase transition-all ${copyLang === l ? 'bg-white shadow-sm text-stone-900' : 'text-stone-400'}`}>{l}</button>
                ))}
              </div>
            </div>
            
            <label className="block w-full h-32 border-2 border-dashed border-stone-200 rounded-[1.5rem] mb-4 cursor-pointer hover:border-stone-400 transition-all relative overflow-hidden group">
              {imagePreview && <img src={imagePreview} className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" alt="" />}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-stone-400 group-hover:text-stone-800 transition-colors">
                <Upload className="w-6 h-6 mb-2" />
                <span className="text-[9px] font-black uppercase tracking-widest bg-white/80 px-3 py-1 rounded-full">{imagePreview ? t.changeImage : t.uploadImage}</span>
              </div>
              <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
            </label>

            <textarea className="w-full h-28 p-4 bg-stone-50 border-none rounded-2xl text-sm resize-none focus:ring-2 focus:ring-stone-200 transition-all font-medium leading-relaxed" placeholder={t.rawIdeaPlaceholder} value={rawText} onChange={e => setRawText(e.target.value)} />
            
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleProcessText('enrich')} disabled={isProcessingText || !rawText.trim()} className="flex-1 py-3 bg-stone-900 text-white rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-800 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                {isProcessingText ? <InlineSpinner className="w-3 h-3" /> : t.enrichBtn}
              </button>
              <button onClick={() => handleProcessText('idea')} disabled={isProcessingText || !imageFile} className="flex-1 py-3 bg-stone-100 text-stone-900 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-stone-200 transition-all disabled:opacity-30 flex items-center justify-center gap-2">
                {isProcessingText ? <InlineSpinner className="w-3 h-3" /> : t.ideaBtn}
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.2em]">{t.step2}</h3>
              <button 
                onClick={handleRecommendStyle} 
                disabled={isRecommending || !imageFile}
                className="flex items-center gap-1 text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded-lg hover:bg-indigo-100 disabled:opacity-50 transition-all"
              >
                {isRecommending ? <InlineSpinner className="w-3 h-3 text-indigo-600" /> : <Sparkles className="w-3 h-3"/>}
                {t.recommendBtn}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {STYLES_CONFIG.map(s => (
                <button 
                  key={s.id} 
                  onClick={() => { setSelectedStyle(s.id); setRecommendReasonText(''); }} 
                  className={`relative p-3.5 rounded-2xl border-2 text-[10px] font-black uppercase tracking-widest transition-all ${selectedStyle === s.id ? 'border-stone-900 bg-stone-900 text-white shadow-lg' : 'border-stone-50 bg-stone-50 hover:border-stone-200 text-stone-600'}`}
                >
                  {s.name.split(' (')[0]}
                  {recommendedStyle === s.id && (
                    <span className="absolute -top-2 -right-2 bg-indigo-500 text-white text-[8px] px-1.5 py-0.5 rounded-full shadow-sm animate-bounce">
                      推薦
                    </span>
                  )}
                </button>
              ))}
            </div>
            {recommendReasonText && (
              <div className="mt-3 p-3 bg-indigo-50/50 border border-indigo-100 rounded-xl text-[10px] text-indigo-700 font-medium leading-relaxed flex items-start gap-2 transition-all">
                <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0" />
                <span>{String(recommendReasonText)}</span>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-stone-100 shadow-sm mt-auto">
             <h3 className="text-[10px] font-black text-stone-400 mb-4 uppercase tracking-[0.2em]">{t.step3}</h3>
             
             <div className="grid grid-cols-2 gap-2 mb-4">
               <button onClick={() => setImageMode('bg')} className={`py-3.5 rounded-2xl border-2 text-[10px] font-black tracking-widest transition-all uppercase ${imageMode === 'bg' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-50 text-stone-500 hover:border-stone-200'}`}>{t.modeBg}</button>
               <button onClick={() => setImageMode('inset')} className={`py-3.5 rounded-2xl border-2 text-[10px] font-black tracking-widest transition-all uppercase ${imageMode === 'inset' ? 'bg-stone-900 text-white border-stone-900' : 'bg-stone-50 border-stone-50 text-stone-500 hover:border-stone-200'}`}>{t.modeInset}</button>
             </div>
             
             <div className="flex gap-2 mb-6">
               {SIZES.map(s => (
                 <button key={s.id} onClick={() => setLayoutSize(s.id)} className={`flex-1 py-2.5 rounded-xl border-2 text-[10px] font-black transition-all ${layoutSize === s.id ? 'border-stone-400 bg-stone-100 text-stone-900' : 'border-transparent bg-stone-50 text-stone-400 hover:bg-stone-100'}`}>{t[s.labelKey]}</button>
               ))}
             </div>

             <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-5 rounded-[1.5rem] font-black text-white bg-indigo-600 shadow-xl hover:bg-indigo-700 active:scale-95 transition-all disabled:bg-stone-200 flex items-center justify-center gap-3 uppercase tracking-[0.2em]">
               {isGenerating ? <InlineSpinner className="w-5 h-5" /> : t.generate}
             </button>
             {error && <p className="text-[10px] text-red-500 font-bold mt-3 text-center bg-red-50 py-2 rounded-lg">{error}</p>}
          </div>
        </section>

        {/* RIGHT PREVIEW */}
        <section className="flex-1 bg-white rounded-[2.5rem] border border-stone-100 overflow-hidden flex flex-col shadow-sm">
          <div className="px-10 py-6 border-b border-stone-50 flex justify-between items-center">
            <h3 className="font-black text-stone-400 text-[10px] uppercase tracking-[0.4em]">{t.previewTitle}</h3>
            <div className="flex items-center gap-4">
              <select value={exportScale} onChange={e => setExportScale(Number(e.target.value))} className="text-[10px] font-black bg-stone-50 border-none rounded-full px-4 py-2.5 outline-none cursor-pointer">
                <option value={1}>1x SD</option><option value={2}>2x HD</option><option value={3}>3x UHD</option>
              </select>
              <button onClick={handleDownload} disabled={!aiOptions.length || isDownloading} className="px-8 py-2.5 text-[10px] bg-stone-900 text-white rounded-full flex items-center gap-2 font-black hover:bg-stone-800 transition-all shadow-md uppercase tracking-widest disabled:opacity-20"><Download className="w-4 h-4"/> {t.export}</button>
            </div>
          </div>
          
          <div ref={containerRef} className="flex-1 relative bg-[#eaeaeb] flex items-center justify-center overflow-hidden p-12 inner-shadow">
            <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
              <div ref={previewRef} style={{ width: baseW, height: baseH }}>
                {renderLayout(aiOptions[activeOptionIndex])}
              </div>
            </div>
            
            {aiOptions.length > 0 ? (
              <div style={{ width: baseW * previewScale, height: baseH * previewScale, boxShadow: '0 60px 100px -20px rgba(0,0,0,0.25)', borderRadius: '4px', overflow: 'hidden', transition: 'all 0.6s cubic-bezier(0.2, 1, 0.3, 1)' }}>
                <div style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>{renderLayout(aiOptions[activeOptionIndex])}</div>
              </div>
            ) : (
              <div className="text-center opacity-20 select-none">
                <LayoutTemplate className="w-24 h-24 mx-auto mb-6" />
                <p className="font-black uppercase tracking-[0.5em] text-2xl italic">{t.awaiting}</p>
              </div>
            )}
          </div>

          <div className="h-44 bg-white border-t border-stone-50 p-6 flex gap-6 overflow-x-auto custom-scrollbar items-center">
            {aiOptions.map((opt, i) => {
              const thumbW = 120;
              const thumbH = 120 * (baseH / baseW);
              return (
                <button key={i} onClick={() => setActiveOptionIndex(i)} 
                  style={{ width: thumbW, height: thumbH }}
                  className={`rounded-2xl overflow-hidden border-2 flex-shrink-0 transition-all relative ${activeOptionIndex === i ? 'border-stone-900 ring-4 ring-stone-200 scale-105 shadow-xl' : 'border-stone-200 hover:border-stone-300'}`}>
                  <div style={{ transform: `scale(${thumbW/baseW})`, transformOrigin: 'top left', width: baseW, height: baseH, pointerEvents: 'none' }}>
                    {renderLayout(opt)}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </main>
      <style>{`.custom-scrollbar::-webkit-scrollbar { height: 6px; } .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e5e5; border-radius: 10px; } .inner-shadow { box-shadow: inset 0 10px 30px rgba(0,0,0,0.02); }`}</style>
    </div>
  );
}