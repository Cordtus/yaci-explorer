import type * as React from 'react'
import { cx, css } from '@/styled-system/css'
import { badge, type BadgeVariantProps } from '@/styled-system/recipes'

type LegacyVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: LegacyVariant | BadgeVariantProps['variant']
}

const mapVariant = (variant?: BadgeProps['variant']): BadgeVariantProps['variant'] => {
  if (!variant || variant === 'default') return 'solid'
  if (variant === 'secondary') return 'subtle'
  if (variant === 'destructive' || variant === 'success' || variant === 'warning') return 'solid'
  return variant as BadgeVariantProps['variant']
}

function Badge({ className, variant, ...props }: BadgeProps) {
  const recipeClass = badge({ variant: mapVariant(variant) })

  const colorOverrides =
    variant === 'success'
      ? css({ bg: 'green.600', color: 'white' })
      : variant === 'warning'
        ? css({ bg: 'yellow.500', color: 'black' })
        : variant === 'destructive'
          ? css({ bg: 'red.600', color: 'white' })
          : undefined

  return <div className={cx(recipeClass, colorOverrides, className)} {...props} />
}

export { Badge }
