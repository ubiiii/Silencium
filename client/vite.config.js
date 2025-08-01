// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  
  return {
    plugins: [react()],
    worker: {
      format: 'es' // Allow ES module workers with `import`
    },
    build: {
      minify: isProduction ? 'terser' : false,
      sourcemap: !isProduction, // Disable source maps in production for security
      terserOptions: isProduction ? {
        compress: {
          drop_console: true, // Remove console.log in production
          drop_debugger: true, // Remove debugger statements
          pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false // Remove all comments
        }
      } : {},
      rollupOptions: {
        output: {
          manualChunks: undefined,
          // Obfuscate chunk names in production
          entryFileNames: isProduction ? '[name].[hash].js' : '[name].js',
          chunkFileNames: isProduction ? '[name].[hash].js' : '[name].js',
          assetFileNames: isProduction ? '[name].[hash].[ext]' : '[name].[ext]'
        }
      }
    }
  }
})
