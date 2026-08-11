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
 * ## Two rules keep this safe
 *
 * **1. Match on the resolved path, in order.** `react-dom` and `react-hook-form`
 * both contain "react", so specific patterns are tested before generic ones and
 * `/react/` is anchored to directory boundaries.
 *
 * **2. Never split a CommonJS package away from the package it `require`s at
 * module scope.** This is not a size optimisation, it's a correctness rule, and
 * breaking it produced a white screen:
 *
 *     Uncaught TypeError: Cannot set properties of undefined (setting 'Children')
 *
 * `use-sync-external-store` and `react-is` are CJS and call `require('react')`
 * while evaluating. When a catch-all `vendor` bucket put them in a different
 * chunk from React, the two chunks became mutually dependent at *initialisation*
 * time — `vendor` ran first, reached into a React module whose CJS `exports`
 * object did not exist yet, and the app died before first paint. ESM cross-chunk
 * imports are hoisted and tolerate this; CJS interop shims do not.
 *
 * So the React chunk lists its whole interop family, and there is deliberately
 * no catch-all: an unmatched package returns `undefined` and Rollup places it
 * beside whatever imports it, which is always init-safe.
 */
function vendorChunk(id: string): string | undefined {
  const path = id.replace(/\\/g, '/')

  // Rollup's CJS interop helpers are a *virtual* module with no node_modules
  // path, so they fall through every rule below and Rollup drops them wherever
  // it likes. Landing in `vendor-charts` made `vendor-react` import the chart
  // chunk for a two-line helper — dragging 450 kB of Recharts into the boot
  // graph and closing a cycle around it. Pinned to their own leaf chunk, which
  // imports nothing and therefore cannot participate in one.
  if (path.includes('commonjsHelpers') || path.includes('\0commonjs')) return 'vendor-cjs'

  if (!path.includes('/node_modules/')) return undefined

  // React and every package that reaches into its exports during evaluation.
  // Adding a CJS package that requires React? It belongs in this list.
  if (
    /\/node_modules\/(react|react-dom|scheduler|react-is|use-sync-external-store|object-assign|prop-types)\//.test(
      path,
    )
  ) {
    return 'vendor-react'
  }

  // Recharts pulls in the whole d3 scale/shape/array family plus victory-vendor.
  // Keeping them together means a chart-free route downloads none of it.
  if (
    /\/node_modules\/(recharts|d3-[^/]+|victory-vendor|internmap|decimal\.js-light|eventemitter3|fast-equals)\//.test(
      path,
    )
  ) {
    return 'vendor-charts'
  }
  if (/\/node_modules\/(framer-motion|motion-dom|motion-utils)\//.test(path)) return 'vendor-motion'
  if (/\/node_modules\/@tanstack\//.test(path)) return 'vendor-query'
  if (/\/node_modules\/lucide-react\//.test(path)) return 'vendor-icons'
  if (/\/node_modules\/(zod|react-hook-form|@hookform)\//.test(path)) return 'vendor-forms'

  // Everything else: let Rollup decide. No catch-all bucket.
  return undefined
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
