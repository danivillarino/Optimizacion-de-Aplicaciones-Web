import { fileURLToPath, URL } from 'node:url'

import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  const isDev = command === 'serve'
  const env = loadEnv(mode, '.', '')
  const enableVueDevTools = env.VITE_ENABLE_VUE_DEVTOOLS === 'true'

  return {
    plugins: [vue(), isDev && enableVueDevTools ? vueDevTools() : null].filter(Boolean),
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    build: {
      cssCodeSplit: true,
      reportCompressedSize: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return
            }

            if (id.match(/[\\/]bootstrap[\\/]/)) {
              return 'vendor-bootstrap'
            }

            return 'vendor'
          },
        },
      },
    },
  }
})
