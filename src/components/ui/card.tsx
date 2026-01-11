import * as React from 'react'
import { cx, css } from '@/styled-system/css'
import { card } from '@/styled-system/recipes'

const slots = card()

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cx(
        slots.root,
        css({
          boxShadow: 'sm',
          borderWidth: '1px',
          borderColor: 'border.default',
          bg: 'bg.default',
        }),
        className
      )}
      {...props}
    />
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cx(
        slots.header,
        css({ display: 'flex', flexDir: 'column', gap: '1.5', p: '4' }),
        className
      )}
      {...props}
    />
  )
)
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cx(
      slots.title,
      css({ fontSize: '2xl', fontWeight: 'semibold', lineHeight: 'tight', letterSpacing: 'tight' }),
      className
    )}
    {...props}
  />
))
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cx(slots.description, css({ fontSize: 'sm', color: 'fg.muted' }), className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cx(slots.body, css({ p: '4', pt: '0' }), className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cx(
        slots.footer,
        css({ display: 'flex', alignItems: 'center', p: '4', pt: '0' }),
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
