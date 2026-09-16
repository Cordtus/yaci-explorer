import * as React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

interface TruncateProps {
  children: string
  maxLength?: number
  startChars?: number
  endChars?: number
  className?: string
  showTooltip?: boolean
}

export function Truncate({
  children,
  maxLength = 20,
  startChars,
  endChars,
  className,
  showTooltip = true,
}: TruncateProps) {
  if (!children || children.length <= maxLength) {
    return <span className={className}>{children}</span>
  }

  // Use start/end chars if provided, otherwise split evenly
  const start = startChars ?? Math.floor(maxLength / 2) - 2
  const end = endChars ?? Math.floor(maxLength / 2) - 2
  const truncated = `${children.slice(0, start)}...${children.slice(-end)}`

  if (!showTooltip) {
    return <span className={className}>{truncated}</span>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <span className={cn("cursor-help", className)}>{truncated}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs break-all">{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
