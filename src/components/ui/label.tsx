import * as React from 'react'

import { cx } from '../../../styled-system/css'
import { formLabel, type FormLabelVariantProps } from '../../../styled-system/recipes'

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    FormLabelVariantProps {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, size, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={cx(formLabel({ size }), className)}
        {...props}
      />
    )
  }
)
Label.displayName = 'Label'

export { Label }
