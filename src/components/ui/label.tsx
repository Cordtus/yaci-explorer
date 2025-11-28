import * as React from 'react'
import { cx, css } from '@/styled-system/css'
import { formLabel } from '@/styled-system/recipes'

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cx(
        formLabel(),
        css({
          fontSize: 'sm',
          fontWeight: 'medium',
          lineHeight: 'none',
          _peerDisabled: { cursor: 'not-allowed', opacity: '0.7' },
        }),
        className
      )}
      {...props}
    />
  )
})
Label.displayName = 'Label'

export { Label }
