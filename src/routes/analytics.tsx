import { NetworkMetricsCard } from '@/components/analytics/NetworkMetricsCard'
import { BlockIntervalChart } from '@/components/analytics/BlockIntervalChart'
import { TransactionVolumeChart } from '@/components/analytics/TransactionVolumeChart'
import { FeeRevenueChart } from '@/components/analytics/FeeRevenueChart'
import { GasEfficiencyChart } from '@/components/analytics/GasEfficiencyChart'
import { IbcVolumeChart } from '@/components/analytics/IbcVolumeChart'
import { css } from '@/styled-system/css'
import { useFeatureFlags } from '@/contexts/FeatureFlagsContext'

export default function AnalyticsPage() {
  const { ibcEnabled } = useFeatureFlags()

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

      {/* IBC volume chart (when IBC is enabled) */}
      {ibcEnabled && (
        <IbcVolumeChart />
      )}

      {/* Additional charts */}
      <div className={styles.gridTwo}>
        <GasEfficiencyChart />
        <FeeRevenueChart />
      </div>
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
