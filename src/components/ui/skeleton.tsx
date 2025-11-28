import { cx, css } from '@/styled-system/css'
import { skeleton } from '@/styled-system/recipes'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(
        skeleton(),
        css({
          animation: 'pulse',
          rounded: 'md',
          bg: 'bg.muted',
        }),
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
