import { type ComponentPropsWithoutRef, useState } from "react"

import { cn } from "@/lib/utils"

interface MarqueeProps extends ComponentPropsWithoutRef<"div"> {
  /**
   * Optional CSS class name to apply custom styles
   */
  className?: string
  /**
   * Whether to reverse the animation direction
   * @default false
   */
  reverse?: boolean
  /**
   * Whether to pause the animation on hover
   * @default false
   */
  pauseOnHover?: boolean
  /**
   * Content to be displayed in the marquee
   */
  children: React.ReactNode
  /**
   * Whether to animate vertically instead of horizontally
   * @default false
   */
  vertical?: boolean
  /**
   * Number of times to repeat the content
   * @default 4
   */
  repeat?: number
}

export function Marquee({
  className,
  reverse = false,
  pauseOnHover = false,
  children,
  vertical = false,
  repeat = 4,
  ...props
}: MarqueeProps) {
  const animationName = vertical ? "marquee-vertical" : "marquee"
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      {...props}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "group flex gap-(--gap) overflow-hidden p-2 [--duration:40s] [--gap:1rem]",
        {
          "flex-row": !vertical,
          "flex-col": vertical,
        },
        className
      )}
    >
      {Array(repeat)
        .fill(0)
        .map((_, i) => (
          <div
            key={i}
            className={cn("flex shrink-0 justify-around gap-(--gap)", {
              "flex-row": !vertical,
              "flex-col": vertical,
            })}
            style={{
              animation: `${animationName} var(--duration) linear infinite`,
              animationDirection: reverse ? "reverse" : "normal",
              animationPlayState: pauseOnHover && isHovered ? "paused" : "running",
            }}
          >
            {children}
          </div>
        ))}
    </div>
  )
}
