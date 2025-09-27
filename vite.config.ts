import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  define: {
    global: 'globalThis',
    'process.env': {}
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'pdf-worker': ['pdfjs-dist'],
          'antd': ['antd', '@ant-design/icons']
        }
      }
    },
    commonjsOptions: {
      include: [/node_modules/]
    },
    assetsInlineLimit: 0
  },
  publicDir: 'public',
  assetsInclude: ['**/*.mjs'],
  optimizeDeps: {
    include: ['pdfjs-dist', 'antd', '@ant-design/icons']
  },
  base: './'
})