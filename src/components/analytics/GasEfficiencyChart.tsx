import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { css } from '@/styled-system/css'
import { token } from '@/styled-system/tokens'

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
      backgroundColor: token('colors.bg.muted'),
      borderColor: token('colors.border.accent'),
      textStyle: { color: token('colors.fg.default') },
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
      axisLine: { lineStyle: { color: token('colors.border.default') } }
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
      splitLine: { lineStyle: { color: token('colors.border.default'), type: 'dashed' } }
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
              { offset: 0, color: token('colors.republicGreen.7') },
              { offset: 1, color: token('colors.republicGreen.1') },
            ],
          },
        },
        emphasis: {
          itemStyle: {
            color: token('colors.republicGreen.5'),
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
