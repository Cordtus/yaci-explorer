import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import ReactECharts from 'echarts-for-react'
import { YaciAPIClient } from '@yaci/database-client'

const client = new YaciAPIClient(import.meta.env.VITE_POSTGREST_URL)

interface AddressActivity {
  dates: string[]
  counts: number[]
  totalUnique: number
}

async function getActiveAddresses(): Promise<AddressActivity> {
  // Get messages with senders from last 7 days worth of data
  const { data: messages } = await client.query<any>('messages_main', {
    select: 'sender,id',
    limit: 2000,
    order: 'id.desc'
  })

  // Get timestamps for these transactions
  const txIds = [...new Set(messages.map((m: any) => m.id))]
  const idFilter = txIds.slice(0, 100).map(id => `id.eq.${id}`).join(',')

  const { data: txs } = await client.query<any>('transactions_main', {
    select: 'id,timestamp',
    filters: { or: `(${idFilter})` }
  })

  // Create a map of tx_id to date
  const txDateMap = new Map<string, string>()
  txs.forEach((tx: any) => {
    const date = new Date(tx.timestamp).toISOString().split('T')[0]
    txDateMap.set(tx.id, date)
  })

  // Group unique addresses by date
  const addressesByDate = new Map<string, Set<string>>()
  const allAddresses = new Set<string>()

  messages.forEach((msg: any) => {
    if (msg.sender) {
      allAddresses.add(msg.sender)
      const date = txDateMap.get(msg.id)
      if (date) {
        if (!addressesByDate.has(date)) {
          addressesByDate.set(date, new Set())
        }
        addressesByDate.get(date)!.add(msg.sender)
      }
    }
  })

  // Sort dates and get counts
  const sortedDates = Array.from(addressesByDate.keys()).sort()
  const dates = sortedDates.slice(-7) // Last 7 days
  const counts = dates.map(date => addressesByDate.get(date)?.size || 0)

  return {
    dates: dates.map(d => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
    counts,
    totalUnique: allAddresses.size
  }
}

export function ActiveAddressesChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['active-addresses'],
    queryFn: getActiveAddresses,
    refetchInterval: 60000,
  })

  if (isLoading || !data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Active Addresses</CardTitle>
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
      trigger: 'axis'
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.dates,
      axisLabel: { fontSize: 10 }
    },
    yAxis: {
      type: 'value',
      name: 'Addresses'
    },
    series: [{
      name: 'Active Addresses',
      type: 'line',
      smooth: true,
      data: data.counts,
      areaStyle: {
        color: {
          type: 'linear',
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(16, 185, 129, 0.4)' },
            { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }
          ]
        }
      },
      lineStyle: { color: '#10b981', width: 2 },
      itemStyle: { color: '#10b981' }
    }]
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Addresses</CardTitle>
        <CardDescription>
          {data.totalUnique} unique addresses (daily activity)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: '250px' }} />
      </CardContent>
    </Card>
  )
}
