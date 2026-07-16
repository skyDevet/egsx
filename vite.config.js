import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'

export default defineConfig(({ mode }) => {
  // Force GitHub Pages base
  const baseUrl = '/egsx/'
  
  return {
    base: baseUrl,
    plugins: [preact()],
    server: { 
      host: true, 
      port: 3000 
    },
    build: { 
      outDir: 'dist', 
      sourcemap: false,
      // Fix worker format for production build
      rollupOptions: {
        output: {
          format: 'es',
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]'
        }
      }
    },
    // ✅ CRITICAL FIX: Configure worker format
    // ✅ Fixed version
worker: {
  format: 'es',
  plugins: () => [preact()]  // Function that returns array
},
    // Optimize dependencies for Capacitor
    optimizeDeps: {
      include: [
        '@capacitor/core',
        '@capacitor/filesystem',
        'llama-cpp-capacitor'
      ]
    },
    // Handle Node.js modules in browser
    resolve: {
      alias: {
        // If you have Node.js modules that need polyfilling
        'stream': 'stream-browserify',
        'buffer': 'buffer'
      }
    },
    // Define environment variables
    define: {
      // Fix for Capacitor in production
      'process.env.NODE_ENV': JSON.stringify(mode),
      'process.env': {
        NODE_ENV: JSON.stringify(mode)
      }
    }
  }
})