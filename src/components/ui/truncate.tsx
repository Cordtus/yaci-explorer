import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { cx, css } from '@/styled-system/css'

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

  const start = startChars ?? Math.floor(maxLength / 2) - 2
  const end = endChars ?? Math.floor(maxLength / 2) - 2
  const truncated = `${children.slice(0, start)}...${children.slice(-end)}`

  if (!showTooltip) {
    return <span className={className}>{truncated}</span>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cx(css({ cursor: 'help' }), className)}>{truncated}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p className={css({ maxW: 'xs', wordBreak: 'break-all' })}>{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export function TruncateInline({
  children,
  maxLength = 20,
  className,
  showTooltip = true,
}: Omit<TruncateProps, 'startChars' | 'endChars'>) {
  if (!children || children.length <= maxLength) {
    return <span className={cx(css({ display: 'inline-block' }), className)}>{children}</span>
  }

  const truncated = `${children.slice(0, maxLength)}...`

  if (!showTooltip) {
    return <span className={cx(css({ display: 'inline-block' }), className)}>{truncated}</span>
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className={cx(css({ display: 'inline-block', cursor: 'help' }), className)}>
            {truncated}
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p className={css({ maxW: 'xs', wordBreak: 'break-all' })}>{children}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
