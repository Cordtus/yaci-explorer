import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import ReactECharts from 'echarts-for-react'
import { useQuery } from '@tanstack/react-query'
import { YaciAPIClient } from '@/lib/api/client'

const client = new YaciAPIClient()

interface BlockTimeData {
  height: number
  time: number
  timestamp: string
}

async function getBlockIntervalData(limit = 100): Promise<BlockTimeData[]> {
  const baseUrl = import.meta.env.VITE_POSTGREST_URL
  if (!baseUrl) {
    throw new Error('VITE_POSTGREST_URL environment variable is not set')
  }
  const response = await fetch(
    `${baseUrl}/blocks_raw?order=id.desc&limit=${limit}`
  )
  const blocks = await response.json()

  const data: BlockTimeData[] = []
  for (let i = 0; i < blocks.length - 1; i++) {
    const currentTime = new Date(blocks[i].data?.block?.header?.time).getTime()
    const previousTime = new Date(blocks[i + 1].data?.block?.header?.time).getTime()
    const diff = (currentTime - previousTime) / 1000

    if (diff > 0 && diff < 100) {
      data.push({
        height: blocks[i].id,
        time: diff,
        timestamp: blocks[i].data?.block?.header?.time,
      })
    }
  }

  return data.reverse()
}

export function BlockIntervalChart() {
  const { data, isLoading } = useQuery({
    queryKey: ['block-intervals'],
    queryFn: () => getBlockIntervalData(100),
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  if (isLoading || !data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Block Interval</CardTitle>
          <CardDescription>Block production time over recent blocks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Loading...
          </div>
        </CardContent>
      </Card>
    )
  }

  const avgBlockTime = data.reduce((sum, d) => sum + d.time, 0) / data.length
  const minBlockTime = Math.min(...data.map((d) => d.time))
  const maxBlockTime = Math.max(...data.map((d) => d.time))

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
      },
      formatter: (params: any) => {
        const point = params[0]
        return `
          <div style="font-size: 12px;">
            <strong>Block ${point.name}</strong><br/>
            Interval: ${point.value[1].toFixed(2)}s
          </div>
        `
      },
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      top: '15%',
      containLabel: true,
    },
    xAxis: {
      type: 'category',
      data: data.map((d) => d.height),
      axisLabel: {
        rotate: 45,
        interval: Math.floor(data.length / 10),
        formatter: (value: number) => value.toLocaleString(),
      },
      name: 'Block Height',
      nameLocation: 'middle',
      nameGap: 50,
    },
    yAxis: {
      type: 'value',
      name: 'Seconds',
      nameLocation: 'middle',
      nameGap: 50,
      axisLabel: {
        formatter: '{value}s',
      },
    },
    series: [
      {
        name: 'Block Interval',
        type: 'line',
        data: data.map((d) => [d.height, d.time]),
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: {
          width: 2,
          color: '#3b82f6',
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' },
            ],
          },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: {
            type: 'dashed',
            color: '#10b981',
          },
          data: [
            {
              yAxis: avgBlockTime,
              label: {
                formatter: `Avg: ${avgBlockTime.toFixed(2)}s`,
              },
            },
          ],
        },
      },
    ],
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Block Production Interval</CardTitle>
        <CardDescription>
          Last 100 blocks | Avg: {avgBlockTime.toFixed(2)}s | Min: {minBlockTime.toFixed(2)}
          s | Max: {maxBlockTime.toFixed(2)}s
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ReactECharts option={option} style={{ height: '300px' }} opts={{ renderer: 'canvas' }} />
      </CardContent>
    </Card>
  )
}
