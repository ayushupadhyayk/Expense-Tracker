import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Keep CRA's output folder so the existing Vercel project settings still work.
  build: { outDir: 'build' },
  server: { port: 5173 },
  // exclude macOS '._*' metadata files that exFAT drives create
  test: { environment: 'jsdom', exclude: ['**/node_modules/**', '**/._*'] },
})
