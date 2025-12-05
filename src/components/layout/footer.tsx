import { css } from '@/styled-system/css'
import { RepublicLogo, XIcon, GitHubIcon, DiscordIcon, DocumentIcon } from '@/components/icons/icons'

const links = {
  docs: [
    { label: 'Documentation', href: 'https://docs.republicai.io' },
    { label: 'Whitepaper', href: 'https://whitepaper.republicai.io' },
    { label: 'API Reference', href: 'https://docs.republicai.io/api' },
  ],
  company: [
    { label: 'About', href: 'https://republicai.io' },
    { label: 'Blog', href: 'https://republicai.io/blog' },
  ],
  resources: [
    { label: 'Faucet', href: 'https://faucet.republicai.io' },
  ],
  legal: [
    { label: 'Terms of Service', href: 'https://points.republicai.io/terms' },
    { label: 'Privacy Policy', href: 'https://points.republicai.io/privacy' },
  ],
}

const socialLinks = [
  { icon: XIcon, href: 'https://x.com/republicai', label: 'X (Twitter)' },
  { icon: GitHubIcon, href: 'https://github.com/RepublicAI', label: 'GitHub' },
  { icon: DiscordIcon, href: 'https://discord.com/invite/therepublic', label: 'Discord' },
  { icon: DocumentIcon, href: 'https://whitepaper.republicai.io', label: 'Whitepaper' },
]

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.top}>
          <div className={styles.brand}>
            <RepublicLogo className={styles.logo} />
            <p className={styles.tagline}>Powering the new order of computing</p>
            <div className={styles.socialLinks}>
              {socialLinks.map((link) => {
                const Icon = link.icon
                return (
                  <a
                    key={link.href}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                    title={link.label}
                  >
                    <Icon className={styles.socialIcon} />
                  </a>
                )
              })}
            </div>
          </div>

          <div className={styles.linksGrid}>
            <div className={styles.linkColumn}>
              <h3 className={styles.linkHeader}>Documentation</h3>
              {links.docs.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  {link.label}
                </a>
              ))}
            </div>
            <div className={styles.linkColumn}>
              <h3 className={styles.linkHeader}>Company</h3>
              {links.company.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  {link.label}
                </a>
              ))}
            </div>
            <div className={styles.linkColumn}>
              <h3 className={styles.linkHeader}>Resources</h3>
              {links.resources.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target={link.href.startsWith('/') ? undefined : '_blank'}
                  rel={link.href.startsWith('/') ? undefined : 'noopener noreferrer'}
                  className={styles.link}
                >
                  {link.label}
                </a>
              ))}
            </div>
            <div className={styles.linkColumn}>
              <h3 className={styles.linkHeader}>Legal</h3>
              {links.legal.map((link) => (
                <a key={link.href} href={link.href} target="_blank" rel="noopener noreferrer" className={styles.link}>
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className={styles.bottom}>
          <p className={styles.copyright}>Copyright 2025 IGCF</p>
        </div>
      </div>
    </footer>
  )
}

const styles = {
  footer: css({
    bg: 'bg.default',
    mt: 'auto',
    borderTop: '1px solid transparent',
    backgroundImage: 'linear-gradient(bg.default, bg.default), linear-gradient(90deg, rgba(204,204,204,0) 0%, #707B92 20%, #707B92 80%, rgba(153,153,153,0) 100%)',
    backgroundOrigin: 'border-box',
    backgroundClip: 'padding-box, border-box',
  }),
  container: css({
    maxW: '7xl',
    mx: 'auto',
    px: '4',
    py: '12',
  }),
  top: css({
    display: 'flex',
    flexDirection: { base: 'column', lg: 'row' },
    gap: '12',
    pb: '8',
    borderBottomWidth: '1px',
    borderColor: 'border.default',
  }),
  brand: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '4',
    maxW: { lg: '280px' },
  }),
  logo: css({
    h: '10',
    w: 'auto',
  }),
  tagline: css({
    fontSize: 'sm',
    color: 'rgba(221, 244, 255, 0.75)',
  }),
  socialLinks: css({
    display: 'flex',
    gap: '3',
    mt: '2',
  }),
  socialLink: css({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    h: '10',
    w: '10',
    rounded: 'full',
    bg: 'bg.muted',
    color: 'rgba(221, 244, 255, 0.75)',
    transition: 'all 0.2s ease',
    _hover: {
      bg: 'accent.default',
      color: '#050607',
      boxShadow: '0px 0px 20px rgba(48, 255, 110, 0.3)',
    },
  }),
  socialIcon: css({
    h: '5',
    w: '5',
  }),
  linksGrid: css({
    display: 'grid',
    gridTemplateColumns: { base: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
    gap: '8',
    flex: '1',
  }),
  linkColumn: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '3',
  }),
  linkHeader: css({
    fontSize: 'xs',
    fontWeight: 'semibold',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 'wide',
    mb: '1',
  }),
  link: css({
    fontSize: 'sm',
    color: 'rgba(221, 244, 255, 0.75)',
    transition: 'color 0.2s ease',
    _hover: { color: '#FFFFFF' },
  }),
  bottom: css({
    pt: '8',
    display: 'flex',
    justifyContent: 'center',
  }),
  copyright: css({
    fontSize: 'sm',
    color: 'rgba(221, 244, 255, 0.75)',
  }),
}
