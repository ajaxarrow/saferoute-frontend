import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // WSL2 only forwards a Windows browser's localhost to servers bound on all interfaces.
  server: { host: process.env.WSL_DISTRO_NAME ? '0.0.0.0' : undefined },
  // MapLibre 6 spawns its module worker relative to its own files; pre-bundling breaks that path.
  optimizeDeps: { exclude: ['maplibre-gl'] },
  resolve: { alias: { '@': path.resolve(import.meta.dirname, './src') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    css: false,
    env: { VITE_MAPTILER_KEY: 'test-key' },
  },
})
