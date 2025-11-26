import { Select as ArkSelect, createListCollection } from '@ark-ui/react/select'
import { Check, ChevronDown } from 'lucide-react'
import { cx, css } from '@/styled-system/css'
import { select } from '@/styled-system/recipes'

const slots = select()

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
  defaultValue?: string
  placeholder?: string
  disabled?: boolean
}

const Select = ({
  value,
  onValueChange,
  children,
  defaultValue,
  placeholder,
  disabled,
}: SelectProps) => {
  // For simple cases, we wrap children in a collection
  return (
    <ArkSelect.Root
      value={value ? [value] : undefined}
      defaultValue={defaultValue ? [defaultValue] : undefined}
      onValueChange={(details) => onValueChange?.(details.value[0])}
      disabled={disabled}
    >
      {children}
    </ArkSelect.Root>
  )
}

const SelectGroup = ArkSelect.ItemGroup

const SelectValue = ({ placeholder }: { placeholder?: string }) => (
  <ArkSelect.ValueText placeholder={placeholder} />
)

const SelectTrigger = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ArkSelect.Trigger>) => (
  <ArkSelect.Trigger
    className={cx(
      slots.trigger,
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
    <ArkSelect.Indicator>
      <ChevronDown className={css({ h: '4', w: '4', opacity: '0.5' })} />
    </ArkSelect.Indicator>
  </ArkSelect.Trigger>
)

const SelectContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ArkSelect.Content>) => (
  <ArkSelect.Positioner>
    <ArkSelect.Content
      className={cx(
        slots.content,
        css({
          position: 'relative',
          zIndex: '50',
          maxH: '96',
          minW: '32',
          overflow: 'hidden',
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
    </ArkSelect.Content>
  </ArkSelect.Positioner>
)

const SelectLabel = ({
  className,
  ...props
}: React.ComponentProps<typeof ArkSelect.ItemGroupLabel>) => (
  <ArkSelect.ItemGroupLabel
    className={cx(
      css({ py: '1.5', pl: '8', pr: '2', fontSize: 'sm', fontWeight: 'semibold' }),
      className
    )}
    {...props}
  />
)

const SelectItem = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ArkSelect.Item>) => (
  <ArkSelect.Item
    className={cx(
      slots.item,
      css({
        position: 'relative',
        display: 'flex',
        w: 'full',
        cursor: 'default',
        userSelect: 'none',
        alignItems: 'center',
        rounded: 'sm',
        py: '1.5',
        pl: '8',
        pr: '2',
        fontSize: 'sm',
        outline: 'none',
        _focus: { bg: 'bg.muted' },
        _disabled: { pointerEvents: 'none', opacity: '0.5' },
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
      <ArkSelect.ItemIndicator>
        <Check className={css({ h: '4', w: '4' })} />
      </ArkSelect.ItemIndicator>
    </span>
    <ArkSelect.ItemText>{children}</ArkSelect.ItemText>
  </ArkSelect.Item>
)

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
  createListCollection,
}
