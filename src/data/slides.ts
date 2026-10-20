import type { Lang } from '../i18n/strings'
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

export interface SlideCopy {
  /** Name in the bottom navigation. */
  title: string
  /** Small caps line under the name in the bottom navigation. */
  subtitle: string
  /** Small caps line above the headline. */
  kicker: string
  /** First line of the headline (serif). */
  headline: string
  /** Second, italic gold line of the headline. */
  accent: string
  description: string
  cta: string
  alt: string
}

export interface Slide {
  id: MediaId
  copy: Record<Lang, SlideCopy>
  /** Where the call-to-action leads (replace with the real project page when it exists). */
  ctaHref: string
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
    ctaHref: '#smart-home',
    copy: {
      vi: {
        title: 'Smart Home',
        subtitle: 'Sống thông minh',
        kicker: 'Ngôi nhà biết lắng nghe',
        headline: 'Ánh sáng theo ý bạn.',
        accent: 'Ngôi nhà hiểu từng nhịp sống.',
        description:
          'Chiếu sáng, khí hậu, rèm và an ninh hội tụ trong một màn hình điều khiển trung tâm — tinh gọn, trực quan, vận hành trong im lặng.',
        cta: 'Khám phá giải pháp',
        alt: 'Bức tường gỗ óc chó với màn hình điều khiển trung tâm của hệ thống nhà thông minh',
      },
      en: {
        title: 'Smart Home',
        subtitle: 'Smart living',
        kicker: 'A home that listens',
        headline: 'Light, on your terms.',
        accent: 'A home that knows your rhythm.',
        description:
          'Lighting, climate, shading and security come together in one central control panel — calm, intuitive, quietly at work.',
        cta: 'Explore solutions',
        alt: 'A walnut wall with the central control panel of a smart-home system',
      },
    },
    image: imageSet('smart-home'),
    credit: { author: 'HUUM', url: 'https://unsplash.com/photos/a-hand-holding-a-black-device-NohN3BIkAZM' },
  },
  {
    id: 'construction',
    ctaHref: '#construction',
    copy: {
      vi: {
        title: 'Construction',
        subtitle: 'Xây dựng có chủ đích',
        kicker: 'Từ bản vẽ đến công trình',
        headline: 'Vững từ móng.',
        accent: 'Chuẩn đến từng mạch bê tông.',
        description:
          'Kết cấu, giáo chống và ván khuôn được tổ chức chặt chẽ — mỗi giai đoạn thi công đều minh bạch, an toàn và đúng tiến độ.',
        cta: 'Khám phá dự án',
        alt: 'Biệt thự bê tông đang thi công với hệ giáo chống và ván khuôn gỗ, lúc hoàng hôn',
      },
      en: {
        title: 'Construction',
        subtitle: 'Built with purpose',
        kicker: 'From drawing to structure',
        headline: 'Solid from the ground up.',
        accent: 'Precise to every pour.',
        description:
          'Structure, shoring and formwork, organised with rigour — every phase of the build transparent, safe and on schedule.',
        cta: 'Explore projects',
        alt: 'A concrete villa under construction with shoring and timber formwork, at sunset',
      },
    },
    image: imageSet('construction'),
    credit: { author: 'VILLA NEST (concept)', url: '' },
  },
  {
    id: 'interior',
    ctaHref: '#interior',
    copy: {
      vi: {
        title: 'Interior',
        subtitle: 'Tinh tế tĩnh lặng',
        kicker: 'Nơi vật liệu có cảm xúc',
        headline: 'Tĩnh trong đường nét.',
        accent: 'Ấm trong từng chạm.',
        description:
          'Đá, gỗ và ánh sáng tự nhiên gặp nhau trong một nội thất đủ tinh giản để đời sống được lên tiếng.',
        cta: 'Khám phá dự án',
        alt: 'Phòng khách hoàn thiện với sofa màu kem, tường đá và tủ gỗ, mở ra khu vườn nhiệt đới',
      },
      en: {
        title: 'Interior',
        subtitle: 'Quiet refinement',
        kicker: 'Where materials feel',
        headline: 'Calm in every line.',
        accent: 'Warm in every touch.',
        description: 'Stone, timber and daylight meet in an interior pared back enough to let life speak.',
        cta: 'Explore projects',
        alt: 'A finished living room with a cream sofa, stone walls and timber cabinetry opening onto a tropical garden',
      },
    },
    image: imageSet('interior'),
    credit: { author: 'VILLA NEST (concept)', url: '' },
  },
]
