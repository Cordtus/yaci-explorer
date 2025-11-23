import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

export function GasEfficiencyChart() {
  const { data: distribution, isLoading: loadingDist } = useQuery({
    queryKey: ['gas-usage-distribution'],
    queryFn: () => api.getGasUsageDistribution(1000),
    refetchInterval: 60000,
  })

  const { data: efficiency, isLoading: loadingEff } = useQuery({
    queryKey: ['gas-efficiency'],
    queryFn: () => api.getGasEfficiency(1000),
    refetchInterval: 60000,
  })

  if (loadingDist || loadingEff || !distribution || !efficiency) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Gas Usage Analysis</CardTitle>
          <CardDescription>Distribution and efficiency metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
      },
      formatter: (params: any) => {
        const point = params[0]
        return `
          <div style="font-size: 12px;">
            <strong>${point.name}</strong><br/>
            Count: ${point.value.toLocaleString()} transactions
          </div>
        `
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: distribution.map((d) => d.range),
      axisLabel: {
        rotate: 45,
      },
      name: 'Gas Used Range',
      nameLocation: 'middle',
      nameGap: 60,
    },
    yAxis: {
      type: 'value',
      name: 'Number of Transactions',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        formatter: (value: number) => {
          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
          return value.toString()
        },
      },
    },
    series: [
      {
        name: 'Transactions',
        type: 'bar',
        data: distribution.map((d) => d.count),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: '#3b82f6' },
              { offset: 1, color: '#1d4ed8' },
            ],
          },
        },
        emphasis: {
          itemStyle: {
            color: '#2563eb',
          },
        },
      },
    ],
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gas Usage Distribution</CardTitle>
        <CardDescription>
          Avg Gas Limit: {Math.round(efficiency.avgGasLimit).toLocaleString()} | Total Limit:{' '}
          {(efficiency.totalGasLimit / 1e6).toFixed(2)}M | Transactions:{' '}
          {efficiency.transactionCount.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: '300px' }} opts={{ renderer: 'canvas' }} />
      </CardContent>
    </Card>
  )
}
