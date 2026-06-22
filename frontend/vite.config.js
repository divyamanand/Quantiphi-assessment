import path from 'path'
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendUrl = env.VITE_API_BASE_URL ?? 'http://localhost:4000'

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      proxy: {
        // Strips /api prefix and forwards to the backend URL from .env.
        // e.g. /api/subscriptions → http://localhost:4000/subscriptions
        '/api': {
          target: backendUrl,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/api/, ''),
        },
      },
    },
  }
})
