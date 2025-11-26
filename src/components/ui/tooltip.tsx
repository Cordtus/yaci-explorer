import { Tooltip as ArkTooltip } from '@ark-ui/react/tooltip'
import { cx, css } from '@/styled-system/css'
import { tooltip } from '@/styled-system/recipes'

const slots = tooltip()

const TooltipProvider = ({ children }: { children: React.ReactNode }) => <>{children}</>

const Tooltip = ArkTooltip.Root

const TooltipTrigger = ArkTooltip.Trigger

const TooltipContent = ({
  className,
  sideOffset = 4,
  ...props
}: React.ComponentProps<typeof ArkTooltip.Content> & { sideOffset?: number }) => (
  <ArkTooltip.Positioner>
    <ArkTooltip.Content
      className={cx(
        slots.content,
        css({
          zIndex: '50',
          overflow: 'hidden',
          rounded: 'md',
          borderWidth: '1px',
          bg: 'bg.default',
          px: '3',
          py: '1.5',
          fontSize: 'sm',
          shadow: 'md',
        }),
        className
      )}
      {...props}
    />
  </ArkTooltip.Positioner>
)

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider }
