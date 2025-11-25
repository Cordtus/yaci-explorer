'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'

import { cx, css } from '../../../styled-system/css'
import { select as selectRecipe } from '../../../styled-system/recipes'

type SelectContextValue = {
  value: string | undefined
  onChange: (value: string) => void
}

const SelectContext = React.createContext<SelectContextValue | null>(null)

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {}

const Select = ({ value, defaultValue, onChange, children, ...props }: SelectProps) => {
  const [internal, setInternal] = React.useState(defaultValue?.toString())
  const isControlled = value !== undefined
  const current = isControlled ? value?.toString() : internal

  const handleChange = (next: string) => {
    if (!isControlled) setInternal(next)
    onChange?.({ target: { value: next } } as any)
  }

  return (
    <SelectContext.Provider value={{ value: current, onChange: handleChange }}>
      <div className={selectRecipe().root}>
        <select
          value={current}
          onChange={(e) => handleChange(e.target.value)}
          className={cx(
            selectRecipe().trigger,
            css({
              appearance: 'none',
              backgroundImage: 'none',
              paddingInlineEnd: '8',
            })
          )}
          {...props}
        >
          {children}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 opacity-60" />
      </div>
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ children }: { children: React.ReactNode }) => <>{children}</>
const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  const ctx = React.useContext<SelectContextValue | null>(SelectContext)
  return ctx?.value ?? placeholder ?? ''
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ children, ...props }, ref) => (
    <button ref={ref} type="button" aria-label="Open select" {...props}>
      {children}
    </button>
  )
)
SelectTrigger.displayName = 'SelectTrigger'

const SelectContent = ({ children }: { children: React.ReactNode }) => <>{children}</>
const SelectLabel = ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => (
  <span {...props}>{children}</span>
)
const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.OptionHTMLAttributes<HTMLOptionElement>
>(({ children, ...props }, ref) => {
  return (
    <option ref={ref} {...props}>
      {children}
    </option>
  )
})
SelectItem.displayName = 'SelectItem'

const SelectSeparator = () => null
const SelectScrollUpButton = () => null
const SelectScrollDownButton = () => null

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
