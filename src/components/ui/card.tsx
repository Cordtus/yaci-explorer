import * as React from 'react'
import { cx, css } from '@/styled-system/css'
import { card } from '@/styled-system/recipes'

const slots = card()

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  withGlow?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, withGlow = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cx(
        slots.root,
        css({
          background: 'linear-gradient(to right, #0D0F0F, #0A0C0C)',
          borderWidth: '1px',
          borderColor: 'rgba(94, 94, 94, 0.25)',
          position: 'relative',
          overflow: 'hidden',
        }),
        className
      )}
      {...props}
    >
      {withGlow && (
        <div
          className={css({
            position: 'absolute',
            top: '0',
            left: '0',
            right: '0',
            height: '1px',
            background: 'linear-gradient(-90deg, rgba(0,255,77,0) 0%, #30FF6E 49.23%, #FFFFFF 100%)',
            opacity: '0.5',
          })}
        />
      )}
      {props.children}
    </div>
  )
)
Card.displayName = 'Card'

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cx(
        slots.header,
        css({ display: 'flex', flexDir: 'column', gap: '1.5', p: '6' }),
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
    <div ref={ref} className={cx(slots.body, css({ p: '6', pt: '0' }), className)} {...props} />
  )
)
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cx(
        slots.footer,
        css({ display: 'flex', alignItems: 'center', p: '6', pt: '0' }),
        className
      )}
      {...props}
    />
  )
)
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
