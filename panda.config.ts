import { defineConfig } from '@pandacss/dev'
import { createPreset } from '@park-ui/panda-preset'
import cyan from '@park-ui/panda-preset/colors/cyan'
import slate from '@park-ui/panda-preset/colors/slate'

export default defineConfig({
  preflight: true,
  jsxFramework: 'react',
  include: ['./src/**/*.{ts,tsx,js,jsx}'],
  exclude: [
    './node_modules/**/*',
    './build/**/*',
  ],
  outdir: 'styled-system',
  conditions: {
    light: '[data-color-mode=light] &',
    dark: '[data-color-mode=dark] &, .dark &',
  },

  presets: [
    createPreset({
      accentColor: cyan,
      grayColor: slate,
      radius: 'md',
    }),
  ],

  plugins: [
  {
    name: 'Remove Default Panda Preset Colors',
    hooks: {
      'preset:resolved': ({ utils, preset, name }) =>
        name === '@pandacss/preset-panda'
          ? utils.omit(preset, ['theme.tokens.colors', 'theme.semanticTokens.colors'])
          : preset,
    },
  },
],

  theme: {
    extend: {
      semanticTokens: {
        colors: {
          chart: {
            transactions: {
              value: { base: '#00d2ff', _dark: '#00d2ff' },
            },
            gas: {
              value: { base: '#10b981', _dark: '#34d399' },
            },
            grid: {
              value: { base: '#e5e7eb', _dark: '#30363d' },
            },
            axis: {
              value: { base: '#9ca3af', _dark: '#8b949e' },
            },
          },
        },
      },
    },
  },
})
