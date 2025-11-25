import * as React from "react"
import { createPortal } from "react-dom"
import { X } from "lucide-react"

import { cx, css } from "../../../styled-system/css"
import { dialog as dialogRecipe } from "../../../styled-system/recipes"

type DialogContextValue = {
  open: boolean
  setOpen: (open: boolean) => void
}

const DialogContext = React.createContext<DialogContextValue | null>(null)

export interface DialogProps {
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

const Dialog = ({ open, defaultOpen, onOpenChange, children }: DialogProps) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen ?? false)
  const isControlled = open !== undefined
  const value = isControlled ? open! : internalOpen
  const setOpen = (next: boolean) => {
    if (!isControlled) setInternalOpen(next)
    onOpenChange?.(next)
  }

  return (
    <DialogContext.Provider value={{ open: value, setOpen }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { asChild?: boolean }
>(({ asChild, children, ...props }, ref) => {
  const ctx = React.useContext(DialogContext)
  if (!ctx) return null
  const handleClick = () => ctx.setOpen(true)
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as any, {
      onClick: (...args: any[]) => {
        ;(children as any).props?.onClick?.(...args)
        handleClick()
      },
      ref,
      'aria-expanded': ctx.open,
    })
  }
  return (
    <button ref={ref} onClick={handleClick} {...props}>
      {children}
    </button>
  )
})
DialogTrigger.displayName = "DialogTrigger"

const DialogPortal = ({ children }: { children: React.ReactNode }) => {
  if (typeof document === 'undefined') return null
  return createPortal(children, document.body)
}

const slots = dialogRecipe()

const DialogOverlay = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cx(
          slots.backdrop,
          css({ position: 'fixed', inset: '0', bg: 'blackAlpha.700', zIndex: 50 }),
          className
        )}
        {...props}
      />
    )
  }
)
DialogOverlay.displayName = "DialogOverlay"

const DialogContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => {
    const ctx = React.useContext(DialogContext)
    if (!ctx || !ctx.open) return null
    return (
      <DialogPortal>
        <DialogOverlay onClick={() => ctx.setOpen(false)} />
        <div className={slots.positioner}>
          <div
            ref={ref}
            role="dialog"
            aria-modal="true"
            className={cx(
              slots.content,
              css({
                zIndex: 50,
                position: 'fixed',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                maxW: 'lg',
                w: 'full',
                bg: 'bg.default',
                borderWidth: '1px',
                borderColor: 'border.default',
                rounded: 'xl',
                shadow: 'xl',
                p: '6',
                display: 'grid',
                gap: '4',
              }),
              className
            )}
            {...props}
          >
            {children}
            <DialogClose />
          </div>
        </div>
      </DialogPortal>
    )
  }
)
DialogContent.displayName = "DialogContent"

const DialogHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cx(css({ display: 'flex', flexDirection: 'column', gap: '1.5' }), className)} {...props} />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cx(
      css({
        display: 'flex',
        flexDirection: { base: 'column-reverse', sm: 'row' },
        gap: { base: '2', sm: '3' },
        justifyContent: { sm: 'flex-end' },
      }),
      className
    )}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cx(css({ fontWeight: 'semibold', fontSize: 'lg', lineHeight: 'short' }), className)}
      {...props}
    />
  )
)
DialogTitle.displayName = "DialogTitle"

const DialogDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cx(css({ fontSize: 'sm', color: 'fg.muted' }), className)} {...props} />
  )
)
DialogDescription.displayName = "DialogDescription"

const DialogClose = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => {
    const ctx = React.useContext(DialogContext)
    if (!ctx) return null
    return (
      <button
        ref={ref}
        type="button"
        aria-label="Close"
        onClick={() => ctx.setOpen(false)}
        className={cx(
          slots.closeTrigger,
          css({
            position: 'absolute',
            top: '4',
            right: '4',
            p: '2',
            rounded: 'sm',
            color: 'fg.muted',
            transition: 'all 0.2s ease',
            _hover: { color: 'fg.default', bg: 'bg.subtle' },
            _focusVisible: { outline: '2px solid', outlineColor: 'colorPalette.default', outlineOffset: '2px' },
          }),
          className
        )}
        {...props}
      >
        <X className="h-4 w-4" />
      </button>
    )
  }
)
DialogClose.displayName = "DialogClose"

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
