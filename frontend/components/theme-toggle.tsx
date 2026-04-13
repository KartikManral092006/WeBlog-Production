"use client";

import { useEffect, useId, useState } from "react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const inputId = useId().replace(/:/g, "");

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <span aria-hidden="true" className="inline-block h-8 w-18 rounded-full bg-muted" />
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <>
      <div className="toggle-switch">
        <label className="switch-label" htmlFor={inputId}>
          <input
            id={inputId}
            className="checkbox"
            type="checkbox"
            checked={isDark}
            onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
            aria-label="Toggle dark and light mode"
          />
          <span className="slider" aria-hidden="true" />
        </label>
      </div>

      <style jsx>{`
        .toggle-switch {
          position: relative;
          display: inline-block;
          width: 72px;
          height: 32px;
          --light: color-mix(in oklab, var(--card) 94%, white 6%);
          --dark: color-mix(in oklab, var(--background) 72%, #0d1118 28%);
        }

        .switch-label {
          position: absolute;
          width: 100%;
          height: 32px;
          background-color: var(--dark);
          border-radius: 9999px;
          cursor: pointer;
          border: 2px solid color-mix(in oklab, var(--border) 75%, transparent);
        }

        .checkbox {
          position: absolute;
          display: none;
        }

        .slider {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 9999px;
          transition: 0.3s;
        }

        .checkbox:checked ~ .slider {
          background-color: var(--light);
        }

        .checkbox:focus-visible ~ .slider {
          box-shadow: 0 0 0 2px color-mix(in oklab, var(--ring) 35%, transparent);
        }

        .slider::before {
          content: "";
          position: absolute;
          top: 6px;
          left: 8px;
          width: 18px;
          height: 18px;
          border-radius: 9999px;
          box-shadow: inset 9px -3px 0 0 var(--light);
          background-color: var(--dark);
          transition: 0.3s;
        }

        .checkbox:checked ~ .slider::before {
          transform: translateX(34px);
          background-color: var(--dark);
          box-shadow: none;
        }
      `}</style>
    </>
  );
}
