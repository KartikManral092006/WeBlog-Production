"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

type MouseContextValue = {
  isMouseEntered: boolean;
};

const MouseContext = React.createContext<MouseContextValue>({
  isMouseEntered: false,
});

export function CardContainer({
  children,
  className,
  containerClassName,
}: {
  children: React.ReactNode;
  className?: string;
  containerClassName?: string;
}) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isMouseEntered, setIsMouseEntered] = React.useState(false);

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const { left, top, width, height } = containerRef.current.getBoundingClientRect();
    const x = (event.clientX - left - width / 2) / 20;
    const y = (event.clientY - top - height / 2) / 20;

    containerRef.current.style.transform = `rotateY(${x}deg) rotateX(${-y}deg)`;
  };

  const handleMouseEnter = () => {
    setIsMouseEntered(true);
  };

  const handleMouseLeave = () => {
    setIsMouseEntered(false);
    if (!containerRef.current) return;
    containerRef.current.style.transform = "rotateY(0deg) rotateX(0deg)";
  };

  return (
    <MouseContext.Provider value={{ isMouseEntered }}>
      <div
        className={cn("flex items-center justify-center py-3 [perspective:1000px]", containerClassName)}
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <div
          ref={containerRef}
          className={cn("transition-transform duration-200 ease-linear", className)}
          style={{ transformStyle: "preserve-3d" }}
        >
          {children}
        </div>
      </div>
    </MouseContext.Provider>
  );
}

export const CardBody = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("relative [transform-style:preserve-3d]", className)}
      {...props}
    />
  );
});

CardBody.displayName = "CardBody";

type CardItemProps<T extends React.ElementType> = {
  as?: T;
  children: React.ReactNode;
  className?: string;
  translateX?: number | string;
  translateY?: number | string;
  translateZ?: number | string;
  rotateX?: number | string;
  rotateY?: number | string;
  rotateZ?: number | string;
} & Omit<React.ComponentPropsWithoutRef<T>, "as" | "children" | "className">;

function toUnit(value: number | string | undefined, unit: "px" | "deg") {
  if (value === undefined) return unit === "px" ? "0px" : "0deg";
  return typeof value === "number" ? `${value}${unit}` : value;
}

export function CardItem<T extends React.ElementType = "div">({
  as,
  children,
  className,
  translateX = 0,
  translateY = 0,
  translateZ = 0,
  rotateX = 0,
  rotateY = 0,
  rotateZ = 0,
  ...props
}: CardItemProps<T>) {
  const Component = (as || "div") as React.ElementType;
  const { isMouseEntered } = React.useContext(MouseContext);

  return (
    <Component
      className={cn("transition-transform duration-200 ease-linear", className)}
      style={{
        transform: isMouseEntered
          ? `translate3d(${toUnit(translateX, "px")}, ${toUnit(
              translateY,
              "px"
            )}, ${toUnit(translateZ, "px")}) rotateX(${toUnit(
              rotateX,
              "deg"
            )}) rotateY(${toUnit(rotateY, "deg")}) rotateZ(${toUnit(
              rotateZ,
              "deg"
            )})`
          : "translate3d(0, 0, 0) rotateX(0deg) rotateY(0deg) rotateZ(0deg)",
      }}
      {...props}
    >
      {children}
    </Component>
  );
}
