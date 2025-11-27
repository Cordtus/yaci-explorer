import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api'
import { css } from '@/styled-system/css'

export function ActiveAddressesChart() {
	const { data: stats, isLoading } = useQuery({
		queryKey: ['chain-stats'],
		queryFn: () => api.getChainStats(),
		refetchInterval: 30000,
	})

	if (isLoading || !stats) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>Active Addresses</CardTitle>
					<CardDescription>Loading...</CardDescription>
				</CardHeader>
				<CardContent>
					<Skeleton className={styles.skeleton} />
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Unique Addresses</CardTitle>
				<CardDescription>
					Total unique addresses that have interacted with the chain
				</CardDescription>
			</CardHeader>
			<CardContent>
				<div className={styles.statsContainer}>
					<div className={styles.statItem}>
						<span className={styles.statValue}>{stats.unique_addresses.toLocaleString()}</span>
						<span className={styles.statLabel}>Unique Addresses</span>
					</div>
					<div className={styles.statItem}>
						<span className={styles.statValue}>{stats.total_transactions.toLocaleString()}</span>
						<span className={styles.statLabel}>Total Transactions</span>
					</div>
					<div className={styles.statItem}>
						<span className={styles.statValue}>{stats.active_validators}</span>
						<span className={styles.statLabel}>Active Validators</span>
					</div>
				</div>
			</CardContent>
		</Card>
	)
}

const styles = {
	skeleton: css({ h: '64', w: 'full' }),
	statsContainer: css({
		display: 'grid',
		gridTemplateColumns: 'repeat(3, 1fr)',
		gap: '4',
		py: '4',
	}),
	statItem: css({
		display: 'flex',
		flexDir: 'column',
		alignItems: 'center',
		gap: '1',
	}),
	statValue: css({
		fontSize: '2xl',
		fontWeight: 'bold',
		color: 'fg.default',
	}),
	statLabel: css({
		fontSize: 'sm',
		color: 'fg.muted',
	}),
}
