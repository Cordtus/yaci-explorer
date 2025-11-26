import { Checkbox as ArkCheckbox } from '@ark-ui/react/checkbox'
import { Check } from 'lucide-react'
import { cx, css } from '@/styled-system/css'
import { checkbox } from '@/styled-system/recipes'

const slots = checkbox()

interface CheckboxProps extends Omit<React.ComponentProps<typeof ArkCheckbox.Root>, 'checked'> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = ({ className, checked, onCheckedChange, ...props }: CheckboxProps) => (
  <ArkCheckbox.Root
    checked={checked}
    onCheckedChange={(details) => onCheckedChange?.(details.checked === true)}
    className={cx(
      slots.root,
      css({
        display: 'inline-flex',
        alignItems: 'center',
      }),
      className
    )}
    {...props}
  >
    <ArkCheckbox.Control
      className={cx(
        slots.control,
        css({
          h: '4',
          w: '4',
          flexShrink: '0',
          rounded: 'sm',
          borderWidth: '1px',
          borderColor: 'accent.default',
          _focus: { outline: 'none', ring: '2', ringColor: 'accent.default', ringOffset: '2' },
          _disabled: { cursor: 'not-allowed', opacity: '0.5' },
          _checked: { bg: 'accent.default', color: 'white' },
        })
      )}
    >
      <ArkCheckbox.Indicator
        className={css({ display: 'flex', alignItems: 'center', justifyContent: 'center' })}
      >
        <Check className={css({ h: '4', w: '4' })} />
      </ArkCheckbox.Indicator>
    </ArkCheckbox.Control>
    <ArkCheckbox.HiddenInput />
  </ArkCheckbox.Root>
)

export { Checkbox }
