import { defineConfig } from '@pandacss/dev'
import { createPreset } from '@park-ui/panda-preset'

export default defineConfig({
  preflight: true,
  jsxFramework: 'react',
  include: ['./src/**/*.{ts,tsx,js,jsx}'],
  exclude: ['./node_modules/**/*', './build/**/*', './dist/**/*'],
  outdir: 'styled-system',

  presets: [
    '@pandacss/preset-base',
    createPreset({
      accentColor: 'blue',
      grayColor: 'slate',
      radius: 'md',
    }),
  ],

  theme: {
    extend: {
      tokens: {
        sizes: {
          '4.5': { value: '1.125rem' },
        },
        colors: {
          // Chart colors - using direct values
          chartBlue: {
            light: { value: '#3b82f6' },
            dark: { value: '#60a5fa' },
          },
          chartGreen: {
            light: { value: '#22c55e' },
            dark: { value: '#4ade80' },
          },
          chartGray: {
            light: { value: '#e2e8f0' },
            dark: { value: '#1e293b' },
          },
          chartAxis: {
            light: { value: '#94a3b8' },
            dark: { value: '#64748b' },
          },
        },
      },
      semanticTokens: {
        colors: {
          // Chart colors for analytics
          chart: {
            transactions: {
              value: { base: '{colors.chartBlue.light}', _dark: '{colors.chartBlue.dark}' },
            },
            gas: {
              value: { base: '{colors.chartGreen.light}', _dark: '{colors.chartGreen.dark}' },
            },
            grid: {
              value: { base: '{colors.chartGray.light}', _dark: '{colors.chartGray.dark}' },
            },
            axis: {
              value: { base: '{colors.chartAxis.light}', _dark: '{colors.chartAxis.dark}' },
            },
          },
        },
      },
    },
  },
})
