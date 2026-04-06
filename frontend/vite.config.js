/**
 * @file vite.config.js
 * @description Vite 빌드 설정. React + Tailwind CSS 플러그인 구성.
 */
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 2020,
    open: false,
    proxy: {
      '/api': {
        target: 'http://localhost:2021',
        changeOrigin: true,
      },
    },
  },
})
