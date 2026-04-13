"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type VortexProps = {
  className?: string;
  children: React.ReactNode;
  backgroundColor?: string;
  particleCount?: number;
};

type Particle = {
  left: number;
  top: number;
  size: number;
  delay: number;
  duration: number;
  opacity: number;
};

export function Vortex({
  className,
  children,
  backgroundColor = "#000000",
  particleCount = 28,
}: VortexProps) {
  const particles = React.useMemo<Particle[]>(() => {
    return Array.from({ length: particleCount }).map(() => ({
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: 2 + Math.random() * 3.5,
      delay: Math.random() * 5,
      duration: 8 + Math.random() * 9,
      opacity: 0.2 + Math.random() * 0.5,
    }));
  }, [particleCount]);

  return (
    <div
      className={cn(
        "relative isolate overflow-hidden rounded-md border border-white/10",
        className
      )}
      style={{ backgroundColor }}
    >
      <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_30%_40%,rgba(14,165,233,0.23),transparent_45%),radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.24),transparent_42%),radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),transparent_60%)]" />

      <div className="absolute inset-0 z-0">
        {particles.map((p, idx) => (
          <span
            key={idx}
            className="vortex-particle"
            style={{
              left: `${p.left}%`,
              top: `${p.top}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              opacity: p.opacity,
              animationDelay: `${p.delay}s`,
              animationDuration: `${p.duration}s`,
            }}
          />
        ))}
      </div>

      <div className="absolute inset-0 z-0 bg-[conic-gradient(from_0deg_at_50%_50%,rgba(255,255,255,0.05),rgba(59,130,246,0.22),rgba(14,165,233,0.12),rgba(255,255,255,0.04),rgba(59,130,246,0.2),rgba(255,255,255,0.05))] vortex-spin" />

      <div className={cn("relative z-10", className)}>{children}</div>

      <style jsx>{`
        .vortex-particle {
          position: absolute;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.8);
          box-shadow: 0 0 14px rgba(56, 189, 248, 0.65);
          animation-name: vortex-float;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }

        .vortex-spin {
          animation: vortex-spin 18s linear infinite;
          transform-origin: center;
          will-change: transform;
        }

        @keyframes vortex-float {
          0% {
            transform: rotate(0deg) translateX(0px) translateY(0px);
            opacity: 0.15;
          }
          40% {
            transform: rotate(120deg) translateX(18px) translateY(-12px);
            opacity: 0.8;
          }
          70% {
            transform: rotate(240deg) translateX(-15px) translateY(14px);
            opacity: 0.45;
          }
          100% {
            transform: rotate(360deg) translateX(0px) translateY(0px);
            opacity: 0.15;
          }
        }

        @keyframes vortex-spin {
          from {
            transform: rotate(0deg) scale(1.1);
          }
          to {
            transform: rotate(360deg) scale(1.1);
          }
        }
      `}</style>
    </div>
  );
}
