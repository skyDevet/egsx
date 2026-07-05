import { defineConfig } from 'vite'
import preact from '@preact/preset-vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig(({ command, mode }) => {
  const isGitHubPages = mode === 'github-pages' || process.env.GITHUB_PAGES === 'true'
  const baseUrl = isGitHubPages ? '/YOUR_REPOSITORY_NAME/' : '/'
  
  return {
    base: baseUrl,
    plugins: [
      preact(),
      VitePWA({
        registerType: 'autoUpdate',
        strategies: 'generateSW',
        // ✅ Completely disable minification
        injectManifest: false,
        minify: false,
        workbox: {
          // ✅ Use simpler workbox config
          maximumFileSizeToCacheInBytes: 50 * 1024 * 1024,
          globPatterns: ['**/*.{js,css,html,wasm,webmanifest,ico,png,svg}'],
          globIgnores: [
            '**/tesseract-core.wasm*',
            '**/ort-wasm*.wasm',
            '**/magick.wasm',
            '**/*.onnx',
            '**/*.model',
            '**/*.map'
          ],
          cleanupOutdatedCaches: true,
          skipWaiting: true,
          clientsClaim: true,
          // ✅ Don't minify workbox
          mode: 'production',
          sourcemap: false
        },
        manifest: {
          name: 'Enhanced Government Services',
          short_name: 'egs',
          description: 'Advanced Document Analysis PWA with AI',
          theme_color: '#667eea',
          background_color: '#ffffff',
          display: 'standalone',
          start_url: baseUrl,
          scope: baseUrl,
          icons: [
            {
              src: './img/1752692028961-removebg-preview.png',
              sizes: '72x72',
              type: 'image/png',
              purpose: 'any maskable'
            },
            {
              src: './img/1752692028961-removebg-preview.png',
              sizes: '96x96',
              type: 'image/png'
            },
            {
              src: 'icons/1752692028961-removebg-preview.png',
              sizes: '128x128',
              type: 'image/png'
            }
          ]
        }
      })
    ],
    worker: {
      format: 'es',
      plugins: [preact()]
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      strictPort: false
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      assetsInlineLimit: 0,
      chunkSizeWarningLimit: 2000,
      // ✅ Disable minification completely
      minify: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'wasm-runtime': ['onnxruntime-web', '@huggingface/transformers'],
            'ocr-engine': ['tesseract.js'],
            'pdf-processor': ['pdfjs-dist'],
            'nlp-models': ['compromise'],
            'vendor': ['preact', 'preact-router']
          }
        }
      }
    },
    optimizeDeps: {
      exclude: ['onnxruntime-web', '@huggingface/transformers'],
      include: ['tesseract.js', 'pdfjs-dist', 'compromise']
    },
    resolve: {
      alias: {
        'react': 'preact/compat',
        'react-dom': 'preact/compat'
      }
    },
    define: {
      'import.meta.env.VITE_BUILD_TIME': JSON.stringify(new Date().toISOString()),
      'import.meta.env.VITE_IS_GITHUB_PAGES': JSON.stringify(isGitHubPages),
      'import.meta.env.VITE_APP_VERSION': JSON.stringify(process.env.npm_package_version || '1.0.0')
    }
  }
})
