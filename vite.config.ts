import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Served at the root of the custom domain (awski.pavlov-ai.online), so base is "/".
export default defineConfig({
  base: '/',
  plugins: [react()],
})
