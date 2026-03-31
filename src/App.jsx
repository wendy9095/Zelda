import { useState } from "react";
import { Menu } from "lucide-react";
import RenderFlowApp from "./RenderFlowApp.jsx";
import { LocaleProvider } from "./LocaleContext.jsx";
import DesignMindApp from "./DesignMindApp.jsx";
import PresentationPage from "./PresentationPage.jsx";

export default function App() {
  const isPresentationPage =
    typeof window !== "undefined" &&
    /\/presentation\/?$/.test(window.location.pathname);

  if (isPresentationPage) {
    return <PresentationPage />;
  }

  const [view, setView] = useState("renderflow");
  const [renderFlowStep, setRenderFlowStep] = useState(null);

  return (
    <div className="relative min-h-screen">
      {view === "renderflow" && (
        <>
          {renderFlowStep !== "studio" && (
            <button
              type="button"
              onClick={() => setView("designmind")}
              className="fixed top-4 left-4 z-[300] flex items-center gap-2 rounded-2xl border border-white/20 bg-black/40 px-3 py-2.5 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/55 sm:px-4"
              aria-expanded={false}
              aria-label="打开 DesignMind 排版"
            >
              <Menu className="h-5 w-5 shrink-0" />
              <span className="hidden text-[10px] font-black uppercase tracking-widest sm:inline">
                DesignMind
              </span>
            </button>
          )}
          <LocaleProvider>
            <RenderFlowApp onStepChange={setRenderFlowStep} />
          </LocaleProvider>
        </>
      )}

      {view === "designmind" && (
        <DesignMindApp onBackToRenderFlow={() => setView("renderflow")} />
      )}
    </div>
  );
}
