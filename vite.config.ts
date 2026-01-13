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
        secure: true,
        followRedirects: true,
        rewrite: (path) => path.replace(/^\/api\/bugzilla/, ''),
        // Handle OPTIONS preflight requests without proxying
        bypass(req, res) {
          if (req.method === 'OPTIONS') {
            res.writeHead(204, {
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, X-BUGZILLA-API-KEY',
              'Access-Control-Max-Age': '86400',
            })
            res.end()
            return false // Don't proxy this request
          }
        },
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Forward the API key header
            const apiKey = req.headers['x-bugzilla-api-key']
            if (apiKey) {
              proxyReq.setHeader('X-BUGZILLA-API-KEY', apiKey as string)
            }
          })
          proxy.on('proxyRes', (_proxyRes, _req, res) => {
            // Add CORS headers to proxied responses
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-BUGZILLA-API-KEY')
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
