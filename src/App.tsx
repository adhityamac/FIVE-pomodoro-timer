import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TimerHero } from "./components/TimerHero";
import { SegmentedControl } from "./components/SegmentedControl";
import { ControlTray } from "./components/ControlTray";
import { ThemeSelector } from "./components/ThemeSelector";
import { MagneticCursor } from "./components/MagneticCursor";
import { SettingsModal } from "./components/SettingsModal";
import { useTimerStore } from "./utils/store";
import { auras } from "./utils/auras";
import { playTap, playAlarm } from "./utils/audio";

export default function App() {
  const {
    mode,
    activeAura,
    durations,
    timeLeft,
    isActive,
    isSettingsOpen,
    autoFlow,
    setMode,
    setTimeLeft,
    setIsActive,
  } = useTimerStore();

  const workerRef = useRef<Worker | null>(null);

  // Keep ref of active state for the worker handler to avoid stale closures
  const stateRef = useRef({ autoFlow, mode, durations, isActive, timeLeft });
  useEffect(() => {
    stateRef.current = { autoFlow, mode, durations, isActive, timeLeft };
  }, [autoFlow, mode, durations, isActive, timeLeft]);

  useEffect(() => {
    // Instantiate background timekeeping worker
    workerRef.current = new Worker(
      new URL('./utils/timer.worker.ts', import.meta.url),
      { type: 'module' }
    );

    workerRef.current.onmessage = (e: MessageEvent) => {
      const { action, timeLeft: workerTimeLeft } = e.data;
      if (action === 'tick') {
        setTimeLeft(workerTimeLeft);

        if (workerTimeLeft === 0) {
          const current = stateRef.current;
          if (current.autoFlow) {
            const nextMode = current.mode === 'focus' ? 'shortBreak' : 'focus';
            const nextDuration = current.durations[nextMode];
            
            setMode(nextMode);
            setTimeLeft(nextDuration);
            
            workerRef.current?.postMessage({ action: 'start', timeLeft: nextDuration });
          } else {
            setIsActive(false);
          }
        }
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [setMode, setTimeLeft, setIsActive]);

  // Worker active state controller
  useEffect(() => {
    if (isActive) {
      workerRef.current?.postMessage({ action: 'start', timeLeft });
    } else {
      workerRef.current?.postMessage({ action: 'pause' });
    }
  }, [isActive, timeLeft]);

  // Sensory feedback: Haptic heartbeat, warning taps, and bell chime
  useEffect(() => {
    if (!isActive) return;

    // Heartbeat vibe in the final 10 seconds
    if (timeLeft <= 10 && timeLeft > 0) {
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        const intensity = 10 + (10 - timeLeft) * 4;
        navigator.vibrate(intensity);
      }
    }

    // Gentle warning click at 1 second
    if (timeLeft === 1) {
      playTap();
    }

    // High fidelity bell chime alarm
    if (timeLeft === 0) {
      playAlarm();
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate([200, 100, 200, 100, 500]);
      }
    }
  }, [timeLeft, isActive]);

  return (
    <div className={`relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden font-sans antialiased bg-black text-white`}>
      <MagneticCursor />
      
      {/* 60fps GPU-Accelerated Breathing Aura Background */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <AnimatePresence mode="wait">
          {auras.map((a) => (
            a.id === activeAura.id && (
              <motion.div
                key={a.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1, ease: "easeInOut" }}
                className="absolute inset-0"
              >
                {/* Active breathing pulse wrapper */}
                <motion.div
                  animate={{
                    scale: isActive 
                      ? [1, 1.025, 0.98, 1.025, 1] // Faster, active heartbeat
                      : [1, 1.04, 1]              // Slow, resting breathing cycle
                  }}
                  transition={{
                    duration: isActive ? 4 : 8,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute inset-0"
                >
                  {/* Inactive Aura state */}
                  <div 
                    className="absolute inset-0 transition-opacity duration-1000 ease-out"
                    style={{
                      background: a.bgInactive || `radial-gradient(ellipse at center, ${a.core} 0%, ${a.inner} 22%, ${a.mid} 55%, ${a.outer} 100%)`,
                      opacity: isActive ? 0 : 1,
                      willChange: "opacity"
                    }}
                  />
                  {/* Active Aura state */}
                  <div 
                    className="absolute inset-0 transition-opacity duration-1000 ease-out"
                    style={{
                      background: a.bgActive || `radial-gradient(ellipse at center, #ffffff 0%, ${a.inner} 30%, ${a.mid} 60%, ${a.outer} 100%)`,
                      opacity: isActive ? 1 : 0,
                      willChange: "opacity"
                    }}
                  />
                </motion.div>
              </motion.div>
            )
          ))}
        </AnimatePresence>
      </div>

      {/* Screen noise overlay */}
      <div 
        className="fixed inset-[-5%] w-[110%] h-[110%] z-40 opacity-[0.06] mix-blend-overlay pointer-events-none" 
        style={{ 
          backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.8%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")',
          animation: 'grain 1s steps(10) infinite'
        }}
      />
      <style>{`
        @keyframes grain {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1%, -1%); }
          20% { transform: translate(1%, 1%); }
          30% { transform: translate(-2%, 2%); }
          40% { transform: translate(2%, -2%); }
          50% { transform: translate(-1%, 2%); }
          60% { transform: translate(2%, -1%); }
          70% { transform: translate(1%, 2%); }
          80% { transform: translate(-2%, -1%); }
          90% { transform: translate(2%, 1%); }
        }
        body {
          cursor: none;
        }
      `}</style>

      <main className="@container relative z-10 flex flex-col items-center justify-between h-[100dvh] w-full max-w-md mx-auto py-8 px-6">
        
        {/* Top Nav: Theme Selector & Segments */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, type: "spring", bounce: 0.4 }}
          className="w-full flex flex-col items-center gap-4 mt-2 transition-all duration-700"
        >
          <ThemeSelector />
          <SegmentedControl />
        </motion.div>

        {/* Hero Clock Dial */}
        <motion.div 
          layout
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 1, type: "spring", bounce: 0.4 }}
          className="flex-1 flex items-center justify-center w-full" 
          style={{ perspective: "1000px" }}
        >
          <TimerHero />
        </motion.div>

        {/* Lower Control Tray */}
        <motion.div 
          layout
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8, type: "spring", bounce: 0.4 }}
          className="w-full flex justify-center mb-6 transition-all duration-700"
        >
          <ControlTray />
        </motion.div>

      </main>

      {/* Global Config Settings Drawer */}
      <SettingsModal />
    </div>
  );
}