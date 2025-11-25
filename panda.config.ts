import { defineConfig } from '@pandacss/dev'
import { createPreset } from '@park-ui/panda-preset'
import blue from '@park-ui/panda-preset/colors/blue'
import slate from '@park-ui/panda-preset/colors/slate'

export default defineConfig({
  // Enable Panda's reset and JSX typings
  preflight: true,
  jsxFramework: 'react',

  // Where Panda looks for class usage
  include: ['./src/**/*.{ts,tsx,js,jsx}'],
  exclude: [
    './node_modules/**/*',
    './build/**/*',
    './dist/**/*',
  ],

  // Generated output folder (CSS + typed helpers)
  outdir: 'styled-system',

  // Park UI preset backed by Ark UI + Panda
  presets: [
    createPreset({
      accentColor: blue,
      grayColor: slate,
      radius: 'md',
    }),
  ],

  theme: {
    extend: {
      // Additional semantic colors for charts / data viz
      semanticTokens: {
        colors: {
          chart: {
            transactions: {
              value: { base: '#3b82f6', _dark: '#60a5fa' },
            },
            gas: {
              value: { base: '#10b981', _dark: '#34d399' },
            },
            grid: {
              value: { base: '#e5e7eb', _dark: '#1f2937' },
            },
            axis: {
              value: { base: '#9ca3af', _dark: '#94a3b8' },
            },
          },
        },
      },
    },
  },
})
