import media from './media.json'

type MediaId = keyof typeof media.images

export interface SlideImageSet {
  /** srcset strings for the landscape (desktop) variants. */
  landscape: { avif: string; webp: string }
  /** srcset strings for the portrait (mobile) panels. */
  portrait: { avif: string; webp: string }
  /** Plain WebP used by the <img> fallback. */
  fallback: string
  /** Tiny blurred colour wash used as the room light behind the slides. */
  ambient: string
}

export interface Slide {
  id: MediaId
  /** Short label used in the bottom navigation. */
  label: string
  /** Full name used in the menu and for assistive technology. */
  title: string
  /** One-line descriptor shown in the menu. */
  caption: string
  alt: string
  image: SlideImageSet
  credit: { author: string; url: string }
}

const assetBase = `${import.meta.env.BASE_URL}${media.publicPath}`

const srcset = (name: string, widths: number[], ext: 'avif' | 'webp') =>
  widths.map((w) => `${assetBase}/${name}-${w}.${ext} ${w}w`).join(', ')

const fallbackWidth = media.landscapeWidths.find((w) => w >= 1400) ?? media.landscapeWidths.at(-1)

function imageSet(id: MediaId): SlideImageSet {
  return {
    landscape: {
      avif: srcset(id, media.landscapeWidths, 'avif'),
      webp: srcset(id, media.landscapeWidths, 'webp'),
    },
    portrait: {
      avif: srcset(`${id}-portrait`, media.portraitWidths, 'avif'),
      webp: srcset(`${id}-portrait`, media.portraitWidths, 'webp'),
    },
    fallback: `${assetBase}/${id}-${fallbackWidth}.webp`,
    ambient: `${assetBase}/${id}-ambient.webp`,
  }
}

export const slides: Slide[] = [
  {
    id: 'smart-home',
    label: 'Smart Home',
    title: 'Smart Home',
    caption: 'Lighting · Climate · Security',
    alt: 'A hand adjusting a black glass smart-home control panel set into a walnut wall',
    image: imageSet('smart-home'),
    credit: { author: 'HUUM', url: 'https://unsplash.com/photos/a-hand-holding-a-black-device-NohN3BIkAZM' },
  },
  {
    id: 'construction',
    label: 'Construction',
    title: 'Construction',
    caption: 'Architecture · Engineering · Build',
    alt: 'A minimalist modern villa with a cantilevered upper volume, glowing warmly at dusk',
    image: imageSet('construction'),
    credit: {
      author: 'Arthur BAUDRY',
      url: 'https://unsplash.com/photos/modern-house-exterior-glows-with-lights-4vioYQ9Nn9Y',
    },
  },
  {
    id: 'interior',
    label: 'Interior',
    title: 'Interior Design',
    caption: 'Spaces · Materials · Furniture',
    alt: 'A calm, minimalist living room with a cream modular sofa, pendant lamps and a lake view',
    image: imageSet('interior'),
    credit: {
      author: 'Lumbardh Plluzhina',
      url: 'https://unsplash.com/photos/a-modern-living-room-with-a-large-window-7NvBEeHDY7M',
    },
  },
]
