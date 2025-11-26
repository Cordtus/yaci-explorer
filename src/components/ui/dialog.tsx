import { Dialog as ArkDialog } from '@ark-ui/react/dialog'
import { X } from 'lucide-react'
import { cx, css } from '@/styled-system/css'
import { dialog } from '@/styled-system/recipes'

const slots = dialog()

const Dialog = ArkDialog.Root
const DialogTrigger = ArkDialog.Trigger
const DialogClose = ArkDialog.CloseTrigger

const DialogPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>

const DialogOverlay = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <ArkDialog.Backdrop
    className={cx(
      slots.backdrop,
      css({
        position: 'fixed',
        inset: '0',
        zIndex: '50',
        bg: 'black/80',
      }),
      className
    )}
    {...props}
  />
)

const DialogContent = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ArkDialog.Content>) => (
  <ArkDialog.Positioner>
    <DialogOverlay />
    <ArkDialog.Content
      className={cx(
        slots.content,
        css({
          position: 'fixed',
          left: '50%',
          top: '50%',
          zIndex: '50',
          display: 'grid',
          w: 'full',
          maxW: 'lg',
          transform: 'translate(-50%, -50%)',
          gap: '4',
          borderWidth: '1px',
          bg: 'bg.default',
          p: '6',
          shadow: 'lg',
          rounded: 'lg',
        }),
        className
      )}
      {...props}
    >
      {children}
      <ArkDialog.CloseTrigger
        className={css({
          position: 'absolute',
          right: '4',
          top: '4',
          rounded: 'sm',
          opacity: '0.7',
          transition: 'opacity',
          _hover: { opacity: '1' },
          _focus: { outline: 'none', ring: '2', ringColor: 'accent.default', ringOffset: '2' },
        })}
      >
        <X className={css({ h: '4', w: '4' })} />
        <span className={css({ srOnly: true })}>Close</span>
      </ArkDialog.CloseTrigger>
    </ArkDialog.Content>
  </ArkDialog.Positioner>
)

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cx(
      css({
        display: 'flex',
        flexDir: 'column',
        gap: '1.5',
        textAlign: { base: 'center', sm: 'left' },
      }),
      className
    )}
    {...props}
  />
)

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cx(
      css({
        display: 'flex',
        flexDir: { base: 'column-reverse', sm: 'row' },
        justifyContent: { sm: 'flex-end' },
        gap: '2',
      }),
      className
    )}
    {...props}
  />
)

const DialogTitle = ({ className, ...props }: React.ComponentProps<typeof ArkDialog.Title>) => (
  <ArkDialog.Title
    className={cx(
      slots.title,
      css({ fontSize: 'lg', fontWeight: 'semibold', lineHeight: 'none', letterSpacing: 'tight' }),
      className
    )}
    {...props}
  />
)

const DialogDescription = ({
  className,
  ...props
}: React.ComponentProps<typeof ArkDialog.Description>) => (
  <ArkDialog.Description
    className={cx(slots.description, css({ fontSize: 'sm', color: 'fg.muted' }), className)}
    {...props}
  />
)

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
