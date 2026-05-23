import { useMemo, useRef, useEffect, useState, memo } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "motion/react";
import { Mode } from "../utils/store";
import { Aura } from "../utils/auras";
import { playTap } from "../utils/audio";

const Digit = ({ digit, id }: { digit: string; id: string }) => {
  return (
    <div className="relative inline-flex flex-col overflow-hidden h-[1.1em] align-top">
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={`${id}-${digit}`}
          initial={{ y: "100%", opacity: 0, filter: "blur(4px)" }}
          animate={{ y: "0%", opacity: 1, filter: "blur(0px)" }}
          exit={{ y: "-100%", opacity: 0, filter: "blur(4px)" }}
          transition={{ type: "spring", stiffness: 200, damping: 25 }}
          className="inline-block"
        >
          {digit}
        </motion.span>
      </AnimatePresence>
    </div>
  );
};

import { useTimerStore } from "../utils/store";

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString()}:${s.toString().padStart(2, '0')}`;
};

export const TimerHero = memo(function TimerHero() {
  const {
    timeLeft,
    durations,
    mode,
    activeAura,
    isActive,
    setIsActive,
    setDurations
  } = useTimerStore();

  const totalTime = durations[mode];
  const containerRef = useRef<HTMLDivElement>(null);

  // Parallax Physics setup
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for the parallax tilt
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  // Jelly click state
  const [isJelly, setIsJelly] = useState(false);

  // Map mouse position to rotation angles (subtle 3D tilt)
  const rotateX = useTransform(springY, [-0.5, 0.5], [15, -15]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-15, 15]);
  
  // Lighting specular shift based on tilt
  const glareX = useTransform(springX, [-0.5, 0.5], [-20, 20]);
  const glareY = useTransform(springY, [-0.5, 0.5], [-20, 20]);

  useEffect(() => {
    let rect: DOMRect | null = null;

    const handleResize = () => {
      rect = null; // Invalidate cache
    };

    const handleScroll = () => {
      rect = null; // Invalidate cache
    };

    // Mouse Parallax
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) return; // Lock parallax when dragging the rim
      if (!containerRef.current) return;
      if (!rect) {
        rect = containerRef.current.getBoundingClientRect();
      }
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      if (Math.abs(x) < 1.5 && Math.abs(y) < 1.5) {
        mouseX.set(x);
        mouseY.set(y);
      } else {
        mouseX.set(0);
        mouseY.set(0);
      }
    };

    const handleMouseLeave = () => {
      mouseX.set(0);
      mouseY.set(0);
    };

    // Gyroscope Mobile Tilt
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (!e.beta || !e.gamma) return;
      let x = e.gamma / 60;
      let y = (e.beta - 45) / 60;
      x = Math.max(-0.5, Math.min(0.5, x));
      y = Math.max(-0.5, Math.min(0.5, y));
      mouseX.set(x);
      mouseY.set(y);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleScroll, { passive: true });
    
    window.addEventListener("deviceorientation", handleDeviceOrientation);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("deviceorientation", handleDeviceOrientation);
    };
  }, [mouseX, mouseY]);

  const isDraggingRef = useRef(false);

  const adjustTime = (clientX: number, clientY: number, rect: DOMRect) => {
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 90 + 360) % 360;
    
    const progress = angle / 360;
    const maxMinutes = mode === 'focus' ? 60 : mode === 'shortBreak' ? 15 : 30;
    const newMinutes = Math.max(1, Math.round(progress * maxMinutes));
    
    setDurations({ ...durations, [mode]: newMinutes * 60 });
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const radius = Math.sqrt(dx * dx + dy * dy);
    
    const svgRadius = (radius / (rect.width / 2)) * 230;

    // Check if dragging outer rim (ticks area)
    if (svgRadius >= 170 && svgRadius <= 245) {
      isDraggingRef.current = true;
      containerRef.current.setPointerCapture(e.pointerId);
      adjustTime(e.clientX, e.clientY, rect);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      adjustTime(e.clientX, e.clientY, rect);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      if (containerRef.current) {
        containerRef.current.releasePointerCapture(e.pointerId);
      }
    } else {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const radius = Math.sqrt(dx * dx + dy * dy);
      const svgRadius = (radius / (rect.width / 2)) * 230;

      if (svgRadius < 170) {
        playTap();
        setIsJelly(true);
        setTimeout(() => setIsJelly(false), 500);
        setIsActive(!isActive, e.clientX);
      }
    }
  };

  // Makes the dial go a full 360 degrees, sweeping from top around and back
  const progress = 1 - (timeLeft / totalTime);
  const arcDegrees = 360;
  const startAngle = -90;
  const currentAngle = startAngle + (progress * arcDegrees);

  const neonColor = activeAura.inner;
  const outerColor = activeAura.outer;

  const ticksPathData = useMemo(() => {
    const numTicks = 60;
    let majorPath = "";
    let minorPath = "";
    for (let i = 0; i < numTicks; i++) {
      const angle = startAngle + (i / numTicks) * arcDegrees;
      const rad = (angle) * (Math.PI / 180);
      const isMajor = i % 5 === 0;
      
      const innerRadius = isMajor ? 200 : 208;
      const outerRadius = 215;

      const cx = 230;
      const cy = 230;

      const x1 = cx + Math.cos(rad) * innerRadius;
      const y1 = cy + Math.sin(rad) * innerRadius;
      const x2 = cx + Math.cos(rad) * outerRadius;
      const y2 = cy + Math.sin(rad) * outerRadius;

      if (isMajor) {
        majorPath += ` M ${x1} ${y1} L ${x2} ${y2}`;
      } else {
        minorPath += ` M ${x1} ${y1} L ${x2} ${y2}`;
      }
    }
    return { majorPath, minorPath };
  }, [startAngle, arcDegrees]);

  const dentedPath = useMemo(() => {
    const cx = 230;
    const cy = 230;
    const r = 185;
    const points = [];
    for (let a = 0; a < 360; a++) {
      let currentR = r;
      let dist = a;
      if (dist > 180) dist = 360 - dist;
      
      if (dist < 35) {
        const factor = 1 - (dist / 35); 
        const ease = factor < 0.5 ? 2 * factor * factor : 1 - Math.pow(-2 * factor + 2, 2) / 2;
        currentR -= 28 * ease;
      }
      const rad = (a * Math.PI) / 180;
      points.push(`${cx + currentR * Math.cos(rad)},${cy + currentR * Math.sin(rad)}`);
    }
    return `M ${points.join(' L ')} Z`;
  }, []);

  const dentGlowPath = useMemo(() => {
    const cx = 230;
    const cy = 230;
    const r = 185;
    const points = [];
    for (let a = -45; a <= 45; a++) {
      let currentR = r;
      let dist = Math.abs(a);
      
      if (dist < 35) {
        const factor = 1 - (dist / 35); 
        const ease = factor < 0.5 ? 2 * factor * factor : 1 - Math.pow(-2 * factor + 2, 2) / 2;
        currentR -= 28 * ease;
      }
      const rad = (a * Math.PI) / 180;
      points.push(`${cx + currentR * Math.cos(rad)},${cy + currentR * Math.sin(rad)}`);
    }
    return `M ${points.join(' L ')}`;
  }, []);

  return (
    <motion.div 
      ref={containerRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      data-cursor="dial"
      className="relative flex items-center justify-center w-[100cqw] max-w-[480px] aspect-square cursor-pointer"
      style={{
        rotateX,
        rotateY,
        transformStyle: "preserve-3d"
      }}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.96, rotateX: 0, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* 3D glare effect moving inversely to the rotation */}
      <motion.div 
        className="absolute inset-0 z-30 rounded-full pointer-events-none opacity-40 mix-blend-overlay"
        style={{
          x: glareX,
          y: glareY,
          background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8) 0%, transparent 40%)',
          transformStyle: "preserve-3d",
          translateZ: "30px"
        }}
      />

      <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 460 460" style={{ transformStyle: "preserve-3d", translateZ: "10px" }}>
        <defs>
          <filter id="superGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="8" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="mildGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur"/>
            <feMerge>
              <feMergeNode in="blur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>

          <filter id="tickShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.75" stdDeviation="0.4" floodColor="#000000" floodOpacity="0.5" />
          </filter>

          <filter id="volumetricNeon" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur1" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="8" result="blur2" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="20" result="blur3" />
            <feGaussianBlur in="SourceGraphic" stdDeviation="40" result="blur4" />
            <feMerge result="mergedBlurs">
              <feMergeNode in="blur4" />
              <feMergeNode in="blur3" />
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
            <feColorMatrix in="mergedBlurs" type="saturate" values="3" result="saturated" />
            <feComponentTransfer in="saturated">
              <feFuncR type="linear" slope="1.3" />
              <feFuncG type="linear" slope="1.3" />
              <feFuncB type="linear" slope="1.3" />
            </feComponentTransfer>
          </filter>

          <filter id="jellyWobble">
            <feTurbulence type="fractalNoise" baseFrequency={isJelly ? "0.08" : "0"} numOctaves="2" result="noise">
              {isJelly && <animate attributeName="baseFrequency" values="0.08;0" dur="0.5s" fill="freeze" />}
            </feTurbulence>
            <feDisplacementMap in="SourceGraphic" in2="noise" scale={isJelly ? "15" : "0"} xChannelSelector="R" yChannelSelector="G">
              {isJelly && <animate attributeName="scale" values="15;0" dur="0.5s" fill="freeze" />}
            </feDisplacementMap>
          </filter>

          <radialGradient id="dentLight" cx="390" cy="230" r="160" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={outerColor} stopOpacity="0.8" />
            <stop offset="50%" stopColor={neonColor} stopOpacity="0.3" />
            <stop offset="100%" stopColor={neonColor} stopOpacity="0" />
          </radialGradient>

          <radialGradient id="dialFaceGradient" cx="230" cy="230" r="185" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={activeAura.dialStop1 || "#161722"} />
            <stop offset="60%" stopColor={activeAura.dialStop2 || "#080910"} />
            <stop offset="100%" stopColor={activeAura.dialStop3 || "#010103"} />
          </radialGradient>
          
          <linearGradient id="dialSpecular" x1="0" y1="0" x2="460" y2="460" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.0" />
            <stop offset="70%" stopColor="#000000" stopOpacity="0.0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
          </linearGradient>
        </defs>

        {/* Ticks on the background */}
        <path d={ticksPathData.majorPath} stroke="rgba(255, 255, 255, 0.95)" strokeWidth={1} strokeLinecap="round" filter="url(#tickShadow)" />
        <path d={ticksPathData.minorPath} stroke="rgba(255, 255, 255, 0.45)" strokeWidth={0.5} strokeLinecap="round" filter="url(#tickShadow)" />

        {/* The Active Running Light (moves continuously when active) */}
        {isActive && (
          <motion.g
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            style={{ transformOrigin: "230px 230px", transformBox: "view-box" }}
          >
            {/* Extended Saturated Trail */}
            <circle
              cx="230" cy="230" r="185"
              fill="none"
              stroke={neonColor}
              strokeWidth="6"
              strokeDasharray="180 1200"
              strokeLinecap="round"
              filter="url(#volumetricNeon)"
              opacity="1"
            />
            {/* Mid-Head (blend from white to color) */}
            <circle
              cx="230" cy="230" r="185"
              fill="none"
              stroke="#ffffff"
              strokeWidth="5"
              strokeDasharray="40 1200"
              strokeDashoffset="-140"
              strokeLinecap="round"
              filter="url(#superGlow)"
              opacity="0.8"
            />
            {/* Pure White Core Head */}
            <circle
              cx="230" cy="230" r="185"
              fill="none"
              stroke="#ffffff"
              strokeWidth="4"
              strokeDasharray="6 1200"
              strokeDashoffset="-174" 
              strokeLinecap="round"
              filter="url(#superGlow)"
            />
          </motion.g>
        )}


        {/* Rotating Dial with dent and needle */}
        <motion.g
          animate={{ rotate: currentAngle }}
          transition={{ type: "spring", damping: 25, stiffness: 120 }}
          style={{ transformOrigin: "230px 230px", transformBox: "view-box" }}
          filter="url(#jellyWobble)"
        >
          {/* Main Dark Circle that masks/acts as the center with 3D gradient */}
          <path 
            d={dentedPath} 
            fill="url(#dialFaceGradient)" 
          />
          <path 
            d={dentedPath} 
            fill="url(#dialSpecular)" 
          />

          {/* Concentric brushed metal micro-grooves */}
          <circle cx="230" cy="230" r="160" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1.5" />
          <circle cx="230" cy="230" r="135" fill="none" stroke="rgba(255,255,255,0.012)" strokeWidth="1" />
          <circle cx="230" cy="230" r="110" fill="none" stroke="rgba(255,255,255,0.008)" strokeWidth="1" />
          <circle cx="230" cy="230" r="85" fill="none" stroke="rgba(255,255,255,0.005)" strokeWidth="1" />

          {/* Deep inner shadow / glow inside the dent */}
          <path 
            d={dentedPath} 
            fill="url(#dentLight)" 
            opacity="0.6"
          />

          {/* Subtle colored border around the entire circle */}
          <path 
            d={dentedPath} 
            fill="none" 
            stroke={outerColor} 
            strokeWidth="1" 
            opacity="0.5"
            filter="url(#mildGlow)"
          />

          {/* Intense bright stroke on the dent itself */}
          <path
            d={dentGlowPath}
            fill="none"
            stroke={neonColor}
            strokeWidth="5"
            filter="url(#superGlow)"
            opacity="0.9"
          />
          <path
            d={dentGlowPath}
            fill="none"
            stroke="#ffffff"
            strokeWidth="1.5"
            filter="url(#mildGlow)"
            opacity="1"
          />

          {/* High Fidelity Chronograph Laser Needle */}
          <polygon 
            points="380,228.5 380,231.5 430,230" 
            fill={neonColor} 
            filter="url(#volumetricNeon)" 
            opacity="0.9" 
          />
          <polygon 
            points="382,229.3 382,230.7 430,230" 
            fill="#ffffff" 
          />
          
          {/* Floating Target crosshair ring */}
          <circle 
            cx="438" 
            cy="230" 
            r="8.5" 
            fill="none" 
            stroke={neonColor} 
            strokeWidth="2" 
            filter="url(#volumetricNeon)" 
            opacity="1" 
          />
          <circle 
            cx="438" 
            cy="230" 
            r="4" 
            fill="#ffffff" 
          />
        </motion.g>
      </svg>

      {/* WebGL-like Lens Refraction Glass */}
      <div 
        className="absolute inset-[10%] rounded-full pointer-events-none z-15 backdrop-blur-[6px] backdrop-saturate-[150%] shadow-[inset_0_0_50px_rgba(255,255,255,0.05),0_10px_40px_rgba(0,0,0,0.5)] border border-white/5"
        style={{ transform: "translateZ(20px)" }}
      />

      {/* Center Number Output */}
      <div 
        className="relative z-20 flex flex-col items-center pointer-events-none mt-2"
        style={{ transform: "translateZ(40px)" }} // Pop text out in 3D
      >
        <div
          className="text-[6.5rem] sm:text-[7.5rem] flex items-center leading-none tracking-[-0.04em] font-light tabular-nums transition-colors duration-500 text-white"
          style={{ 
            fontVariantNumeric: "tabular-nums"
          }}
        >
          {formatTime(timeLeft).split('').map((char, i) => (
            char === ':' ? (
              <span key={`colon-${i}`} className="opacity-50 mx-[-0.05em] translate-y-[-0.05em]">:</span>
            ) : (
              <Digit key={`digit-col-${i}`} id={`col-${i}`} digit={char} />
            )
          ))}
        </div>
        <div className="mt-4 text-[11px] uppercase tracking-[0.5em] font-medium transition-colors duration-500 text-white/50 ml-1">
          {mode === 'focus' ? 'Focus Session' : mode === 'shortBreak' ? 'Short Break' : 'Long Break'}
        </div>
      </div>
    </motion.div>
  );
});
