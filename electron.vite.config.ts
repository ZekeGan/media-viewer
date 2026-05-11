import { defineConfig } from 'electron-vite'
import { resolve } from 'path'

export default defineConfig({
  main: {
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: resolve(__dirname, 'electron/main.ts'),
        external: ['electron'],
      },
    },
  },

  preload: {
    build: {
      outDir: 'out/preload',
      rollupOptions: {
        input: resolve(__dirname, 'electron/preload.ts'),
        external: ['electron'],
      },
    },
  },
})
