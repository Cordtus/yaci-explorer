import * as React from "react"

import { cx, css } from "../../../styled-system/css"

type Orientation = "horizontal" | "vertical"

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: Orientation
  decorative?: boolean
}

const Separator = React.forwardRef<HTMLDivElement, SeparatorProps>(
  ({ className, orientation = "horizontal", decorative = true, ...props }, ref) => (
    <div
      ref={ref}
      role="separator"
      aria-orientation={orientation}
      aria-hidden={decorative}
      className={cx(
        css({
          bg: 'border.subtle',
          flexShrink: 0,
          w: orientation === 'vertical' ? '1px' : 'full',
          h: orientation === 'vertical' ? 'full' : '1px',
        }),
        className
      )}
      {...props}
    />
  )
)
Separator.displayName = "Separator"

export { Separator }
