"use client"

import * as React from "react"
import { Check } from "lucide-react"

import { cx, css } from "../../../styled-system/css"
import { checkbox as checkboxRecipe, type CheckboxVariantProps } from "../../../styled-system/recipes"

export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'>,
    CheckboxVariantProps {
  label?: React.ReactNode
}

const slots = checkboxRecipe()

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, size, ...props }, ref) => {
    const controlClass = checkboxRecipe({ size }).control
    const indicatorClass = checkboxRecipe({ size }).indicator

    return (
      <label className={cx(slots.root, className)}>
        <input
          type="checkbox"
          ref={ref}
          className={cx(
            controlClass,
            css({
              appearance: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: '1px',
              borderColor: 'border.default',
              borderRadius: 'sm',
              bg: 'bg.default',
              transitionProperty: 'border, background, color, box-shadow',
              transitionDuration: 'normal',
              cursor: 'pointer',
              _focusVisible: {
                outline: '2px solid',
                outlineColor: 'colorPalette.default',
                outlineOffset: '2px',
              },
              _checked: {
                bg: 'colorPalette.default',
                borderColor: 'colorPalette.default',
                color: 'colorPalette.fg',
              },
              _disabled: {
                cursor: 'not-allowed',
                opacity: 0.5,
              },
            })
          )}
          {...props}
        />
        <span
          aria-hidden
          className={cx(
            indicatorClass,
            css({
              position: 'absolute',
              pointerEvents: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              insetInlineStart: '0',
              insetBlockStart: '0',
              w: 'full',
              h: 'full',
              color: 'currentcolor',
            })
          )}
        >
          <Check className="h-3.5 w-3.5" />
        </span>
        {label ? <span className={slots.label}>{label}</span> : null}
      </label>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
