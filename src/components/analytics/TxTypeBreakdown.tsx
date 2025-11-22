import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ReactECharts from 'echarts-for-react'
import { YaciAPIClient } from '@yaci/database-client'

const client = new YaciAPIClient(import.meta.env.VITE_POSTGREST_URL)

interface TxBreakdown {
  evm: number
  cosmos: number
  total: number
}

async function getTxTypeBreakdown(): Promise<TxBreakdown> {
  const { data: messages } = await client.query<any>('messages_main', {
    select: 'type',
    limit: 1000,
    order: 'id.desc'
  })

  let evm = 0
  let cosmos = 0

  messages.forEach((msg: any) => {
    if (msg.type?.includes('MsgEthereumTx') || msg.type?.includes('evm')) {
      evm++
    } else {
      cosmos++
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
          <Skeleton className="h-64 w-full" />
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
        <ReactECharts option={option} style={{ height: '250px' }} />
      </CardContent>
    </Card>
  )
}
