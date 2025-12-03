import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { css } from '@/styled-system/css'

export function GasEfficiencyChart() {
  const { data: distribution, isLoading: loadingDist } = useQuery({
    queryKey: ['gas-usage-distribution'],
    queryFn: () => api.getGasUsageDistribution(),
    refetchInterval: 60000,
  })

  const { data: efficiency, isLoading: loadingEff } = useQuery({
    queryKey: ['gas-efficiency'],
    queryFn: () => api.getGasEfficiency(),
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
          <div className={styles.loadingContainer}>
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  const option = {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#0D0F0F',
      borderColor: 'rgba(48, 255, 110, 0.25)',
      textStyle: { color: '#FFFFFF' },
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
      data: distribution.map((d) => d.gas_range),
      axisLabel: {
        rotate: 45,
        color: '#707B92'
      },
      name: 'Gas Used Range',
      nameLocation: 'middle',
      nameGap: 60,
      nameTextStyle: { color: '#707B92' },
      axisLine: { lineStyle: { color: 'rgba(94, 94, 94, 0.25)' } }
    },
    yAxis: {
      type: 'value',
      name: 'Number of Transactions',
      nameLocation: 'middle',
      nameGap: 50,
      nameTextStyle: { color: '#707B92' },
      axisLabel: {
        color: '#707B92',
        formatter: (value: number) => {
          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
          return value.toString()
        },
      },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: 'rgba(94, 94, 94, 0.25)', type: 'dashed' } }
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
              { offset: 0, color: '#30FF6E' },
              { offset: 1, color: '#C8FFD8' },
            ],
          },
        },
        emphasis: {
          itemStyle: {
            color: '#7CFFB5',
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
        <ReactECharts option={option} style={{ height: '300px' }} opts={{ renderer: 'canvas' }} notMerge={true} lazyUpdate={true} />
      </CardContent>
    </Card>
  )
}

const styles = {
  loadingContainer: css({ h: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'fg.muted' }),
}
