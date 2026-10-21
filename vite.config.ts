import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'

/**
 * `virtual:asset-versions/<folder>` (e.g. `virtual:asset-versions/assets/slides`): every file in
 * public/<folder>, by name → a short hash of its content, read when the site is built. The photos
 * keep stable names and are cached for 30 days, so their addresses carry this hash
 * (src/data/assetUrl.ts): a photo that changes is fetched afresh, never taken from a stale cache.
 */
function assetVersions(): Plugin {
  const prefix = 'virtual:asset-versions/'
  const hash = (file: string) => createHash('sha256').update(readFileSync(file)).digest('hex').slice(0, 10)
  let publicDir = ''
  return {
    name: 'asset-versions',
    configResolved(config) {
      publicDir = config.publicDir
    },
    resolveId(id) {
      return id.startsWith(prefix) ? `\0${id}` : undefined
    },
    load(id) {
      if (!id.startsWith(`\0${prefix}`)) return
      const dir = join(publicDir, id.slice(prefix.length + 1))
      const versions = Object.fromEntries(readdirSync(dir).map((file) => [file, hash(join(dir, file))]))
      return `export default ${JSON.stringify(versions)}`
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // Relative asset URLs: the build works at a domain root or in any sub-folder.
  base: './',
  plugins: [react(), assetVersions()],
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
