import { useParams } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router'
import { Vote, Clock, User, ArrowLeft } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { api } from '@/lib/api'
import { formatTimestamp, formatAddress } from '@/lib/utils'
import { useEffect, useState } from 'react'
import { css } from '@/styled-system/css'

function getStatusBadgeVariant(status: string): 'default' | 'secondary' | 'destructive' | 'success' | 'outline' {
	if (status.includes('PASSED') || status.includes('VOTING_PERIOD')) {
		return 'success'
	}
	if (status.includes('REJECTED') || status.includes('FAILED')) {
		return 'destructive'
	}
	if (status.includes('DEPOSIT_PERIOD')) {
		return 'secondary'
	}
	return 'outline'
}

function formatStatusLabel(status: string): string {
	return status.replace('PROPOSAL_STATUS_', '').replace(/_/g, ' ')
}

export default function GovernanceProposalDetailPage() {
	const [mounted, setMounted] = useState(false)
	const params = useParams()
	const proposalId = parseInt(params.id!)

	useEffect(() => {
		setMounted(true)
	}, [])

	const { data: proposal, isLoading: proposalLoading, error } = useQuery({
		queryKey: ['proposal', proposalId],
		queryFn: async () => {
			const result = await api.getProposalDetail(proposalId)
			return result
		},
		enabled: mounted && !isNaN(proposalId),
	})

	const { data: snapshots, isLoading: snapshotsLoading } = useQuery({
		queryKey: ['proposalSnapshots', proposalId],
		queryFn: async () => {
			const result = await api.getProposalSnapshots(proposalId)
			return result
		},
		enabled: mounted && !isNaN(proposalId),
	})

	if (mounted && error) {
		return (
			<div className={css(styles.container)}>
				<Link to="/governance" className={css(styles.backLink)}>
					<ArrowLeft className={css(styles.backIcon)} />
					Back to Governance
				</Link>
				<Card>
					<CardContent className={css(styles.cardContentPadding)}>
						<div className={css(styles.errorContainer)}>
							<Vote className={css(styles.errorIcon)} />
							<h2 className={css(styles.errorTitle)}>Proposal Not Found</h2>
							<p className={css(styles.errorText)}>
								The requested governance proposal could not be found.
							</p>
							<p className={css(styles.errorDetail)}>{String(error)}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!mounted || proposalLoading) {
		return (
			<div className={css(styles.container)}>
				<Skeleton className={css(styles.skeletonHeader)} />
				<Skeleton className={css(styles.skeletonContent)} />
				<Skeleton className={css(styles.skeletonLarge)} />
			</div>
		)
	}

	if (!proposal) {
		return null
	}

	const yesCount = parseFloat(proposal.tally.yes || '0')
	const noCount = parseFloat(proposal.tally.no || '0')
	const abstainCount = parseFloat(proposal.tally.abstain || '0')
	const noWithVetoCount = parseFloat(proposal.tally.no_with_veto || '0')
	const totalVotes = yesCount + noCount + abstainCount + noWithVetoCount

	const yesPercent = totalVotes > 0 ? (yesCount / totalVotes) * 100 : 0
	const noPercent = totalVotes > 0 ? (noCount / totalVotes) * 100 : 0
	const abstainPercent = totalVotes > 0 ? (abstainCount / totalVotes) * 100 : 0
	const noWithVetoPercent = totalVotes > 0 ? (noWithVetoCount / totalVotes) * 100 : 0

	return (
		<div className={css(styles.container)}>
			{/* Header */}
			<div>
				<Link to="/governance" className={css(styles.backLinkHeader)}>
					<ArrowLeft className={css(styles.backIcon)} />
					Back to Governance
				</Link>
				<div className={css(styles.headerRow)}>
					<h1 className={css(styles.pageTitle)}>Proposal #{proposalId}</h1>
					<Badge variant={getStatusBadgeVariant(proposal.status)}>
						{formatStatusLabel(proposal.status)}
					</Badge>
				</div>
				{proposal.title && (
					<h2 className={css(styles.proposalTitle)}>{proposal.title}</h2>
				)}
			</div>

			<div className={css(styles.gridLayout)}>
				{/* Main Content */}
				<div className={css(styles.mainContent)}>
					{/* Summary */}
					{proposal.summary && (
						<Card>
							<CardHeader>
								<CardTitle>Summary</CardTitle>
							</CardHeader>
							<CardContent>
								<p className={css(styles.summaryText)}>{proposal.summary}</p>
							</CardContent>
						</Card>
					)}

					{/* Vote Tally */}
					<Card>
						<CardHeader>
							<CardTitle className={css(styles.tallyHeader)}>
								<Vote className={css(styles.tallyIcon)} />
								Vote Tally
							</CardTitle>
							<CardDescription>
								{totalVotes > 0 ? `${totalVotes.toLocaleString()} total votes` : 'No votes yet'}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className={css(styles.tallyContainer)}>
								{/* Yes */}
								<div>
									<div className={css(styles.tallyRow)}>
										<span className={css(styles.tallyLabel)}>Yes</span>
										<span className={css(styles.tallyValue)}>
											{yesPercent.toFixed(2)}% ({yesCount.toLocaleString()})
										</span>
									</div>
									<div className={css(styles.progressBar)}>
										<div
											className={css(styles.progressBarYes)}
											style={{ width: `${yesPercent}%` }}
										/>
									</div>
								</div>

								{/* No */}
								<div>
									<div className={css(styles.tallyRow)}>
										<span className={css(styles.tallyLabel)}>No</span>
										<span className={css(styles.tallyValue)}>
											{noPercent.toFixed(2)}% ({noCount.toLocaleString()})
										</span>
									</div>
									<div className={css(styles.progressBar)}>
										<div
											className={css(styles.progressBarNo)}
											style={{ width: `${noPercent}%` }}
										/>
									</div>
								</div>

								{/* Abstain */}
								<div>
									<div className={css(styles.tallyRow)}>
										<span className={css(styles.tallyLabel)}>Abstain</span>
										<span className={css(styles.tallyValue)}>
											{abstainPercent.toFixed(2)}% ({abstainCount.toLocaleString()})
										</span>
									</div>
									<div className={css(styles.progressBar)}>
										<div
											className={css(styles.progressBarAbstain)}
											style={{ width: `${abstainPercent}%` }}
										/>
									</div>
								</div>

								{/* No with Veto */}
								<div>
									<div className={css(styles.tallyRow)}>
										<span className={css(styles.tallyLabel)}>No with Veto</span>
										<span className={css(styles.tallyValue)}>
											{noWithVetoPercent.toFixed(2)}% ({noWithVetoCount.toLocaleString()})
										</span>
									</div>
									<div className={css(styles.progressBar)}>
										<div
											className={css(styles.progressBarVeto)}
											style={{ width: `${noWithVetoPercent}%` }}
										/>
									</div>
								</div>
							</div>
						</CardContent>
					</Card>

					{/* Historical Snapshots */}
					{snapshots && snapshots.length > 0 && (
						<Card>
							<CardHeader>
								<CardTitle>Historical Snapshots</CardTitle>
								<CardDescription>
									Vote tally captured at different points in time
								</CardDescription>
							</CardHeader>
							<CardContent>
								{snapshotsLoading ? (
									<div className={css(styles.snapshotLoading)}>
										{Array.from({ length: 3 }).map((_, i) => (
											<Skeleton key={i} className={css(styles.skeletonSnapshot)} />
										))}
									</div>
								) : (
									<div className={css(styles.tableOverflow)}>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Timestamp</TableHead>
													<TableHead>Status</TableHead>
													<TableHead className={css(styles.textRight)}>Yes</TableHead>
													<TableHead className={css(styles.textRight)}>No</TableHead>
													<TableHead className={css(styles.textRight)}>Abstain</TableHead>
													<TableHead className={css(styles.textRight)}>No w/ Veto</TableHead>
												</TableRow>
											</TableHeader>
											<TableBody>
												{snapshots.map((snapshot, idx) => {
													const yes = parseFloat(snapshot.yes_count)
													const no = parseFloat(snapshot.no_count)
													const abstain = parseFloat(snapshot.abstain_count)
													const veto = parseFloat(snapshot.no_with_veto_count)

													return (
														<TableRow key={idx}>
															<TableCell className={css(styles.timestampCell)}>
																{formatTimestamp(snapshot.snapshot_time)}
															</TableCell>
															<TableCell>
																<Badge variant="outline" className={css(styles.statusBadge)}>
																	{formatStatusLabel(snapshot.status)}
																</Badge>
															</TableCell>
															<TableCell className={css(styles.numberCell)}>
																{yes.toLocaleString()}
															</TableCell>
															<TableCell className={css(styles.numberCell)}>
																{no.toLocaleString()}
															</TableCell>
															<TableCell className={css(styles.numberCell)}>
																{abstain.toLocaleString()}
															</TableCell>
															<TableCell className={css(styles.numberCell)}>
																{veto.toLocaleString()}
															</TableCell>
														</TableRow>
													)
												})}
											</TableBody>
										</Table>
									</div>
								)}
							</CardContent>
						</Card>
					)}
				</div>

				{/* Sidebar */}
				<div className={css(styles.sidebar)}>
					{/* Timeline */}
					<Card>
						<CardHeader>
							<CardTitle className={css(styles.sidebarHeader)}>
								<Clock className={css(styles.sidebarIcon)} />
								Timeline
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className={css(styles.timelineContainer)}>
								<div>
									<label className={css(styles.timelineLabel)}>Submit Time</label>
									<p className={css(styles.timelineValue)}>{formatTimestamp(proposal.submit_time)}</p>
								</div>

								<Separator />

								{proposal.deposit_end_time && (
									<>
										<div>
											<label className={css(styles.timelineLabel)}>Deposit End Time</label>
											<p className={css(styles.timelineValue)}>{formatTimestamp(proposal.deposit_end_time)}</p>
										</div>
										<Separator />
									</>
								)}

								{proposal.voting_start_time && (
									<>
										<div>
											<label className={css(styles.timelineLabel)}>Voting Start Time</label>
											<p className={css(styles.timelineValue)}>{formatTimestamp(proposal.voting_start_time)}</p>
										</div>
										<Separator />
									</>
								)}

								{proposal.voting_end_time && (
									<div>
										<label className={css(styles.timelineLabel)}>Voting End Time</label>
										<p className={css(styles.timelineValue)}>{formatTimestamp(proposal.voting_end_time)}</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Proposer */}
					{proposal.proposer && (
						<Card>
							<CardHeader>
								<CardTitle className={css(styles.sidebarHeader)}>
									<User className={css(styles.sidebarIcon)} />
									Proposer
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Link
									to={`/addr/${proposal.proposer}`}
									className={css(styles.proposerLink)}
								>
									{formatAddress(proposal.proposer, 12)}
								</Link>
							</CardContent>
						</Card>
					)}

					{/* Metadata */}
					<Card>
						<CardHeader>
							<CardTitle>Details</CardTitle>
						</CardHeader>
						<CardContent>
							<div className={css(styles.detailsContainer)}>
								<div className={css(styles.detailRow)}>
									<span className={css(styles.detailLabel)}>Proposal ID</span>
									<span className={css(styles.detailValue)}>#{proposalId}</span>
								</div>
								<div className={css(styles.detailRow)}>
									<span className={css(styles.detailLabel)}>Status</span>
									<Badge variant={getStatusBadgeVariant(proposal.status)} className={css(styles.statusBadge)}>
										{formatStatusLabel(proposal.status)}
									</Badge>
								</div>
								<div className={css(styles.detailRow)}>
									<span className={css(styles.detailLabel)}>Last Updated</span>
									<span className={css(styles.detailValueSmall)}>{formatTimestamp(proposal.last_updated)}</span>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}

const styles = {
	container: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1.5rem'
	},
	backLink: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		color: 'fg.muted',
		_hover: { color: 'fg.default' }
	},
	backLinkHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		color: 'fg.muted',
		marginBottom: '1rem',
		_hover: { color: 'fg.default' }
	},
	backIcon: {
		height: '1rem',
		width: '1rem'
	},
	cardContentPadding: {
		paddingTop: '1.5rem'
	},
	errorContainer: {
		textAlign: 'center',
		paddingTop: '3rem',
		paddingBottom: '3rem'
	},
	errorIcon: {
		height: '3rem',
		width: '3rem',
		color: 'red.500',
		margin: '0 auto',
		marginBottom: '1rem'
	},
	errorTitle: {
		fontSize: '1.5rem',
		fontWeight: 'bold',
		color: 'red.600',
		marginBottom: '0.5rem'
	},
	errorText: {
		color: 'fg.muted',
		marginBottom: '1rem'
	},
	errorDetail: {
		fontSize: '0.875rem',
		color: 'red.500'
	},
	skeletonHeader: {
		height: '2rem',
		width: '12rem'
	},
	skeletonContent: {
		height: '16rem',
		width: '100%'
	},
	skeletonLarge: {
		height: '24rem',
		width: '100%'
	},
	headerRow: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		marginBottom: '0.5rem'
	},
	pageTitle: {
		fontSize: '1.875rem',
		fontWeight: 'bold'
	},
	proposalTitle: {
		fontSize: '1.25rem',
		color: 'fg.muted'
	},
	gridLayout: {
		display: 'grid',
		gap: '1.5rem',
		lg: { gridTemplateColumns: '2fr 1fr' }
	},
	mainContent: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1.5rem'
	},
	summaryText: {
		fontSize: '0.875rem',
		whiteSpace: 'pre-wrap'
	},
	tallyHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem'
	},
	tallyIcon: {
		height: '1.25rem',
		width: '1.25rem'
	},
	tallyContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem'
	},
	tallyRow: {
		display: 'flex',
		justifyContent: 'space-between',
		marginBottom: '0.5rem'
	},
	tallyLabel: {
		fontSize: '0.875rem',
		fontWeight: 'medium'
	},
	tallyValue: {
		fontSize: '0.875rem',
		color: 'fg.muted'
	},
	progressBar: {
		width: '100%',
		height: '1rem',
		backgroundColor: 'bg.muted',
		borderRadius: '9999px',
		overflow: 'hidden'
	},
	progressBarYes: {
		height: '100%',
		backgroundColor: 'green.500',
		transition: 'width 0.3s'
	},
	progressBarNo: {
		height: '100%',
		backgroundColor: 'red.500',
		transition: 'width 0.3s'
	},
	progressBarAbstain: {
		height: '100%',
		backgroundColor: 'gray.400',
		transition: 'width 0.3s'
	},
	progressBarVeto: {
		height: '100%',
		backgroundColor: 'orange.500',
		transition: 'width 0.3s'
	},
	snapshotLoading: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5rem'
	},
	skeletonSnapshot: {
		height: '3rem',
		width: '100%'
	},
	tableOverflow: {
		overflowX: 'auto'
	},
	textRight: {
		textAlign: 'right'
	},
	timestampCell: {
		fontFamily: 'mono',
		fontSize: '0.75rem'
	},
	statusBadge: {
		fontSize: '0.75rem'
	},
	numberCell: {
		textAlign: 'right',
		fontSize: '0.875rem'
	},
	sidebar: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1.5rem'
	},
	sidebarHeader: {
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem'
	},
	sidebarIcon: {
		height: '1.25rem',
		width: '1.25rem'
	},
	timelineContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem'
	},
	timelineLabel: {
		fontSize: '0.875rem',
		fontWeight: 'medium',
		color: 'fg.muted'
	},
	timelineValue: {
		fontSize: '0.875rem'
	},
	proposerLink: {
		fontFamily: 'mono',
		fontSize: '0.875rem',
		color: 'accent.default',
		wordBreak: 'break-all',
		_hover: { opacity: 0.8 }
	},
	detailsContainer: {
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem'
	},
	detailRow: {
		display: 'flex',
		justifyContent: 'space-between'
	},
	detailLabel: {
		color: 'fg.muted'
	},
	detailValue: {
		fontWeight: 'medium'
	},
	detailValueSmall: {
		fontSize: '0.875rem'
	}
}
