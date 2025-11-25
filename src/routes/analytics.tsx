import { Activity } from 'lucide-react'
import { NetworkMetricsCard } from '@/components/analytics/NetworkMetricsCard'
import { BlockIntervalChart } from '@/components/analytics/BlockIntervalChart'
import { TransactionVolumeChart } from '@/components/analytics/TransactionVolumeChart'
import { TopMessageTypesCard } from '@/components/analytics/TopMessageTypesCard'
import { DashboardMetrics } from '@/components/common/DashboardMetrics'
import { css } from '../../styled-system/css'

export default function AnalyticsPage() {
  return (
    <div className={styles.page}>
      <div className={styles.headerRow}>
        <Activity className={styles.iconLg} />
        <div>
          <h1 className={styles.title}>Network Metrics</h1>
          <p className={styles.subtitle}>
            Real-time blockchain statistics and performance metrics
          </p>
        </div>
      </div>

      {/* Key metrics from dashboard */}
      <DashboardMetrics />

      {/* Primary metrics card */}
      <NetworkMetricsCard />

      {/* Charts grid */}
      <div className={styles.chartGrid}>
        <BlockIntervalChart />
        <TransactionVolumeChart />
      </div>

      {/* Additional metrics */}
      <TopMessageTypesCard />
    </div>
  )
}

const styles = {
  page: css({ display: 'flex', flexDirection: 'column', gap: '6' }),
  headerRow: css({ display: 'flex', alignItems: 'center', gap: '3' }),
  iconLg: css({ h: '8', w: '8', color: 'colorPalette.default' }),
  title: css({ fontSize: '3xl', fontWeight: 'bold' }),
  subtitle: css({ color: 'fg.muted' }),
  chartGrid: css({
    display: 'grid',
    gap: '6',
    gridTemplateColumns: { base: '1fr', lg: 'repeat(2, minmax(0, 1fr))' },
  }),
}
