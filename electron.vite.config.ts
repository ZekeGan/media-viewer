import { defineConfig } from 'electron-vite'

export default defineConfig({
  main: {
    build: {
      lib: {
        entry: 'electron/main.ts',
      },
    },
  },

  preload: {
    build: {
      lib: {
        entry: 'electron/preload.ts',
      },
    },
  },
})
