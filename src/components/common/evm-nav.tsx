import { Link, useLocation } from 'react-router'
import { FileCode2, Coins } from 'lucide-react'
import { css, cx } from '@/styled-system/css'

const tabs = [
	{ name: 'Contracts', href: '/evm/contracts', icon: FileCode2 },
	{ name: 'Tokens', href: '/evm/tokens', icon: Coins },
]

export function EvmNav() {
	const location = useLocation()
	const pathname = location.pathname

	return (
		<nav className={styles.nav}>
			{tabs.map((tab) => {
				const Icon = tab.icon
				const isActive = pathname === tab.href
				return (
					<Link
						key={tab.name}
						to={tab.href}
						className={cx(styles.tab, isActive ? styles.tabActive : styles.tabInactive)}
					>
						<Icon className={styles.icon} />
						{tab.name}
					</Link>
				)
			})}
		</nav>
	)
}

const styles = {
	nav: css({
		display: 'flex',
		gap: '1',
		p: '1',
		bg: 'bg.muted',
		rounded: 'lg',
		w: 'fit-content',
	}),
	tab: css({
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		px: '4',
		py: '2',
		rounded: 'md',
		fontSize: 'sm',
		fontWeight: 'medium',
		transition: 'all',
	}),
	tabActive: css({
		bg: 'bg.default',
		color: 'fg.default',
		shadow: 'sm',
	}),
	tabInactive: css({
		color: 'fg.muted',
		_hover: {
			color: 'fg.default',
			bg: 'bg.subtle',
		},
	}),
	icon: css({
		h: '4',
		w: '4',
	}),
}
