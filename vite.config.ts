import { readFileSync } from 'node:fs'
import path from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import { defineConfig } from 'vitest/config'

/**
 * MapLibre 6 starts its web worker with `new URL('./maplibre-gl-worker.mjs', import.meta.url)`, which Vite cannot see, so the file
 * never reaches the build. Without it production serves index.html (via the SPA redirect) and the map fails to load.
 * Emitting it next to the map chunk in assets/ is where MapLibre looks for it.
 */
function emitMapLibreWorker(): Plugin {
  return {
    name: 'emit-maplibre-worker',
    apply: 'build',
    generateBundle() {
      const file = path.resolve(import.meta.dirname, 'node_modules/maplibre-gl/dist/maplibre-gl-worker.mjs')
      this.emitFile({ type: 'asset', fileName: 'assets/maplibre-gl-worker.mjs', source: readFileSync(file) })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), emitMapLibreWorker()],
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
