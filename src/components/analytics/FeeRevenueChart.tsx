import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { css } from '@/styled-system/css'
import { token } from '@/styled-system/tokens'

export function FeeRevenueChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['fee-revenue'],
    queryFn: () => api.getFeeRevenueOverTime(),
    refetchInterval: 30000,
  })

  if (isLoading || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fee Revenue by Denomination</CardTitle>
          <CardDescription>Total fee collection breakdown</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.loadingContainer}>
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  // Format denom names (remove 'u' prefix for display)
  const formatDenom = (denom: string) => {
    return denom.startsWith('u') ? denom.slice(1).toUpperCase() : denom.toUpperCase()
  }

  // Format amount (divide by 1e6 for micro denomination)
  const formatAmount = (amount: string, denom: string) => {
    const num = parseFloat(amount)
    return denom.startsWith('u') ? num / 1e6 : num
  }

  // Calculate total for description
  const totalDescription = data
    .map((d) => `${formatAmount(d.total_amount, d.denom).toFixed(2)} ${formatDenom(d.denom)}`)
    .join(' + ')

  const option = {
    tooltip: {
      trigger: 'item',
      backgroundColor: token('colors.bg.muted'),
      borderColor: token('colors.border.accent'),
      textStyle: { color: token('colors.fg.default') },
      formatter: (params: any) => {
        const denom = data[params.dataIndex].denom
        const amount = formatAmount(data[params.dataIndex].total_amount, denom)
        return `<strong>${formatDenom(denom)}</strong><br/>Amount: ${amount.toFixed(2)}`
      },
    },
    legend: {
      data: data.map((d) => formatDenom(d.denom)),
      top: 'bottom',
      textStyle: { color: '#707B92' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '5%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => formatDenom(d.denom)),
      axisLabel: {
        rotate: 45,
        color: '#707B92'
      },
      axisLine: { lineStyle: { color: token('colors.border.default') } }
    },
    yAxis: {
      type: 'value',
      name: 'Fee Revenue',
      nameLocation: 'middle',
      nameGap: 60,
      nameTextStyle: { color: '#707B92' },
      axisLabel: {
        color: '#707B92',
        formatter: (value: number) => {
          if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
          if (value >= 1000) return `${(value / 1000).toFixed(1)}K`
          return value.toFixed(0)
        },
      },
      axisLine: { show: false },
      splitLine: { lineStyle: { color: token('colors.border.default'), type: 'dashed' } }
    },
    series: [
      {
        name: 'Fee Revenue',
        type: 'bar',
        data: data.map((d) => formatAmount(d.total_amount, d.denom)),
        itemStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: token('colors.republicGreen.7') },
              { offset: 1, color: token('colors.republicGreen.5') },
            ],
          },
        },
        emphasis: {
          itemStyle: {
            color: token('colors.republicGreen.1'),
          },
        },
      },
    ],
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Fee Revenue by Denomination</CardTitle>
        <CardDescription>
          Total: {totalDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: '400px' }} opts={{ renderer: 'canvas' }} notMerge={true} lazyUpdate={true} />
      </CardContent>
    </Card>
  )
}

const styles = {
  loadingContainer: css({ h: '400px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'fg.muted' }),
}
