import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Activity, Filter, Check, X } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { api } from '@/lib/api'
import { appConfig } from '@/config/app'
import { formatHash, formatTimeAgo, getTransactionStatus, getMessageTypeLabel, isEVMTransaction, formatNativeFee, getMessageActionSummary } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Pagination } from '@/components/ui/pagination'
import { css } from '@/styled-system/css'

export default function TransactionsPage() {
	const [page, setPage] = useState(0)
	const [filterOpen, setFilterOpen] = useState(false)

	// Filter state
	const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set())
	const [messageTypeFilters, setMessageTypeFilters] = useState<Set<string>>(new Set())
	const [blockFilter, setBlockFilter] = useState('')
	const [blockRangeMin, setBlockRangeMin] = useState('')
	const [blockRangeMax, setBlockRangeMax] = useState('')
	const [timeRangeMin, setTimeRangeMin] = useState('')
	const [timeRangeMax, setTimeRangeMax] = useState('')

	const limit = appConfig.transactions.pageSize

	// Fetch distinct message types dynamically
	const { data: messageTypes = [] } = useQuery({
		queryKey: ['message-types'],
		queryFn: () => api.getDistinctMessageTypes(),
		staleTime: 60000, // Cache for 1 minute
	})

	// Build filters object
	const buildFilters = () => {
		const filters: any = {}

		// Status filter
		if (statusFilters.has('success') && !statusFilters.has('failed')) {
			filters.status = 'success'
		} else if (statusFilters.has('failed') && !statusFilters.has('success')) {
			filters.status = 'failed'
		}

		// Block filters
		if (blockFilter) {
			const parsed = parseInt(blockFilter, 10)
			if (!Number.isNaN(parsed)) {
				filters.block_height = parsed
			}
		} else {
			if (blockRangeMin) {
				const parsed = parseInt(blockRangeMin, 10)
				if (!Number.isNaN(parsed)) {
					filters.block_height_min = parsed
				}
			}
			if (blockRangeMax) {
				const parsed = parseInt(blockRangeMax, 10)
				if (!Number.isNaN(parsed)) {
					filters.block_height_max = parsed
				}
			}
		}

		// Time range filters
		if (timeRangeMin) {
			filters.timestamp_min = new Date(timeRangeMin).toISOString()
		}
		if (timeRangeMax) {
			filters.timestamp_max = new Date(timeRangeMax).toISOString()
		}

		// Message type filter - only use if exactly one is selected
		if (messageTypeFilters.size === 1) {
			filters.message_type = Array.from(messageTypeFilters)[0]
		}

		return filters
	}

	const { data, isLoading, error } = useQuery({
		queryKey: ['transactions', page, Array.from(statusFilters), Array.from(messageTypeFilters), blockFilter, blockRangeMin, blockRangeMax, timeRangeMin, timeRangeMax],
		queryFn: () => api.getTransactions(limit, page * limit, buildFilters()),
	})

	const handleClearFilters = () => {
		setStatusFilters(new Set())
		setMessageTypeFilters(new Set())
		setBlockFilter('')
		setBlockRangeMin('')
		setBlockRangeMax('')
		setTimeRangeMin('')
		setTimeRangeMax('')
		setPage(0)
	}

	const handleStatusToggle = (status: string) => {
		const newFilters = new Set(statusFilters)
		if (newFilters.has(status)) {
			newFilters.delete(status)
		} else {
			newFilters.add(status)
		}
		setStatusFilters(newFilters)
	}

	const handleMessageTypeToggle = (type: string) => {
		const newFilters = new Set(messageTypeFilters)
		if (newFilters.has(type)) {
			newFilters.delete(type)
		} else {
			newFilters.add(type)
		}
		setMessageTypeFilters(newFilters)
	}

	const activeFilterCount = statusFilters.size + messageTypeFilters.size + (blockFilter ? 1 : 0) + (blockRangeMin || blockRangeMax ? 1 : 0) + (timeRangeMin || timeRangeMax ? 1 : 0)

	return (
		<div className={css(styles.container)}>
			<div className={css(styles.header)}>
				<div>
					<h1 className={css(styles.title)}>Transactions</h1>
				</div>
				<Dialog open={filterOpen} onOpenChange={setFilterOpen}>
					<DialogTrigger asChild>
						<Button variant="outline" className={css(styles.filterButton)}>
							<Filter className={css(styles.filterIcon)} />
							Filters
							{activeFilterCount > 0 && (
								<Badge variant="secondary" className={css(styles.filterBadge)}>
									{activeFilterCount}
								</Badge>
							)}
						</Button>
					</DialogTrigger>
					<DialogContent className={css(styles.dialogContent)}>
						<DialogHeader>
							<DialogTitle>Filter Transactions</DialogTitle>
							<DialogDescription>
								Select filter criteria to narrow down the transaction list
							</DialogDescription>
						</DialogHeader>

						<div className={css(styles.filterContainer)}>
							{/* Status Filter */}
							<div className={css(styles.filterSection)}>
								<Label className={css(styles.filterLabel)}>Status</Label>
								<div className={css(styles.checkboxGroup)}>
									<div className={css(styles.checkboxItem)}>
										<Checkbox
											id="status-success"
											checked={statusFilters.has('success')}
											onCheckedChange={() => handleStatusToggle('success')}
										/>
										<label
											htmlFor="status-success"
											className={css(styles.checkboxLabel)}
										>
											Success
										</label>
									</div>
									<div className={css(styles.checkboxItem)}>
										<Checkbox
											id="status-failed"
											checked={statusFilters.has('failed')}
											onCheckedChange={() => handleStatusToggle('failed')}
										/>
										<label
											htmlFor="status-failed"
											className={css(styles.checkboxLabel)}
										>
											Failed
										</label>
									</div>
								</div>
							</div>

							<Separator />

							{/* Message Type Filter */}
							<div className={css(styles.filterSection)}>
								<Label className={css(styles.filterLabel)}>Message Type</Label>
								<div className={css(styles.messageTypeList)}>
									{messageTypes.length === 0 ? (
										<div className={css(styles.loadingText)}>Loading message types...</div>
									) : (
										messageTypes.map((type) => (
											<div key={type} className={css(styles.checkboxItem)}>
												<Checkbox
													id={`type-${type}`}
													checked={messageTypeFilters.has(type)}
													onCheckedChange={() => handleMessageTypeToggle(type)}
												/>
												<label
													htmlFor={`type-${type}`}
													className={css(styles.checkboxLabel)}
												>
													{getMessageTypeLabel(type)}
												</label>
											</div>
										))
									)}
								</div>
							</div>

							<Separator />

							{/* Block Height Filter */}
							<div className={css(styles.filterSection)}>
								<Label className={css(styles.filterLabel)}>Block Height</Label>
								<div className={css(styles.blockFilterGroup)}>
									<div>
										<Label htmlFor="block-single" className={css(styles.inputLabel)}>Single Block</Label>
										<Input
											id="block-single"
											type="number"
											placeholder="Enter block number"
											value={blockFilter}
											onChange={(e) => {
												setBlockFilter(e.target.value)
												if (e.target.value) {
													setBlockRangeMin('')
													setBlockRangeMax('')
												}
											}}
										/>
									</div>
									<div className={css(styles.blockRangeGrid)}>
										<div>
											<Label htmlFor="block-min" className={css(styles.inputLabel)}>Min Block</Label>
											<Input
												id="block-min"
												type="number"
												placeholder="Min"
												value={blockRangeMin}
												onChange={(e) => {
													setBlockRangeMin(e.target.value)
													if (e.target.value) setBlockFilter('')
												}}
												disabled={!!blockFilter}
											/>
										</div>
										<div>
											<Label htmlFor="block-max" className={css(styles.inputLabel)}>Max Block</Label>
											<Input
												id="block-max"
												type="number"
												placeholder="Max"
												value={blockRangeMax}
												onChange={(e) => {
													setBlockRangeMax(e.target.value)
													if (e.target.value) setBlockFilter('')
												}}
												disabled={!!blockFilter}
											/>
										</div>
									</div>
								</div>
							</div>

							<Separator />

							{/* Time Range Filter */}
							<div className={css(styles.filterSection)}>
								<Label className={css(styles.filterLabel)}>Time Range</Label>
								<div className={css(styles.timeRangeGrid)}>
									<div>
										<Label htmlFor="time-min" className={css(styles.inputLabel)}>From</Label>
										<Input
											id="time-min"
											type="datetime-local"
											value={timeRangeMin}
											onChange={(e) => setTimeRangeMin(e.target.value)}
										/>
									</div>
									<div>
										<Label htmlFor="time-max" className={css(styles.inputLabel)}>To</Label>
										<Input
											id="time-max"
											type="datetime-local"
											value={timeRangeMax}
											onChange={(e) => setTimeRangeMax(e.target.value)}
										/>
									</div>
								</div>
							</div>
						</div>

						<DialogFooter>
							<Button variant="outline" onClick={handleClearFilters}>
								Clear All
							</Button>
							<Button onClick={() => { setFilterOpen(false); setPage(0) }}>
								Apply Filters
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Transactions</CardTitle>
					<CardDescription>
						{data ? `Showing ${data.data.length} of ${data.pagination.total.toLocaleString()} transactions` : 'Loading...'}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Transaction Hash</TableHead>
								<TableHead>Type</TableHead>
								<TableHead>Block</TableHead>
								<TableHead>Time</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Fee</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{isLoading ? (
								Array.from({ length: 10 }).map((_, i) => (
									<TableRow key={i}>
										<TableCell colSpan={6}>
											<Skeleton className={css(styles.skeletonRow)} />
										</TableCell>
									</TableRow>
								))
							) : error ? (
								<TableRow>
									<TableCell colSpan={6} className={css(styles.emptyCell)}>
										Error loading transactions
									</TableCell>
								</TableRow>
							) : data?.data.length === 0 ? (
								<TableRow>
									<TableCell colSpan={6} className={css(styles.emptyCellWithPadding)}>
										No transactions found matching your filters
									</TableCell>
								</TableRow>
							) : (
								data?.data.map((tx) => {
									const status = getTransactionStatus(tx.error)
									const isEVM = isEVMTransaction(tx.messages)

									return (
										<TableRow key={tx.id} className={css(styles.tableRow)}>
											<TableCell>
												<Link
													to={`/tx/${tx.id}`}
													className={css(styles.txLink)}
												>
													<Activity className={css(styles.activityIcon)} />
													<code className={css(styles.txHashCode)}>{formatHash(tx.id, 10)}</code>
												</Link>
											</TableCell>
											<TableCell>
												<div className={css(styles.typeCell)}>
													{isEVM && (
														<Badge variant="outline" className={css(styles.evmBadge)}>
															EVM
														</Badge>
													)}
													<span className={css(styles.typeText)}>
														{tx.messages.length > 0
															? getMessageTypeLabel(tx.messages[0].type || '')
															: 'Unknown'}
													</span>
													{tx.messages.length > 1 && (
														<Badge variant="secondary" className={css(styles.countBadge)}>
															+{tx.messages.length - 1}
														</Badge>
													)}
												</div>
												{tx.messages.length > 0 && tx.messages[0].data && (
													<div className={css(styles.actionSummary)}>
														{getMessageActionSummary(tx.messages[0] as { type: string; data?: Record<string, unknown> })}
													</div>
												)}
											</TableCell>
											<TableCell>
												{tx.height ? (
													<Link
														to={`/blocks/${tx.height}`}
														className={css(styles.blockLink)}
													>
														{tx.height}
													</Link>
												) : (
													<span className={css(styles.unavailableText)}>-</span>
												)}
											</TableCell>
											<TableCell>
												<div className={css(styles.timeText)}>
													{tx.timestamp ? formatTimeAgo(tx.timestamp) : 'Unavailable'}
												</div>
											</TableCell>
											<TableCell>
												<Badge
													variant={tx.error ? 'destructive' : 'success'}
													className={css(styles.statusBadge)}
												>
													{tx.error ? (
														<X className={css(styles.statusIcon)} />
													) : (
														<Check className={css(styles.statusIcon)} />
													)}
													{status.label}
												</Badge>
											</TableCell>
											<TableCell>
												<div className={css(styles.feeText)}>
													{tx.fee?.amount?.[0]
														? formatNativeFee(tx.fee.amount[0].amount, tx.fee.amount[0].denom)
														: '-'}
												</div>
											</TableCell>
										</TableRow>
									)
								})
							)}
						</TableBody>
					</Table>

					{data && data.pagination.total > 0 && (
						<Pagination
							currentPage={page}
							totalPages={Math.ceil(data.pagination.total / limit)}
							onPageChange={setPage}
							isLoading={isLoading}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	)
}

const styles = {
	container: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1.5rem',
		w: 'full'
	},
	header: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'space-between',
		w: 'full'
	},
	title: {
		fontSize: '1.875rem',
		fontWeight: 'bold'
	},
	filterButton: {
		display: 'flex',
		gap: '0.5rem'
	},
	filterIcon: {
		height: '1rem',
		width: '1rem'
	},
	filterBadge: {
		marginLeft: '0.25rem'
	},
	dialogContent: {
		maxWidth: '42rem',
		maxHeight: '80vh',
		overflowY: 'auto'
	},
	filterContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1.5rem',
		paddingTop: '1rem',
		paddingBottom: '1rem'
	},
	filterSection: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem'
	},
	filterLabel: {
		fontSize: '1rem',
		fontWeight: 'semibold'
	},
	checkboxGroup: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5rem'
	},
	checkboxItem: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem'
	},
	checkboxLabel: {
		fontSize: '0.875rem',
		fontWeight: 'medium',
		lineHeight: '1',
		cursor: 'pointer',
		_peerDisabled: {
			cursor: 'not-allowed',
			opacity: '0.7'
		}
	},
	messageTypeList: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5rem',
		maxHeight: '15rem',
		overflowY: 'auto'
	},
	loadingText: {
		fontSize: '0.875rem',
		color: 'fg.muted'
	},
	blockFilterGroup: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem'
	},
	inputLabel: {
		fontSize: '0.875rem'
	},
	blockRangeGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, 1fr)',
		gap: '0.5rem'
	},
	timeRangeGrid: {
		display: 'grid',
		gridTemplateColumns: 'repeat(2, 1fr)',
		gap: '0.5rem'
	},
	skeletonRow: {
		height: '3rem',
		width: '100%'
	},
	emptyCell: {
		textAlign: 'center',
		color: 'fg.muted'
	},
	emptyCellWithPadding: {
		textAlign: 'center',
		color: 'fg.muted',
		paddingTop: '2rem',
		paddingBottom: '2rem'
	},
	txLink: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		fontWeight: 'medium',
		transition: 'color 0.2s ease',
		_hover: {
			color: 'accent.default'
		}
	},
	activityIcon: {
		height: '1rem',
		width: '1rem'
	},
	txHashCode: {
		fontFamily: 'monospace',
		fontSize: '0.75rem'
	},
	typeCell: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem'
	},
	evmBadge: {
		fontSize: '0.75rem'
	},
	typeText: {
		fontSize: '0.875rem'
	},
	actionSummary: {
		fontSize: '0.75rem',
		color: 'fg.muted',
		mt: '0.5',
		fontFamily: 'mono'
	},
	countBadge: {
		fontSize: '0.75rem'
	},
	blockLink: {
		fontSize: '0.875rem',
		transition: 'color 0.2s ease',
		_hover: {
			color: 'accent.default'
		}
	},
	unavailableText: {
		fontSize: '0.875rem',
		color: 'fg.muted'
	},
	timeText: {
		fontSize: '0.875rem',
		color: 'fg.muted'
	},
	statusBadge: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.25rem',
		width: 'fit-content'
	},
	statusIcon: {
		height: '0.75rem',
		width: '0.75rem'
	},
	feeText: {
		fontFamily: 'monospace',
		fontSize: '0.875rem',
		color: 'fg.muted'
	},
	tableRow: {
		transition: 'background-color 0.2s ease',
		_hover: {
			backgroundColor: 'bg.accentSubtle'
		}
	}
}
