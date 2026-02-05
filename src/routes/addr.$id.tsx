import { useQuery } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Copy, CheckCircle, User, ArrowUpRight, ArrowDownLeft, Activity, FileCode, Wallet, AlertCircle, Coins } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api, getAccountBalances, getEvmBalance, type EnhancedTransaction, type TokenBalance } from '@/lib/api'
import { formatNumber, formatTimeAgo, formatHash, cn, getAddressType, getAlternateAddress, isValidAddress } from '@/lib/utils'
import { formatDenomAmount, getDenomMetadata } from '@/lib/denom'
import { Skeleton } from '@/components/ui/skeleton'
import { ContractDetails } from '@/components/ContractDetails'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table'
import { Pagination } from '@/components/ui/pagination'
import { css } from '@/styled-system/css'
import { grid, hstack, center, statRow } from '@/styled-system/patterns'

export default function AddressDetailPage() {
	const [mounted, setMounted] = useState(false)
	const [copiedHex, setCopiedHex] = useState(false)
	const [copiedBech32, setCopiedBech32] = useState(false)
	const [page, setPage] = useState(0)
	const params = useParams()
	const pageSize = 20

	const isValidAddr = params.id ? isValidAddress(params.id) : false
	const entryFormat = params.id ? getAddressType(params.id) : null
	const isEvmFocused = entryFormat === 'evm'
	const alternateAddr = params.id ? getAlternateAddress(params.id) : null
	const hexAddr = isEvmFocused ? params.id : alternateAddr
	const bech32Addr = isEvmFocused ? alternateAddr : params.id

	useEffect(() => {
		setMounted(true)
	}, [])

	const { data: isContract } = useQuery({
		queryKey: ['is-contract', hexAddr],
		queryFn: async () => {
			if (!hexAddr) return false
			return await api.isEvmContract(hexAddr)
		},
		enabled: mounted && !!hexAddr,
		staleTime: Infinity,
	})

	const primaryAddr = bech32Addr || hexAddr || ''
	const altAddr = bech32Addr ? hexAddr : bech32Addr

	const { data: stats, isLoading: statsLoading } = useQuery({
		queryKey: ['address-stats', primaryAddr, altAddr],
		queryFn: async () => {
			if (!primaryAddr) return null
			return await api.getAddressStats(primaryAddr, altAddr || undefined)
		},
		enabled: mounted && !!primaryAddr,
	})

	const { data: transactions, isLoading: txLoading } = useQuery({
		queryKey: ['address-transactions', primaryAddr, altAddr, page],
		queryFn: async () => {
			if (!primaryAddr) return { data: [], pagination: { total: 0, limit: pageSize, offset: 0, has_next: false, has_prev: false } }
			return await api.getTransactionsByAddress(primaryAddr, pageSize, page * pageSize, altAddr || undefined)
		},
		enabled: mounted && !!primaryAddr,
	})

	const { data: balances, isLoading: balancesLoading } = useQuery({
		queryKey: ['account-balances', bech32Addr, hexAddr],
		queryFn: async () => {
			if (!bech32Addr) return []

			// Try API first (chain-query-service)
			const apiBalances = await getAccountBalances(bech32Addr)
			if (apiBalances.length > 0) return apiBalances

			// Fallback to EVM RPC for native balance
			if (hexAddr) {
				const evmBalance = await getEvmBalance(hexAddr)
				if (evmBalance && BigInt(evmBalance.amount) > 0n) {
					return [evmBalance]
				}
			}

			return []
		},
		enabled: mounted && !!bech32Addr,
		staleTime: 30000,
	})

	const copyHex = () => {
		if (hexAddr) {
			navigator.clipboard.writeText(hexAddr)
			setCopiedHex(true)
			setTimeout(() => setCopiedHex(false), 2000)
		}
	}

	const copyBech32 = () => {
		if (bech32Addr) {
			navigator.clipboard.writeText(bech32Addr)
			setCopiedBech32(true)
			setTimeout(() => setCopiedBech32(false), 2000)
		}
	}

	const isSender = (tx: EnhancedTransaction): boolean => {
		return tx.messages?.some(msg =>
			msg.sender === params.id ||
			(hexAddr && msg.sender === hexAddr) ||
			(bech32Addr && msg.sender === bech32Addr)
		) ?? false
	}

	if (!mounted || (isValidAddr && statsLoading)) {
		return (
			<div className={css({ display: 'flex', flexDirection: 'column', gap: '4', w: 'full' })}>
				<Skeleton className={css({ h: '8', w: '48' })} />
				<Skeleton className={css({ h: '32', w: 'full' })} />
				<Skeleton className={css({ h: '96', w: 'full' })} />
			</div>
		)
	}

	if (!isValidAddr) {
		return (
			<div className={css({ display: 'flex', flexDirection: 'column', gap: '4', w: 'full' })}>
				<Link to="/" className={hstack({ gap: '2', color: 'fg.muted', _hover: { color: 'accent.default' } })}>
					<ArrowLeft className={css({ w: 'icon.sm', h: 'icon.sm' })} />
					Back to Home
				</Link>
				<Card>
					<CardContent className={css({ pt: '6' })}>
						<div className={center({ flexDir: 'column', py: '12' })}>
							<AlertCircle className={css({ w: 'icon.xl', h: 'icon.xl', color: 'red.500', mb: '4' })} />
							<h2 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: '2' })}>Invalid Address</h2>
							<p className={css({ color: 'fg.muted' })}>"{params.id}" is not a valid address format.</p>
							<p className={css({ color: 'fg.muted', fontSize: 'sm', mt: '2' })}>
								Valid formats: bech32 (e.g. rai1...) or hex (0x...)
							</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!stats) {
		return (
			<div className={css({ display: 'flex', flexDirection: 'column', gap: '4', w: 'full' })}>
				<Link to="/" className={hstack({ gap: '2', color: 'fg.muted', _hover: { color: 'accent.default' } })}>
					<ArrowLeft className={css({ w: 'icon.sm', h: 'icon.sm' })} />
					Back to Home
				</Link>
				<Card>
					<CardContent className={css({ pt: '6' })}>
						<div className={center({ flexDir: 'column', py: '12' })}>
							<User className={css({ w: 'icon.xl', h: 'icon.xl', color: 'fg.muted', mb: '4' })} />
							<h2 className={css({ fontSize: '2xl', fontWeight: 'bold', mb: '2' })}>Address Not Found</h2>
							<p className={css({ color: 'fg.muted' })}>No transactions found for this address.</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	return (
		<div className={css({ display: 'flex', flexDirection: 'column', gap: '6', w: 'full' })}>
			{/* Header */}
			<div>
				<Link to="/" className={hstack({ gap: '2', color: 'fg.muted', mb: '4', _hover: { color: 'accent.default' } })}>
					<ArrowLeft className={css({ w: 'icon.sm', h: 'icon.sm' })} />
					Back to Home
				</Link>
				<div className={hstack({ gap: '3', mb: '2' })}>
					{isContract ? (
						<FileCode className={css({ w: 'icon.xl', h: 'icon.xl', color: 'fg.accent' })} />
					) : (
						<Wallet className={css({ w: 'icon.xl', h: 'icon.xl', color: 'fg.accent' })} />
					)}
					<h1 className={css({ fontSize: '3xl', fontWeight: 'bold' })}>
						{isContract ? 'Contract' : 'Account'} Details
					</h1>
					<Badge variant="outline">
						{isContract === undefined ? (isEvmFocused ? 'EVM' : 'Cosmos') : isContract ? 'Contract' : 'EOA'}
					</Badge>
				</div>
				<div className={css({
					bg: 'bg.accentSubtle',
					p: '4',
					borderRadius: 'lg',
					border: '1px solid',
					borderColor: 'border.accent',
					boxShadow: '0 0 20px rgba(48, 255, 110, 0.1)',
				})}>
					<div className={hstack({ gap: '2', mb: isContract ? '0' : '2' })}>
						<Badge variant={isEvmFocused ? 'default' : 'outline'} className={css({ fontSize: 'xs', minW: '14', justifyContent: 'center' })}>
							Hex
						</Badge>
						<p className={css({ fontFamily: 'mono', fontSize: 'sm', wordBreak: 'break-all', flex: '1', fontWeight: isEvmFocused ? 'semibold' : 'normal' })}>
							{hexAddr}
						</p>
						<Button variant="ghost" size="icon" className={css({ w: '8', h: '8', flexShrink: '0' })} onClick={copyHex}>
							{copiedHex ? <CheckCircle className={css({ w: 'icon.sm', h: 'icon.sm', color: 'green.500' })} /> : <Copy className={css({ w: 'icon.sm', h: 'icon.sm' })} />}
						</Button>
					</div>
					{!isContract && (
						<div className={hstack({ gap: '2' })}>
							<Badge variant={!isEvmFocused ? 'default' : 'outline'} className={css({ fontSize: 'xs', minW: '14', justifyContent: 'center' })}>
								Bech32
							</Badge>
							<p className={css({ fontFamily: 'mono', fontSize: 'sm', wordBreak: 'break-all', flex: '1', fontWeight: !isEvmFocused ? 'semibold' : 'normal' })}>
								{bech32Addr}
							</p>
							<Button variant="ghost" size="icon" className={css({ w: '8', h: '8', flexShrink: '0' })} onClick={copyBech32}>
								{copiedBech32 ? <CheckCircle className={css({ w: 'icon.sm', h: 'icon.sm', color: 'green.500' })} /> : <Copy className={css({ w: 'icon.sm', h: 'icon.sm' })} />}
							</Button>
						</div>
					)}
				</div>
			</div>

			{/* Account Overview - Stats + Balances side by side */}
			<div className={grid({ columns: { base: 1, md: 2 }, gap: '4', w: 'full' })}>
				{/* Left: Compact Stats */}
				<div className={css({ display: 'flex', flexDirection: 'column', gap: '2', w: 'full' })}>
					<div className={statRow()}>
						<span className={hstack({ gap: '2', color: 'fg.muted', fontSize: 'sm' })}>
							<Activity className={css({ w: 'icon.sm', h: 'icon.sm' })} />
							Transactions
						</span>
						<span className={css({ fontFamily: 'mono', fontWeight: 'semibold', color: 'fg.accent' })}>
							{formatNumber(stats.transaction_count)}
						</span>
					</div>
					<div className={statRow()}>
						<span className={hstack({ gap: '2', color: 'fg.muted', fontSize: 'sm' })}>
							<ArrowDownLeft className={css({ w: 'icon.sm', h: 'icon.sm', color: 'fg.accent' })} />
							First Seen
						</span>
						<span className={css({ fontFamily: 'mono', fontWeight: 'semibold', color: 'fg.accent' })}>
							{stats.first_seen ? formatTimeAgo(stats.first_seen) : 'N/A'}
						</span>
					</div>
					<div className={statRow()}>
						<span className={hstack({ gap: '2', color: 'fg.muted', fontSize: 'sm' })}>
							<Activity className={css({ w: 'icon.sm', h: 'icon.sm', color: 'blue.500' })} />
							Last Active
						</span>
						<span className={css({ fontFamily: 'mono', fontWeight: 'semibold', color: 'fg.accent' })}>
							{stats.last_seen ? formatTimeAgo(stats.last_seen) : 'N/A'}
						</span>
					</div>
					<div className={statRow()}>
						<span className={hstack({ gap: '2', color: 'fg.muted', fontSize: 'sm' })}>
							{isContract ? <FileCode className={css({ w: 'icon.sm', h: 'icon.sm' })} /> : <Wallet className={css({ w: 'icon.sm', h: 'icon.sm' })} />}
							Type
						</span>
						<span className={css({ fontFamily: 'mono', fontWeight: 'semibold', color: 'fg.accent' })}>
							{isContract === undefined ? '...' : isContract ? 'Contract' : 'EOA'}
						</span>
					</div>
				</div>

				{/* Right: Token Balances */}
				<Card>
					<CardHeader className={hstack({ justify: 'space-between', pb: '2' })}>
						<CardTitle className={css({ fontSize: 'sm', fontWeight: 'medium' })}>Token Balances</CardTitle>
						<Coins className={css({ w: 'icon.sm', h: 'icon.sm', color: 'fg.muted' })} />
					</CardHeader>
					<CardContent className={css({ pt: '0' })}>
						{balancesLoading ? (
							<div className={css({ display: 'flex', flexDirection: 'column', gap: '2', w: 'full' })}>
								<Skeleton className={css({ h: '10', w: 'full' })} />
								<Skeleton className={css({ h: '10', w: 'full' })} />
							</div>
						) : balances && balances.length > 0 ? (
							<div className={css({ display: 'flex', flexDirection: 'column', gap: '2', w: 'full' })}>
								{balances.map((balance: TokenBalance) => {
									const metadata = getDenomMetadata(balance.denom)
									const formattedAmount = formatDenomAmount(balance.amount, balance.denom, { maxDecimals: 6 })
									return (
										<div key={balance.denom} className={hstack({ gap: '2', p: '2', borderRadius: 'md', border: '1px solid', borderColor: 'border.default', bg: 'bg.subtle' })}>
											<span className={css({ fontFamily: 'mono', fontWeight: 'bold', color: 'fg.accent' })}>{formattedAmount}</span>
											<span className={css({ fontSize: 'sm', fontWeight: 'medium' })}>{metadata.symbol}</span>
											{metadata.isIBC && <Badge variant="outline" className={css({ fontSize: '10px', ml: 'auto' })}>IBC</Badge>}
										</div>
									)
								})}
							</div>
						) : (
							<div className={center({ py: '6' })}>
								<p className={css({ color: 'fg.muted', fontSize: 'sm' })}>No balances</p>
							</div>
						)}
					</CardContent>
				</Card>
			</div>

			{/* Contract Details (only for contracts) */}
			{isContract && hexAddr && (
				<ContractDetails address={hexAddr} />
			)}

			{/* Transactions Table */}
			<Card>
				<CardHeader>
					<CardTitle>Transaction History</CardTitle>
				</CardHeader>
				<CardContent>
					{txLoading ? (
						<div className={css({ display: 'flex', flexDirection: 'column', gap: '3', w: 'full' })}>
							<Skeleton className={css({ h: '12', w: 'full' })} />
							<Skeleton className={css({ h: '12', w: 'full' })} />
							<Skeleton className={css({ h: '12', w: 'full' })} />
						</div>
					) : transactions && transactions.data.length > 0 ? (
						<>
							<div className={css({ borderRadius: 'md', border: '1px solid', borderColor: 'border.default', overflowX: 'auto' })}>
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Role</TableHead>
											<TableHead>Tx Hash</TableHead>
											<TableHead>Block</TableHead>
											<TableHead>Messages</TableHead>
											<TableHead>Status</TableHead>
											<TableHead>Time</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{transactions.data.map((tx) => {
											const isOut = isSender(tx)
											const isSuccess = !tx.error
											return (
												<TableRow key={tx.id}>
													<TableCell>
														<Badge
															variant={isOut ? 'default' : 'secondary'}
															className={cn(
																css({ fontWeight: 'medium' }),
																isOut
																	? css({ bg: 'rgba(124, 207, 255, 0.2)', color: '#7CCFFF', border: '1px solid rgba(124, 207, 255, 0.3)' })
																	: css({ bg: 'bg.accentMuted', color: 'fg.accent', border: '1px solid', borderColor: 'border.accent' })
															)}
														>
															{isOut ? (
																<><ArrowUpRight className={css({ w: 'icon.xs', h: 'icon.xs', mr: '1' })} />Sender</>
															) : (
																<><ArrowDownLeft className={css({ w: 'icon.xs', h: 'icon.xs', mr: '1' })} />Related</>
															)}
														</Badge>
													</TableCell>
													<TableCell>
														<Link to={`/tx/${tx.id}`} className={css({ fontFamily: 'mono', fontSize: 'sm', color: 'chart.secondary', _hover: { color: 'accent.default' } })}>
															{formatHash(tx.id, 8)}
														</Link>
													</TableCell>
													<TableCell>
														{tx.height ? (
															<Link to={`/blocks/${tx.height}`} className={css({ color: 'chart.secondary', _hover: { color: 'accent.default' } })}>
																{formatNumber(tx.height)}
															</Link>
														) : (
															<span className={css({ color: 'fg.muted' })}>-</span>
														)}
													</TableCell>
													<TableCell>
														<Badge variant="outline">{tx.messages?.length || 0}</Badge>
													</TableCell>
													<TableCell>
														<Badge variant={isSuccess ? 'success' : 'destructive'}>
															{isSuccess ? <><CheckCircle className={css({ w: 'icon.xs', h: 'icon.xs', mr: '1' })} />Success</> : 'Failed'}
														</Badge>
													</TableCell>
													<TableCell className={css({ fontSize: 'sm', color: 'fg.muted' })}>
														{tx.timestamp ? formatTimeAgo(tx.timestamp) : 'Unavailable'}
													</TableCell>
												</TableRow>
											)
										})}
									</TableBody>
								</Table>
							</div>

							{transactions.pagination.total > pageSize && (
								<Pagination
									currentPage={page}
									totalPages={Math.ceil(transactions.pagination.total / pageSize)}
									onPageChange={setPage}
									isLoading={txLoading}
								/>
							)}
						</>
					) : (
						<div className={center({ flexDir: 'column', py: '12' })}>
							<Activity className={css({ w: 'icon.xl', h: 'icon.xl', color: 'fg.muted', mb: '4' })} />
							<p className={css({ color: 'fg.muted' })}>No transactions found for this address</p>
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
