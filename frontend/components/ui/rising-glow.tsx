"use client";

import React, { useMemo } from "react";
import { motion } from "framer-motion";

type RisingGlowProps = {
  particleCount?: number;
  particleColor?: string;
  height?: number;
  width?: number | string;
};

export function RisingGlow({
  particleCount = 60,
  particleColor = "var(--primary)",
  height = 90,
  width = "100%",
}: RisingGlowProps) {
  const seeded = (seed: number) => {
    const x = Math.sin(seed * 12.9898) * 43758.5453;
    return x - Math.floor(x);
  };

  const particles = useMemo(
    () =>
      Array.from({ length: particleCount }, (_, index) => ({
        x: seeded(index + 1) * 100,
        size: 2 + seeded(index + 11) * 5,
        duration: 2.2 + seeded(index + 21) * 2.4,
        delay: seeded(index + 31) * 2,
        drift: -20 + seeded(index + 41) * 40,
        opacity: 0.2 + seeded(index + 51) * 0.6,
      })),
    [particleCount]
  );

  return (
    <div className="relative overflow-hidden" style={{ width, height }}>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-primary/70 to-transparent" />

      {particles.map((particle, index) => (
        <motion.span
          key={index}
          className="pointer-events-none absolute bottom-0 rounded-full"
          style={{
            left: `${particle.x}%`,
            width: particle.size,
            height: particle.size,
            backgroundColor: particleColor,
            filter: "blur(0.2px)",
          }}
          initial={{ y: 6, x: 0, opacity: 0 }}
          animate={{
            y: [6, -height * 0.65],
            x: [0, particle.drift],
            opacity: [0, particle.opacity, 0],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Number.POSITIVE_INFINITY,
            ease: "easeOut",
          }}
        />
      ))}
    </div>
  );
}
