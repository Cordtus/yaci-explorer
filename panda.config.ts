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

  patterns: {
    extend: {
      // Stat row - compact label/value display
      statRow: {
        description: 'A compact stat display with label and value',
        transform() {
          return {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            py: '2',
            px: '3',
            borderRadius: 'md',
            border: '1px solid',
            borderColor: 'border.default',
            bg: 'bg.subtle',
          }
        },
      },
      // List item with hover effect
      listItem: {
        description: 'A list item with hover accent border',
        transform() {
          return {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            w: 'full',
            py: '3',
            borderBottomWidth: '1px',
            borderColor: 'border.default',
            transition: 'all 0.2s',
            _hover: {
              borderLeftWidth: '2px',
              borderLeftColor: 'accent.default',
              pl: '2',
              bg: 'bg.accentSubtle',
            },
            _last: { borderBottomWidth: '0' },
          }
        },
      },
      // Section header - title with optional action
      sectionHeader: {
        description: 'A section header with space-between layout',
        transform() {
          return {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: '4',
          }
        },
      },
    },
  },

  theme: {
    extend: {
      tokens: {
        sizes: {
          'icon.xs': { value: '0.75rem' },
          'icon.sm': { value: '1rem' },
          'icon.md': { value: '1.25rem' },
          'icon.lg': { value: '1.5rem' },
          'icon.xl': { value: '2rem' },
        },
      },
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
