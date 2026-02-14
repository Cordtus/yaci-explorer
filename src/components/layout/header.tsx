import { useMemo } from "react"
import { useQuery } from "@tanstack/react-query"
import { Activity, BarChart3, Blocks, ChevronDown, Code, Coins, Home, Link2, Shield, Vote } from "lucide-react"
import { Link, useLocation } from "react-router"
import { ResetNotice } from "@/components/common/reset-notice"
import { SearchBar } from "@/components/common/search-bar"
import { useChain } from "@/contexts/ChainContext"
import { getBrandingConfig } from "@/config/branding"
import { css, cx } from "@/styled-system/css"
import type { ChainFeatures } from "@/config/chains"
import type { LucideIcon } from "lucide-react"

interface NavItem {
	name: string
	href: string
	icon: LucideIcon
	requiresFeature?: keyof ChainFeatures
}

const allNavItems: NavItem[] = [
	{ name: "Dashboard", href: "/", icon: Home },
	{ name: "Blocks", href: "/blocks", icon: Blocks },
	{ name: "Transactions", href: "/tx", icon: Activity },
	{ name: "Validators", href: "/validators", icon: Shield },
	{ name: "Analytics", href: "/analytics", icon: BarChart3 },
	{ name: "Governance", href: "/governance", icon: Vote },
	{ name: "Contracts", href: "/evm/contracts", icon: Code, requiresFeature: "evm" },
	{ name: "Tokens", href: "/evm/tokens", icon: Coins, requiresFeature: "evm" },
	{ name: "IBC", href: "/ibc", icon: Link2, requiresFeature: "ibc" },
]

/** Builds the visible nav items based on the selected chain's features */
function useNavItems(): NavItem[] {
	const { chainInfo } = useChain()
	return useMemo(() =>
		allNavItems.filter(item => {
			if (!item.requiresFeature) return true
			return chainInfo.features[item.requiresFeature]
		}),
		[chainInfo.features]
	)
}

/** Pulsing dot with lag text when the indexer falls behind the chain tip */
function SyncIndicator() {
	const { api, chainInfo } = useChain()

	const { data: latestBlock } = useQuery({
		queryKey: ["sync-status", chainInfo.chainId],
		queryFn: () => api.getLatestBlock(),
		staleTime: 10_000,
		refetchInterval: 10_000,
	})

	if (!latestBlock) return null

	const blockTime = new Date(latestBlock.data.block.header.time).getTime()
	const now = Date.now()
	const lagSeconds = Math.floor((now - blockTime) / 1000)

	// Only show when lag exceeds 60 seconds
	if (lagSeconds < 60) return null

	const lagMinutes = Math.floor(lagSeconds / 60)
	const isCritical = lagMinutes >= 30
	const lagText = lagMinutes >= 60
		? `${Math.floor(lagMinutes / 60)}h ${lagMinutes % 60}m behind`
		: `${lagMinutes}m behind`

	return (
		<div className={syncStyles.wrapper} title={`Last indexed block: #${latestBlock.id}`}>
			<div className={cx(syncStyles.dot, isCritical ? syncStyles.dotCritical : syncStyles.dotWarning)} />
			<span className={syncStyles.text}>{lagText}</span>
		</div>
	)
}

function ChainSwitcher() {
	const { selectedChainId, switchChain, availableChains } = useChain()

	// Hide switcher when only one chain configured
	if (availableChains.length <= 1) {
		const name = availableChains[0]?.name || 'Explorer'
		return <span className={chainSwitcherStyles.singleChain}>{name}</span>
	}

	const current = availableChains.find(c => c.id === selectedChainId)

	return (
		<div className={chainSwitcherStyles.wrapper}>
			<select
				value={selectedChainId}
				onChange={(e) => switchChain(e.target.value)}
				className={chainSwitcherStyles.select}
			>
				{availableChains.map((chain) => (
					<option key={chain.id} value={chain.id}>
						{chain.name}
					</option>
				))}
			</select>
			<div className={chainSwitcherStyles.display}>
				<div className={chainSwitcherStyles.dot} />
				<span>{current?.name}</span>
				<ChevronDown className={chainSwitcherStyles.chevron} />
			</div>
		</div>
	)
}

export function Header() {
	const location = useLocation()
	const pathname = location.pathname
	const branding = getBrandingConfig()
	const navItems = useNavItems()

	return (
		<header className={styles.header}>
			<div className={styles.container}>
				<div className={styles.bar}>
					<div className={styles.left}>
						<Link to="/" className={styles.brand}>
							<div className={styles.brandMark} />
							<span className={styles.brandText}>{branding.appNameShort}</span>
						</Link>

						<ChainSwitcher />

						<nav className={styles.nav}>
							{navItems.map((item) => {
								const Icon = item.icon
								const isActive = pathname === item.href ||
									(item.href !== "/" && pathname.startsWith(item.href))
								return (
									<Link
										key={item.name}
										to={item.href}
										className={cx(
											styles.navItem,
											isActive
												? styles.navItemActive
												: styles.navItemInactive
										)}
									>
										<Icon className={styles.navIcon} />
										{item.name}
									</Link>
								)
							})}
						</nav>
					</div>

					<div className={styles.right}>
						<SyncIndicator />
						<SearchBar />
					</div>
				</div>
			</div>
			<ResetNotice />
		</header>
	)
}

const chainSwitcherStyles = {
	wrapper: css({
		position: "relative",
		display: "inline-flex",
	}),
	select: css({
		position: "absolute",
		inset: "0",
		opacity: "0",
		cursor: "pointer",
		w: "full",
		h: "full",
	}),
	display: css({
		display: "inline-flex",
		alignItems: "center",
		gap: "1.5",
		px: "2",
		py: "1",
		rounded: "md",
		fontSize: "xs",
		fontWeight: "medium",
		color: "fg.muted",
		bg: "bg.muted",
		cursor: "pointer",
		_hover: { bg: "bg.emphasized" },
	}),
	dot: css({
		w: "2",
		h: "2",
		rounded: "full",
		bg: "chain.accent",
		flexShrink: "0",
	}),
	chevron: css({
		w: "3",
		h: "3",
	}),
	singleChain: css({
		fontSize: "xs",
		fontWeight: "medium",
		color: "fg.muted",
		px: "2",
	}),
}

const styles = {
	header: css({
		position: "sticky",
		top: "0",
		zIndex: "50",
		w: "full",
		borderBottomWidth: "1px",
		bg: "bg.default",
		backdropFilter: "blur(8px)"
	}),
	container: css({
		maxW: "7xl",
		mx: "auto",
		px: "4"
	}),
	bar: css({
		display: "flex",
		alignItems: "center",
		justifyContent: "space-between",
		h: "16"
	}),
	left: css({
		display: "flex",
		alignItems: "center",
		gap: "4"
	}),
	right: css({
		display: "flex",
		alignItems: "center",
		gap: "4"
	}),
	brand: css({
		display: "inline-flex",
		alignItems: "center",
		gap: "2"
	}),
	brandMark: css({
		h: "8",
		w: "8",
		rounded: "full",
		bg: "chain.accent"
	}),
	brandText: css({
		fontSize: "xl",
		fontWeight: "bold",
		letterSpacing: "-0.01em"
	}),
	nav: css({
		display: { base: "none", md: "flex" },
		alignItems: "center",
		gap: "6",
		fontSize: "sm",
		fontWeight: "medium"
	}),
	navItem: css({
		display: "inline-flex",
		alignItems: "center",
		gap: "2",
		transition: "color 0.2s ease"
	}),
	navItemActive: css({ color: "fg.default" }),
	navItemInactive: css({ color: "fg.muted", _hover: { color: "fg.default" } }),
	navIcon: css({ h: "4", w: "4" })
}

const syncStyles = {
	wrapper: css({
		display: "inline-flex",
		alignItems: "center",
		gap: "1.5",
		px: "2",
		py: "1",
		rounded: "md",
		fontSize: "xs",
		fontWeight: "medium",
		bg: "bg.muted",
	}),
	dot: css({
		w: "2",
		h: "2",
		rounded: "full",
		flexShrink: "0",
		animation: "skeleton-pulse 2s ease-in-out infinite",
	}),
	dotWarning: css({
		bg: "yellow.500",
	}),
	dotCritical: css({
		bg: "red.500",
	}),
	text: css({
		color: "fg.muted",
	}),
}
