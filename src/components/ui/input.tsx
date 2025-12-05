import * as React from 'react'
import { cx, css } from '@/styled-system/css'
import { input } from '@/styled-system/recipes'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cx(
          input(),
          css({
            w: 'full',
            h: '10',
            px: '3',
            py: '2',
            fontSize: 'sm',
            bg: 'transparent',
            color: 'fg.default',
            borderWidth: '1px',
            borderColor: 'border.default',
            rounded: 'md',
            _placeholder: { color: 'fg.placeholder' },
            _focus: {
              outline: 'none',
              borderColor: 'accent.default',
              boxShadow: 'glow.accent',
            },
            _disabled: { cursor: 'not-allowed', opacity: '0.5' },
          }),
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
