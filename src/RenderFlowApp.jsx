import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Camera, Upload, Download, Copy, ChevronLeft, 
  Wand2, LayoutGrid, Activity, 
  Image as ImageIcon, Loader2, ArrowRight, Settings2,
  Dna, Info, Zap, Hash, History, Trash2, Languages
} from 'lucide-react';
import { pushHistory, getHistory, removeHistory, clearHistory } from './historyStorage';
import { useLocale } from './LocaleContext';

// --- 6 种精选核心构图配置（nameEn / tipEn 为中文的直译） ---
const COMPOSITIONS = [
  { id: 'center', name: '中心点', nameEn: 'Center point', tip: '将主体放置于正中心，营造极简、稳定的秩序感。', tipEn: 'Place the subject at the exact center for a minimal, stable sense of order.' },
  { id: 'thirds_pts', name: '三分点', nameEn: 'Rule-of-thirds points', tip: '视觉黄金点，适合放置人像眼神或产品核心细节。', tipEn: 'Visual sweet spots—place a subject’s eyes or key product details here.' },
  { id: 'symmetry', name: '对称线', nameEn: 'Symmetry line', tip: '利用中轴线创造绝对平衡，适合建筑或静物。', tipEn: 'Use the central axis for perfect balance—suited to architecture or still life.' },
  { id: 'thirds_lines', name: '三分线', nameEn: 'Rule-of-thirds lines', tip: '将地平线或垂直边缘对齐网格线，画面更协调。', tipEn: 'Align the horizon or vertical edges with the grid lines for a more harmonious frame.' },
  { id: 'diagonal', name: '对角线', nameEn: 'Diagonal', tip: '打破沉闷，利用倾斜线引导视觉延伸，增加动感。', tipEn: 'Break visual monotony—use slanted lines to lead the eye and add energy.' },
  { id: 'frame', name: '框架', nameEn: 'Frame', tip: '利用前景形成“画中画”，聚焦主体并增加层次。', tipEn: 'Use the foreground as a picture-in-picture frame to focus the subject and add depth.' }
];

// --- 风格模式（nameEn 为中文名称的直译） ---
const STYLE_MODES = [
  { id: 'original', name: '原图预览', nameEn: 'Original preview', icon: ImageIcon },
  { id: 'lineart', name: 'AI 手绘线稿', nameEn: 'AI hand-drawn line art', icon: Wand2 },
  { id: 'thermal', name: '高对比热感', nameEn: 'High-contrast thermal look', icon: Dna },
  { id: 'mosaic', name: '像素效果', nameEn: 'Pixel effect', icon: LayoutGrid },
  { id: 'halftone', name: '点阵印刷', nameEn: 'Halftone print', icon: Activity },
  { id: 'ascii', name: 'ASCII 海报', nameEn: 'ASCII poster', icon: Hash }
];

/**
 * 灰度 → 伪热成像 RGB
 * 色序按参考图归纳（非自创）：暗部紫/靛入黑 → 深蓝 → 电青 → 红 → 橙 → 黄 → 青绿
 * → 亮部电青 + 品红相邻 → 白（图1轮廓热像 + 图2字标 Black→Blue→Cyan→Red→Orange→Yellow→White）
 */
function lerp(a, b, t) {
  return a + (b - a) * t;
}
function lerpRgb(c0, c1, t) {
  return [lerp(c0[0], c1[0], t), lerp(c0[1], c1[1], t), lerp(c0[2], c1[2], t)];
}
/** 段内缓动，减轻硬边 */
function smooth01(t) {
  const u = Math.max(0, Math.min(1, t));
  return u * u * (3 - 2 * u);
}
function thermalRgbFromLuma(v01) {
  const x = Math.max(0, Math.min(1, v01));
  const stops = [
    [0.0, [0, 0, 0]],
    [0.035, [28, 0, 38]],
    [0.07, [48, 8, 92]],
    [0.1, [22, 28, 88]],
    [0.13, [0, 120, 210]],
    [0.17, [0, 195, 255]],
    [0.21, [175, 0, 55]],
    [0.26, [240, 20, 0]],
    [0.32, [255, 75, 0]],
    [0.39, [255, 140, 0]],
    [0.46, [255, 215, 0]],
    [0.52, [195, 255, 55]],
    [0.58, [0, 238, 195]],
    [0.64, [0, 225, 255]],
    [0.7, [255, 45, 195]],
    [0.76, [0, 255, 255]],
    [0.82, [255, 95, 235]],
    [0.88, [255, 200, 255]],
    [0.93, [255, 248, 255]],
    [1.0, [255, 255, 255]],
  ];
  for (let i = 0; i < stops.length - 1; i++) {
    if (x <= stops[i + 1][0]) {
      const span = stops[i + 1][0] - stops[i][0] || 1;
      const rawT = (x - stops[i][0]) / span;
      const t = smooth01(rawT);
      const rgb = lerpRgb(stops[i][1], stops[i + 1][1], t);
      return [rgb[0] | 0, rgb[1] | 0, rgb[2] | 0];
    }
  }
  const last = stops[stops.length - 1][1];
  return [last[0], last[1], last[2]];
}

const GEMINI_SESSION_STORAGE_KEY = 'picture_processing_gemini_api_key';

// --- Gemini AI 图像处理（apiKey 由界面输入或开发环境 .env 传入） ---
const generateAILineart = async (apiKey, base64Img, weight, def) => {
  const key = (apiKey || '').trim();
  if (!key) {
    throw new Error('Missing API key');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image-preview:generateContent?key=${key}`;
  const b64Data = base64Img.split(',')[1] || base64Img;
  
  const weightDesc = weight > 70 ? "thick and bold" : weight < 30 ? "thin and delicate" : "moderate";
  const detailDesc = def > 70 ? "highly detailed with fine structural lines" : def < 30 ? "minimalist with only main structural contours" : "balanced detail";

  const prompt = `Act as an expert illustrator. Redraw the main subject of this image as a pure, hand-drawn black ink sketch on a white background. 
  CRITICAL REQUIREMENTS:
  1. Output EXACTLY two colors: pure black (#000000) for lines, pure white (#FFFFFF) for background.
  2. NO solid color filling, NO dark patches, and NO shading. ONLY draw the outer contours and internal structural lines. 
  3. The inside of all objects MUST remain pure white. Keep it strictly as a hollow outline sketch.
  Line weight: ${weightDesc}. Detail level: ${detailDesc}.`;

  const payload = {
      contents: [{
          parts: [
              { text: prompt },
              { inlineData: { mimeType: "image/jpeg", data: b64Data } }
          ]
      }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] }
  };

  let retries = 5;
  let delay = 1000;
  while (retries > 0) {
      try {
          const res = await fetch(url, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(payload)
          });
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          const result = await res.json();
          const imgPart = result.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
          if (imgPart && imgPart.inlineData) {
              return `data:${imgPart.inlineData.mimeType};base64,${imgPart.inlineData.data}`;
          }
          throw new Error("No image data returned from AI");
      } catch (e) {
          retries--;
          if (retries === 0) throw e;
          await new Promise(r => setTimeout(r, delay));
          delay *= 2;
      }
  }
};

function LanguageToggle() {
  const { locale, toggleLocale, t } = useLocale();
  const main = locale === 'zh' ? t('lang_switch_main') : t('lang_switch_main_en_mode');
  const sub = locale === 'zh' ? t('lang_switch_sub') : t('lang_switch_sub_en_mode');
  return (
    <button
      type="button"
      onClick={toggleLocale}
      className="fixed top-3 right-3 z-[200] flex items-center gap-2 rounded-2xl border border-white/15 bg-black/55 backdrop-blur-md px-3 py-2 text-left text-white shadow-lg hover:bg-white/10 transition-colors max-w-[min(200px,calc(100vw-1.5rem))]"
      aria-label={t('aria_lang')}
    >
      <Languages size={16} className="text-indigo-400 shrink-0 mt-0.5" />
      <span className="min-w-0">
        <span className="block text-[11px] font-bold tracking-wide leading-tight">{main}</span>
        <span className="block text-[9px] font-medium text-neutral-400 leading-snug mt-0.5 normal-case">{sub}</span>
      </span>
    </button>
  );
}

export default function App({ onStepChange }) {
  const [step, setStep] = useState('home');
  const [sourceImage, setSourceImage] = useState(null);

  useEffect(() => {
    onStepChange?.(step);
  }, [step, onStepChange]);

  return (
    <div className="font-sans antialiased bg-neutral-950 min-h-screen text-white select-none">
      <LanguageToggle />
      {step === 'home' && (
        <HomeView
          onNext={(img, s) => { setSourceImage(img); setStep(s); }}
          onOpenHistory={() => setStep('history')}
        />
      )}
      {step === 'history' && (
        <HistoryView
          onBack={() => setStep('home')}
          onPick={(item) => {
            setSourceImage(item.image);
            setStep('studio');
          }}
        />
      )}
      {step === 'camera' && (
        <CameraView 
          onBack={() => setStep('home')} 
          onCapture={(img) => { setSourceImage(img); setStep('studio'); }} 
        />
      )}
      {step === 'studio' && (
        <StudioView 
          sourceImage={sourceImage}
          onBack={({ resultImage, mode }) => {
            if (resultImage) {
              pushHistory({ imageDataUrl: resultImage, modeId: mode }).catch(() => {});
            }
            setSourceImage(null);
            setStep('home');
          }}
        />
      )}
    </div>
  );
}

// --- 历史记录 ---
function HistoryView({ onBack, onPick }) {
  const { t, isZh } = useLocale();
  const [items, setItems] = useState(() => getHistory());
  const refresh = useCallback(() => setItems(getHistory()), []);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    removeHistory(id);
    refresh();
  };

  const handleClearAll = () => {
    if (!items.length) return;
    const ok = window.confirm(t('clear_confirm'));
    if (ok) {
      clearHistory();
      refresh();
    }
  };

  const modeLabel = (id) => {
    const m = STYLE_MODES.find((x) => x.id === id);
    if (!m) return id;
    return isZh ? m.name : m.nameEn;
  };

  return (
    <div className="min-h-screen flex flex-col bg-[radial-gradient(circle_at_top_right,_#1e1b4b_0%,_#0a0a0a_100%)] pt-14">
      <header className="shrink-0 flex items-center justify-between gap-4 px-4 py-3 border-b border-white/10 bg-black/20 backdrop-blur-md">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-neutral-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer font-bold text-xs uppercase tracking-widest"
        >
          <ChevronLeft size={20} />
          <span className="normal-case tracking-wide">{t('history_back')}</span>
        </button>
        <div className="text-center flex-1 min-w-0">
          <h2 className="text-sm font-black text-white tracking-tight">{t('history_title')}</h2>
        </div>
        <button
          type="button"
          onClick={handleClearAll}
          disabled={!items.length}
          className="text-[10px] font-bold tracking-wider text-red-400/90 hover:text-red-300 disabled:opacity-30 disabled:pointer-events-none bg-transparent border-none cursor-pointer whitespace-nowrap normal-case"
        >
          {t('history_clear')}
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 pb-10">
        {!items.length ? (
          <div className="max-w-sm mx-auto mt-20 text-center space-y-3 text-neutral-500">
            <History size={40} className="mx-auto opacity-40" />
            <p className="text-sm font-medium">{t('history_empty')}</p>
            <p className="text-xs text-neutral-600 leading-relaxed">{t('history_empty_hint')}</p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => onPick(item)}
                className="group relative rounded-2xl overflow-hidden border border-white/10 bg-neutral-900/60 hover:border-indigo-500/40 transition-all text-left cursor-pointer p-0"
              >
                <div className="aspect-square relative bg-black/40">
                  <img
                    src={item.thumb || item.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-90" />
                  <button
                    type="button"
                    onClick={(e) => handleDelete(item.id, e)}
                    className="absolute top-2 right-2 p-2 rounded-xl bg-black/60 text-neutral-300 hover:bg-red-600/90 hover:text-white border border-white/10 opacity-80 group-hover:opacity-100 transition-all"
                    aria-label={t('aria_delete')}
                  >
                    <Trash2 size={16} />
                  </button>
                  <div className="absolute bottom-0 left-0 right-0 p-3 space-y-0.5">
                    <p className="text-[10px] font-bold text-white truncate">{modeLabel(item.mode)}</p>
                    <p className="text-[9px] text-neutral-400 font-mono">
                      {new Date(item.createdAt).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                <p className="px-3 py-2 text-[9px] text-indigo-400/90 font-bold tracking-wider normal-case">
                  {t('history_card_hint')}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// --- 首页 ---
function HomeView({ onNext, onOpenHistory }) {
  const { t } = useLocale();
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 pt-16 bg-[radial-gradient(circle_at_top_right,_#1e1b4b_0%,_#0a0a0a_100%)]">
      <div className="max-w-md w-full space-y-12">
        <div className="text-center space-y-6">
          <div className="inline-flex p-5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] shadow-2xl shadow-indigo-500/20 animate-pulse">
            <Wand2 size={48} className="text-white" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl font-black tracking-tighter text-white">
              PICTURE<span className="text-indigo-500"> PROCESSING</span>
            </h1>
          </div>
        </div>

        <div className="grid gap-4">
          <button onClick={() => onNext(null, 'camera')} className="group flex items-center p-6 bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-white/5 hover:border-indigo-500/50 transition-all active:scale-95 shadow-xl">
            <div className="w-12 h-12 bg-indigo-500/20 rounded-2xl flex items-center justify-center text-indigo-400 mr-4 group-hover:bg-indigo-500 group-hover:text-white transition-colors">
              <Camera size={24} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-lg">{t('home_camera_title')}</span>
              <span className="block text-xs text-neutral-500 mt-1">{t('home_camera_desc')}</span>
            </div>
            <ArrowRight className="ml-auto text-neutral-700 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" size={20} />
          </button>

          <label className="group flex items-center p-6 bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-white/5 hover:border-purple-500/50 cursor-pointer transition-all active:scale-95 shadow-xl">
            <input type="file" accept="image/*" className="hidden" onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => onNext(ev.target.result, 'studio');
                reader.readAsDataURL(file);
              }
            }} />
            <div className="w-12 h-12 bg-purple-500/20 rounded-2xl flex items-center justify-center text-purple-400 mr-4 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <Upload size={24} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-lg">{t('home_upload_title')}</span>
              <span className="block text-xs text-neutral-500 mt-1">{t('home_upload_desc')}</span>
            </div>
            <ArrowRight className="ml-auto text-neutral-700 group-hover:text-purple-400 group-hover:translate-x-1 transition-all" size={20} />
          </label>

          <button
            type="button"
            onClick={onOpenHistory}
            className="group flex items-center p-6 bg-neutral-900/40 backdrop-blur-md rounded-3xl border border-white/5 hover:border-amber-500/40 transition-all active:scale-95 shadow-xl w-full"
          >
            <div className="w-12 h-12 bg-amber-500/15 rounded-2xl flex items-center justify-center text-amber-400 mr-4 group-hover:bg-amber-500/30 group-hover:text-amber-200 transition-colors">
              <History size={24} />
            </div>
            <div className="text-left">
              <span className="block font-bold text-lg">{t('home_history_title')}</span>
              <span className="block text-xs text-neutral-500 mt-1">{t('home_history_desc')}</span>
            </div>
            <ArrowRight className="ml-auto text-neutral-700 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" size={20} />
          </button>
        </div>
      </div>
    </div>
  );
}

// --- 相机 ---
function CameraView({ onBack, onCapture }) {
  const { t, isZh } = useLocale();
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [comp, setComp] = useState('thirds_pts');
  
  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 1920, height: 1080 } })
      .then(s => { if (videoRef.current) videoRef.current.srcObject = s; })
      .catch(() => alert(t('camera_denied')));
    return () => {
      if (videoRef.current?.srcObject) videoRef.current.srcObject.getTracks().forEach(t => t.stop());
    };
  }, [t]);

  const capture = () => {
    const v = videoRef.current;
    const c = canvasRef.current;
    c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext('2d').drawImage(v, 0, 0);
    onCapture(c.toDataURL('image/jpeg', 0.95));
  };

  return (
    <div className="h-screen bg-black flex flex-col overflow-hidden">
      <div className="absolute top-0 w-full z-30 p-4 pt-14 bg-gradient-to-b from-black/90 to-transparent">
        <div className="flex justify-between items-center mb-6">
          <button type="button" onClick={onBack} className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/5 text-white"><ChevronLeft /></button>
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500 rounded-full shadow-lg shadow-indigo-500/20 text-white">
             <Zap size={14} className="fill-current" />
             <span className="text-[10px] font-black tracking-widest uppercase">{t('camera_guide')}</span>
          </div>
          <div className="w-10"></div>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
          {COMPOSITIONS.map(item => (
            <button key={item.id} type="button" onClick={() => setComp(item.id)} className={`shrink-0 px-4 py-2 rounded-2xl text-[10px] font-black transition-all leading-tight text-center normal-case ${comp === item.id ? 'bg-indigo-500 text-white shadow-xl shadow-indigo-500/40' : 'bg-white/5 text-neutral-400 border border-white/5'}`}>
              {isZh ? item.name : item.nameEn}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative bg-neutral-950 overflow-hidden">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
        <div className="absolute inset-0 pointer-events-none">
           <CompositionOverlay type={comp} />
        </div>
        <div className="absolute bottom-36 w-full px-8 flex justify-center">
           <div className="bg-black/80 backdrop-blur-2xl border-l-4 border-indigo-500 p-4 rounded-r-3xl flex items-start gap-4 max-w-sm">
              <div className="p-2 bg-indigo-500/20 text-indigo-400 rounded-xl shrink-0"><Info size={18} /></div>
              <p className="text-xs leading-relaxed font-medium text-neutral-200">
                {isZh ? COMPOSITIONS.find(c => c.id === comp).tip : COMPOSITIONS.find(c => c.id === comp).tipEn}
              </p>
           </div>
        </div>
      </div>

      <div className="h-32 flex items-center justify-center bg-black">
        <button onClick={capture} className="w-20 h-20 rounded-full border-4 border-white flex items-center justify-center active:scale-90 transition-all bg-transparent">
          <div className="w-16 h-16 rounded-full bg-white"></div>
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

function CompositionOverlay({ type }) {
  const HIGHLIGHT = "stroke-yellow-400 stroke-[2]"; 
  const BASE = "stroke-indigo-400 stroke-[1.5]";
  const POINT = "fill-yellow-400 stroke-indigo-900 stroke-[2]";

  return (
    <svg className="w-full h-full opacity-90">
      {(type === 'thirds_pts' || type === 'thirds_lines') && (
        <>
          <line x1="33.3%" y1="0" x2="33.3%" y2="100%" className={BASE} strokeDasharray="5 5" />
          <line x1="66.6%" y1="0" x2="66.6%" y2="100%" className={BASE} strokeDasharray="5 5" />
          <line x1="0" y1="33.3%" x2="100%" y2="33.3%" className={BASE} strokeDasharray="5 5" />
          <line x1="0" y1="66.6%" x2="100%" y2="66.6%" className={BASE} strokeDasharray="5 5" />
          {type === 'thirds_pts' && (
            <>
              <circle cx="33.3%" cy="33.3%" r="8" className={POINT} />
              <circle cx="66.6%" cy="33.3%" r="8" className={POINT} />
              <circle cx="33.3%" cy="66.6%" r="8" className={POINT} />
              <circle cx="66.6%" cy="66.6%" r="8" className={POINT} />
            </>
          )}
        </>
      )}
      {type === 'center' && (
        <>
          <circle cx="50%" cy="50%" r="5" className={POINT} />
          <rect x="40%" y="40%" width="20%" height="20%" fill="none" className={HIGHLIGHT} strokeDasharray="8 4" />
        </>
      )}
      {type === 'diagonal' && <><line x1="0" y1="0" x2="100%" y2="100%" className={HIGHLIGHT} /><line x1="100%" y1="0" x2="0" y2="100%" className={HIGHLIGHT} /></>}
      {type === 'symmetry' && <line x1="50%" y1="0" x2="50%" y2="100%" className={HIGHLIGHT} />}
      {type === 'frame' && <rect x="20%" y="20%" width="60%" height="60%" className={HIGHLIGHT} fill="none" />}
    </svg>
  );
}

// --- 工作台 ---
function StudioView({ sourceImage, onBack }) {
  const { t, isZh } = useLocale();
  const [activeMode, setActiveMode] = useState('original');
  const [currentResult, setCurrentResult] = useState(sourceImage);
  const [isProcessing, setIsProcessing] = useState(false);
  const [geminiApiKey, setGeminiApiKey] = useState(() => {
    try {
      return sessionStorage.getItem(GEMINI_SESSION_STORAGE_KEY) ?? '';
    } catch {
      return '';
    }
  });
  const [params, setParams] = useState({
    density: 70, weight: 40, contrast: 55, saturation: 50, bgTolerance: 0, definition: 50, colorLevel: 50
  });

  const persistGeminiKey = useCallback((value) => {
    const v = (value || '').trim();
    try {
      if (v) sessionStorage.setItem(GEMINI_SESSION_STORAGE_KEY, v);
      else sessionStorage.removeItem(GEMINI_SESSION_STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const originalRef = useRef(new Image());
  const effectId = useRef(0);
  const prevMode = useRef(activeMode);

  useEffect(() => {
    originalRef.current.src = sourceImage;
    if (originalRef.current.complete) applyEffect();
    else originalRef.current.onload = () => applyEffect();
  }, [sourceImage]);

  const applyEffect = useCallback(async () => {
    if (activeMode === 'original') { setCurrentResult(sourceImage); return; }
    
    setIsProcessing(true);
    const currentEffectId = ++effectId.current;

    const img = originalRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 1600 / Math.max(img.width, img.height);
    canvas.width = img.width * scale;
    canvas.height = img.height * scale;
    const { width: w, height: h } = canvas;

    const baseCanvas = document.createElement('canvas');
    baseCanvas.width = w; baseCanvas.height = h;
    const baseCtx = baseCanvas.getContext('2d');

    let emptyBgColor = '#ffffff';
    if (activeMode === 'ascii') {
       const isRetro = params.colorLevel > 40 && params.colorLevel <= 60;
       emptyBgColor = isRetro ? '#ffffff' : '#000000';
    } else if (activeMode === 'thermal') {
       emptyBgColor = '#000000';
    }
    baseCtx.fillStyle = emptyBgColor;
    baseCtx.fillRect(0, 0, w, h);

    const isolateC = document.createElement('canvas');
    isolateC.width = w; isolateC.height = h;
    const iCtx = isolateC.getContext('2d');
    iCtx.drawImage(img, 0, 0, w, h);

    if (params.bgTolerance > 0) {
      const iDataObj = iCtx.getImageData(0, 0, w, h);
      const d = iDataObj.data;
      const bgR = d[0], bgG = d[1], bgB = d[2];
      const thresh = (params.bgTolerance / 100) * 200; 

      for(let i=0; i<d.length; i+=4) {
         const r = d[i], g = d[i+1], b = d[i+2];
         const dist = Math.sqrt((r-bgR)**2 + (g-bgG)**2 + (b-bgB)**2);
         if (dist <= thresh) d[i+3] = 0; 
      }
      iCtx.putImageData(iDataObj, 0, 0);
    }

    baseCtx.filter = `contrast(${0.6 + params.contrast/50}) brightness(${0.85 + params.definition/200}) saturate(${params.saturation * 2}%)`;
    baseCtx.drawImage(isolateC, 0, 0, w, h);
    baseCtx.filter = 'none';

    const data = baseCtx.getImageData(0, 0, w, h).data;

    if (activeMode === 'lineart') {
      const applyMorphologicalLineart = (targetCtx) => {
          const imgDataObj = targetCtx.getImageData(0, 0, w, h);
          const d = imgDataObj.data;
          const threshold = 255 - (params.definition * 1.5); 
          const binaryMap = new Uint8Array(w * h);
          for(let i = 0; i < d.length; i += 4) {
              const luma = (d[i]*0.299 + d[i+1]*0.587 + d[i+2]*0.114);
              binaryMap[i/4] = luma < threshold ? 1 : 0; 
          }
          const fillRadius = Math.max(1, Math.floor(params.weight / 25)); 
          for(let y = 0; y < h; y++) {
              for(let x = 0; x < w; x++) {
                  const idx = y * w + x;
                  const pIdx = idx * 4;
                  if (binaryMap[idx] === 1) {
                      let isDeepInsideFill = true;
                      for(let dy = -fillRadius; dy <= fillRadius; dy++) {
                          for(let dx = -fillRadius; dx <= fillRadius; dx++) {
                              const ny = y + dy; const nx = x + dx;
                              if (ny >= 0 && ny < h && nx >= 0 && nx < w && binaryMap[ny * w + nx] === 0) {
                                  isDeepInsideFill = false; break;
                              }
                          }
                          if (!isDeepInsideFill) break;
                      }
                      if (isDeepInsideFill) d[pIdx] = d[pIdx+1] = d[pIdx+2] = 255; 
                      else d[pIdx] = d[pIdx+1] = d[pIdx+2] = 0;   
                  } else d[pIdx] = d[pIdx+1] = d[pIdx+2] = 255;
              }
          }
          targetCtx.putImageData(imgDataObj, 0, 0);
          targetCtx.filter = 'blur(0.5px)';
          targetCtx.drawImage(targetCtx.canvas, 0, 0);
          targetCtx.filter = 'none';
      };

      const base64Img = baseCanvas.toDataURL('image/jpeg', 0.8);
      const localFallback = () => {
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
          ctx.filter = 'grayscale(100%)'; ctx.drawImage(baseCanvas, 0, 0, w, h);
          const blurC = document.createElement('canvas');
          blurC.width = w; blurC.height = h;
          const bCtx = blurC.getContext('2d');
          const blurRadius = Math.max(1, params.weight / 10);
          bCtx.filter = `grayscale(100%) invert(100%) blur(${blurRadius}px)`;
          bCtx.drawImage(baseCanvas, 0, 0, w, h);
          ctx.globalCompositeOperation = 'color-dodge';
          ctx.drawImage(blurC, 0, 0, w, h);
          const tempC = document.createElement('canvas');
          tempC.width = w; tempC.height = h;
          tempC.getContext('2d').drawImage(canvas, 0, 0);
          ctx.globalCompositeOperation = 'multiply';
          ctx.filter = 'none';
          const darkenPasses = Math.max(1, Math.floor(params.definition / 20)); 
          for(let i=0; i<darkenPasses; i++) ctx.drawImage(tempC, 0, 0, w, h);
          ctx.globalCompositeOperation = 'source-over';
          applyMorphologicalLineart(ctx);
      };

      const envKey = (import.meta.env.VITE_GEMINI_API_KEY ?? '').trim();
      const effectiveKey = (geminiApiKey || '').trim() || envKey;

      if (!effectiveKey) {
          if (currentEffectId === effectId.current) {
              localFallback();
              setCurrentResult(canvas.toDataURL('image/jpeg', 0.9));
              setIsProcessing(false);
          }
          return;
      }

      try {
          const aiResult = await generateAILineart(effectiveKey, base64Img, params.weight, params.definition);
          if (currentEffectId === effectId.current) {
              const aiImg = new Image();
              aiImg.onload = () => {
                  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
                  ctx.drawImage(aiImg, 0, 0, w, h);
                  applyMorphologicalLineart(ctx);
                  setCurrentResult(canvas.toDataURL('image/jpeg', 0.9));
                  setIsProcessing(false);
              };
              aiImg.src = aiResult;
          }
      } catch (err) {
          console.error("AI Fallback:", err);
          if (currentEffectId === effectId.current) {
              localFallback();
              setCurrentResult(canvas.toDataURL('image/jpeg', 0.9));
              setIsProcessing(false);
          }
      }
      return; 
    } 
    else if (activeMode === 'ascii') {
      const fontSize = Math.max(8, 36 - Math.floor(params.density / 3)); 
      ctx.font = `900 ${fontSize}px "SF Mono", "JetBrains Mono", "Courier New", monospace`;
      ctx.textBaseline = 'top';
      const charW = fontSize * 0.6; const charH = fontSize * 0.9; 
      const cols = Math.floor(w / charW); const rows = Math.floor(h / charH);
      const tCanvas = document.createElement('canvas');
      tCanvas.width = cols; tCanvas.height = rows;
      const tCtx = tCanvas.getContext('2d');
      tCtx.filter = `grayscale(100%)`;
      tCtx.drawImage(baseCanvas, 0, 0, cols, rows);
      const tData = tCtx.getImageData(0, 0, cols, rows).data;
      let bg, fg, invertLuma = false;
      if (params.colorLevel <= 20) { bg = '#050505'; fg = '#00ff41'; } 
      else if (params.colorLevel <= 40) { bg = '#0a0a0a'; fg = '#ffffff'; } 
      else if (params.colorLevel <= 60) { bg = '#f4ebd0'; fg = '#1a1a1a'; invertLuma = true; } 
      else if (params.colorLevel <= 80) { bg = '#0a2463'; fg = '#f0ede6'; } 
      else { bg = '#1a0b2e'; fg = '#ff007f'; }
      ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h); ctx.fillStyle = fg;
      const charSets = [
         [' ', '.', ',', '-', '~', '+', '=', '*', '#', '@'], 
         [' ', '.', 'o', 'O', '0', 'Q', 'G', '8', 'M', 'W'], 
         [' ', 'A', 'R', 'T', 'D', 'E', 'S', 'I', 'G', 'N'], 
         [' ', '░', '▒', '▓', '█']                             
      ];
      const setIdx = Math.min(3, Math.floor((params.definition / 100) * 4));
      const chars = charSets[setIdx];
      for(let r=0; r<rows; r++) {
          for(let c=0; c<cols; c++) {
              const idx = (r * cols + c) * 4;
              let brightness = tData[idx]; 
              if (invertLuma) brightness = 255 - brightness;
              if (brightness < 20) continue; 
              let charIdx = Math.floor((brightness / 255) * chars.length);
              charIdx = Math.min(chars.length - 1, Math.max(0, charIdx));
              const char = chars[charIdx];
              if (char !== ' ') ctx.fillText(char, c * charW, r * charH);
          }
      }
    }
    else if (activeMode === 'thermal') {
      ctx.filter = `grayscale(100%) contrast(${1.15 + params.contrast / 80})`;
      ctx.drawImage(baseCanvas, 0, 0, w, h);
      ctx.filter = 'none';
      const tDataObj = ctx.getImageData(0, 0, w, h);
      const tData = tDataObj.data;
      const satBoost = 0.92 + (params.saturation / 100) * 0.2;
      for (let i = 0; i < tData.length; i += 4) {
        const a = tData[i + 3];
        if (a < 12) {
          tData[i] = tData[i + 1] = tData[i + 2] = 0;
          tData[i + 3] = 255;
          continue;
        }
        let v = tData[i] / 255;
        v = Math.min(1, Math.pow(v, 0.88) * satBoost);
        const [r, g, b] = thermalRgbFromLuma(v);
        tData[i] = r;
        tData[i + 1] = g;
        tData[i + 2] = b;
        tData[i + 3] = 255;
      }
      ctx.putImageData(tDataObj, 0, 0);

      const thermalC = document.createElement('canvas');
      thermalC.width = w;
      thermalC.height = h;
      thermalC.getContext('2d').drawImage(canvas, 0, 0);

      const blurC = document.createElement('canvas');
      blurC.width = w;
      blurC.height = h;
      const bctx = blurC.getContext('2d');
      const passes = 13;
      const spread = 10 + Math.floor(params.weight / 12);
      bctx.globalCompositeOperation = 'source-over';
      bctx.globalAlpha = 1 / passes;
      for (let p = 0; p < passes; p++) {
        const u = passes > 1 ? p / (passes - 1) : 0.5;
        const ox = (u - 0.5) * 2 * spread;
        bctx.drawImage(thermalC, ox, 0);
      }
      bctx.globalAlpha = 1;

      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(blurC, 0, 0);
      ctx.globalAlpha = 0.42;
      ctx.drawImage(thermalC, 0, 0);
      ctx.globalAlpha = 1;

      ctx.filter = 'blur(1.2px)';
      ctx.globalAlpha = 0.22;
      ctx.drawImage(thermalC, 0, 0);
      ctx.filter = 'none';
      ctx.globalAlpha = 1;

      const cx = w * 0.5;
      const cy = h * 0.5;
      const rMax = Math.hypot(w, h) * 0.58;
      const vig = ctx.createRadialGradient(cx, cy, rMax * 0.28, cx, cy, rMax);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(0.55, 'rgba(0,0,0,0.12)');
      vig.addColorStop(1, 'rgba(0,0,0,0.78)');
      ctx.fillStyle = vig;
      ctx.globalCompositeOperation = 'multiply';
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      const leftLeak = ctx.createLinearGradient(0, 0, w * 0.42, 0);
      leftLeak.addColorStop(0, 'rgba(130, 50, 200, 0.2)');
      leftLeak.addColorStop(0.55, 'rgba(40, 0, 80, 0.06)');
      leftLeak.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = leftLeak;
      ctx.globalCompositeOperation = 'screen';
      ctx.fillRect(0, 0, w, h);

      const rightLeak = ctx.createLinearGradient(w, 0, w * 0.58, 0);
      rightLeak.addColorStop(0, 'rgba(0,0,0,0)');
      rightLeak.addColorStop(0.45, 'rgba(120, 40, 0, 0.05)');
      rightLeak.addColorStop(1, 'rgba(255, 150, 70, 0.16)');
      ctx.fillStyle = rightLeak;
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'source-over';

      const grain = ctx.createImageData(w, h);
      const gd = grain.data;
      for (let gi = 0; gi < gd.length; gi += 4) {
        const n = (Math.random() * 255) | 0;
        gd[gi] = gd[gi + 1] = gd[gi + 2] = n;
        gd[gi + 3] = 14 + ((Math.random() * 22) | 0);
      }
      const grainCanvas = document.createElement('canvas');
      grainCanvas.width = w;
      grainCanvas.height = h;
      grainCanvas.getContext('2d').putImageData(grain, 0, 0);
      ctx.globalCompositeOperation = 'overlay';
      ctx.globalAlpha = 0.32;
      ctx.drawImage(grainCanvas, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }
    else if (activeMode === 'mosaic') {
      const blockSize = Math.max(4, Math.floor((101 - params.density) / 3));
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(baseCanvas, 0, 0, w / blockSize, h / blockSize);
      ctx.filter = 'saturate(80%)';
      ctx.drawImage(canvas, 0, 0, w / blockSize, h / blockSize, 0, 0, w, h);
      ctx.filter = 'none';
    }
    else if (activeMode === 'halftone') {
      ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h);
      const step = Math.max(4, Math.floor((101 - params.density) / 3));
      const rMax = step * (params.weight / 100) * 1.5;
      ctx.fillStyle = `hsl(${params.colorLevel * 3.6}, 80%, 20%)`;
      for (let y = 0; y < h; y += step) {
        for (let x = 0; x < w; x += step) {
          const idx = (y * w + x) * 4;
          const b = 1 - (data[idx] + data[idx+1] + data[idx+2]) / 765;
          if (b > 0.05) {
            ctx.beginPath(); ctx.arc(x, y, b * rMax, 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }

    if (currentEffectId === effectId.current) {
        setCurrentResult(canvas.toDataURL('image/jpeg', 0.9));
        setIsProcessing(false);
    }
  }, [activeMode, params, sourceImage, geminiApiKey]);

  useEffect(() => {
    const isModeSwitch = prevMode.current !== activeMode;
    prevMode.current = activeMode;
    const delay = (activeMode === 'lineart' && !isModeSwitch) ? 1500 : 50;
    const timer = setTimeout(() => applyEffect(), delay);
    return () => clearTimeout(timer);
  }, [activeMode, params, sourceImage, applyEffect]);

  const handleCopy = async () => {
    try {
      const res = await fetch(currentResult);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      alert(t('copy_ok'));
    } catch (e) { alert(t('copy_fail')); }
  };

  return (
    <div className="h-screen min-h-0 flex flex-col md:flex-row bg-[#080808] overflow-hidden">
      <div className="w-full md:w-[380px] min-h-0 max-md:min-h-[44vh] max-h-[52vh] md:max-h-none md:h-full flex flex-col shrink-0 order-2 md:order-1 shadow-2xl bg-neutral-900/80 backdrop-blur-xl border-r border-white/5">
        <div className="shrink-0 p-6 border-b border-white/5 flex items-center justify-between">
          <button
            type="button"
            onClick={() => onBack({ resultImage: currentResult, mode: activeMode })}
            className="text-neutral-500 hover:text-white transition-all flex items-center gap-2 font-bold text-xs uppercase tracking-widest bg-transparent border-none cursor-pointer"
          >
            <ChevronLeft size={18} />
            <span className="normal-case tracking-wide">{t('studio_exit')}</span>
          </button>
          <div className="flex items-center gap-2 text-indigo-500">
            <Settings2 size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.25em] normal-case text-right max-w-[140px] leading-tight">
              {t('studio_console')}
            </span>
          </div>
        </div>
        
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-y-contain p-8 space-y-12 scrollbar-hide">
          <section className="space-y-6">
            <ParamSlider label={t('param_isolate')} value={params.bgTolerance} onChange={v => setParams({...params, bgTolerance: v})} />
            <ParamSlider label={t('param_density')} value={params.density} onChange={v => setParams({...params, density: v})} />
            <ParamSlider label={t('param_weight')} value={params.weight} onChange={v => setParams({...params, weight: v})} />
            <ParamSlider label={t('param_contrast')} value={params.contrast} onChange={v => setParams({...params, contrast: v})} />
            <ParamSlider label={t('param_saturation')} value={params.saturation} onChange={v => setParams({...params, saturation: v})} />
            <div className="pt-2 border-t border-white/5"></div>
            <div className="bg-white/5 p-4 rounded-xl border border-white/5 space-y-4">
               <div className="flex items-center gap-2 mb-2">
                 <Wand2 size={14} className="text-purple-400" />
                 <span className="text-[10px] font-bold text-purple-400 tracking-widest uppercase">{t('studio_style')}</span>
               </div>
               <ParamSlider label={t('param_definition')} value={params.definition} onChange={v => setParams({...params, definition: v})} />
               <ParamSlider label={t('param_color')} value={params.colorLevel} onChange={v => setParams({...params, colorLevel: v})} />
            </div>
            {activeMode === 'lineart' && (
              <div className="rounded-xl border border-indigo-500/35 bg-indigo-950/25 p-4 space-y-2">
                <label className="block text-[10px] font-bold text-indigo-300 uppercase tracking-wider leading-snug">
                  {t('studio_gemini_key_label')}
                </label>
                <input
                  type="password"
                  name="gemini-api-key"
                  autoComplete="off"
                  spellCheck={false}
                  value={geminiApiKey}
                  onChange={(e) => {
                    const v = e.target.value;
                    setGeminiApiKey(v);
                    persistGeminiKey(v);
                  }}
                  placeholder={t('studio_gemini_key_placeholder')}
                  className="w-full rounded-lg bg-neutral-950 border border-white/15 px-3 py-2.5 text-[11px] text-white placeholder:text-neutral-600 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <p className="text-[9px] text-neutral-500 leading-relaxed">{t('studio_gemini_key_hint')}</p>
                <button
                  type="button"
                  onClick={() => {
                    setGeminiApiKey('');
                    persistGeminiKey('');
                  }}
                  className="text-[9px] font-bold text-red-400/90 hover:text-red-300 bg-transparent border-none cursor-pointer p-0"
                >
                  {t('studio_gemini_key_clear')}
                </button>
              </div>
            )}
          </section>
          <section className="space-y-4">
            <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest leading-tight normal-case">
              {t('studio_render_modes')}
            </h3>
            <div className="grid grid-cols-2 gap-3">
                {STYLE_MODES.map(mode => (
                  <button key={mode.id} onClick={() => setActiveMode(mode.id)} className={`flex flex-col items-center gap-3 p-5 rounded-3xl border transition-all cursor-pointer ${activeMode === mode.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-xl shadow-indigo-600/30' : 'bg-neutral-800/50 border-transparent text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'}`}>
                    <mode.icon size={20} />
                    <span className="text-[10px] font-black text-center leading-tight normal-case tracking-wide">
                      {isZh ? mode.name : mode.nameEn}
                    </span>
                  </button>
                ))}
            </div>
          </section>
        </div>

        <div className="shrink-0 px-4 py-2.5 md:px-6 md:py-3 border-t border-white/5 space-y-1.5">
           <button onClick={() => {
              const a = document.createElement('a'); a.href = currentResult; a.download = `PictureProcessing_${activeMode}.jpg`; a.click();
           }} className="w-full bg-white text-black py-2 rounded-xl font-black text-[10px] md:text-xs tracking-wider shadow-md shadow-white/5 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none normal-case">
             <Download size={14} />
             <span>{t('download')}</span>
           </button>
           <button onClick={handleCopy} className="w-full bg-neutral-800 text-white py-2 rounded-xl font-black text-[10px] md:text-xs tracking-wider active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer border-none normal-case">
             <Copy size={14} />
             <span>{t('copy')}</span>
           </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 relative flex items-center justify-center px-6 py-3 md:px-8 md:py-5 order-1 md:order-2 bg-[radial-gradient(circle_at_center,_#111_0%,_#000_100%)]">
        {isProcessing && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/60 backdrop-blur-md">
            <Loader2 className="animate-spin text-indigo-500" size={48} />
            <p className="mt-4 text-[10px] font-black text-indigo-400 text-center tracking-wide normal-case">
              {activeMode === 'lineart' ? t('processing_lineart') : t('processing_pixels')}
            </p>
          </div>
        )}
        <div className="relative w-full h-full max-w-5xl flex items-center justify-center">
          <img src={currentResult} className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_50px_100px_rgba(0,0,0,0.8)] ring-1 ring-white/10" alt={t('result_alt')} />
          <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 text-[9px] font-mono text-white/10 uppercase tracking-[0.35em] pointer-events-none text-center leading-tight normal-case">
            {t('studio_footer')}
          </div>
        </div>
      </div>
    </div>
  );
}

function ParamSlider({ label, value, onChange }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-start gap-2 px-1">
        <span className="text-[10px] font-black text-neutral-400 uppercase tracking-widest min-w-0 leading-snug normal-case">{label}</span>
        <span className="text-[10px] font-mono text-indigo-500 font-bold shrink-0 pt-0.5">{value}%</span>
      </div>
      <input type="range" min="0" max="100" value={value} onChange={e => onChange(parseInt(e.target.value))} 
        className="w-full h-[4px] bg-neutral-800 rounded-full appearance-none cursor-pointer accent-indigo-500" />
    </div>
  );
}