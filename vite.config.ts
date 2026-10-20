import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs: the build works at a domain root or in any sub-folder.
  base: './',
  plugins: [react()],
  server: {
    host: true,
  },
  preview: {
    host: true,
  },
})
