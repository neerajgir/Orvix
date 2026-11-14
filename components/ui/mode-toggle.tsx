
"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

function ModeToggleIcon({ clipPathId }: { clipPathId: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 16"
      fill="none"
      className="size-4"
      aria-hidden="true"
    >
      <circle
        cx="8"
        cy="8"
        r="6.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />

      <line
        x1="8"
        y1="1.75"
        x2="8"
        y2="14.25"
        stroke="currentColor"
        strokeWidth="1.25"
      />

      <defs>
        <clipPath id={clipPathId}>
          <path d="M8 1.75 A6.25 6.25 0 0 1 8 14.25 Z" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${clipPathId})`}>
        {Array.from({ length: 5 }, (_, i) => (
          <line
            key={i}
            x1={4.5 + i * 2}
            y1="16"
            x2={16 + i * 2}
            y2="4.5"
            stroke="currentColor"
            strokeWidth="1.25"
          />
        ))}
      </g>
    </svg>
  )
}

function ModeToggle({
  className,
  ...props
}: React.ComponentProps<"button">) {
  const { resolvedTheme, setTheme } = useTheme()

  const [mounted, setMounted] = React.useState(false)
  const clipPathId = React.useId()

  React.useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <div className={cn("flex items-center", className)}>
      <div
        aria-hidden="true"
        className="h-3.5 w-px bg-foreground/15"
      />

      <button
        {...props}
        type="button"
        data-slot="mode-toggle"
        disabled={!mounted || props.disabled}
        aria-label="Toggle theme"
        className={cn(
          "flex size-7 items-center justify-center",
          "text-foreground/80 transition-colors duration-200",
          "hover:text-foreground",
          "focus-visible:outline-none focus-visible:ring-[3px]",
          "focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:opacity-50"
        )}
        onClick={() =>
          setTheme(resolvedTheme === "dark" ? "light" : "dark")
        }
      >
        <ModeToggleIcon clipPathId={clipPathId} />
      </button>

      <div
        aria-hidden="true"
        className="h-3.5 w-px bg-foreground/15"
      />
    </div>
  )
}
export { ModeToggle, ModeToggleIcon }
