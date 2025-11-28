import { useDenomResolver } from '@/hooks/useDenomResolver'
import { Truncate } from '@/components/ui/truncate'
import { css, cx } from '@/styled-system/css'

interface DenomDisplayProps {
  denom: string
  maxLength?: number
  className?: string
}

/**
 * Component that displays a denomination with automatic IBC resolution
 * Shows resolved name (e.g., ATOM) for IBC denoms, with full hash in tooltip
 * Uses static mapping for known IBC denoms
 */
export function DenomDisplay({ denom, maxLength = 15, className }: DenomDisplayProps) {
  const { resolvedDenom, originalDenom } = useDenomResolver(denom)

  // If it resolved to something different (IBC denom), show resolved name with original in tooltip
  if (resolvedDenom !== originalDenom && resolvedDenom.length <= maxLength) {
    return (
      <span className={cx(styles.base, className)} title={originalDenom}>
        {resolvedDenom}
      </span>
    )
  }

  // If it's still long (couldn't resolve), truncate with tooltip
  if (resolvedDenom.length > maxLength) {
    return (
      <Truncate maxLength={maxLength} startChars={8} endChars={6} className={className}>
        {resolvedDenom}
      </Truncate>
    )
  }

  // Short enough to display as-is
  return <span className={cx(styles.base, className)}>{resolvedDenom}</span>
}

const styles = {
  base: css({})
}
