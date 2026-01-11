import { NetworkMetricsCard } from '@/components/analytics/NetworkMetricsCard'
import { BlockIntervalChart } from '@/components/analytics/BlockIntervalChart'
import { TransactionVolumeChart } from '@/components/analytics/TransactionVolumeChart'
import { DailyActiveAddressesChart } from '@/components/analytics/DailyActiveAddressesChart'
import { IBCActivityChart } from '@/components/analytics/IBCActivityChart'
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

      {/* Activity charts */}
      <div className={styles.gridTwo}>
        <DailyActiveAddressesChart />
        <IBCActivityChart />
      </div>
    </div>
  )
}

const styles = {
  container: css({
    display: 'flex',
    flexDirection: 'column',
    gap: '5',
  }),
  title: css({
    fontSize: '3xl',
    fontWeight: 'bold',
  }),
  gridTwo: css({
    display: 'grid',
    gap: '5',
    gridTemplateColumns: {
      base: '1fr',
      lg: 'repeat(2, 1fr)',
    },
  }),
}
