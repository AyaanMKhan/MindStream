import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react({
    // Enable React Fast Refresh
    fastRefresh: true,
    // Enable React Strict Mode
    strictMode: true,
    // Enable React Refresh for HMR
    refresh: true,
  })],
  server: {
    port: 3000,
    host: true,
  },
}) 