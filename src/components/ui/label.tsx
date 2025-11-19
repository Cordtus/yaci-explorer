import * as React from 'react'
import { type LabelProps } from '@/types/components/ui/label'

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, ...props }, ref) => {
    return (
      <label
        ref={ref}
        className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className || ''}`}
        {...props}
      />
    )
  }
)
Label.displayName = 'Label'

export { Label }
