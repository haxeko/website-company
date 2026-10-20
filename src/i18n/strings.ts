export type Lang = 'vi' | 'en'

export const LANGS: Lang[] = ['vi', 'en']
export const DEFAULT_LANG: Lang = 'vi'

/** Interface text. Slide copy lives in src/data/slides.ts. */
export const strings = {
  vi: {
    documentTitle: 'VILLA NEST — Kiến trúc, Xây dựng, Nội thất & Nhà thông minh',
    heading: 'VILLA NEST — Kiến trúc, Xây dựng, Nội thất và Nhà thông minh',
    slogan: 'Design · Build · Live',
    home: 'VILLA NEST — về trang đầu',
    soundOn: 'Âm thanh bật',
    soundOff: 'Âm thanh tắt',
    soundToggle: 'Bật hoặc tắt âm thanh nền',
    language: 'Ngôn ngữ',
    carousel: 'Các lĩnh vực của Villa Nest',
    services: 'Lĩnh vực',
    prev: 'Không gian trước',
    next: 'Không gian tiếp theo',
    hint: 'Click · Vuốt · Phím mũi tên',
  },
  en: {
    documentTitle: 'VILLA NEST — Architecture, Construction, Interior & Smart Home',
    heading: 'VILLA NEST — Architecture, Construction, Interior and Smart Home',
    slogan: 'Design · Build · Live',
    home: 'VILLA NEST — back to start',
    soundOn: 'Sound on',
    soundOff: 'Sound off',
    soundToggle: 'Turn ambient sound on or off',
    language: 'Language',
    carousel: 'Villa Nest services',
    services: 'Services',
    prev: 'Previous space',
    next: 'Next space',
    hint: 'Click · Swipe · Arrow keys',
  },
} satisfies Record<Lang, Record<string, string>>

export type UiStrings = (typeof strings)['vi']
