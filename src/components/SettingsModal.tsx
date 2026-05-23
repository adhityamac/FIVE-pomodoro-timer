import { memo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Volume2, Repeat, Sparkles, Clock3 } from "lucide-react";
import { playTap } from "../utils/audio";
import { useTimerStore } from "../utils/store";
import { Magnetic } from "./Magnetic";

export const SettingsModal = memo(function SettingsModal() {
  const {
    isSettingsOpen,
    setIsSettingsOpen,
    autoFlow,
    setAutoFlow,
    asmrTicking,
    setAsmrTicking
  } = useTimerStore();

  const handleClose = () => {
    playTap();
    setIsSettingsOpen(false);
  };

  return (
    <AnimatePresence>
      {isSettingsOpen && (
        <>
          {/* Frosted Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-md"
          />
          {/* Settings Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, rotateX: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20, rotateX: -15 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90%] max-w-sm rounded-[2rem] p-6 text-white overflow-hidden bg-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.4)] backdrop-blur-[40px] saturate-[120%]"
            style={{ transformStyle: "preserve-3d" }}
          >
            <div className="relative flex items-center justify-between mb-8 z-10">
              <h2 className="text-sm uppercase tracking-[0.2em] font-medium text-white/80">Preferences</h2>
              <Magnetic>
                <button 
                  onClick={handleClose}
                  className="p-2 rounded-full hover:bg-white/10 transition-colors focus:outline-none"
                >
                  <X className="w-5 h-5 text-white/50 hover:text-white" />
                </button>
              </Magnetic>
            </div>

            <div className="relative space-y-4 z-10">
              {/* Smart Auto-Flow */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/80">
                    <Repeat className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Smart Auto-Flow</h3>
                    <p className="text-xs text-white/40 mt-0.5">Cascade focus to breaks</p>
                  </div>
                </div>
                <Magnetic>
                  <button
                    onClick={() => {
                      playTap();
                      setAutoFlow(!autoFlow);
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${autoFlow ? "bg-white" : "bg-white/20"}`}
                  >
                    <motion.div
                      animate={{ x: autoFlow ? 24 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`absolute top-1 left-0 w-4 h-4 rounded-full ${autoFlow ? "bg-black" : "bg-white"}`}
                    />
                  </button>
                </Magnetic>
              </div>

              {/* ASMR Ticking */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/80">
                    <Clock3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Watch Escapement</h3>
                    <p className="text-xs text-white/40 mt-0.5">Ultra-quiet ASMR ticking</p>
                  </div>
                </div>
                <Magnetic>
                  <button
                    onClick={() => {
                      playTap();
                      setAsmrTicking(!asmrTicking);
                    }}
                    className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none ${asmrTicking ? "bg-white" : "bg-white/20"}`}
                  >
                    <motion.div
                      animate={{ x: asmrTicking ? 24 : 2 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                      className={`absolute top-1 left-0 w-4 h-4 rounded-full ${asmrTicking ? "bg-black" : "bg-white"}`}
                    />
                  </button>
                </Magnetic>
              </div>

              {/* Spatial Audio (static indicator) */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-black/20 border border-white/5 opacity-70">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/10 text-white/80">
                    <Volume2 className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-medium">Spatial Audio</h3>
                    <p className="text-xs text-white/40 mt-0.5">Haptics & SFX Panning</p>
                  </div>
                </div>
                <div className="text-xs font-medium tracking-wide text-white/50 pr-2">ON</div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});
