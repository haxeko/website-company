/**
 * The address of a photo in public/: `<base>/<file>?v=<hash of its content>`.
 *
 * The photos keep stable file names and are cached for 30 days (deploy/nginx.conf, and Cloudflare
 * at its edge), so the hash gives a photo that changed a new address: no browser or CDN can show an
 * old copy beside a newer page — the live control screen, for one, is laid onto the glass of exactly
 * the photo it was made for. The hashes are read from the files when the site is built
 * (vite.config.ts, assetVersions).
 */
export function assetUrl(base: string, file: string, versions: Readonly<Record<string, string>>) {
  const version = versions[file]
  return version ? `${base}/${file}?v=${version}` : `${base}/${file}`
}
