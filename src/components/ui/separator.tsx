import * as React from 'react'
import { cx, css } from '@/styled-system/css'

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = 'horizontal', decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role={decorative ? 'none' : 'separator'}
      aria-orientation={decorative ? undefined : orientation}
      className={cx(
        css({
          flexShrink: '0',
          bg: 'border.default',
        }),
        orientation === 'horizontal'
          ? css({ h: '1px', w: 'full' })
          : css({ h: 'full', w: '1px' }),
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = 'Separator'

export { Separator }
