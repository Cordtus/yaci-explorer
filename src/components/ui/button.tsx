import * as React from 'react'
import { cx, css } from '@/styled-system/css'
import { button, type ButtonVariantProps } from '@/styled-system/recipes'

type LegacyVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type LegacySize = 'default' | 'sm' | 'lg' | 'icon'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: LegacyVariant | ButtonVariantProps['variant']
  size?: LegacySize | ButtonVariantProps['size']
}

const mapVariant = (variant?: ButtonProps['variant']): ButtonVariantProps['variant'] => {
  if (!variant || variant === 'default') return 'solid'
  if (variant === 'destructive') return 'solid'
  if (variant === 'secondary') return 'subtle'
  return variant as ButtonVariantProps['variant']
}

const mapSize = (size?: ButtonProps['size']): ButtonVariantProps['size'] => {
  if (!size || size === 'default') return 'md'
  if (size === 'icon') return 'md'
  if (size === 'lg') return 'lg'
  return size as ButtonVariantProps['size']
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const recipeClass = button({ variant: mapVariant(variant), size: mapSize(size) })

    const destructiveStyles =
      variant === 'destructive'
        ? css({
            bg: 'red.600',
            color: 'white',
            _hover: { bg: 'red.700' },
          })
        : undefined

    const iconStyles =
      size === 'icon'
        ? css({
            w: '10',
            h: '10',
            p: '0',
            minW: '10',
          })
        : undefined

    const mergedClass = cx(recipeClass, destructiveStyles, iconStyles, className)

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children, {
        ...props,
        className: cx(
          (children.props as { className?: string })?.className,
          mergedClass
        ),
      } as React.HTMLAttributes<HTMLElement>)
    }

    return (
      <button className={mergedClass} ref={ref} {...props}>
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button }
