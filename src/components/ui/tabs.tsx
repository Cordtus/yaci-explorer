import { Tabs as ArkTabs } from '@ark-ui/react/tabs'
import { cx, css } from '@/styled-system/css'
import { tabs } from '@/styled-system/recipes'

const slots = tabs()

const Tabs = ArkTabs.Root

const TabsList = ({ className, ...props }: React.ComponentProps<typeof ArkTabs.List>) => (
  <ArkTabs.List
    className={cx(
      slots.list,
      css({
        display: 'inline-flex',
        h: '10',
        alignItems: 'center',
        justifyContent: 'center',
        rounded: 'md',
        bg: 'bg.muted',
        p: '1',
        color: 'fg.muted',
      }),
      className
    )}
    {...props}
  />
)

const TabsTrigger = ({ className, ...props }: React.ComponentProps<typeof ArkTabs.Trigger>) => (
  <ArkTabs.Trigger
    className={cx(
      slots.trigger,
      css({
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        whiteSpace: 'nowrap',
        rounded: 'sm',
        px: '3',
        py: '1.5',
        fontSize: 'sm',
        fontWeight: 'medium',
        transition: 'all',
        _focus: { outline: 'none', ring: '2', ringColor: 'accent.default', ringOffset: '2' },
        _disabled: { pointerEvents: 'none', opacity: '0.5' },
        _selected: { bg: 'bg.default', color: 'fg.default', shadow: 'sm' },
      }),
      className
    )}
    {...props}
  />
)

const TabsContent = ({ className, ...props }: React.ComponentProps<typeof ArkTabs.Content>) => (
  <ArkTabs.Content
    className={cx(
      slots.content,
      css({
        mt: '2',
        _focus: { outline: 'none', ring: '2', ringColor: 'accent.default', ringOffset: '2' },
      }),
      className
    )}
    {...props}
  />
)

export { Tabs, TabsList, TabsTrigger, TabsContent }
