import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import compression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    compression({
      algorithm: 'gzip',
      ext: '.gz',
    }),
    visualizer({
      filename: './dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api/bugzilla': {
        target: 'https://bugzilla.mozilla.org/rest',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/bugzilla/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Forward the API key header
            const apiKey = req.headers['x-bugzilla-api-key']
            if (apiKey) {
              proxyReq.setHeader('X-BUGZILLA-API-KEY', apiKey as string)
            }
          })
        },
      },
    },
  },
  build: {
    target: 'esnext',
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'animation-vendor': ['framer-motion'],
          'store-vendor': ['zustand'],
        },
      },
    },
  },
})
