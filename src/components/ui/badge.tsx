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
          bg: 'rgba(48, 255, 110, 0.1)',
          color: '#30FF6E',
          borderWidth: '1px',
          borderColor: 'rgba(48, 255, 110, 0.25)',
        })
      : variant === 'warning'
        ? css({
            bg: 'rgba(234, 179, 8, 0.1)',
            color: '#EAB308',
            borderWidth: '1px',
            borderColor: 'rgba(234, 179, 8, 0.25)',
          })
        : variant === 'destructive'
          ? css({
              bg: 'rgba(220, 38, 38, 0.1)',
              color: '#DC2626',
              borderWidth: '1px',
              borderColor: 'rgba(220, 38, 38, 0.25)',
            })
          : undefined

  return <div className={cx(recipeClass, colorOverrides, className)} {...props} />
}

export { Badge }
