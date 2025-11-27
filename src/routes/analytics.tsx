import { NetworkMetricsCard } from '@/components/analytics/NetworkMetricsCard'
import { CosmosIcon } from '@/components/icons/icons'
import { BlockIntervalChart } from '@/components/analytics/BlockIntervalChart'
import { TransactionVolumeChart } from '@/components/analytics/TransactionVolumeChart'
import { TopMessageTypesCard } from '@/components/analytics/TopMessageTypesCard'
import { TopEventTypesCard } from '@/components/analytics/TopEventTypesCard'
import { GasUsageChart } from '@/components/analytics/GasUsageChart'
import { TxTypeBreakdown } from '@/components/analytics/TxTypeBreakdown'
import { ActiveAddressesChart } from '@/components/analytics/ActiveAddressesChart'
import { css } from '@/styled-system/css'

export default function AnalyticsPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <CosmosIcon className={styles.icon} />
        <div>
          <h1 className={styles.title}>Network Analytics</h1>
        </div>
      </div>

      {/* Primary metrics card */}
      <NetworkMetricsCard />

      {/* Time series charts */}
      <div className={styles.gridTwo}>
        <TransactionVolumeChart />
        <BlockIntervalChart />
      </div>

      {/* Distribution charts */}
      <div className={styles.gridThree}>
        <TxTypeBreakdown />
        <GasUsageChart />
        <ActiveAddressesChart />
      </div>

      {/* Breakdown tables */}
      <div className={styles.gridTwo}>
        <TopMessageTypesCard />
        <TopEventTypesCard />
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
  header: css({
    display: 'flex',
    alignItems: 'center',
    gap: '3',
  }),
  icon: css({
    height: '8',
    width: '8',
    color: 'colorPalette.fg',
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
  gridThree: css({
    display: 'grid',
    gap: '6',
    gridTemplateColumns: {
      base: '1fr',
      lg: 'repeat(3, 1fr)',
    },
  }),
}
