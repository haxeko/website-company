/** Every file in public/<folder>, by name → a short hash of its content (vite.config.ts, assetVersions). */
declare module 'virtual:asset-versions/*' {
  const versions: Readonly<Record<string, string>>
  export default versions
}
