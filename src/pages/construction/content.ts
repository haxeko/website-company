import type { Lang } from '../../i18n/strings'
import type { DeckText } from '../shared/Deck'

/** The four phases of the build: the page's themes, in order. */
export type PhaseId = 'design' | 'structure' | 'progress' | 'handover'

export interface ConstructionCopy {
  documentTitle: string
  /** The page's name (its projects: "Các dự án Xây dựng"). */
  name: string
  description: string
  stripLabel: string
  strip: { name: string; note: string }[]
  index: string
  /** A moment after the page opens: the laser line can be dragged. */
  tryIt: string
  /** `\n` in a title: where the theme's tab breaks on phones (one line elsewhere). */
  features: Record<PhaseId, { title: string; note: string }>
  themes: Record<PhaseId, DeckText>
  /** The two sides of the laser line (the BIM model, the building), and its handle. */
  model: string
  built: string
  handle: string
  /** "{n}% built", for the handle's value. */
  builtValue: string
  /** The model's floor levels, top down: [name, level]. */
  levels: [string, string][]
  /** What the structure callouts point at: [part, detail]. */
  callouts: [string, string][]
  progress: {
    title: string
    project: string
    /** "Week {n} / {total}" */
    week: string
    /** `{date}`: the month of the handover, as in `handover.date`. */
    handover: string
    phases: [string, string][]
    today: string
  }
  /** `{date}` in `date`: the month the keys are handed over — eight months from today. */
  handover: { title: string; date: string; items: string[] }
}

const vi: ConstructionCopy = {
  documentTitle: 'Xây dựng — VILLA NEST',
  name: 'Xây dựng',
  description:
    'Xây dựng biệt thự VILLA NEST: thiết kế BIM, kết cấu bê tông cốt thép đúng chuẩn, tiến độ minh bạch theo từng tuần và bàn giao kèm bảo hành dài hạn.',
  stripLabel: 'Tiêu chuẩn thi công',
  strip: [
    { name: 'BIM 3D', note: 'Mô phỏng trước khi xây' },
    { name: 'Địa chất', note: 'Khảo sát trước khi đặt móng' },
    { name: 'Bê tông', note: 'Nén mẫu 28 ngày' },
    { name: 'Thép', note: 'Có chứng chỉ xuất xưởng' },
    { name: 'Giám sát 24/7', note: 'Camera công trường' },
    { name: 'Bảo hành 5 năm', note: 'Kết cấu & chống thấm' },
  ],
  index: 'Construction',
  tryIt: 'Kéo đường laser để xem mô hình BIM trở thành công trình.',
  features: {
    design: { title: 'Thiết kế\n& BIM', note: 'Bản vẽ trước, công trình sau.' },
    structure: { title: 'Kết cấu\nvững chắc', note: 'Từ móng đến mái.' },
    progress: { title: 'Tiến độ\nminh bạch', note: 'Theo dõi từng tuần.' },
    handover: { title: 'Bàn giao\nkỹ càng', note: 'Hoàn công & bảo hành.' },
  },
  themes: {
    design: {
      kicker: 'Từ bản vẽ đến công trình',
      headline: 'Vững từ móng.',
      accent: 'Chuẩn đến từng chi tiết.',
      description:
        'Kết cấu, giáo chống và ván khuôn được tổ chức chặt chẽ — mỗi giai đoạn thi công đều minh bạch, an toàn và đúng tiến độ, bắt đầu từ mô hình BIM và khảo sát địa chất.',
    },
    structure: {
      kicker: 'Kết cấu & vật liệu',
      headline: 'Khung bê tông\nđúng chuẩn.',
      accent: 'Bê tông, thép đạt chuẩn.',
      description:
        'Cột, dầm, sàn được tính theo tải trọng thực; cốt thép nghiệm thu trước mỗi lần đổ, mẫu bê tông nén thử ở 28 ngày, ván khuôn chỉ tháo khi bê tông đủ cường độ.',
    },
    progress: {
      kicker: 'Thi công minh bạch',
      headline: 'Công trường\ntrong lòng bàn tay.',
      accent: 'Tiến độ, chi phí, hình ảnh mỗi ngày.',
      description:
        'Chủ nhà theo dõi tiến độ từng hạng mục, nhật ký và camera công trường ngay trên điện thoại — mọi phát sinh đều được báo trước và duyệt trước khi làm.',
    },
    handover: {
      kicker: 'Bàn giao & bảo hành',
      headline: 'Nhận chìa khóa,\nan tâm dài lâu.',
      accent: 'Bảo hành kết cấu 5 năm.',
      description:
        'Nghiệm thu cùng chủ nhà từng hạng mục, bàn giao hồ sơ hoàn công, bản vẽ điện nước và lịch bảo trì — VILLA NEST tiếp tục đồng hành sau ngày dọn vào.',
    },
  },
  model: 'BIM 3D',
  built: 'Thực tế',
  handle: 'Kéo để so sánh mô hình BIM và công trình',
  builtValue: 'Đã xây {n}%',
  levels: [
    ['Mái', '+7.20'],
    ['Sàn tầng 2', '+3.60'],
    ['Sàn tầng 1', '±0.00'],
  ],
  callouts: [
    ['Cột 400 × 400', 'Bê tông đạt chuẩn'],
    ['Dầm 300 × 600', 'Thép có chứng chỉ'],
    ['Sàn BTCT 150 mm', 'Đổ liền khối'],
    ['Giàn chống, ván khuôn', 'Tháo sau 21 ngày'],
  ],
  progress: {
    title: 'Tiến độ công trình',
    project: 'Dự án minh họa · Biệt thự 2 tầng',
    week: 'Tuần {n} / {total}',
    handover: 'Bàn giao dự kiến {date}',
    phases: [
      ['Móng & tầng trệt', 'T1–8'],
      ['Khung bê tông', 'T9–20'],
      ['Mái & bao che', 'T21–28'],
      ['Hoàn thiện', 'T29–38'],
    ],
    today: 'Hôm nay: đổ bê tông sàn mái · 24 nhân sự · 31°C',
  },
  handover: {
    title: 'Bàn giao',
    date: 'Nhận chìa khóa · {date}',
    items: ['Bảo hành kết cấu 5 năm', 'Bảo hành chống thấm 5 năm', 'Hồ sơ hoàn công, bản vẽ điện nước', 'Bảo trì định kỳ 12 tháng đầu'],
  },
}

const en: ConstructionCopy = {
  documentTitle: 'Construction — VILLA NEST',
  name: 'Construction',
  description:
    'VILLA NEST villa construction: BIM design, a reinforced-concrete structure built to standard, week-by-week transparent progress and a handover with long-term warranty.',
  stripLabel: 'Building standards',
  strip: [
    { name: 'BIM 3D', note: 'Simulated before it is built' },
    { name: 'Soil survey', note: 'Before the foundations' },
    { name: 'Concrete', note: 'Cube tests at 28 days' },
    { name: 'Steel', note: 'Mill certificates' },
    { name: '24/7 monitoring', note: 'Site cameras' },
    { name: '5-year warranty', note: 'Structure & waterproofing' },
  ],
  index: 'Construction',
  tryIt: 'Drag the laser line to watch the BIM model become a building.',
  features: {
    design: { title: 'Design\n& BIM', note: 'Drawn first, then built.' },
    structure: { title: 'Solid\nstructure', note: 'From footing to roof.' },
    progress: { title: 'Transparent\nprogress', note: 'Followed week by week.' },
    handover: { title: 'Thorough\nhandover', note: 'As-built files & warranty.' },
  },
  themes: {
    design: {
      kicker: 'From drawing to structure',
      headline: 'Solid from the ground up.',
      accent: 'Precise in every detail.',
      description:
        'Structure, shoring and formwork, organised with rigour — every phase of the build transparent, safe and on schedule, starting from a BIM model and a soil survey.',
    },
    structure: {
      kicker: 'Structure & materials',
      headline: 'A concrete frame\nbuilt to standard.',
      accent: 'Concrete and steel to standard.',
      description:
        'Columns, beams and slabs sized for the real loads; the rebar inspected before every pour, concrete cubes tested at 28 days, formwork struck only once the concrete is strong enough.',
    },
    progress: {
      kicker: 'Transparent building',
      headline: 'The site\nin the palm of your hand.',
      accent: 'Progress, costs and photos every day.',
      description:
        'Owners follow every work package, the site diary and the site cameras on their phone — any change is announced and approved before it is made.',
    },
    handover: {
      kicker: 'Handover & warranty',
      headline: 'Take the keys,\nrest easy for years.',
      accent: 'A 5-year structural warranty.',
      description:
        'Every package inspected with the owner, the as-built files, wiring and plumbing drawings and the maintenance plan handed over — VILLA NEST stays by your side after moving day.',
    },
  },
  model: 'BIM 3D',
  built: 'Built',
  handle: 'Drag to compare the BIM model with the building',
  builtValue: '{n}% built',
  levels: [
    ['Roof', '+7.20'],
    ['Level 2', '+3.60'],
    ['Level 1', '±0.00'],
  ],
  callouts: [
    ['Column 400 × 400', 'Tested concrete'],
    ['Beam 300 × 600', 'Certified rebar'],
    ['150 mm RC slab', 'Cast monolithic'],
    ['Shoring & formwork', 'Struck after 21 days'],
  ],
  progress: {
    title: 'Site progress',
    project: 'Sample project · Two-storey villa',
    week: 'Week {n} / {total}',
    handover: 'Handover planned {date}',
    phases: [
      ['Foundations & ground floor', 'W1–8'],
      ['Concrete frame', 'W9–20'],
      ['Roof & envelope', 'W21–28'],
      ['Finishes', 'W29–38'],
    ],
    today: 'Today: pouring the roof slab · 24 on site · 31°C',
  },
  handover: {
    title: 'Handover',
    date: 'Keys handed over · {date}',
    items: [
      '5-year structural warranty',
      '5-year waterproofing warranty',
      'As-built files, wiring & plumbing drawings',
      'Maintenance for the first 12 months',
    ],
  },
}

export const constructionCopy: Record<Lang, ConstructionCopy> = { vi, en }
