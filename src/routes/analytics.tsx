import { Activity } from 'lucide-react'
import { NetworkMetricsCard } from '@/components/analytics/NetworkMetricsCard'
import { BlockIntervalChart } from '@/components/analytics/BlockIntervalChart'
import { TransactionVolumeChart } from '@/components/analytics/TransactionVolumeChart'
import { TopMessageTypesCard } from '@/components/analytics/TopMessageTypesCard'

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Network Metrics</h1>
          <p className="text-muted-foreground">
            Real-time blockchain statistics and performance metrics
          </p>
        </div>
      </div>

      {/* Primary metrics card */}
      <NetworkMetricsCard />

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <BlockIntervalChart />
        <TransactionVolumeChart />
      </div>

      {/* Additional metrics */}
      <TopMessageTypesCard />
    </div>
  )
}