import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Subpath the app is served under. Production: /cobot/ (default).
// QA: build with VITE_BASE_PATH=/cobot-testing/ so the app requests its
// files and its API from that path. Must match FRONTEND_BASE_URL in
// backend/.env on the same server.
const base = process.env.VITE_BASE_PATH || '/cobot/'

// https://vite.dev/config/
export default defineConfig({
  base,
  plugins: [react(), tailwindcss()],
  server: {
    proxy: {
      [`${base}api`]: {
        target: 'http://localhost:3123',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
