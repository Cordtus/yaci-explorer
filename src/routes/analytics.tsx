import { NetworkMetricsCard } from '@/components/analytics/NetworkMetricsCard'
import { BlockIntervalChart } from '@/components/analytics/BlockIntervalChart'
import { TransactionVolumeChart } from '@/components/analytics/TransactionVolumeChart'
import { TxTypeBreakdown } from '@/components/analytics/TxTypeBreakdown'
import { css } from '@/styled-system/css'

export default function AnalyticsPage() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Network Analytics</h1>

      {/* Primary metrics card */}
      <NetworkMetricsCard />

      {/* Time series charts */}
      <div className={styles.gridTwo}>
        <TransactionVolumeChart />
        <BlockIntervalChart />
      </div>

      {/* Transaction type breakdown */}
      <TxTypeBreakdown />
    </div>
  )
}

const styles = {
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '6',
  }),
  title: css({
    fontSize: '3xl',
    fontWeight: 'bold',
  }),
  gridTwo: css({
    display: 'grid',
    gap: '6',
    gridTemplateColumns: {
      base: '1fr',
      lg: 'repeat(2, 1fr)',
    },
  }),
}
