import * as React from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { type TruncateProps } from '@/types/components/ui/truncate'

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
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("cursor-help", className)}>{truncated}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs break-all">{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Version with inline-block for better layout control
export function TruncateInline({
  children,
  maxLength = 20,
  className,
  showTooltip = true,
}: Omit<TruncateProps, "startChars" | "endChars">) {
  if (!children || children.length <= maxLength) {
    return <span className={cn("inline-block", className)}>{children}</span>
  }

  const truncated = `${children.slice(0, maxLength)}...`

  if (!showTooltip) {
    return <span className={cn("inline-block", className)}>{truncated}</span>
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cn("inline-block cursor-help", className)}>{truncated}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className="max-w-xs break-all">{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
