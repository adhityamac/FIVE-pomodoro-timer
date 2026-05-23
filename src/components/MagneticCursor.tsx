import { useEffect, useState, useRef } from "react";
import { motion, useSpring } from "motion/react";

export function MagneticCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const [hoverRect, setHoverRect] = useState<DOMRect | null>(null);
  const [isOverDial, setIsOverDial] = useState(false);
  const [isPointerDown, setIsPointerDown] = useState(false);
  
  const activeElementRef = useRef<Element | null>(null);
  const activeRectRef = useRef<DOMRect | null>(null);

  // Snappy spring values to avoid tracking lag when system cursor is hidden
  const cursorX = useSpring(-100, { stiffness: 1200, damping: 65, mass: 0.05 });
  const cursorY = useSpring(-100, { stiffness: 1200, damping: 65, mass: 0.05 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      
      const overDial = !!target.closest('[data-cursor="dial"]');
      setIsOverDial(overDial);

      const magneticElement = target.closest('[data-magnetic], button, a');

      if (magneticElement) {
        // Only trigger state updates/re-renders if the hovered element actually changed
        if (activeElementRef.current !== magneticElement) {
          activeElementRef.current = magneticElement;
          setIsHovering(true);
          const rect = magneticElement.getBoundingClientRect();
          activeRectRef.current = rect;
          setHoverRect(rect);
        }
        
        // Snap to the cached center of the magnetic element
        const rect = activeRectRef.current;
        if (rect) {
          cursorX.set(rect.left + rect.width / 2);
          cursorY.set(rect.top + rect.height / 2);
        }
      } else {
        // Only trigger state updates/re-renders if we were hovering before
        if (activeElementRef.current !== null) {
          activeElementRef.current = null;
          activeRectRef.current = null;
          setIsHovering(false);
          setHoverRect(null);
        }
        
        cursorX.set(e.clientX);
        cursorY.set(e.clientY);
      }
    };

    const handlePointerDown = () => setIsPointerDown(true);
    const handlePointerUp = () => setIsPointerDown(false);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [cursorX, cursorY]);

  // When hovering, the cursor expands to wrap the element
  const width = isHovering && hoverRect 
    ? hoverRect.width + 8 
    : isOverDial 
      ? (isPointerDown ? 10 : 18) 
      : 12;
  const height = isHovering && hoverRect 
    ? hoverRect.height + 8 
    : isOverDial 
      ? (isPointerDown ? 10 : 18) 
      : 12;
  const borderRadius = isHovering && hoverRect 
    ? Math.min(hoverRect.width, hoverRect.height) / 2 + 4 
    : isOverDial 
      ? (isPointerDown ? 5 : 9) 
      : 6;

  return (
    <motion.div
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%",
      }}
      animate={{
        width,
        height,
        borderRadius,
        backgroundColor: isHovering 
          ? "rgba(255, 255, 255, 0.1)" 
          : isOverDial 
            ? (isPointerDown ? "rgba(255, 255, 255, 0.9)" : "rgba(255, 255, 255, 0)") 
            : "rgba(255, 255, 255, 1)",
        border: isOverDial && !isPointerDown 
          ? "1.5px solid rgba(255, 255, 255, 0.8)" 
          : "0px solid transparent",
        opacity: 1,
      }}
      transition={{ type: "spring", stiffness: 500, damping: 35 }}
    />
  );
}

