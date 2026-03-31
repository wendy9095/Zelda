import React, { useState, useEffect } from 'react';
import { 
  Camera, PenTool, Layout, Palette, Zap, 
  ShieldCheck, Layers, Type, Crop, Wand2,
  ExternalLink, Sparkles, Image as ImageIcon, PlayCircle,
  Moon, Sun, Navigation, Paintbrush, Globe,
  X, ChevronLeft, ChevronRight, ZoomIn
} from 'lucide-react';

// --- 多語系字典 ---
const TRANSLATIONS = {
  en: {
    navOpenApp: "Open App",
    heroTag: "AI-Powered Visual Workflow",
    heroTitle1: "From Lens to Poster,",
    heroTitle2: "One-Stop AI Visual Workflow",
    heroDesc: "Breaking the boundaries between image processing and graphic layout. RenderFlow focuses on visual refinement, while DesignMind PRO handles copy generation and master-level layouts. You are the entire design team.",
    videoLoading: "Loading video...",
    
    sec1Title: "Why build this tool?",
    sec1P1: "In traditional workflows, creators often switch between multiple software: color grading in Lightroom, brainstorming copy in ChatGPT, and finally layout in Canva or AI. This is tedious and often results in disconnected visual styles and broken layouts.",
    sec1P2: "Our goal is to build a 'closed-loop immersive workflow'. Using AI as a bridge, the visual context extends naturally into layout inspiration, drastically lowering the barrier to professional design and letting creators focus on 'beauty' itself.",
    sec1Box1Title: "Image Refinement",
    sec1Box1Desc: "RenderFlow",
    sec1Box2Title: "Layout Generation",
    sec1Box2Desc: "DesignMind",

    sec2Title: "Core UI/UX Decisions",
    sec2Sub: "Every visual detail is crafted to guide a smoother state of flow.",
    sec2Dec1Title: "Dual Scenes: Dark & Light",
    sec2Dec1Desc: "RenderFlow uses an extreme dark mode to simulate a darkroom, keeping the focus entirely on color contrast and light details. DesignMind switches to a bright canvas to simulate real paper, helping creators gauge spacing and negative space perfectly.",
    sec2Dec2Title: "Visual Cue: Blue-Purple Gradient",
    sec2Dec2Desc: "Against the minimalist black-and-white tones, a 'blue-purple gradient' serves as the accent color. Blue signifies calm technology, while purple represents emotional creativity—symbolizing the soul of 'AI-empowered design'.",
    sec2Dec3Title: "Seamless Hub: Top-Left Menu",
    sec2Dec3Desc: "Abandoning tedious home page jumps and deep routing, we placed the switch toggle in the top-left corner. This fits tool intuitions and allows seamless transitions between 'material processing' and 'poster layout'.",

    sec3Title: "Core Engine Analysis",
    sec3Sub: "Built for creators, covering every step from inspiration capture to final output.",
    sec3Part1Title: "Precise Framing & Image Refinement",
    sec3Part1Desc: "Process your raw visual assets. We don't just provide a camera; we provide a professional photographer's perspective and effects.",
    sec3Part1F1Title: "6 Major Composition Guides",
    sec3Part1F1Desc: "Built-in rule-of-thirds, diagonal, and framing guides, paired with real-time shooting tips, ensuring every shot follows a master's trace.",
    sec3Part1F2Title: "AI Line Art & Frontend Effects",
    sec3Part1F2Desc: "Call Gemini AI to convert real scenes into sketches, or use Canvas 2D for real-time high-contrast thermal and ASCII poster effects—no cloud wait time.",
    
    sec3Part2Title: "Contextual Copy & Smart Layout",
    sec3Part2Desc: "From 'brainstorming copy' to 'applying master layouts', export high-res posters in just 3 steps.",
    sec3Part2F1Title: "AI Image-to-Copy",
    sec3Part2F1Desc: "Upload an image, and AI generates 3 sets of commercial slogans based on the visual mood; or input keywords for expansion and optimization.",
    sec3Part2F2Title: "8 Top Design Styles",
    sec3Part2F2Desc: "Built-in minimalist, cyberpunk, magazine, and Swiss design models. One-click computation generates 4 stunning layouts adapted to your image's vibe.",

    sec3Part3Title: "Invisible Foolproof Tech",
    sec3Part3Desc: "To solve common AI layout issues like 'illegible text' and 'bleeding off canvas', we embedded dynamic defense mechanisms at the core.",
    sec3Part3F1Title: "WCAG Smart Contrast Shield",
    sec3Part3F1Desc: "Calculates text-to-background contrast in real-time. If it's too low (< 3.0), the system forces text color inversion or injects dynamic halos to ensure legibility.",
    sec3Part3F2Title: "Omnidirectional X/Y Smart Anchoring",
    sec3Part3F2Desc: "Strips the browser of arbitrary wrapping rights, taking over with smart center anchoring and boundary detection. Texts near edges grow inwards; geometric cuts guarantee 100% perfect ratios.",

    sec4Title: "Feature Showcase",
    sec4Sub: "A glance at the actual operation and beautifully generated layouts. Click to expand.",
    sec4Waiting: "(Waiting for image)",

    footerBrand: "RenderFlow × DesignMind PRO",
    footerTech: "Engineered with React, Tailwind CSS & Google Gemini AI."
  },
  zh: {
    navOpenApp: "開啟應用",
    heroTag: "AI-Powered Visual Workflow",
    heroTitle1: "從鏡頭到海報，",
    heroTitle2: "一站式 AI 視覺工作流",
    heroDesc: "打破影像處理與平面排版的界線。RenderFlow 專注於鏡頭語言與像素淬鍊，DesignMind PRO 接手文案生成與大師級排版。一人即是一個設計團隊。",
    videoLoading: "載入影片中...",
    
    sec1Title: "為什麼打造這個工具？",
    sec1P1: "在傳統工作流中，創作者通常需要切換多個軟體：在 Lightroom 調色、在 ChatGPT 構思文案、最後到 Canva 或 AI 進行排版。這不僅繁瑣，更常面臨「影像與排版風格脫節」、「文案長度破壞畫面」的痛點。",
    sec1P2: "本專案旨在打造一個「閉環式的沉浸工作流」。以 AI 為橋樑，讓影像的語境自然延伸到排版靈感中，將繁雜的技術門檻降至最低，讓創作者專注於「美」本身。",
    sec1Box1Title: "影像淬鍊",
    sec1Box1Desc: "RenderFlow",
    sec1Box2Title: "排版生成",
    sec1Box2Desc: "DesignMind",

    sec2Title: "UI / UX 核心決策",
    sec2Sub: "每一個視覺細節，都是為了引導更順暢的心流體驗。",
    sec2Dec1Title: "雙生場景：黑白切換",
    sec2Dec1Desc: "RenderFlow 採用極致暗色系：模擬專業暗房，讓視覺完全聚焦於影像色彩對比，避免介面干擾。DesignMind 則切換為明亮畫布：還原紙張質感，幫助精準掌握文字間距與版面呼吸感。",
    sec2Dec2Title: "視覺線索：藍紫漸變",
    sec2Dec2Desc: "在極簡的黑白基調中，我們將「藍紫色漸變」作為貫穿全域的點綴色。藍色象徵冷靜的演算科技，紫色代表感性的藝術創意。隱喻著「AI 賦能設計」的核心靈魂。",
    sec2Dec3Title: "無縫樞紐：左上角切換",
    sec2Dec3Desc: "摒棄繁瑣的首頁跳轉，我們將切換入口統一收納於左上角。這不僅符合軟體選單直覺，更讓使用者能在「素材處理」與「海報排版」間實現無縫穿梭。",

    sec3Title: "核心引擎解析",
    sec3Sub: "專為創作者打造，涵蓋從靈感捕捉到成品輸出的每一個環節。",
    sec3Part1Title: "精準取景與影像淬鍊",
    sec3Part1Desc: "處理您的第一手視覺素材。我們不只提供相機，更提供專業攝影師的視角與特效。",
    sec3Part1F1Title: "6 大構圖輔助系統",
    sec3Part1F1Desc: "內建三分點、對角線、框架式等多種大師級構圖指引，搭配即時拍攝提示，讓每一次快門都有跡可循。",
    sec3Part1F2Title: "AI 線稿與純前端特效",
    sec3Part1F2Desc: "調用 Gemini AI 將實景轉為手繪線稿；或使用 Canvas 2D 即時渲染高對比熱成像、ASCII 字符海報等酷炫視覺，無需等待雲端運算。",
    
    sec3Part2Title: "語境文案與智能排版",
    sec3Part2Desc: "從「幫你想文案」到「套用大師級版型」，只需三個步驟即可輸出高清海報。",
    sec3Part2F1Title: "AI 讀圖發想文案",
    sec3Part2F1Desc: "上傳圖片，讓 AI 根據畫面情緒自動發想 3 組商業級中英廣告標語；也可手動輸入關鍵字進行擴寫優化。",
    sec3Part2F2Title: "8 大頂流設計流派",
    sec3Part2F2Desc: "內建極簡風、賽博龐克、時尚雜誌、瑞士設計等參數模型。一鍵演算，為您生成 4 款完美適配圖片氛圍的絕美排版。",

    sec3Part3Title: "看不見的防呆黑科技",
    sec3Part3Desc: "為了解決 AI 排版常出現的「文字看不清」與「跑出畫布」問題，我們在底層植入了強大的動態防禦機制。",
    sec3Part3F1Title: "WCAG 智能對比度護盾",
    sec3Part3F1Desc: "即時計算文字與背景色的亮度對比度。若對比度過低 (< 3.0)，系統會強制反轉文字顏色，或動態注入保護光暈，確保文字永遠清晰。",
    sec3Part3F2Title: "全方位 X/Y 軸智慧錨定",
    sec3Part3F2Desc: "徹底剝奪瀏覽器自動換行權限，改由智慧中心點定位接管。文字靠近邊緣會自動調整生長方向，幾何裁切保證 100% 完美比例。",

    sec4Title: "功能實機展示",
    sec4Sub: "實際操作與生成的精美排版結果一覽，點擊圖片可放大檢視。",
    sec4Waiting: "(等待放入圖片)",

    footerBrand: "RenderFlow × DesignMind PRO",
    footerTech: "Engineered with React, Tailwind CSS & Google Gemini AI."
  }
};

export default function PresentationPage({ onStartApp }) {
  const [lang, setLang] = useState('en');
  const [selectedImageIndex, setSelectedImageIndex] = useState(null); // 控制燈箱顯示的圖片索引
  const t = TRANSLATIONS[lang];

  // 截圖放在 public/screenshots/，使用 BASE_URL 兼容本機與子路徑部署。
  const assetBase = import.meta.env.BASE_URL || '/';
  const screenshots = Array.from({ length: 12 }, (_, i) => `${assetBase}screenshots/shot-${i + 1}.png`);

  const toggleLang = () => {
    setLang(prev => prev === 'en' ? 'zh' : 'en');
  };

  // 燈箱鍵盤控制 (Esc 關閉, 左右鍵切換)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedImageIndex === null) return;
      if (e.key === 'Escape') setSelectedImageIndex(null);
      if (e.key === 'ArrowRight') setSelectedImageIndex((prev) => (prev + 1) % screenshots.length);
      if (e.key === 'ArrowLeft') setSelectedImageIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex, screenshots.length]);

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200 font-sans selection:bg-indigo-500/30">
      
      {/* === 圖片放大燈箱 (Lightbox) === */}
      {selectedImageIndex !== null && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md transition-all duration-300"
          onClick={() => setSelectedImageIndex(null)}
        >
          {/* 關閉按鈕 */}
          <button 
            className="absolute top-6 right-6 p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all"
            onClick={() => setSelectedImageIndex(null)}
            title="關閉 (Esc)"
          >
            <X size={32} />
          </button>

          {/* 上一張按鈕 */}
          <button 
            className="absolute left-4 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all hidden md:block"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex((prev) => (prev - 1 + screenshots.length) % screenshots.length);
            }}
          >
            <ChevronLeft size={48} />
          </button>

          {/* 放大的圖片 */}
          <img 
            src={screenshots[selectedImageIndex]} 
            alt={`Expanded View ${selectedImageIndex + 1}`}
            className="max-w-[95vw] max-h-[90vh] object-contain rounded-lg shadow-2xl animate-in fade-in zoom-in duration-300"
            onClick={(e) => e.stopPropagation()} // 防止點擊圖片時關閉
          />

          {/* 下一張按鈕 */}
          <button 
            className="absolute right-4 p-4 text-white/50 hover:text-white hover:bg-white/10 rounded-full transition-all hidden md:block"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImageIndex((prev) => (prev + 1) % screenshots.length);
            }}
          >
            <ChevronRight size={48} />
          </button>

          {/* 計數器 */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full bg-black/50 text-white/80 font-mono text-sm tracking-widest backdrop-blur-sm border border-white/10">
            {String(selectedImageIndex + 1).padStart(2, '0')} / {String(screenshots.length).padStart(2, '0')}
          </div>
        </div>
      )}

      {/* === 導覽列 === */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-neutral-950/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="font-black text-white tracking-tighter text-xl flex items-center gap-2">
            <Layers className="text-indigo-500" />
            <span className="hidden sm:inline">RENDER<span className="text-neutral-500">FLOW</span> × DESIGN<span className="text-indigo-500">MIND</span></span>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleLang}
              className="flex items-center gap-2 text-sm font-bold text-neutral-400 hover:text-white transition-colors"
            >
              <Globe size={16} /> {lang === 'en' ? '中' : 'EN'}
            </button>
            {onStartApp && (
              <button 
                onClick={onStartApp}
                className="bg-white text-black px-4 sm:px-5 py-2 rounded-full font-bold text-sm hover:bg-neutral-200 transition-colors flex items-center gap-2"
              >
                {t.navOpenApp} <ExternalLink size={16} />
              </button>
            )}
          </div>
        </div>
      </nav>

      {/* === Hero Section & 影片區 === */}
      <header className="pt-40 md:pt-48 pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-400 text-xs font-bold tracking-widest uppercase mb-2">
            <Sparkles size={14} />
            <span>{t.heroTag}</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-black text-white tracking-tight leading-tight">
            {t.heroTitle1}<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{t.heroTitle2}</span>
          </h1>
          <p className="text-lg md:text-xl text-neutral-400 leading-relaxed max-w-3xl mx-auto">
            {t.heroDesc}
          </p>

          {/* 視覺引導：向下捲動提示 (首屏結尾) */}
          <div className="pt-20 md:pt-32 pb-10 flex flex-col items-center justify-center opacity-40 animate-pulse">
            <span className="text-[10px] uppercase tracking-[0.3em] mb-4 text-white font-bold">Scroll to explore</span>
            <div className="w-[1px] h-16 bg-gradient-to-b from-white to-transparent"></div>
          </div>

          {/* YouTube 影片嵌入區塊 - 利用 vh 推至第二屏 */}
          <div className="mt-[20vh] md:mt-[30vh] relative mx-auto max-w-5xl rounded-[2rem] overflow-hidden shadow-[0_0_60px_rgba(79,70,229,0.2)] border border-white/10 aspect-video bg-neutral-900 flex items-center justify-center group">
            <iframe 
              className="w-full h-full absolute inset-0 z-10"
              src="https://www.youtube.com/embed/X1ac-t89RTg?si=vXw-874h3-uX_x8i&autoplay=0" 
              title="RenderFlow & DesignMind Intro" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              allowFullScreen>
            </iframe>
            <div className="absolute z-0 flex flex-col items-center text-neutral-500">
              <PlayCircle className="w-12 h-12 mb-2 opacity-50" />
              <span className="text-sm font-bold tracking-wider">{t.videoLoading}</span>
            </div>
          </div>
        </div>
      </header>

      {/* === 設計目的與 UI/UX 決策 (UI/UX Decisions) === */}
      <section className="py-24 px-6 bg-black relative">
        <div className="max-w-6xl mx-auto space-y-20">
          
          {/* 設計目的 */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl font-black text-white">{t.sec1Title}</h2>
              <div className="space-y-4 text-neutral-400 leading-relaxed">
                <p>{t.sec1P1}</p>
                <p><strong>{t.sec1P2}</strong></p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-neutral-900 p-6 rounded-3xl border border-white/5 space-y-4">
                <Moon className="text-neutral-400 w-8 h-8" />
                <h3 className="font-bold text-white">{t.sec1Box1Title}</h3>
                <p className="text-xs text-neutral-500">{t.sec1Box1Desc}</p>
              </div>
              <div className="bg-neutral-900 p-6 rounded-3xl border border-white/5 space-y-4 mt-8">
                <Sun className="text-neutral-400 w-8 h-8" />
                <h3 className="font-bold text-white">{t.sec1Box2Title}</h3>
                <p className="text-xs text-neutral-500">{t.sec1Box2Desc}</p>
              </div>
            </div>
          </div>

          {/* UI/UX 決策 */}
          <div className="space-y-12 pt-12 border-t border-white/5">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <h2 className="text-3xl font-black text-white">{t.sec2Title}</h2>
              <p className="text-neutral-400">{t.sec2Sub}</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {/* 決策 1：黑白切換 */}
              <div className="bg-neutral-900/50 p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/5 rounded-2xl flex items-center justify-center gap-1">
                    <Moon size={18} className="text-white" /><Sun size={18} className="text-neutral-500" />
                  </div>
                  <h3 className="font-bold text-lg text-white">{t.sec2Dec1Title}</h3>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: t.sec2Dec1Desc.replace('RenderFlow', '<strong>RenderFlow</strong>').replace('DesignMind', '<br/><br/><strong>DesignMind</strong>') }}></p>
              </div>

              {/* 決策 2：藍紫色漸變 */}
              <div className="bg-neutral-900/50 p-8 rounded-[2rem] border border-white/5 hover:border-indigo-500/30 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center">
                    <Paintbrush size={20} className="text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-white">{t.sec2Dec2Title}</h3>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed">{t.sec2Dec2Desc}</p>
              </div>

              {/* 決策 3：左上角菜單 */}
              <div className="bg-neutral-900/50 p-8 rounded-[2rem] border border-white/5 hover:border-white/10 transition-colors">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 bg-white/5 rounded-2xl flex items-center justify-center">
                    <Navigation size={20} className="text-white" />
                  </div>
                  <h3 className="font-bold text-lg text-white">{t.sec2Dec3Title}</h3>
                </div>
                <p className="text-sm text-neutral-400 leading-relaxed">{t.sec2Dec3Desc}</p>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* === 核心功能介紹 (Core Features) === */}
      <section className="py-24 px-6 bg-neutral-900/30 border-t border-white/5">
        <div className="max-w-6xl mx-auto space-y-20">
          <div className="text-center space-y-4 max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white">{t.sec3Title}</h2>
            <p className="text-neutral-400">{t.sec3Sub}</p>
          </div>

          {/* 功能 1：RenderFlow */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 text-amber-400 text-xs font-bold uppercase tracking-widest border border-amber-500/20">
                <Camera size={14} /> Part 1. RenderFlow
              </div>
              <h3 className="text-3xl font-black text-white">{t.sec3Part1Title}</h3>
              <p className="text-neutral-400 leading-relaxed">{t.sec3Part1Desc}</p>
              <ul className="space-y-6 mt-6">
                <li className="flex gap-4">
                  <Crop className="w-6 h-6 text-amber-500 shrink-0" />
                  <div>
                    <strong className="text-white block mb-1 text-lg">{t.sec3Part1F1Title}</strong>
                    <span className="text-sm text-neutral-500">{t.sec3Part1F1Desc}</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Wand2 className="w-6 h-6 text-amber-500 shrink-0" />
                  <div>
                    <strong className="text-white block mb-1 text-lg">{t.sec3Part1F2Title}</strong>
                    <span className="text-sm text-neutral-500">{t.sec3Part1F2Desc}</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2 aspect-square bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(245,158,11,0.15),_transparent_50%)]"></div>
               <div className="w-full h-full border border-dashed border-amber-500/30 rounded-2xl relative flex items-center justify-center">
                  <div className="w-1/3 h-full border-r border-dashed border-amber-500/30 absolute left-0"></div>
                  <div className="w-full h-1/3 border-b border-dashed border-amber-500/30 absolute top-0"></div>
                  <Camera className="w-16 h-16 text-amber-500/50" />
               </div>
            </div>
          </div>

          {/* 功能 2：DesignMind */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="aspect-square bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,_rgba(99,102,241,0.15),_transparent_50%)]"></div>
               <div className="w-3/4 h-3/4 bg-white rounded-xl shadow-2xl rotate-3 flex flex-col p-4 relative">
                 <div className="w-full h-1/2 bg-neutral-200 rounded-lg mb-4"></div>
                 <div className="w-3/4 h-4 bg-indigo-100 rounded mb-2"></div>
                 <div className="w-1/2 h-4 bg-indigo-100 rounded"></div>
                 <Layout className="absolute bottom-4 right-4 w-8 h-8 text-indigo-500/50" />
               </div>
            </div>
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold uppercase tracking-widest border border-indigo-500/20">
                <Palette size={14} /> Part 2. DesignMind PRO
              </div>
              <h3 className="text-3xl font-black text-white">{t.sec3Part2Title}</h3>
              <p className="text-neutral-400 leading-relaxed">{t.sec3Part2Desc}</p>
              <ul className="space-y-6 mt-6">
                <li className="flex gap-4">
                  <Type className="w-6 h-6 text-indigo-400 shrink-0" />
                  <div>
                    <strong className="text-white block mb-1 text-lg">{t.sec3Part2F1Title}</strong>
                    <span className="text-sm text-neutral-500">{t.sec3Part2F1Desc}</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Layers className="w-6 h-6 text-indigo-400 shrink-0" />
                  <div>
                    <strong className="text-white block mb-1 text-lg">{t.sec3Part2F2Title}</strong>
                    <span className="text-sm text-neutral-500">{t.sec3Part2F2Desc}</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>

          {/* 功能 3：防呆黑科技 */}
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-widest border border-emerald-500/20">
                <ShieldCheck size={14} /> Under The Hood
              </div>
              <h3 className="text-3xl font-black text-white">{t.sec3Part3Title}</h3>
              <p className="text-neutral-400 leading-relaxed">{t.sec3Part3Desc}</p>
              <ul className="space-y-6 mt-6">
                <li className="flex gap-4">
                  <Zap className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <strong className="text-white block mb-1 text-lg">{t.sec3Part3F1Title}</strong>
                    <span className="text-sm text-neutral-500">{t.sec3Part3F1Desc}</span>
                  </div>
                </li>
                <li className="flex gap-4">
                  <Layout className="w-6 h-6 text-emerald-500 shrink-0" />
                  <div>
                    <strong className="text-white block mb-1 text-lg">{t.sec3Part3F2Title}</strong>
                    <span className="text-sm text-neutral-500">{t.sec3Part3F2Desc}</span>
                  </div>
                </li>
              </ul>
            </div>
            <div className="order-1 md:order-2 aspect-square bg-gradient-to-br from-neutral-800 to-neutral-900 rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center p-8 shadow-2xl relative overflow-hidden">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.15),_transparent_50%)]"></div>
               <div className="w-3/4 bg-neutral-950 rounded-xl border border-emerald-500/30 p-5 font-mono text-xs text-emerald-400/80 space-y-2 relative z-10 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                 <p>{`if (contrast < 3.0) {`}</p>
                 <p className="pl-4">{`applyShield(text);`}</p>
                 <p className="pl-4 text-white font-bold bg-emerald-500/20 px-2 py-0.5 rounded inline-block">Fix Readability</p>
                 <p>{`}`}</p>
                 <p className="mt-4">{`anchoring: 'center'`}</p>
                 <p>{`whiteSpace: 'pre'`}</p>
                 <ShieldCheck className="absolute -bottom-4 -right-4 w-16 h-16 text-emerald-500/20" />
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* === Gallery (功能實機展示) === */}
      <section className="py-24 bg-neutral-950">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white">{t.sec4Title}</h2>
            <p className="text-neutral-400">{t.sec4Sub}</p>
          </div>
          
          {/* 瀑布流/網格展示區 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8">
            {screenshots.map((src, index) => (
              <div 
                key={index} 
                className="group relative aspect-[4/5] rounded-3xl overflow-hidden bg-neutral-900 border border-white/5 shadow-lg cursor-pointer"
                onClick={() => setSelectedImageIndex(index)}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center text-neutral-600 group-hover:opacity-0 transition-opacity">
                  <ImageIcon className="w-12 h-12 mb-2 opacity-30" />
                  <span className="text-xs font-mono">/screenshots/shot-{index + 1}.png</span>
                  <span className="text-[10px] mt-1 opacity-50">{t.sec4Waiting}</span>
                </div>
                <img 
                  src={src} 
                  alt={`Feature Showcase ${index + 1}`}
                  className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:scale-105 transition-transform duration-700 ease-in-out z-10"
                  onError={(e) => { e.target.style.display = 'none'; }}
                  onLoad={(e) => { e.target.style.opacity = '1'; }}
                />
                {/* 懸停遮罩與放大圖示 */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20 flex items-center justify-center">
                  <div className="p-4 bg-white/10 rounded-full backdrop-blur-md text-white border border-white/20 transform scale-50 group-hover:scale-100 transition-all duration-300">
                    <ZoomIn size={24} />
                  </div>
                </div>
                {/* 底部編號 */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6 pt-12 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none flex justify-between items-end">
                  <span className="text-white/80 font-mono text-sm">Shot {String(index + 1).padStart(2, '0')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === Footer === */}
      <footer className="py-12 border-t border-white/10 text-center text-neutral-500">
        <p className="font-bold tracking-widest text-sm mb-2 uppercase text-white/70">{t.footerBrand}</p>
        <p className="text-xs">{t.footerTech}</p>
      </footer>
    </div>
  );
}