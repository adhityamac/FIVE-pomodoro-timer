import { memo } from "react";
import { motion } from "motion/react";
import { useTimerStore, Mode } from "../utils/store";
import { playClick } from "../utils/audio";
import { Magnetic } from "./Magnetic";

const TABS: { id: Mode; label: string }[] = [
  { id: "focus", label: "Focus" },
  { id: "shortBreak", label: "Short Break" },
  { id: "longBreak", label: "Long Break" },
];

export const SegmentedControl = memo(function SegmentedControl() {
  const { mode, setMode } = useTimerStore();

  const triggerHaptic = (e?: React.MouseEvent) => {
    playClick(e?.clientX);
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(40);
    }
  };

  return (
    <div className={`relative flex items-center p-1 rounded-full backdrop-blur-2xl border shadow-[inset_0_1px_4px_rgba(255,255,255,0.05)] overflow-hidden transition-colors duration-500 bg-white/5 border-white/10`}>
      {TABS.map((tab) => {
        const isActive = mode === tab.id;
        return (
          <Magnetic key={tab.id}>
            <motion.button
              onClick={(e) => {
                triggerHaptic(e);
                setMode(tab.id);
              }}
              whileTap={{ scale: 0.95 }}
              className={`relative px-5 py-2.5 text-[13px] font-medium tracking-wide transition-colors duration-300 z-10 focus:outline-none ${
                isActive 
                  ? "text-white" 
                  : "text-white/50 hover:text-white/80"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="segmented-control-active"
                  className={`absolute inset-0 rounded-full border shadow-sm bg-white/15 border-white/10`}
                  transition={{ type: "spring", stiffness: 160, damping: 18 }}
                />
              )}
              <span className="relative z-10">{tab.label}</span>
            </motion.button>
          </Magnetic>
        );
      })}
    </div>
  );
});