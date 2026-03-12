"use client";

import { useEffect, useRef, useState } from "react";

export default function GyroCompass() {
  const [rotation, setRotation] = useState(0);
  const [hasGyro, setHasGyro] = useState(false);
  const animFrame = useRef<number>(0);
  const targetRotation = useRef(0);

  useEffect(() => {
    let active = true;

    function handleOrientation(e: DeviceOrientationEvent) {
      if (e.alpha != null) {
        setHasGyro(true);
        targetRotation.current = e.alpha;
      }
    }

    function animate() {
      if (!active) return;
      setRotation((prev) => {
        const target = targetRotation.current;
        let diff = target - prev;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        return prev + diff * 0.1;
      });
      animFrame.current = requestAnimationFrame(animate);
    }

    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      window.addEventListener("deviceorientation", handleOrientation);
    } else if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      window.addEventListener("deviceorientation", handleOrientation);
    }

    animFrame.current = requestAnimationFrame(animate);

    return () => {
      active = false;
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  async function requestPermission() {
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      try {
        const perm = await (DeviceOrientationEvent as any).requestPermission();
        if (perm === "granted") {
          setHasGyro(true);
        }
      } catch {
        // User denied
      }
    }
  }

  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (hasGyro) return;

    function handleMouseMove(e: MouseEvent) {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const angle = Math.atan2(e.clientX - cx, -(e.clientY - cy)) * (180 / Math.PI);
      targetRotation.current = angle;
    }

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [hasGyro]);

  return (
    <div
      className="relative select-none"
      onClick={requestPermission}
      role="img"
      aria-label="Interactive compass"
    >
      <svg
        ref={svgRef}
        viewBox="0 0 200 200"
        className="h-28 w-28 sm:h-36 sm:w-36"
        style={{ filter: "drop-shadow(0 0 12px rgba(77,184,201,0.3))" }}
      >
        <defs>
          <linearGradient id="g-nd" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#082e36" />
            <stop offset="40%" stopColor="#10525e" />
            <stop offset="100%" stopColor="#1a7080" />
          </linearGradient>
          <linearGradient id="g-nl" x1="0.2" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#18707e" />
            <stop offset="50%" stopColor="#2c9cac" />
            <stop offset="100%" stopColor="#44b8c8" />
          </linearGradient>
          <linearGradient id="g-rg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#c8ccd4" />
            <stop offset="50%" stopColor="#a8aeb8" />
            <stop offset="100%" stopColor="#c8ccd4" />
          </linearGradient>
          <linearGradient id="g-rd" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#166a78" />
            <stop offset="100%" stopColor="#1a7a8a" />
          </linearGradient>
          <linearGradient id="g-rl" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#1e8494" />
            <stop offset="100%" stopColor="#2a96a6" />
          </linearGradient>
        </defs>

        {/* Static outer ring */}
        <circle cx="100" cy="100" r="86" fill="none" stroke="url(#g-rg)" strokeWidth="14" opacity="0.55" />

        {/* Rotating group: rose + needle */}
        <g transform={`rotate(${rotation}, 100, 100)`}>
          {/* Compass rose */}
          <path d="M100,10 L76,74 L100,56 Z" fill="url(#g-rd)" />
          <path d="M100,10 L124,74 L100,56 Z" fill="url(#g-rl)" />
          <path d="M100,190 L124,126 L100,144 Z" fill="url(#g-rl)" />
          <path d="M100,190 L76,126 L100,144 Z" fill="url(#g-rd)" />
          <path d="M190,100 L126,76 L144,100 Z" fill="url(#g-rd)" />
          <path d="M190,100 L126,124 L144,100 Z" fill="url(#g-rl)" />
          <path d="M10,100 L74,124 L56,100 Z" fill="url(#g-rl)" />
          <path d="M10,100 L74,76 L56,100 Z" fill="url(#g-rd)" />

          {/* Needle blade */}
          <path d="M155,16 Q65,72 45,184 L100,100 Z" fill="url(#g-nd)" />
          <path d="M155,16 Q135,128 45,184 L100,100 Z" fill="url(#g-nl)" opacity="0.88" />
        </g>

        {/* Center dot (fixed) */}
        <circle cx="100" cy="100" r="10" fill="white" />
        <circle cx="100" cy="100" r="6.5" fill="#e4e6ea" />
      </svg>

      {!hasGyro && (
        <p
          className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] sm:hidden"
          style={{ color: "var(--text-muted)" }}
        >
          Tap to enable compass
        </p>
      )}
    </div>
  );
}
