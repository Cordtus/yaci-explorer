import type * as React from 'react'

import { cx, css } from '../../../styled-system/css'
import { badge as badgeRecipe, type BadgeVariantProps } from '../../../styled-system/recipes'

type LegacyVariant = 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    BadgeVariantProps {
  variant?: LegacyVariant | BadgeVariantProps['variant']
}

const mapVariant = (variant?: BadgeProps['variant']): BadgeVariantProps['variant'] => {
  if (!variant || variant === 'default' || variant === 'success' || variant === 'warning') return 'solid'
  if (variant === 'secondary') return 'subtle'
  return variant as BadgeVariantProps['variant']
}

function Badge({ className, variant, ...props }: BadgeProps) {
  const base = badgeRecipe({ variant: mapVariant(variant) })

  const overrides =
    variant === 'destructive'
      ? css({
          bg: 'red.default',
          color: 'red.fg',
          borderColor: 'red.default',
          _hover: { bg: 'red.emphasized' },
        })
      : variant === 'success'
      ? css({
          bg: 'green.3',
          color: 'green.11',
          borderColor: 'green.6',
        })
      : variant === 'warning'
      ? css({
          bg: 'amber.3',
          color: 'amber.11',
          borderColor: 'amber.6',
        })
      : undefined

  return <div className={cx(base, overrides, className)} {...props} />
}

export { Badge }
