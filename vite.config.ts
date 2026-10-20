import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs: the build works at a domain root or in any sub-folder.
  base: './',
  plugins: [react()],
  build: {
    rolldownOptions: {
      // The home page and the stand-alone pages (each folder becomes its own URL: /smart-home/,
      // /construction/, /interior/).
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        'smart-home': resolve(import.meta.dirname, 'smart-home/index.html'),
        construction: resolve(import.meta.dirname, 'construction/index.html'),
        interior: resolve(import.meta.dirname, 'interior/index.html'),
      },
    },
  },
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
})
