"use client";

import { useEffect, useRef, useState } from "react";

export default function GyroCompass() {
  const needleRef = useRef<SVGGElement>(null);
  const [rotation, setRotation] = useState(0);
  const [hasGyro, setHasGyro] = useState(false);
  const animFrame = useRef<number>(0);
  const targetRotation = useRef(0);

  useEffect(() => {
    let active = true;

    function handleOrientation(e: DeviceOrientationEvent) {
      // alpha = compass heading (0-360), null if unavailable
      if (e.alpha != null) {
        setHasGyro(true);
        targetRotation.current = e.alpha;
      }
    }

    // Smooth animation loop — lerp toward target
    function animate() {
      if (!active) return;
      setRotation((prev) => {
        const target = targetRotation.current;
        // Handle wraparound (e.g. 350 -> 10 should go +20, not -340)
        let diff = target - prev;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        // Lerp 10% per frame for smooth motion
        return prev + diff * 0.1;
      });
      animFrame.current = requestAnimationFrame(animate);
    }

    // Try to request permission (required on iOS 13+)
    if (
      typeof DeviceOrientationEvent !== "undefined" &&
      typeof (DeviceOrientationEvent as any).requestPermission === "function"
    ) {
      // iOS — permission will be requested on first user tap (see below)
      window.addEventListener("deviceorientation", handleOrientation);
    } else if (typeof window !== "undefined" && "DeviceOrientationEvent" in window) {
      // Android / desktop with orientation support
      window.addEventListener("deviceorientation", handleOrientation);
    }

    animFrame.current = requestAnimationFrame(animate);

    return () => {
      active = false;
      cancelAnimationFrame(animFrame.current);
      window.removeEventListener("deviceorientation", handleOrientation);
    };
  }, []);

  // iOS requires user gesture to request permission
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

  // On desktop: needle follows mouse cursor position relative to compass center
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
        viewBox="0 0 100 100"
        className="h-28 w-28 sm:h-36 sm:w-36 drop-shadow-lg"
        style={{ filter: "drop-shadow(0 0 12px rgba(77,184,201,0.3))" }}
      >
        <defs>
          <linearGradient id="gyro-needle" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#1a6b7a" />
            <stop offset="100%" stopColor="#4db8c9" />
          </linearGradient>
          <linearGradient id="gyro-needle-light" x1="0.5" y1="0" x2="0.5" y2="1">
            <stop offset="0%" stopColor="#4db8c9" />
            <stop offset="100%" stopColor="#7dd3e1" />
          </linearGradient>
        </defs>

        {/* Outer ring */}
        <circle cx="50" cy="50" r="44" fill="none" stroke="#6b7280" strokeWidth="3" opacity="0.5" />
        {/* Inner ring */}
        <circle cx="50" cy="50" r="36" fill="none" stroke="#6b7280" strokeWidth="1.5" opacity="0.3" />

        {/* Cardinal ticks */}
        <line x1="50" y1="2" x2="50" y2="14" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <line x1="98" y1="50" x2="86" y2="50" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <line x1="50" y1="98" x2="50" y2="86" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" opacity="0.6" />
        <line x1="2" y1="50" x2="14" y2="50" stroke="#6b7280" strokeWidth="3" strokeLinecap="round" opacity="0.6" />

        {/* Diagonal ticks */}
        <line x1="84" y1="16" x2="76" y2="24" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        <line x1="84" y1="84" x2="76" y2="76" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        <line x1="16" y1="84" x2="24" y2="76" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" opacity="0.35" />
        <line x1="16" y1="16" x2="24" y2="24" stroke="#6b7280" strokeWidth="2" strokeLinecap="round" opacity="0.35" />

        {/* Rotating needle group */}
        <g ref={needleRef} transform={`rotate(${rotation}, 50, 50)`}>
          {/* North needle */}
          <polygon points="50,14 42,50 50,44 58,50" fill="url(#gyro-needle)" />
          {/* South needle */}
          <polygon points="50,86 58,50 50,56 42,50" fill="url(#gyro-needle-light)" opacity="0.5" />
        </g>

        {/* Center dot */}
        <circle cx="50" cy="50" r="4" fill="#4db8c9" />
        <circle cx="50" cy="50" r="2" fill="#1a6b7a" />
      </svg>

      {/* Tap hint on mobile — shown briefly */}
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
