/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Buckets a `node_modules` module into a vendor chunk.
 *
 * This replaces the previous object-form `manualChunks`, which keyed on bare
 * package names and silently under-matched. `'vendor-react': ['react',
 * 'react-dom']` only captured the two package entry points, so `react-dom/client`
 * — the specifier `main.tsx` actually imports, and where nearly all of react-dom's
 * weight lives — fell through into the app entry. The result was a 12 kB
 * "vendor-react" chunk sitting next to a 730 kB `index`, alongside framer-motion,
 * zod and react-hook-form, none of which the map mentioned at all.
 *
 * Matching on the resolved path instead catches every deep import. Order is
 * significant: `react-dom` and `react-hook-form` both contain "react", so the
 * specific patterns are tested before the generic ones, and `/react/` is
 * anchored to a directory boundary.
 */
function vendorChunk(id: string): string | undefined {
  const path = id.replace(/\\/g, '/')
  if (!path.includes('/node_modules/')) return undefined

  // Recharts pulls in the whole d3 scale/shape/array family plus victory-vendor.
  // Keeping them together means a chart-free route downloads none of it.
  if (/\/node_modules\/(recharts|d3-[^/]+|victory-vendor|internmap|decimal\.js-light|eventemitter3|fast-equals)\//.test(path)) {
    return 'vendor-charts'
  }
  if (/\/node_modules\/(react-dom|scheduler)\//.test(path)) return 'vendor-react'
  if (/\/node_modules\/react\//.test(path)) return 'vendor-react'
  if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(path)) return 'vendor-motion'
  if (/\/node_modules\/@tanstack\//.test(path)) return 'vendor-query'
  if (/\/node_modules\/lucide-react\//.test(path)) return 'vendor-icons'
  if (/\/node_modules\/(zod|react-hook-form|@hookform)\//.test(path)) return 'vendor-forms'
  return 'vendor'
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // The repo already carried vitest-style tests with no runner installed, so
  // none of them could run. Wiring the runner here rather than in a separate
  // vitest.config.ts keeps one source of aliases and plugin config.
  test: {
    environment: 'jsdom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: (id) => vendorChunk(id),
      },
    },
  },
})
