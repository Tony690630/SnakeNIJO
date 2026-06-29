import React, { useRef, useState, useEffect } from 'react';

interface JoystickProps {
  onMove: (direction: 'up' | 'down' | 'left' | 'right') => void;
  active: boolean;
}

export const Joystick: React.FC<JoystickProps> = ({ onMove, active }) => {
  const baseRef = useRef<HTMLDivElement>(null);
  const [stickPos, setStickPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const maxRadius = 35;
  const threshold = 12;

  const handleStart = (clientX: number, clientY: number) => {
    if (!active) return;
    setIsDragging(true);
    updatePosition(clientX, clientY);
  };

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !active) return;
    updatePosition(clientX, clientY);
  };

  const handleEnd = () => {
    setIsDragging(false);
    setStickPos({ x: 0, y: 0 });
  };

  const updatePosition = (clientX: number, clientY: number) => {
    if (!baseRef.current) return;
    const rect = baseRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    let dx = clientX - centerX;
    let dy = clientY - centerY;
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
      dist = maxRadius;
    }

    setStickPos({ x: dx, y: dy });

    if (dist > threshold) {
      const angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle >= -45 && angle < 45) {
        onMove('right');
      } else if (angle >= 45 && angle < 135) {
        onMove('down');
      } else if (angle >= -135 && angle < -45) {
        onMove('up');
      } else {
        onMove('left');
      }
    }
  };

  useEffect(() => {
    const onTouchMove = (e: TouchEvent) => {
      if (isDragging) {
        e.preventDefault();
        if (e.touches[0]) {
          handleMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      }
    };

    const onTouchEnd = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        handleMove(e.clientX, e.clientY);
      }
    };

    const onMouseUp = () => {
      if (isDragging) {
        handleEnd();
      }
    };

    if (isDragging) {
      window.addEventListener('touchmove', onTouchMove, { passive: false });
      window.addEventListener('touchend', onTouchEnd);
      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    }

    return () => {
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [isDragging]);

  return (
    <div className="flex justify-center items-center h-36">
      <div
        ref={baseRef}
        className="w-28 h-28 bg-slate-950/50 border-2 border-cyan-500/30 rounded-full relative shadow-inner flex items-center justify-center cursor-grab active:cursor-grabbing transition-colors duration-200"
        onTouchStart={(e) => {
          if (e.touches[0]) {
            handleStart(e.touches[0].clientX, e.touches[0].clientY);
          }
        }}
        onMouseDown={(e) => {
          handleStart(e.clientX, e.clientY);
        }}
      >
        {/* Subtle center marker */}
        <div className="absolute w-2 h-2 bg-cyan-500/20 rounded-full"></div>
        {/* Glowing outer aura */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/5 blur-sm"></div>

        {/* The joystick stick */}
        <div
          className="w-12 h-12 rounded-full absolute bg-gradient-to-br from-cyan-400 to-indigo-600 shadow-lg shadow-cyan-500/25 flex items-center justify-center border border-white/20 transition-transform duration-75"
          style={{
            transform: `translate(${stickPos.x}px, ${stickPos.y}px)`,
          }}
        >
          {/* Inner details */}
          <div className="w-4 h-4 bg-white/20 rounded-full border border-white/10 shadow-inner"></div>
        </div>
      </div>
    </div>
  );
};
export default Joystick;
