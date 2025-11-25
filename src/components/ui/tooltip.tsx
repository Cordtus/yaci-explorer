import * as React from "react"

import { cx, css } from "../../../styled-system/css"
import { tooltip as tooltipRecipe } from "../../../styled-system/recipes"

type TooltipContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const TooltipContext = React.createContext<TooltipContextValue | null>(null)

const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

const Tooltip = ({ children }: { children: React.ReactNode }) => {
  const [open, setOpen] = React.useState(false)
  return (
    <TooltipContext.Provider value={{ open, setOpen }}>
      <span className={css({ position: 'relative', display: 'inline-flex' })}>
        {children}
      </span>
    </TooltipContext.Provider>
  )
}

const TooltipTrigger = React.forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement>>(
  ({ children, ...props }, ref) => {
    const ctx = React.useContext(TooltipContext)
    if (!ctx) return <>{children}</>
    return (
      <span
        ref={ref}
        className={css({ display: 'inline-flex' })}
        onMouseEnter={() => ctx.setOpen(true)}
        onMouseLeave={() => ctx.setOpen(false)}
        onFocus={() => ctx.setOpen(true)}
        onBlur={() => ctx.setOpen(false)}
        {...props}
      >
        {children}
      </span>
    )
  }
)
TooltipTrigger.displayName = "TooltipTrigger"

const slots = tooltipRecipe()

const TooltipContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const ctx = React.useContext(TooltipContext)
    if (!ctx || !ctx.open) return null
    return (
      <div
        ref={ref}
        role="tooltip"
        className={cx(
          slots.content,
          css({
            position: 'absolute',
            zIndex: 50,
            pointerEvents: 'none',
            top: '100%',
            left: '0',
            mt: '1',
          }),
          className
        )}
        {...props}
      />
    )
  }
)
TooltipContent.displayName = "TooltipContent"

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
