import { cx } from '../../../styled-system/css'
import { skeleton as skeletonRecipe } from '../../../styled-system/recipes'

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx(skeletonRecipe(), className)}
      {...props}
    />
  )
}

export { Skeleton }
