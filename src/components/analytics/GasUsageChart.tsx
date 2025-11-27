import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ReactECharts from 'echarts-for-react'
import { api } from '@/lib/api'
import { css } from '@/styled-system/css'

async function getGasDistribution(): Promise<{ bins: string[]; counts: number[]; avgGas: number; totalTx: number }> {
  const distribution = await api.getGasUsageDistribution()

  if (!distribution || distribution.length === 0) {
    return { bins: [], counts: [], avgGas: 0, totalTx: 0 }
  }

  const bins = distribution.map(d => d.gas_range)
  const counts = distribution.map(d => d.count)
  const totalTx = counts.reduce((a, b) => a + b, 0)

  // Estimate average gas from distribution midpoints
  const midpoints: Record<string, number> = {
    '0-100k': 50000,
    '100k-250k': 175000,
    '250k-500k': 375000,
    '500k-1M': 750000,
    '1M+': 1500000
  }
  let totalGas = 0
  distribution.forEach(d => {
    totalGas += (midpoints[d.gas_range] || 200000) * d.count
  })
  const avgGas = totalTx > 0 ? Math.round(totalGas / totalTx) : 0

  return { bins, counts, avgGas, totalTx }
}

export function GasUsageChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['gas-distribution'],
    queryFn: getGasDistribution,
    refetchInterval: 30000,
  })

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gas Usage Distribution</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className={styles.skeleton} />
        </CardContent>
      </Card>
    )
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.bins,
      axisLabel: { fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: 'Transactions'
    },
    series: [{
      name: 'Transactions',
      type: 'bar',
      data: data.counts,
      itemStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: '#6366f1' },
            { offset: 1, color: '#8b5cf6' }
          ]
        },
        borderRadius: [4, 4, 0, 0]
      }
    }]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gas Usage Distribution</CardTitle>
        <CardDescription>
          Average: {(data.avgGas / 1000).toFixed(1)}K gas ({data.totalTx} txs)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: '250px' }} />
      </CardContent>
    </Card>
  )
}

const styles = {
  skeleton: css({ h: '64', w: 'full' }),
}
