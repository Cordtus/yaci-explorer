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
            color: '#FFFFFF',
            borderWidth: '1px',
            borderColor: 'rgba(94, 94, 94, 0.25)',
            rounded: 'md',
            _placeholder: { color: '#626C71' },
            _focus: {
              outline: 'none',
              borderColor: '#30FF6E',
              boxShadow: '0px 0px 10px rgba(48, 255, 110, 0.2)',
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
