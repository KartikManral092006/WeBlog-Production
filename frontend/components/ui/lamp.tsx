"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type LampContainerProps = {
  children: ReactNode;
  className?: string;
};

export function LampContainer({ children, className }: LampContainerProps) {
  return (
    <div
      className={cn(
        "relative flex w-full flex-col items-center overflow-hidden bg-transparent px-2 py-8 md:px-6 md:py-12",
        className
      )}
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-linear-to-b from-primary/16 via-primary/5 to-transparent" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-56 w-176 -translate-x-1/2 rounded-full bg-linear-to-b from-primary/20 via-primary/8 to-transparent blur-3xl" />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
