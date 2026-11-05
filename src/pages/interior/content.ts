import type { Lang } from '../../i18n/strings'
import type { DeckText } from '../shared/Deck'

/** The four facets of the interior: the page's themes, in order. */
export type FacetId = 'space' | 'materials' | 'light' | 'bespoke'
/** The room's light through the day, in order. */
export type MoodId = 'morning' | 'golden' | 'evening'
export const MOODS: MoodId[] = ['morning', 'golden', 'evening']

export interface InteriorCopy {
  documentTitle: string
  /** The page's name (its projects: "Các dự án Nội thất"). */
  name: string
  description: string
  stripLabel: string
  index: string
  features: Record<FacetId, { title: string; note: string }>
  themes: Record<FacetId, DeckText>
  /** The materials of the room, in the order of the points on the photo: name, where from, how used. */
  materials: { name: string; origin: string; note: string }[]
  close: string
  moodLabel: string
  moods: Record<MoodId, { label: string; time: string }>
  /** The made-to-measure pieces: [piece, size in mm]. */
  dims: [string, string][]
}

const vi: InteriorCopy = {
  documentTitle: 'Nội thất — VILLA NEST',
  name: 'Nội thất',
  description:
    'Nội thất VILLA NEST: đá travertine, gỗ óc chó, vải bouclé và ánh sáng được thiết kế theo từng giờ trong ngày — nội thất may đo cho nhịp sống của bạn.',
  stripLabel: 'Vật liệu trong căn phòng',
  index: 'Interior',
  features: {
    space: { title: 'Không gian', note: 'Tĩnh trong đường nét.' },
    materials: { title: 'Vật liệu', note: 'Đá, gỗ, vải, đồng.' },
    light: { title: 'Ánh sáng', note: 'Sáng, chiều, tối.' },
    bespoke: { title: 'May đo', note: 'Vừa từng centimet.' },
  },
  themes: {
    space: {
      kicker: 'Nơi vật liệu có cảm xúc',
      headline: 'Tĩnh trong đường nét.',
      accent: 'Ấm trong từng chạm.',
      description: 'Đá, gỗ và ánh sáng tự nhiên gặp nhau trong một nội thất đủ tinh giản để đời sống được lên tiếng.',
    },
    materials: {
      kicker: 'Vật liệu tự nhiên',
      headline: 'Chạm vào\nchất liệu thật.',
      accent: 'Đá, gỗ, vải và đồng.',
      description:
        'Travertine, gỗ óc chó, đá marble, vải bouclé — mỗi vật liệu được chọn theo ánh sáng của căn phòng và cách bạn chạm vào nó mỗi ngày.',
    },
    light: {
      kicker: 'Ánh sáng',
      headline: 'Một căn phòng,\nba khoảnh khắc.',
      accent: 'Sáng trong, chiều vàng, tối ấm.',
      description:
        'Nắng được tính theo hướng nhà, đèn được thiết kế theo lớp — chiếu sáng chung, điểm nhấn và hắt trần — để căn phòng đẹp ở mọi giờ trong ngày.',
    },
    bespoke: {
      kicker: 'Nội thất may đo',
      headline: 'Vừa vặn\ntừng centimet.',
      accent: 'Thiết kế riêng cho nhịp sống của bạn.',
      description:
        'Sofa, tủ bếp, bàn ăn được đo theo không gian và thói quen của gia đình, làm tại xưởng và lắp đặt hoàn thiện — không món nào là đại trà.',
    },
  },
  materials: [
    { name: 'Đá travertine', origin: 'Ý · mài mờ', note: 'Ốp tường phòng khách, vân ngang chạy suốt chiều cao.' },
    { name: 'Gỗ óc chó', origin: 'Bắc Mỹ · phủ dầu', note: 'Vách và tủ bếp, veneer vân thẳng ghép đối xứng.' },
    { name: 'Đá marble', origin: 'Mặt đảo bếp', note: 'Khối đặc, cạnh vát, chống thấm bằng sealer gốc nước.' },
    { name: 'Vải bouclé', origin: 'Bỉ · sợi len pha', note: 'Sofa module may đo, khung gỗ sồi, đệm hai lớp.' },
    { name: 'Thảm len dệt tay', origin: 'Sợi tự nhiên', note: 'Kích thước theo bố cục sofa, viền ẩn.' },
    { name: 'Đèn thả đồng thau', origin: 'Thủ công · 2700 K', note: 'Đèn thanh trên bàn ăn, chỉnh độ sáng theo kịch bản.' },
  ],
  close: 'Đóng',
  moodLabel: 'Ánh sáng trong ngày',
  moods: {
    morning: { label: 'Sáng', time: '07:00' },
    golden: { label: 'Chiều', time: '17:30' },
    evening: { label: 'Tối', time: '21:00' },
  },
  dims: [
    ['Sofa module', '4 200'],
    ['Bàn trà', '1 400 × 900'],
    ['Bàn ăn', '2 800'],
    ['Trần', '3 200'],
  ],
}

const en: InteriorCopy = {
  documentTitle: 'Interior — VILLA NEST',
  name: 'Interior',
  description:
    'VILLA NEST interiors: travertine, walnut, bouclé and a light designed for every hour of the day — made-to-measure interiors for the way you live.',
  stripLabel: 'Materials of the room',
  index: 'Interior',
  features: {
    space: { title: 'Space', note: 'Calm in every line.' },
    materials: { title: 'Materials', note: 'Stone, wood, cloth, brass.' },
    light: { title: 'Light', note: 'Morning, golden hour, evening.' },
    bespoke: { title: 'Bespoke', note: 'Fitted to the centimetre.' },
  },
  themes: {
    space: {
      kicker: 'Where materials feel',
      headline: 'Calm in every line.',
      accent: 'Warm in every touch.',
      description: 'Stone, timber and daylight meet in an interior pared back enough to let life speak.',
    },
    materials: {
      kicker: 'Natural materials',
      headline: 'Touch the\nreal thing.',
      accent: 'Stone, wood, cloth and brass.',
      description:
        'Travertine, walnut, marble, bouclé — every material chosen for the light of the room and for the way you will touch it every day.',
    },
    light: {
      kicker: 'Light',
      headline: 'One room,\nthree moments.',
      accent: 'Clear morning, golden hour, warm evening.',
      description:
        'Sunlight planned with the orientation of the house, lamps designed in layers — ambient, accent and cove — so the room is beautiful at every hour.',
    },
    bespoke: {
      kicker: 'Made to measure',
      headline: 'Fitted to\nthe centimetre.',
      accent: 'Designed around the way you live.',
      description:
        'Sofa, kitchen and dining table measured to the space and the habits of the family, made in our workshop and installed complete — nothing off the shelf.',
    },
  },
  materials: [
    { name: 'Travertine', origin: 'Italy · honed', note: 'The living-room wall, its veins running the full height.' },
    { name: 'Walnut', origin: 'North America · oiled', note: 'Kitchen wall and cabinets, straight-grain veneer book-matched.' },
    { name: 'Marble', origin: 'Kitchen island', note: 'Solid block, chamfered edges, sealed with a water-based sealer.' },
    { name: 'Bouclé', origin: 'Belgium · wool blend', note: 'The made-to-measure sofa, oak frame, two-layer cushions.' },
    { name: 'Hand-woven wool rug', origin: 'Natural fibres', note: 'Sized to the sofa layout, hidden binding.' },
    { name: 'Brass pendant', origin: 'Handmade · 2700 K', note: 'The linear lamp over the table, dimmed by the scenes.' },
  ],
  close: 'Close',
  moodLabel: 'Light through the day',
  moods: {
    morning: { label: 'Morning', time: '07:00' },
    golden: { label: 'Golden', time: '17:30' },
    evening: { label: 'Evening', time: '21:00' },
  },
  dims: [
    ['Sofa', '4 200'],
    ['Coffee table', '1 400 × 900'],
    ['Dining table', '2 800'],
    ['Ceiling', '3 200'],
  ],
}

export const interiorCopy: Record<Lang, InteriorCopy> = { vi, en }
