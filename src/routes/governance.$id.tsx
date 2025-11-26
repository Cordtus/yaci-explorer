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
			<div className={styles.container}>
				<Link to="/governance" className={styles.backLink}>
					<ArrowLeft className={styles.iconSm} />
					Back to Governance
				</Link>
				<Card>
					<CardContent className={styles.cardContentPadded}>
						<div className={styles.errorContainer}>
							<Vote className={styles.errorIcon} />
							<h2 className={styles.errorTitle}>Proposal Not Found</h2>
							<p className={styles.errorDescription}>
								The requested governance proposal could not be found.
							</p>
							<p className={styles.errorMessage}>{String(error)}</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!mounted || proposalLoading) {
		return (
			<div className={styles.container}>
				<Skeleton className={styles.skeletonHeader} />
				<Skeleton className={styles.skeletonMedium} />
				<Skeleton className={styles.skeletonLarge} />
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
		<div className={styles.pageContainer}>
			{/* Header */}
			<div>
				<Link to="/governance" className={styles.backLinkWithMargin}>
					<ArrowLeft className={styles.iconSm} />
					Back to Governance
				</Link>
				<div className={styles.titleContainer}>
					<h1 className={styles.pageTitle}>Proposal #{proposalId}</h1>
					<Badge variant={getStatusBadgeVariant(proposal.status)}>
						{formatStatusLabel(proposal.status)}
					</Badge>
				</div>
				{proposal.title && (
					<h2 className={styles.subtitle}>{proposal.title}</h2>
				)}
			</div>

			<div className={styles.gridLayout}>
				{/* Main Content */}
				<div className={styles.mainContent}>
					{/* Summary */}
					{proposal.summary && (
						<Card>
							<CardHeader>
								<CardTitle>Summary</CardTitle>
							</CardHeader>
							<CardContent>
								<p className={styles.summaryText}>{proposal.summary}</p>
							</CardContent>
						</Card>
					)}

					{/* Vote Tally */}
					<Card>
						<CardHeader>
							<CardTitle className={styles.voteTallyTitle}>
								<Vote className={styles.iconMd} />
								Vote Tally
							</CardTitle>
							<CardDescription>
								{totalVotes > 0 ? `${totalVotes.toLocaleString()} total votes` : 'No votes yet'}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<div className={styles.votesContainer}>
								{/* Yes */}
								<div>
									<div className={styles.voteHeader}>
										<span className={styles.voteLabel}>Yes</span>
										<span className={styles.votePercent}>
											{yesPercent.toFixed(2)}% ({yesCount.toLocaleString()})
										</span>
									</div>
									<div className={styles.progressBar}>
										<div
											className={styles.progressYes}
											style={{ width: `${yesPercent}%` }}
										/>
									</div>
								</div>

								{/* No */}
								<div>
									<div className={styles.voteHeader}>
										<span className={styles.voteLabel}>No</span>
										<span className={styles.votePercent}>
											{noPercent.toFixed(2)}% ({noCount.toLocaleString()})
										</span>
									</div>
									<div className={styles.progressBar}>
										<div
											className={styles.progressNo}
											style={{ width: `${noPercent}%` }}
										/>
									</div>
								</div>

								{/* Abstain */}
								<div>
									<div className={styles.voteHeader}>
										<span className={styles.voteLabel}>Abstain</span>
										<span className={styles.votePercent}>
											{abstainPercent.toFixed(2)}% ({abstainCount.toLocaleString()})
										</span>
									</div>
									<div className={styles.progressBar}>
										<div
											className={styles.progressAbstain}
											style={{ width: `${abstainPercent}%` }}
										/>
									</div>
								</div>

								{/* No with Veto */}
								<div>
									<div className={styles.voteHeader}>
										<span className={styles.voteLabel}>No with Veto</span>
										<span className={styles.votePercent}>
											{noWithVetoPercent.toFixed(2)}% ({noWithVetoCount.toLocaleString()})
										</span>
									</div>
									<div className={styles.progressBar}>
										<div
											className={styles.progressVeto}
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
									<div className={styles.snapshotsLoading}>
										{Array.from({ length: 3 }).map((_, i) => (
											<Skeleton key={i} className={styles.snapshotSkeleton} />
										))}
									</div>
								) : (
									<div className={styles.tableWrapper}>
										<Table>
											<TableHeader>
												<TableRow>
													<TableHead>Timestamp</TableHead>
													<TableHead>Status</TableHead>
													<TableHead className={styles.textRight}>Yes</TableHead>
													<TableHead className={styles.textRight}>No</TableHead>
													<TableHead className={styles.textRight}>Abstain</TableHead>
													<TableHead className={styles.textRight}>No w/ Veto</TableHead>
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
															<TableCell className={styles.timestampCell}>
																{formatTimestamp(snapshot.snapshot_time)}
															</TableCell>
															<TableCell>
																<Badge variant="outline" className={styles.badgeXs}>
																	{formatStatusLabel(snapshot.status)}
																</Badge>
															</TableCell>
															<TableCell className={styles.numberCell}>
																{yes.toLocaleString()}
															</TableCell>
															<TableCell className={styles.numberCell}>
																{no.toLocaleString()}
															</TableCell>
															<TableCell className={styles.numberCell}>
																{abstain.toLocaleString()}
															</TableCell>
															<TableCell className={styles.numberCell}>
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
				<div className={styles.sidebarContainer}>
					{/* Timeline */}
					<Card>
						<CardHeader>
							<CardTitle className={styles.sidebarTitle}>
								<Clock className={styles.iconMd} />
								Timeline
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className={styles.timelineContainer}>
								<div>
									<label className={styles.timelineLabel}>Submit Time</label>
									<p className={styles.timelineValue}>{formatTimestamp(proposal.submit_time)}</p>
								</div>

								<Separator />

								{proposal.deposit_end_time && (
									<>
										<div>
											<label className={styles.timelineLabel}>Deposit End Time</label>
											<p className={styles.timelineValue}>{formatTimestamp(proposal.deposit_end_time)}</p>
										</div>
										<Separator />
									</>
								)}

								{proposal.voting_start_time && (
									<>
										<div>
											<label className={styles.timelineLabel}>Voting Start Time</label>
											<p className={styles.timelineValue}>{formatTimestamp(proposal.voting_start_time)}</p>
										</div>
										<Separator />
									</>
								)}

								{proposal.voting_end_time && (
									<div>
										<label className={styles.timelineLabel}>Voting End Time</label>
										<p className={styles.timelineValue}>{formatTimestamp(proposal.voting_end_time)}</p>
									</div>
								)}
							</div>
						</CardContent>
					</Card>

					{/* Proposer */}
					{proposal.proposer && (
						<Card>
							<CardHeader>
								<CardTitle className={styles.sidebarTitle}>
									<User className={styles.iconMd} />
									Proposer
								</CardTitle>
							</CardHeader>
							<CardContent>
								<Link
									to={`/addr/${proposal.proposer}`}
									className={styles.proposerLink}
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
							<div className={styles.detailsContainer}>
								<div className={styles.detailRow}>
									<span className={styles.detailLabel}>Proposal ID</span>
									<span className={styles.detailValue}>#{proposalId}</span>
								</div>
								<div className={styles.detailRow}>
									<span className={styles.detailLabel}>Status</span>
									<Badge variant={getStatusBadgeVariant(proposal.status)} className={styles.badgeXs}>
										{formatStatusLabel(proposal.status)}
									</Badge>
								</div>
								<div className={styles.detailRow}>
									<span className={styles.detailLabel}>Last Updated</span>
									<span className={styles.timelineValue}>{formatTimestamp(proposal.last_updated)}</span>
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
	container: css({
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem',
	}),
	backLink: css({
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		color: 'fg.muted',
		_hover: {
			color: 'fg.default',
		},
	}),
	iconSm: css({
		height: '1rem',
		width: '1rem',
	}),
	cardContentPadded: css({
		paddingTop: '1.5rem',
	}),
	errorContainer: css({
		textAlign: 'center',
		paddingTop: '3rem',
		paddingBottom: '3rem',
	}),
	errorIcon: css({
		height: '3rem',
		width: '3rem',
		color: 'red.500',
		marginLeft: 'auto',
		marginRight: 'auto',
		marginBottom: '1rem',
	}),
	errorTitle: css({
		fontSize: '1.5rem',
		fontWeight: 'bold',
		color: 'red.600',
		marginBottom: '0.5rem',
	}),
	errorDescription: css({
		color: 'fg.muted',
		marginBottom: '1rem',
	}),
	errorMessage: css({
		fontSize: 'sm',
		color: 'red.500',
	}),
	skeletonHeader: css({
		height: '2rem',
		width: '12rem',
	}),
	skeletonMedium: css({
		height: '16rem',
		width: '100%',
	}),
	skeletonLarge: css({
		height: '24rem',
		width: '100%',
	}),
	pageContainer: css({
		display: 'flex',
		flexDirection: 'column',
		gap: '1.5rem',
	}),
	backLinkWithMargin: css({
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
		color: 'fg.muted',
		marginBottom: '1rem',
		_hover: {
			color: 'fg.default',
		},
	}),
	titleContainer: css({
		display: 'flex',
		alignItems: 'center',
		gap: '0.75rem',
		marginBottom: '0.5rem',
	}),
	pageTitle: css({
		fontSize: '1.875rem',
		fontWeight: 'bold',
	}),
	subtitle: css({
		fontSize: '1.25rem',
		color: 'fg.muted',
	}),
	gridLayout: css({
		display: 'grid',
		gap: '1.5rem',
		lg: {
			gridTemplateColumns: '3',
		},
	}),
	mainContent: css({
		display: 'flex',
		flexDirection: 'column',
		gap: '1.5rem',
		lg: {
			gridColumn: 'span 2',
		},
	}),
	summaryText: css({
		fontSize: 'sm',
		whiteSpace: 'pre-wrap',
	}),
	voteTallyTitle: css({
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	}),
	iconMd: css({
		height: '1.25rem',
		width: '1.25rem',
	}),
	votesContainer: css({
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem',
	}),
	voteHeader: css({
		display: 'flex',
		justifyContent: 'space-between',
		marginBottom: '0.5rem',
	}),
	voteLabel: css({
		fontSize: 'sm',
		fontWeight: 'medium',
	}),
	votePercent: css({
		fontSize: 'sm',
		color: 'fg.muted',
	}),
	progressBar: css({
		width: '100%',
		height: '1rem',
		backgroundColor: 'bg.muted',
		borderRadius: 'full',
		overflow: 'hidden',
	}),
	progressYes: css({
		height: '100%',
		backgroundColor: 'green.500',
		transition: 'all',
		transitionDuration: '300ms',
	}),
	progressNo: css({
		height: '100%',
		backgroundColor: 'red.500',
		transition: 'all',
		transitionDuration: '300ms',
	}),
	progressAbstain: css({
		height: '100%',
		backgroundColor: 'gray.400',
		transition: 'all',
		transitionDuration: '300ms',
	}),
	progressVeto: css({
		height: '100%',
		backgroundColor: 'orange.500',
		transition: 'all',
		transitionDuration: '300ms',
	}),
	snapshotsLoading: css({
		display: 'flex',
		flexDirection: 'column',
		gap: '0.5rem',
	}),
	snapshotSkeleton: css({
		height: '3rem',
		width: '100%',
	}),
	tableWrapper: css({
		overflowX: 'auto',
	}),
	textRight: css({
		textAlign: 'right',
	}),
	timestampCell: css({
		fontFamily: 'mono',
		fontSize: 'xs',
	}),
	badgeXs: css({
		fontSize: 'xs',
	}),
	numberCell: css({
		textAlign: 'right',
		fontSize: 'sm',
	}),
	sidebarContainer: css({
		display: 'flex',
		flexDirection: 'column',
		gap: '1.5rem',
	}),
	sidebarTitle: css({
		display: 'flex',
		alignItems: 'center',
		gap: '0.5rem',
	}),
	timelineContainer: css({
		display: 'flex',
		flexDirection: 'column',
		gap: '1rem',
	}),
	timelineLabel: css({
		fontSize: 'sm',
		fontWeight: 'medium',
		color: 'fg.muted',
	}),
	timelineValue: css({
		fontSize: 'sm',
	}),
	proposerLink: css({
		fontFamily: 'mono',
		fontSize: 'sm',
		color: 'colorPalette.text',
		wordBreak: 'break-all',
		_hover: {
			color: 'colorPalette.text',
			opacity: 0.8,
		},
	}),
	detailsContainer: css({
		display: 'flex',
		flexDirection: 'column',
		gap: '0.75rem',
	}),
	detailRow: css({
		display: 'flex',
		justifyContent: 'space-between',
	}),
	detailLabel: css({
		color: 'fg.muted',
	}),
	detailValue: css({
		fontWeight: 'medium',
	}),
}
