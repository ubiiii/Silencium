// client/vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { obfuscator } from 'vite-plugin-obfuscator'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production'
  
  const plugins = [react()]
  
  // Add obfuscation only in production
  if (isProduction) {
    plugins.push(
      obfuscator({
        options: {
          compact: true,
          controlFlowFlattening: true,
          controlFlowFlatteningThreshold: 0.75,
          deadCodeInjection: true,
          deadCodeInjectionThreshold: 0.4,
          debugProtection: true,
          debugProtectionInterval: 2000,
          disableConsoleOutput: true,
          identifierNamesGenerator: 'hexadecimal',
          log: false,
          renameGlobals: false,
          rotateStringArray: true,
          selfDefending: true,
          shuffleStringArray: true,
          splitStrings: true,
          splitStringsChunkLength: 10,
          stringArray: true,
          stringArrayThreshold: 0.75,
          transformObjectKeys: true,
          unicodeEscapeSequence: false
        }
      })
    )
  }

  return {
    plugins,
    worker: {
      format: 'es' // Allow ES module workers with `import`
    },
    build: {
      minify: 'terser',
      sourcemap: !isProduction, // Disable source maps in production for security
      terserOptions: {
        compress: {
          drop_console: isProduction, // Remove console.log in production
          drop_debugger: isProduction, // Remove debugger statements
          pure_funcs: isProduction ? ['console.log', 'console.info', 'console.debug', 'console.warn'] : []
        },
        mangle: {
          safari10: true
        },
        format: {
          comments: false // Remove all comments
        }
      },
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
