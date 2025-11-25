import * as React from 'react'
import { cx, css } from '../../../styled-system/css'
import { button as buttonRecipe, type ButtonVariantProps } from '../../../styled-system/recipes'

type LegacyVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
type LegacySize = 'default' | 'sm' | 'lg' | 'icon'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  asChild?: boolean
  variant?: LegacyVariant | ButtonVariantProps['variant']
  size?: LegacySize | ButtonVariantProps['size']
}

const mapVariant = (variant?: ButtonProps['variant']): ButtonVariantProps['variant'] => {
  if (!variant || variant === 'default' || variant === 'destructive') return 'solid'
  if (variant === 'secondary') return 'subtle'
  return variant as ButtonVariantProps['variant']
}

const mapSize = (size?: ButtonProps['size']): ButtonVariantProps['size'] => {
  if (!size || size === 'default') return 'md'
  if (size === 'icon') return 'sm'
  return size as ButtonVariantProps['size']
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, children, ...props }, ref) => {
    const Comp = asChild && React.isValidElement(children) ? 'span' : 'button'
    const variantClass = buttonRecipe({ variant: mapVariant(variant), size: mapSize(size) })
    const overrides =
      variant === 'destructive'
        ? css({
            bg: 'red.default',
            color: 'red.fg',
            _hover: { bg: 'red.emphasized' },
            _focusVisible: { outline: '2px solid', outlineColor: 'red.default', outlineOffset: '2px' },
          })
        : undefined

    const iconSize =
      size === 'icon'
        ? css({
            minW: '10',
            w: '10',
            h: '10',
            px: '0',
          })
        : undefined

    const mergedClass = cx(variantClass, overrides, iconSize, className)

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as any, {
        className: cx((children as any).props?.className, mergedClass),
        ref,
        ...props,
      })
    }

    return (
      <Comp
        className={mergedClass}
        ref={ref}
        {...props}
      >
        {children}
      </Comp>
    )
  }
)
Button.displayName = 'Button'

export { Button }
