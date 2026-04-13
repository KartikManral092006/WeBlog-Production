"use client";

import { useEffect } from "react";

export function useOutsideClick<T extends HTMLElement>(
  ref: React.RefObject<T | null>,
  onOutsideClick: () => void
) {
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (!ref.current || ref.current.contains(target)) {
        return;
      }
      onOutsideClick();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
    };
  }, [onOutsideClick, ref]);
}
