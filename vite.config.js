import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  plugins: [
    react(),
    electron({
      main: {
        entry: 'electron/main.js',
        vite: {
          build: {
            rollupOptions: {
              // Keep ffmpeg-static external so its path resolves correctly at runtime
              external: ['ffmpeg-static'],
            },
          },
        },
      },
      preload: {
        input: 'electron/preload.js',
      },
      renderer: process.env.NODE_ENV === 'test' ? undefined : {},
    }),
  ],
})
