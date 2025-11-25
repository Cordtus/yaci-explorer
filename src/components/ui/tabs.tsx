import * as React from "react"

import { cx, css } from "../../../styled-system/css"
import { tabs as tabsRecipe } from "../../../styled-system/recipes"

type TabsContextValue = {
  value: string
  setValue: (value: string) => void
}

const TabsContext = React.createContext<TabsContextValue | null>(null)

interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string
  defaultValue?: string
  onValueChange?: (value: string) => void
}

const Tabs = ({ value, defaultValue, onValueChange, children, ...props }: TabsProps) => {
  const [internal, setInternal] = React.useState(defaultValue ?? '')
  const isControlled = value !== undefined
  const current = isControlled ? value! : internal
  const setValue = (next: string) => {
    if (!isControlled) setInternal(next)
    onValueChange?.(next)
  }
  return (
    <TabsContext.Provider value={{ value: current, setValue }}>
      <div {...props}>{children}</div>
    </TabsContext.Provider>
  )
}

const slots = tabsRecipe()

const TabsList = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx(slots.list, className)} {...props} />
  )
)
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  const ctx = React.useContext(TabsContext)
  if (!ctx) return null
  const isActive = ctx.value === value
  return (
    <button
      ref={ref}
      role="tab"
      aria-selected={isActive}
      data-state={isActive ? 'active' : 'inactive'}
      className={cx(slots.trigger, className)}
      onClick={() => ctx.setValue(value)}
      {...props}
    />
  )
})
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { value: string }
>(({ className, value, ...props }, ref) => {
  const ctx = React.useContext(TabsContext)
  if (!ctx || ctx.value !== value) return null
  return (
    <div
      ref={ref}
      role="tabpanel"
      className={cx(css({ mt: '2' }), slots.content, className)}
      {...props}
    />
  )
})
TabsContent.displayName = "TabsContent"

export { Tabs, TabsList, TabsTrigger, TabsContent }
