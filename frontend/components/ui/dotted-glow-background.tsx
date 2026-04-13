"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type DottedGlowBackgroundProps = {
  className?: string;
  opacity?: number;
  gap?: number;
  radius?: number;
  colorLightVar?: string;
  glowColorLightVar?: string;
  colorDarkVar?: string;
  glowColorDarkVar?: string;
  backgroundOpacity?: number;
  speedMin?: number;
  speedMax?: number;
  speedScale?: number;
};

function readVar(name: string, fallback: string) {
  if (typeof window === "undefined") return fallback;
  const value = getComputedStyle(document.documentElement).getPropertyValue(name);
  return value?.trim() ? `oklch(${value.trim()})` : fallback;
}

export function DottedGlowBackground({
  className,
  opacity = 1,
  gap = 12,
  radius = 1.6,
  colorLightVar = "--color-neutral-500",
  glowColorLightVar = "--color-neutral-600",
  colorDarkVar = "--color-neutral-500",
  glowColorDarkVar = "--color-sky-800",
  backgroundOpacity = 0,
  speedMin = 0.3,
  speedMax = 1.6,
  speedScale = 1,
}: DottedGlowBackgroundProps) {
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted && document.documentElement.classList.contains("dark");
  const dotColor = mounted
    ? readVar(isDark ? colorDarkVar : colorLightVar, isDark ? "#6b7280" : "#6b7280")
    : "#6b7280";
  const glowColor = mounted
    ? readVar(
        isDark ? glowColorDarkVar : glowColorLightVar,
        isDark ? "#0369a1" : "#525252"
      )
    : "#525252";

  const animationDuration = `${(speedMin + speedMax) * 6 * speedScale}s`;

  const basePattern: React.CSSProperties = {
    backgroundColor: `rgba(255,255,255,${backgroundOpacity})`,
    backgroundImage: `radial-gradient(circle, ${dotColor} ${radius}px, transparent ${radius}px)`,
    backgroundSize: `${gap}px ${gap}px`,
    opacity,
  };

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden="true">
      <div className="absolute inset-0" style={basePattern} />

      <div
        className="absolute -inset-1 animate-dotted-drift blur-[1.5px]"
        style={{
          backgroundImage: `radial-gradient(circle, ${glowColor} ${radius * 1.2}px, transparent ${
            radius * 1.2
          }px)`,
          backgroundSize: `${gap}px ${gap}px`,
          animationDuration,
          opacity: Math.min(1, opacity * 0.75),
        }}
      />

      <div
        className="absolute inset-0 animate-dotted-drift-reverse"
        style={{
          backgroundImage: `radial-gradient(circle, ${dotColor} ${Math.max(0.8, radius - 0.3)}px, transparent ${
            Math.max(0.8, radius - 0.3)
          }px)`,
          backgroundSize: `${gap * 1.3}px ${gap * 1.3}px`,
          animationDuration: `${Math.max(8, (speedMax + speedMin) * 5)}s`,
          opacity: Math.min(1, opacity * 0.45),
        }}
      />
    </div>
  );
}
