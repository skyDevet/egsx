import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig(({ mode }) => {
  // Force GitHub Pages base
  const baseUrl = '/egsz/'
  
  return {
    base: baseUrl,
    plugins: [preact()],
    server: { host: true, port: 3000 },
    build: { outDir: 'dist', sourcemap: false }
  }
})