import * as React from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cx, css } from '@/styled-system/css'

interface SelectContextValue {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
}

const SelectContext = React.createContext<SelectContextValue>({
  open: false,
  setOpen: () => {},
})

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  defaultValue?: string
  disabled?: boolean
}

const Select = ({ value, onValueChange, children, defaultValue }: SelectProps) => {
  const [internalValue, setInternalValue] = React.useState(defaultValue || '')
  const [open, setOpen] = React.useState(false)
  const currentValue = value !== undefined ? value : internalValue

  const handleChange = (newValue: string) => {
    if (value === undefined) {
      setInternalValue(newValue)
    }
    onValueChange?.(newValue)
    setOpen(false)
  }

  return (
    <SelectContext.Provider value={{ value: currentValue, onValueChange: handleChange, open, setOpen }}>
      <div className={css({ position: 'relative', display: 'inline-block' })}>
        {children}
      </div>
    </SelectContext.Provider>
  )
}

const SelectGroup = ({ children }: { children: React.ReactNode }) => <div>{children}</div>

interface SelectValueProps {
  placeholder?: string
}

const SelectValue = ({ placeholder }: SelectValueProps) => {
  const { value } = React.useContext(SelectContext)
  return <span>{value || placeholder}</span>
}

interface SelectTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
}

const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const { open, setOpen } = React.useContext(SelectContext)

    return (
      <button
        type="button"
        ref={ref}
        onClick={() => setOpen(!open)}
        className={cx(
          css({
            display: 'flex',
            h: '10',
            w: 'full',
            alignItems: 'center',
            justifyContent: 'space-between',
            rounded: 'md',
            borderWidth: '1px',
            borderColor: 'border.default',
            bg: 'bg.default',
            px: '3',
            py: '2',
            fontSize: 'sm',
            _placeholder: { color: 'fg.muted' },
            _focus: { outline: 'none', ring: '2', ringColor: 'accent.default', ringOffset: '2' },
            _disabled: { cursor: 'not-allowed', opacity: '0.5' },
          }),
          className
        )}
        {...props}
      >
        {children}
        <ChevronDown className={css({ h: '4', w: '4', opacity: '0.5' })} />
      </button>
    )
  }
)
SelectTrigger.displayName = 'SelectTrigger'

interface SelectContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SelectContent = ({ className, children, ...props }: SelectContentProps) => {
  const { open } = React.useContext(SelectContext)

  if (!open) return null

  return (
    <div
      className={cx(
        css({
          position: 'absolute',
          top: 'full',
          left: '0',
          right: '0',
          zIndex: '50',
          mt: '1',
          maxH: '96',
          minW: '32',
          overflow: 'auto',
          rounded: 'md',
          borderWidth: '1px',
          bg: 'bg.default',
          shadow: 'md',
          p: '1',
        }),
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface SelectLabelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

const SelectLabel = ({ className, ...props }: SelectLabelProps) => (
  <div
    className={cx(
      css({ py: '1.5', pl: '8', pr: '2', fontSize: 'sm', fontWeight: 'semibold' }),
      className
    )}
    {...props}
  />
)

interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string
  children: React.ReactNode
}

const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ className, value, children, ...props }, ref) => {
    const { value: selectedValue, onValueChange } = React.useContext(SelectContext)
    const isSelected = selectedValue === value

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        onValueChange?.(value)
      }
    }

    return (
      <div
        ref={ref}
        role="option"
        tabIndex={0}
        aria-selected={isSelected}
        onClick={() => onValueChange?.(value)}
        onKeyDown={handleKeyDown}
        className={cx(
          css({
            position: 'relative',
            display: 'flex',
            w: 'full',
            cursor: 'pointer',
            userSelect: 'none',
            alignItems: 'center',
            rounded: 'sm',
            py: '1.5',
            pl: '8',
            pr: '2',
            fontSize: 'sm',
            outline: 'none',
            _hover: { bg: 'bg.muted' },
          }),
          className
        )}
        {...props}
      >
        <span
          className={css({
            position: 'absolute',
            left: '2',
            display: 'flex',
            h: '3.5',
            w: '3.5',
            alignItems: 'center',
            justifyContent: 'center',
          })}
        >
          {isSelected && <Check className={css({ h: '4', w: '4' })} />}
        </span>
        {children}
      </div>
    )
  }
)
SelectItem.displayName = 'SelectItem'

const SelectSeparator = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cx(css({ mx: '-1', my: '1', h: '1px', bg: 'bg.muted' }), className)}
    {...props}
  />
)

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
}
