import versions from 'virtual:asset-versions/assets/pages'
import { assetUrl } from '../../data/assetUrl'
import media from '../../data/media.json'

/** A photo of the stand-alone pages (public/assets/pages), by file name, with its content version. */
export const pageAsset = (file: string) => assetUrl(`../${media.pages.publicPath}`, file, versions)
