import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { css } from '@/styled-system/css'
import { useChain } from '@/contexts/ChainContext'

export function IBCActivityChart() {
  const { hasFeature } = useChain()
  const ibcEnabled = hasFeature('ibc')

  const { data, isLoading } = useQuery({
    queryKey: ['ibc-volume-timeseries'],
    queryFn: () => api.getIbcVolumeTimeseries(48),
    refetchInterval: 60000,
    enabled: ibcEnabled,
  })

  if (!ibcEnabled) {
    return null
  }

  if (isLoading || !data || data.timeseries.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>IBC Transfer Activity</CardTitle>
          <CardDescription>Cross-chain transfer volume over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className={styles.loadingContainer}>
            {isLoading ? 'Loading...' : 'No IBC activity yet'}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Reverse for chronological order
  const chartData = [...data.timeseries].reverse()
  const { summary } = data

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: unknown[]) => {
        const point = params as Array<{ name: string; seriesName: string; value: number; color: string }>
        const hour = new Date(point[0].name)
        const lines = point.map(p =>
          `<span style="color:${p.color}">\u25CF</span> ${p.seriesName}: ${p.value}`
        ).join('<br/>')
        return `
          <div style="font-size: 12px;">
            <strong>${hour.toLocaleString()}</strong><br/>
            ${lines}
          </div>
        `
      },
    },
    legend: {
      data: ['Outgoing', 'Incoming'],
      bottom: 0,
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '10%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: chartData.map((d) => d.hour),
      axisLabel: {
        formatter: (value: string) => {
          const date = new Date(value)
          return `${date.getHours()}:00`
        },
        rotate: 45,
      },
      boundaryGap: false,
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
    },
    series: [
      {
        name: 'Outgoing',
        type: 'bar',
        stack: 'total',
        data: chartData.map((d) => d.outgoing_count),
        itemStyle: {
          color: '#f97316',
        },
      },
      {
        name: 'Incoming',
        type: 'bar',
        stack: 'total',
        data: chartData.map((d) => d.incoming_count),
        itemStyle: {
          color: '#22c55e',
        },
      },
    ],
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>IBC Transfer Activity</CardTitle>
        <CardDescription>
          Last 48h: {summary.total_transfers} transfers ({summary.total_outgoing} out, {summary.total_incoming} in)
          {summary.peak_hour && ` | Peak: ${summary.peak_count} at ${new Date(summary.peak_hour).getHours()}:00`}
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
