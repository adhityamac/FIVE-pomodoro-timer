import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Aura, auras } from "./auras";
import { playClick, playTap, playRewind, startTicking, stopTicking } from "./audio";

export type Mode = 'focus' | 'shortBreak' | 'longBreak';

interface TimerState {
  mode: Mode;
  activeAura: Aura;
  durations: Record<Mode, number>;
  timeLeft: number;
  isActive: boolean;
  isSettingsOpen: boolean;
  autoFlow: boolean;
  asmrTicking: boolean;
  
  setMode: (mode: Mode) => void;
  setActiveAura: (aura: Aura) => void;
  setDurations: (durations: Record<Mode, number>) => void;
  setTimeLeft: (time: number) => void;
  setIsActive: (active: boolean, clientX?: number) => void;
  setAutoFlow: (autoFlow: boolean) => void;
  setAsmrTicking: (ticking: boolean) => void;
  setIsSettingsOpen: (isOpen: boolean) => void;
  reset: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      mode: "focus",
      activeAura: auras[0],
      durations: {
        focus: 25 * 60,
        shortBreak: 5 * 60,
        longBreak: 15 * 60,
      },
      timeLeft: 25 * 60,
      isActive: false,
      isSettingsOpen: false,
      autoFlow: false,
      asmrTicking: false,

      setMode: (mode) => {
        const durations = get().durations;
        const newTime = durations[mode];
        set({ mode, timeLeft: newTime, isActive: false });
        stopTicking();
      },

      setActiveAura: (aura) => {
        set({ activeAura: aura });
      },

      setDurations: (durations) => {
        const mode = get().mode;
        const newTime = durations[mode];
        set({ durations, timeLeft: newTime });
      },

      setTimeLeft: (timeLeft) => {
        set({ timeLeft });
      },

      setIsActive: (isActive, clientX) => {
        playClick(clientX);
        set({ isActive });
        
        // Tactile Haptics
        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(isActive ? 60 : 30);
        }

        // Ticking audio synchronization
        if (isActive && get().asmrTicking && get().timeLeft > 0) {
          startTicking();
        } else {
          stopTicking();
        }
      },

      setAutoFlow: (autoFlow) => {
        set({ autoFlow });
      },

      setAsmrTicking: (asmrTicking) => {
        set({ asmrTicking });
        
        // Sync tick sound
        if (get().isActive && asmrTicking && get().timeLeft > 0) {
          startTicking();
        } else {
          stopTicking();
        }
      },

      setIsSettingsOpen: (isSettingsOpen) => {
        set({ isSettingsOpen });
      },

      reset: () => {
        const mode = get().mode;
        const durations = get().durations;
        set({ timeLeft: durations[mode], isActive: false });
        playRewind();
        stopTicking();

        if (typeof navigator !== "undefined" && navigator.vibrate) {
          navigator.vibrate(40);
        }
      },
    }),
    {
      name: "pomodoro-timer-store",
      partialize: (state) => ({
        durations: state.durations,
        activeAura: state.activeAura,
        autoFlow: state.autoFlow,
        asmrTicking: state.asmrTicking,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Align timeLeft with the loaded durations on boot
          state.timeLeft = state.durations[state.mode];
        }
      }
    }
  )
);
