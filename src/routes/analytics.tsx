import { Activity } from 'lucide-react'
import { NetworkMetricsCard } from '@/components/analytics/NetworkMetricsCard'
import { BlockIntervalChart } from '@/components/analytics/BlockIntervalChart'
import { TransactionVolumeChart } from '@/components/analytics/TransactionVolumeChart'
import { TopMessageTypesCard } from '@/components/analytics/TopMessageTypesCard'
import { TopEventTypesCard } from '@/components/analytics/TopEventTypesCard'
import { GasUsageChart } from '@/components/analytics/GasUsageChart'
import { TxTypeBreakdown } from '@/components/analytics/TxTypeBreakdown'
import { ActiveAddressesChart } from '@/components/analytics/ActiveAddressesChart'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Network Analytics</h1>
        </div>
      </div>

      {/* Primary metrics card */}
      <NetworkMetricsCard />

      {/* Time series charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TransactionVolumeChart />
        <BlockIntervalChart />
      </div>

      {/* Distribution charts */}
      <div className="grid gap-6 lg:grid-cols-3">
        <TxTypeBreakdown />
        <GasUsageChart />
        <ActiveAddressesChart />
      </div>

      {/* Breakdown tables */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TopMessageTypesCard />
        <TopEventTypesCard />
      </div>
    </div>
  )
}
