import { useState, useRef, memo } from "react";
import { motion, useSpring } from "motion/react";
import { RotateCcw, Settings } from "lucide-react";
import { playClick } from "../utils/audio";
import { useTimerStore } from "../utils/store";

const MagneticButton = ({ children, onClick, className }: any) => {
  const ref = useRef<HTMLButtonElement>(null);
  const rectRef = useRef<DOMRect | null>(null);
  
  const x = useSpring(0, { stiffness: 150, damping: 15, mass: 0.1 });
  const y = useSpring(0, { stiffness: 150, damping: 15, mass: 0.1 });
  const scaleX = useSpring(1, { stiffness: 120, damping: 25 });
  const scaleY = useSpring(1, { stiffness: 120, damping: 25 });

  const handleMouseEnter = () => {
    if (ref.current) {
      rectRef.current = ref.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    let rect = rectRef.current;
    if (!rect && ref.current) {
      rect = ref.current.getBoundingClientRect();
      rectRef.current = rect;
    }
    if (!rect) return;
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Magnetic attraction to cursor
    x.set((e.clientX - centerX) * 0.4);
    y.set((e.clientY - centerY) * 0.4);
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    x.set(0);
    y.set(0);
    scaleX.set(1);
    scaleY.set(1);
  };

  const handlePointerDown = () => {
    scaleX.set(1.15); // Squish wider
    scaleY.set(0.85); // Squish shorter
  };

  const handlePointerUp = () => {
    scaleX.set(1);
    scaleY.set(1);
  };

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onClick={(e) => {
        playClick(e.clientX);
        onClick?.(e);
      }}
      style={{ x, y, scaleX, scaleY }}
      className={className}
    >
      {children}
    </motion.button>
  );
};

export const ControlTray = memo(function ControlTray() {
  const { isActive, setIsActive, reset, setIsSettingsOpen } = useTimerStore();
  const [mousePos, setMousePos] = useState({ x: -100, y: -100 });
  const trayRef = useRef<HTMLDivElement>(null);
  const rectRef = useRef<DOMRect | null>(null);

  const handleMouseEnter = () => {
    if (trayRef.current) {
      rectRef.current = trayRef.current.getBoundingClientRect();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    let rect = rectRef.current;
    if (!rect && trayRef.current) {
      rect = trayRef.current.getBoundingClientRect();
      rectRef.current = rect;
    }
    if (!rect) return;
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  const handleMouseLeave = () => {
    rectRef.current = null;
    setMousePos({ x: -100, y: -100 });
  };

  return (
    <div 
      ref={trayRef}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative flex items-center justify-center gap-6 px-8 py-4 rounded-[2rem] backdrop-blur-[40px] border shadow-[0_8px_32px_rgba(0,0,0,0.2)] transition-colors duration-500 bg-white/[0.03] border-white/10 before:absolute before:inset-0 before:rounded-[2rem] before:bg-gradient-to-b before:pointer-events-none bg-white/[0.03] border-white/10 before:from-white/5 before:to-transparent`}
      style={{
        backdropFilter: "blur(40px) saturate(180%)",
      }}
    >
      {/* Edge glass distortion */}
      <svg width="0" height="0" className="absolute pointer-events-none">
        <filter id="glass-warp">
          <feTurbulence type="fractalNoise" baseFrequency="0.05" numOctaves="1" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="5" xChannelSelector="R" yChannelSelector="G" />
        </filter>
      </svg>
      <div 
        className="absolute inset-0 rounded-[2rem] pointer-events-none"
        style={{ filter: "url(#glass-warp)", opacity: 0.5 }}
      />
      {/* Hover lighting */}
      <div 
        className="absolute inset-0 rounded-[inherit] pointer-events-none transition-opacity duration-300"
        style={{
          background: `radial-gradient(60px circle at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.4), transparent)`,
          WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
          WebkitMaskComposite: "xor",
          maskComposite: "exclude",
          padding: "1px",
        }}
      />
      
      <MagneticButton
        onClick={reset}
        className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors text-white/70 hover:text-white focus:outline-none`}
      >
        <RotateCcw className="w-4 h-4" strokeWidth={2.5} />
      </MagneticButton>

      <MagneticButton
        onClick={(e: React.MouseEvent) => setIsActive(!isActive, e.clientX)}
        className={`relative flex items-center justify-center w-14 h-14 rounded-full transition-all bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] focus:outline-none`}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" className={isActive ? "" : "ml-1"}>
          <motion.path
            d="M 8 6 L 11 6 L 11 18 L 8 18 Z"
            animate={{
              d: isActive 
                ? "M 8 6 L 11 6 L 11 18 L 8 18 Z" 
                : "M 8 6 L 13 9 L 13 15 L 8 18 Z"
            }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
          />
          <motion.path
            d="M 13 6 L 16 6 L 16 18 L 13 18 Z"
            animate={{
              d: isActive 
                ? "M 13 6 L 16 6 L 16 18 L 13 18 Z" 
                : "M 13 9 L 18 12 L 18 12 L 13 15 Z"
            }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
          />
        </svg>
      </MagneticButton>

      <MagneticButton
        className={`relative flex items-center justify-center w-10 h-10 rounded-full transition-colors text-white/70 hover:text-white focus:outline-none`}
        onClick={() => {
          if (typeof navigator !== "undefined" && navigator.vibrate) {
            navigator.vibrate(40);
          }
          setIsSettingsOpen(true);
        }}
      >
        <Settings className="w-4 h-4" strokeWidth={2.5} />
      </MagneticButton>
      
    </div>
  );
});