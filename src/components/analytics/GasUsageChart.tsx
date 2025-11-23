import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ReactECharts from 'echarts-for-react'
import { api } from '@/lib/api'

interface GasData {
  gasLimit: number
  gasUsed: number
}

async function getGasDistribution(): Promise<{ bins: string[]; counts: number[]; avgGas: number; totalTx: number }> {
  const { data: transactions } = await api.query<any>('transactions_main', {
    select: 'fee',
    limit: 500,
    order: 'height.desc'
  })

  const gasValues = transactions
    .filter((tx: any) => tx.fee?.gasLimit)
    .map((tx: any) => parseInt(tx.fee.gasLimit, 10))

  if (gasValues.length === 0) {
    return { bins: [], counts: [], avgGas: 0, totalTx: 0 }
  }

  // Create histogram bins
  const bins = [
    '0-50K',
    '50K-100K',
    '100K-200K',
    '200K-500K',
    '500K-1M',
    '1M+'
  ]

  const counts = [0, 0, 0, 0, 0, 0]

  gasValues.forEach((gas: number) => {
    if (gas < 50000) counts[0]++
    else if (gas < 100000) counts[1]++
    else if (gas < 200000) counts[2]++
    else if (gas < 500000) counts[3]++
    else if (gas < 1000000) counts[4]++
    else counts[5]++
  })

  const avgGas = Math.round(gasValues.reduce((a: number, b: number) => a + b, 0) / gasValues.length)

  return { bins, counts, avgGas, totalTx: gasValues.length }
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
          <Skeleton className="h-64 w-full" />
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
