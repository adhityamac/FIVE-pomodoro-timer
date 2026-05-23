import { memo } from "react";
import { auras } from "../utils/auras";
import { useTimerStore } from "../utils/store";
import { Magnetic } from "./Magnetic";

export const ThemeSelector = memo(function ThemeSelector() {
  const { activeAura, setActiveAura } = useTimerStore();

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div className="flex items-center gap-3 p-1.5 rounded-full backdrop-blur-2xl border bg-white/5 border-white/10 shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)]">
        {auras.map((a) => {
          const isActive = activeAura.id === a.id;
          return (
            <Magnetic key={a.id}>
              <button
                onClick={() => {
                  triggerHaptic();
                  setActiveAura(a);
                }}
                aria-label={`Show ${a.name} aura`}
                aria-pressed={isActive}
                className={`relative w-8 h-8 rounded-full transition-transform duration-300 focus:outline-none focus:ring-2 focus:ring-white/60 ${isActive ? 'scale-110' : 'hover:scale-105'}`}
                style={{
                  background: `radial-gradient(circle at center, ${a.core} 0%, ${a.inner} 35%, ${a.mid} 70%, ${a.outer} 100%)`,
                  boxShadow: isActive
                    ? '0 0 0 2px rgba(255,255,255,0.9), 0 8px 24px rgba(0,0,0,0.2)'
                    : '0 4px 16px rgba(0,0,0,0.15)',
                }}
              />
            </Magnetic>
          );
        })}
      </div>
      <p
        className="text-white/70 text-[10px] tracking-[0.3em] uppercase transition-colors"
        style={{ textShadow: '0 1px 12px rgba(0,0,0,0.25)' }}
      >
        Aura Study — {activeAura.name}
      </p>
    </div>
  );
});
