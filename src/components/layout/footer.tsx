import { css } from '@/styled-system/css'
import { Blocks } from 'lucide-react'
import { getBrandingConfig } from '@/config/branding'

export function Footer() {
  const branding = getBrandingConfig()
  const currentYear = new Date().getFullYear()

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.brand}>
            <Blocks className={styles.logo} />
            <span className={styles.appName}>{branding.appName}</span>
          </div>
          <p className={styles.copyright}>
            {branding.footerText || `${currentYear} Block Explorer`}
          </p>
        </div>
      </div>
    </footer>
  )
}

const styles = {
  footer: css({
    borderTopWidth: '1px',
    borderColor: 'border.default',
    bg: 'bg.default',
    mt: 'auto',
  }),
  container: css({
    w: 'full',
    px: { base: '4', md: '8', lg: '12', xl: '16' },
    py: '6',
  }),
  content: css({
    display: 'flex',
    flexDirection: { base: 'column', sm: 'row' },
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '4',
  }),
  brand: css({
    display: 'flex',
    alignItems: 'center',
    gap: '2',
  }),
  logo: css({
    h: '5',
    w: '5',
    color: 'fg.muted',
  }),
  appName: css({
    fontSize: 'sm',
    fontWeight: 'medium',
    color: 'fg.muted',
  }),
  copyright: css({
    fontSize: 'sm',
    color: 'fg.muted',
  }),
}
