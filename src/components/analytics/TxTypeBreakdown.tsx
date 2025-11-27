import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ReactECharts from 'echarts-for-react'
import { api } from '@/lib/api'
import { css } from '@/styled-system/css'

interface TxBreakdown {
  evm: number
  cosmos: number
  total: number
}

async function getTxTypeBreakdown(): Promise<TxBreakdown> {
  const stats = await api.getMessageTypeStats()

  if (!stats || stats.length === 0) {
    return { evm: 0, cosmos: 0, total: 0 }
  }

  let evm = 0
  let cosmos = 0

  stats.forEach((stat) => {
    if (stat.type?.includes('MsgEthereumTx') || stat.type?.includes('evm')) {
      evm += stat.count
    } else {
      cosmos += stat.count
    }
  })

  return { evm, cosmos, total: evm + cosmos }
}

export function TxTypeBreakdown() {
  const { data, isLoading } = useQuery({
    queryKey: ['tx-type-breakdown'],
    queryFn: getTxTypeBreakdown,
    refetchInterval: 30000,
  })

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Transaction Types</CardTitle>
          <CardDescription>Loading...</CardDescription>
        </CardHeader>
        <CardContent>
          <Skeleton className={styles.skeleton} />
        </CardContent>
      </Card>
    )
  }

  const evmPercent = data.total > 0 ? ((data.evm / data.total) * 100).toFixed(1) : '0'

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      data: ['EVM', 'Cosmos SDK']
    },
    series: [{
      name: 'Transaction Type',
      type: 'pie',
      radius: ['40%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 14,
          fontWeight: 'bold'
        }
      },
      data: [
        { value: data.evm, name: 'EVM', itemStyle: { color: '#6366f1' } },
        { value: data.cosmos, name: 'Cosmos SDK', itemStyle: { color: '#10b981' } }
      ]
    }]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transaction Types</CardTitle>
        <CardDescription>
          {evmPercent}% EVM transactions ({data.total} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: '250px' }} notMerge={true} lazyUpdate={true} />
      </CardContent>
    </Card>
  )
}

const styles = {
  skeleton: css({ h: '64', w: 'full' }),
}
