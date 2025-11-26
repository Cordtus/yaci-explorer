import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: '@/styled-system', replacement: resolve(__dirname, './styled-system') },
      { find: '@', replacement: resolve(__dirname, './src') },
    ],
    extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
  },
})
