import * as React from 'react'

import { cx } from '../../../styled-system/css'
import { input as inputRecipe, type InputVariantProps } from '../../../styled-system/recipes'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    InputVariantProps {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, size, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cx(inputRecipe({ size }), className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = 'Input'

export { Input }
