import * as React from 'react'
import { Collapsible as ArkCollapsible } from '@ark-ui/react/collapsible'

interface CollapsibleProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  defaultOpen?: boolean
  disabled?: boolean
  children: React.ReactNode
  className?: string
}

const Collapsible = ({ open, onOpenChange, children, ...props }: CollapsibleProps) => (
  <ArkCollapsible.Root
    open={open}
    onOpenChange={(details) => onOpenChange?.(details.open)}
    {...props}
  >
    {children}
  </ArkCollapsible.Root>
)

const CollapsibleTrigger = ArkCollapsible.Trigger
const CollapsibleContent = ArkCollapsible.Content

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
