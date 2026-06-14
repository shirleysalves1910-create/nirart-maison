import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('/xlsx/')) return 'xlsx'
          if (id.includes('/@supabase/')) return 'supabase'
          if (id.includes('/react-router/') || id.includes('/react-router-dom/') || id.includes('/@remix-run/router/')) {
            return 'react-router'
          }
          return 'vendor'
        }
      }
    }
  },
  server: {
    port: 5173,
    open: true
  }
})
