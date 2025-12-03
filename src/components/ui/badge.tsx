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
      ? css({
          bg: 'success.bg',
          color: 'success.default',
          borderWidth: '1px',
          borderColor: 'success.border',
        })
      : variant === 'warning'
        ? css({
            bg: 'warning.bg',
            color: 'warning.default',
            borderWidth: '1px',
            borderColor: 'warning.border',
          })
        : variant === 'destructive'
          ? css({
              bg: 'error.bg',
              color: 'error.default',
              borderWidth: '1px',
              borderColor: 'error.border',
            })
          : undefined

  return <div className={cx(recipeClass, colorOverrides, className)} {...props} />
}

export { Badge }
