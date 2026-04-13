"use client";

import React from "react";

export function LoaderOne() {
  return (
    <div className="inline-flex items-center gap-2" role="status" aria-label="Loading">
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary [animation-delay:-0.3s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary/80 [animation-delay:-0.15s]" />
      <span className="h-2.5 w-2.5 animate-bounce rounded-full bg-primary/60" />
    </div>
  );
}

export function LoaderOneDemo() {
  return <LoaderOne />;
}
