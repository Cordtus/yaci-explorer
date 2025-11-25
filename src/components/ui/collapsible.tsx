"use client"

import * as React from "react"

export interface CollapsibleProps extends React.HTMLAttributes<HTMLDivElement> {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

const CollapsibleContext = React.createContext<{
  open: boolean
  setOpen: (value: boolean) => void
} | null>(null)

const Collapsible = ({ open, defaultOpen, onOpenChange, children, ...props }: CollapsibleProps) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)
  const isControlled = open !== undefined
  const value = isControlled ? open! : internalOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  return (
    <CollapsibleContext.Provider value={{ open: value, setOpen }}>
      <div data-state={value ? 'open' : 'closed'} {...props}>
        {children}
      </div>
    </CollapsibleContext.Provider>
  )
}

const CollapsibleTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ children, ...props }, ref) => {
  const ctx = React.useContext(CollapsibleContext)
  if (!ctx) return null
  return (
    <button
      type="button"
      ref={ref}
      aria-expanded={ctx.open}
      data-state={ctx.open ? 'open' : 'closed'}
      onClick={() => ctx.setOpen(!ctx.open)}
      {...props}
    >
      {children}
    </button>
  )
})
CollapsibleTrigger.displayName = "CollapsibleTrigger"

const CollapsibleContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ children, ...props }, ref) => {
  const ctx = React.useContext(CollapsibleContext)
  if (!ctx) return null
  return ctx.open ? (
    <div ref={ref} data-state="open" {...props}>
      {children}
    </div>
  ) : null
})
CollapsibleContent.displayName = "CollapsibleContent"

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
