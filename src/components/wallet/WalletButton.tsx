/**
 * Wallet Button - Shows connection status and opens wallet dropdown with account info
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
	Wallet,
	ChevronDown,
	ChevronRight,
	LogOut,
	Copy,
	Check,
	ExternalLink,
	Coins,
	Users,
	Loader2
} from 'lucide-react'
import { useWallet } from '@/contexts/WalletContext'
import { ConnectWalletModal } from './ConnectWalletModal'
import { truncateAddress } from '@/lib/address'
import { api, getAccountBalances } from '@/lib/api'
import { formatDenomAmount } from '@/lib/denom'
import { getChainBaseDenom, getChainDisplayDenom } from '@/lib/chain-info'
import { css, cx } from '@/styled-system/css'

export function WalletButton() {
	const { isConnected, isConnecting, walletType, evmAddress, cosmosAddress, disconnect, balance: contextBalance, isLoadingBalance: contextBalanceLoading } = useWallet()
	const [isModalOpen, setIsModalOpen] = useState(false)
	const [isMenuOpen, setIsMenuOpen] = useState(false)
	const [isDelegationsExpanded, setIsDelegationsExpanded] = useState(false)
	const [copied, setCopied] = useState<'evm' | 'cosmos' | null>(null)
	const menuRef = useRef<HTMLDivElement>(null)

	const baseDenom = getChainBaseDenom()
	const displayDenom = getChainDisplayDenom()

	// Close menu when clicking outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setIsMenuOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	// Fetch balances when connected
	const { data: balances, isLoading: balancesLoading } = useQuery({
		queryKey: ['wallet-balances', cosmosAddress],
		queryFn: () => getAccountBalances(cosmosAddress || ''),
		enabled: isConnected && !!cosmosAddress && isMenuOpen,
		staleTime: 30000,
	})

	// Fetch delegations when connected
	const { data: delegationsData, isLoading: delegationsLoading } = useQuery({
		queryKey: ['wallet-delegations', cosmosAddress],
		queryFn: () => api.getDelegatorDelegations(cosmosAddress || ''),
		enabled: isConnected && !!cosmosAddress && isMenuOpen,
		staleTime: 30000,
	})

	const copyToClipboard = async (text: string, type: 'evm' | 'cosmos') => {
		await navigator.clipboard.writeText(text)
		setCopied(type)
		setTimeout(() => setCopied(null), 2000)
	}

	const handleDisconnect = () => {
		disconnect()
		setIsMenuOpen(false)
	}

	// Not connected - show connect button
	if (!isConnected) {
		return (
			<>
				<button
					type="button"
					className={styles.connectButton}
					onClick={() => setIsModalOpen(true)}
					disabled={isConnecting}
				>
					<Wallet size={16} />
					<span>{isConnecting ? 'Connecting...' : 'Connect'}</span>
				</button>
				<ConnectWalletModal
					isOpen={isModalOpen}
					onClose={() => setIsModalOpen(false)}
				/>
			</>
		)
	}

	// Connected - show address and dropdown
	const displayAddress = walletType === 'keplr' ? cosmosAddress : evmAddress

	// Get native balance - prefer API balances, fall back to context balance from EVM RPC
	const nativeBalance = balances?.find(b => b.denom === baseDenom)
	const formattedBalance = nativeBalance
		? formatDenomAmount(nativeBalance.amount, baseDenom, { maxDecimals: 4 })
		: contextBalance || '0'

	// Use context loading state when API balances haven't loaded
	const isBalanceLoading = balancesLoading || (!balances?.length && contextBalanceLoading)

	// Get total staked
	const totalStaked = delegationsData?.delegations?.reduce(
		(sum, d) => sum + parseFloat(d.total_delegated || '0'),
		0
	) || 0

	return (
		<div className={styles.container} ref={menuRef}>
			<button
				type="button"
				className={styles.addressButton}
				onClick={() => setIsMenuOpen(!isMenuOpen)}
			>
				<div className={cx(styles.walletIndicator, walletType === 'keplr' ? styles.keplr : styles.evm)} />
				<span className={styles.address}>{truncateAddress(displayAddress || '', 6, 4)}</span>
				<ChevronDown size={14} className={cx(styles.chevron, isMenuOpen && styles.chevronOpen)} />
			</button>

			{isMenuOpen && (
				<div className={styles.dropdown}>
					{/* Header */}
					<div className={styles.dropdownHeader}>
						<span className={styles.walletLabel}>
							{walletType === 'keplr' ? 'Keplr' : 'EVM'} Wallet
						</span>
					</div>

					{/* Addresses */}
					<div className={styles.section}>
						{evmAddress && (
							<div className={styles.addressRow}>
								<span className={styles.addressLabel}>EVM</span>
								<span className={styles.addressValue}>{truncateAddress(evmAddress, 10, 6)}</span>
								<button
									type="button"
									className={styles.iconButton}
									onClick={() => copyToClipboard(evmAddress, 'evm')}
									title="Copy address"
								>
									{copied === 'evm' ? <Check size={14} /> : <Copy size={14} />}
								</button>
							</div>
						)}

						{cosmosAddress && (
							<div className={styles.addressRow}>
								<span className={styles.addressLabel}>Cosmos</span>
								<span className={styles.addressValue}>{truncateAddress(cosmosAddress, 10, 6)}</span>
								<button
									type="button"
									className={styles.iconButton}
									onClick={() => copyToClipboard(cosmosAddress, 'cosmos')}
									title="Copy address"
								>
									{copied === 'cosmos' ? <Check size={14} /> : <Copy size={14} />}
								</button>
							</div>
						)}
					</div>

					<div className={styles.divider} />

					{/* Balance Section */}
					<div className={styles.section}>
						<div className={styles.sectionHeader}>
							<Coins size={14} className={styles.sectionIcon} />
							<span className={styles.sectionTitle}>Balance</span>
						</div>
						{isBalanceLoading ? (
							<div className={styles.loadingRow}>
								<Loader2 size={14} className={styles.spinner} />
								<span>Loading...</span>
							</div>
						) : (
							<div className={styles.balanceGrid}>
								<div className={styles.balanceItem}>
									<span className={styles.balanceLabel}>Available</span>
									<span className={styles.balanceValue}>
										{formattedBalance} <span className={styles.denomText}>{displayDenom}</span>
									</span>
								</div>
								{totalStaked > 0 && (
									<div className={styles.balanceItem}>
										<span className={styles.balanceLabel}>Staked</span>
										<span className={styles.balanceValue}>
											{formatDenomAmount(totalStaked.toString(), baseDenom, { maxDecimals: 4 })}
											{' '}<span className={styles.denomText}>{displayDenom}</span>
										</span>
									</div>
								)}
							</div>
						)}
					</div>

					<div className={styles.divider} />

					{/* Delegations Section */}
					<div className={styles.section}>
						<button
							type="button"
							className={styles.sectionHeaderButton}
							onClick={() => setIsDelegationsExpanded(!isDelegationsExpanded)}
						>
							<Users size={14} className={styles.sectionIcon} />
							<span className={styles.sectionTitle}>
								Delegations
								{delegationsData?.delegations && delegationsData.delegations.length > 0 && (
									<span className={styles.badge}>{delegationsData.delegations.length}</span>
								)}
							</span>
							<ChevronRight
								size={14}
								className={cx(styles.expandIcon, isDelegationsExpanded && styles.expandIconOpen)}
							/>
						</button>

						{isDelegationsExpanded && (
							<div className={styles.delegationsList}>
								{delegationsLoading ? (
									<div className={styles.loadingRow}>
										<Loader2 size={14} className={styles.spinner} />
										<span>Loading delegations...</span>
									</div>
								) : delegationsData?.delegations && delegationsData.delegations.length > 0 ? (
									delegationsData.delegations.map((delegation) => (
										<Link
											key={delegation.validator_address}
											to={`/validators/${delegation.validator_address}`}
											className={styles.delegationItem}
											onClick={() => setIsMenuOpen(false)}
										>
											<div className={styles.delegationInfo}>
												<span className={styles.validatorName}>
													{delegation.validator_moniker || truncateAddress(delegation.validator_address, 8, 6)}
												</span>
												{delegation.validator_jailed && (
													<span className={styles.jailedBadge}>Jailed</span>
												)}
											</div>
											<span className={styles.delegationAmount}>
												{formatDenomAmount(delegation.total_delegated || '0', baseDenom, { maxDecimals: 2 })}
											</span>
										</Link>
									))
								) : (
									<div className={styles.emptyState}>
										<span>No active delegations</span>
										<Link
											to="/validators"
											className={styles.stakeLink}
											onClick={() => setIsMenuOpen(false)}
										>
											Browse validators
										</Link>
									</div>
								)}
							</div>
						)}
					</div>

					<div className={styles.divider} />

					{/* Actions */}
					<div className={styles.actionsSection}>
						{evmAddress && (
							<Link
								to={`/addr/${evmAddress}`}
								className={styles.menuItem}
								onClick={() => setIsMenuOpen(false)}
							>
								<ExternalLink size={14} />
								<span>View in Explorer</span>
							</Link>
						)}

						<button
							type="button"
							className={cx(styles.menuItem, styles.disconnectItem)}
							onClick={handleDisconnect}
						>
							<LogOut size={14} />
							<span>Disconnect</span>
						</button>
					</div>
				</div>
			)}
		</div>
	)
}

const styles = {
	container: css({
		position: 'relative',
	}),
	connectButton: css({
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		px: '4',
		py: '2',
		bg: 'transparent',
		color: 'fg.muted',
		borderRadius: 'lg',
		fontSize: 'sm',
		fontWeight: 'medium',
		cursor: 'pointer',
		transition: 'all 0.2s',
		border: '1px solid',
		borderColor: 'border.default',
		_hover: {
			borderColor: 'border.emphasized',
			color: 'fg.default',
			bg: 'bg.subtle',
		},
		_disabled: {
			opacity: 0.7,
			cursor: 'not-allowed',
		},
	}),
	addressButton: css({
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		px: '3',
		py: '2',
		bg: 'bg.subtle',
		border: '1px solid',
		borderColor: 'border.default',
		borderRadius: 'lg',
		fontSize: 'sm',
		cursor: 'pointer',
		transition: 'all 0.2s',
		_hover: {
			borderColor: 'border.emphasized',
			bg: 'bg.muted',
		},
	}),
	walletIndicator: css({
		w: '2',
		h: '2',
		borderRadius: 'full',
	}),
	keplr: css({
		bg: '#7B68EE',
	}),
	evm: css({
		bg: '#F6851B',
	}),
	address: css({
		fontFamily: 'mono',
	}),
	chevron: css({
		color: 'fg.muted',
		transition: 'transform 0.2s',
	}),
	chevronOpen: css({
		transform: 'rotate(180deg)',
	}),
	dropdown: css({
		position: 'absolute',
		top: 'calc(100% + 8px)',
		right: '0',
		w: '320px',
		maxH: '80vh',
		overflowY: 'auto',
		bg: 'bg.default',
		border: '1px solid',
		borderColor: 'border.default',
		borderRadius: 'xl',
		boxShadow: '0 10px 40px rgba(0, 0, 0, 0.5)',
		zIndex: 100,
	}),
	dropdownHeader: css({
		px: '4',
		py: '3',
		borderBottom: '1px solid',
		borderColor: 'border.default',
		bg: 'bg.subtle',
	}),
	walletLabel: css({
		fontSize: 'xs',
		fontWeight: 'semibold',
		color: 'fg.muted',
		textTransform: 'uppercase',
		letterSpacing: '0.05em',
	}),
	section: css({
		px: '4',
		py: '3',
	}),
	sectionHeader: css({
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		mb: '2',
	}),
	sectionHeaderButton: css({
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		w: 'full',
		p: '0',
		bg: 'transparent',
		border: 'none',
		cursor: 'pointer',
		color: 'fg.default',
		fontSize: 'sm',
		_hover: {
			color: 'fg.default',
		},
	}),
	sectionIcon: css({
		color: 'republicGreen.7',
		flexShrink: 0,
	}),
	sectionTitle: css({
		fontSize: 'sm',
		fontWeight: 'medium',
		color: 'fg.muted',
		flex: 1,
		textAlign: 'left',
		display: 'flex',
		alignItems: 'center',
		gap: '2',
	}),
	expandIcon: css({
		color: 'fg.subtle',
		transition: 'transform 0.2s',
	}),
	expandIconOpen: css({
		transform: 'rotate(90deg)',
	}),
	badge: css({
		px: '1.5',
		py: '0.5',
		fontSize: '10px',
		fontWeight: 'semibold',
		bg: 'republicGreen.7/20',
		color: 'republicGreen.7',
		borderRadius: 'full',
	}),
	addressRow: css({
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		py: '1',
	}),
	addressLabel: css({
		fontSize: 'xs',
		color: 'fg.subtle',
		w: '14',
	}),
	addressValue: css({
		flex: 1,
		fontSize: 'sm',
		fontFamily: 'mono',
		color: 'fg.muted',
	}),
	iconButton: css({
		p: '1',
		color: 'fg.muted',
		borderRadius: 'md',
		cursor: 'pointer',
		transition: 'colors 0.2s',
		bg: 'transparent',
		border: 'none',
		_hover: {
			color: 'fg.default',
			bg: 'bg.subtle',
		},
	}),
	divider: css({
		h: '1px',
		bg: 'border.default',
	}),
	loadingRow: css({
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		py: '2',
		color: 'fg.muted',
		fontSize: 'sm',
	}),
	spinner: css({
		animation: 'spin 1s linear infinite',
	}),
	balanceGrid: css({
		display: 'grid',
		gap: '2',
	}),
	balanceItem: css({
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
	}),
	balanceLabel: css({
		fontSize: 'sm',
		color: 'fg.subtle',
	}),
	balanceValue: css({
		fontSize: 'sm',
		fontWeight: 'semibold',
		color: 'white',
	}),
	denomText: css({
		fontSize: 'xs',
		color: 'fg.muted',
		fontWeight: 'normal',
	}),
	delegationsList: css({
		mt: '2',
		display: 'flex',
		flexDirection: 'column',
		gap: '1',
	}),
	delegationItem: css({
		display: 'flex',
		justifyContent: 'space-between',
		alignItems: 'center',
		px: '3',
		py: '2',
		borderRadius: 'md',
		bg: 'bg.subtle',
		textDecoration: 'none',
		transition: 'all 0.2s',
		_hover: {
			bg: 'bg.muted',
		},
	}),
	delegationInfo: css({
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		minW: 0,
	}),
	validatorName: css({
		fontSize: 'sm',
		fontWeight: 'medium',
		color: 'fg.default',
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	}),
	jailedBadge: css({
		px: '1.5',
		py: '0.5',
		fontSize: '9px',
		fontWeight: 'semibold',
		color: 'red.400',
		bg: 'red.500/20',
		borderRadius: 'sm',
		flexShrink: 0,
	}),
	delegationAmount: css({
		fontSize: 'sm',
		fontFamily: 'mono',
		color: 'republicGreen.7',
		flexShrink: 0,
	}),
	emptyState: css({
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		gap: '2',
		py: '3',
		color: 'fg.muted',
		fontSize: 'sm',
	}),
	stakeLink: css({
		fontSize: 'sm',
		color: 'republicGreen.7',
		textDecoration: 'none',
		fontWeight: 'medium',
		_hover: {
			textDecoration: 'underline',
		},
	}),
	actionsSection: css({
		py: '1',
	}),
	menuItem: css({
		display: 'flex',
		alignItems: 'center',
		gap: '2',
		w: 'full',
		px: '4',
		py: '2.5',
		fontSize: 'sm',
		color: 'fg.muted',
		cursor: 'pointer',
		transition: 'colors 0.2s',
		textDecoration: 'none',
		bg: 'transparent',
		border: 'none',
		_hover: {
			bg: 'bg.subtle',
			color: 'fg.default',
		},
	}),
	disconnectItem: css({
		color: 'red.400',
		_hover: {
			bg: 'red.950',
			color: 'red.300',
		},
	}),
}
