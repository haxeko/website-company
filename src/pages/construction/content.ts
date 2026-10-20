import type { Lang } from '../../i18n/strings'
import type { DeckText, StoryStep } from '../shared/Deck'

/** The four phases of the build: the page's themes, in order. */
export type PhaseId = 'design' | 'structure' | 'progress' | 'handover'

export interface ConstructionCopy {
  documentTitle: string
  description: string
  stripLabel: string
  strip: { name: string; note: string }[]
  index: string
  watch: string
  stop: string
  /** After "Explore": the laser line can be dragged. */
  tryIt: string
  features: Record<PhaseId, { title: string; note: string }>
  themes: Record<PhaseId, DeckText & { cta: string }>
  /** The two sides of the laser line, and its handle. */
  drawing: string
  built: string
  handle: string
  /** "{n}% built", for the handle's value. */
  builtValue: string
  /** The drawing's floor levels, top down: [name, level]. */
  levels: [string, string][]
  /** What the structure callouts point at: [part, detail]. */
  callouts: [string, string][]
  progress: {
    title: string
    project: string
    /** "Week {n} / {total}" */
    week: string
    handover: string
    phases: [string, string][]
    today: string
  }
  handover: { title: string; date: string; items: string[] }
  story: { title: string; replay: string; steps: StoryStep[] }
}

const vi: ConstructionCopy = {
  documentTitle: 'Xây dựng — VILLA NEST',
  description:
    'Xây dựng biệt thự VILLA NEST: thiết kế BIM, kết cấu bê tông cốt thép đúng chuẩn, tiến độ minh bạch theo từng tuần và bàn giao kèm bảo hành dài hạn.',
  stripLabel: 'Tiêu chuẩn thi công',
  strip: [
    { name: 'BIM 3D', note: 'Mô phỏng trước khi xây' },
    { name: 'Địa chất', note: 'Khảo sát trước khi đặt móng' },
    { name: 'Bê tông M350', note: 'Nén mẫu 7 & 28 ngày' },
    { name: 'Thép CB400', note: 'Có chứng chỉ xuất xưởng' },
    { name: 'Giám sát 24/7', note: 'Camera công trường' },
    { name: 'Bảo hành 10 năm', note: 'Kết cấu & chống thấm' },
  ],
  index: 'Construction',
  watch: 'Xem quá trình xây dựng',
  stop: 'Dừng',
  tryIt: 'Kéo đường laser để xem bản vẽ trở thành công trình.',
  features: {
    design: { title: 'Thiết kế & BIM', note: 'Bản vẽ trước, công trình sau.' },
    structure: { title: 'Kết cấu', note: 'Vững từ móng đến mái.' },
    progress: { title: 'Tiến độ minh bạch', note: 'Theo dõi từng tuần.' },
    handover: { title: 'Bàn giao', note: 'Hoàn công & bảo hành.' },
  },
  themes: {
    design: {
      kicker: 'Từ bản vẽ đến công trình',
      headline: 'Vững từ móng.',
      accent: 'Chuẩn đến từng mạch bê tông.',
      description:
        'Kết cấu, giáo chống và ván khuôn được tổ chức chặt chẽ — mỗi giai đoạn thi công đều minh bạch, an toàn và đúng tiến độ, bắt đầu từ mô hình BIM và khảo sát địa chất.',
      cta: 'Khám phá dự án',
    },
    structure: {
      kicker: 'Kết cấu & vật liệu',
      headline: 'Khung bê tông\nđúng chuẩn.',
      accent: 'Bê tông M350, thép CB400.',
      description:
        'Cột, dầm, sàn được tính theo tải trọng thực; cốt thép nghiệm thu trước mỗi lần đổ, mẫu bê tông nén thử ở 7 và 28 ngày, ván khuôn chỉ tháo khi bê tông đủ cường độ.',
      cta: 'Xem kết cấu',
    },
    progress: {
      kicker: 'Thi công minh bạch',
      headline: 'Công trường\ntrong lòng bàn tay.',
      accent: 'Tiến độ, chi phí, hình ảnh mỗi ngày.',
      description:
        'Chủ nhà theo dõi tiến độ từng hạng mục, nhật ký và camera công trường ngay trên điện thoại — mọi phát sinh đều được báo trước và duyệt trước khi làm.',
      cta: 'Xem tiến độ',
    },
    handover: {
      kicker: 'Bàn giao & bảo hành',
      headline: 'Nhận chìa khóa,\nan tâm dài lâu.',
      accent: 'Bảo hành kết cấu 10 năm.',
      description:
        'Nghiệm thu cùng chủ nhà từng hạng mục, bàn giao hồ sơ hoàn công, bản vẽ điện nước và lịch bảo trì — VILLA NEST tiếp tục đồng hành sau ngày dọn vào.',
      cta: 'Xem bàn giao',
    },
  },
  drawing: 'Bản vẽ',
  built: 'Thực tế',
  handle: 'Kéo để so sánh bản vẽ và công trình',
  builtValue: 'Đã xây {n}%',
  levels: [
    ['Mái', '+7.20'],
    ['Sàn tầng 2', '+3.60'],
    ['Sàn tầng 1', '±0.00'],
  ],
  callouts: [
    ['Cột 400 × 400', 'Bê tông M350'],
    ['Dầm 300 × 600', 'Thép CB400'],
    ['Sàn BTCT 150 mm', 'Đổ liền khối'],
    ['Giàn chống, ván khuôn', 'Tháo sau 21 ngày'],
  ],
  progress: {
    title: 'Tiến độ công trình',
    project: 'Dự án minh họa · Biệt thự 2 tầng',
    week: 'Tuần {n} / {total}',
    handover: 'Bàn giao dự kiến 12/2026',
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
    date: 'Nhận chìa khóa · 12/2026',
    items: ['Bảo hành kết cấu 10 năm', 'Bảo hành chống thấm 5 năm', 'Hồ sơ hoàn công, bản vẽ điện nước', 'Bảo trì định kỳ 12 tháng đầu'],
  },
  story: {
    title: 'Hành trình một công trình',
    replay: 'Xem lại',
    steps: [
      { time: 'Tháng 1–2', name: 'Thiết kế', does: 'Khảo sát, kiến trúc, kết cấu, BIM 3D và giấy phép xây dựng.' },
      { time: 'Tháng 3–6', name: 'Kết cấu', does: 'Móng, cột, dầm, sàn — nghiệm thu thép trước mỗi lần đổ.' },
      { time: 'Tháng 7–9', name: 'Thi công', does: 'Mái, bao che, điện nước, hoàn thiện — báo cáo mỗi tuần.' },
      { time: 'Tháng 10', name: 'Bàn giao', does: 'Nghiệm thu, hồ sơ hoàn công, bảo hành và bảo trì.' },
    ],
  },
}

const en: ConstructionCopy = {
  documentTitle: 'Construction — VILLA NEST',
  description:
    'VILLA NEST villa construction: BIM design, a reinforced-concrete structure built to standard, week-by-week transparent progress and a handover with long-term warranty.',
  stripLabel: 'Building standards',
  strip: [
    { name: 'BIM 3D', note: 'Simulated before it is built' },
    { name: 'Soil survey', note: 'Before the foundations' },
    { name: 'M350 concrete', note: 'Cube tests at 7 & 28 days' },
    { name: 'CB400 steel', note: 'Mill certificates' },
    { name: '24/7 monitoring', note: 'Site cameras' },
    { name: '10-year warranty', note: 'Structure & waterproofing' },
  ],
  index: 'Construction',
  watch: 'Watch the build',
  stop: 'Stop',
  tryIt: 'Drag the laser line to watch the drawing become a building.',
  features: {
    design: { title: 'Design & BIM', note: 'Drawn first, then built.' },
    structure: { title: 'Structure', note: 'Solid from footing to roof.' },
    progress: { title: 'Transparent progress', note: 'Followed week by week.' },
    handover: { title: 'Handover', note: 'As-built files & warranty.' },
  },
  themes: {
    design: {
      kicker: 'From drawing to structure',
      headline: 'Solid from the ground up.',
      accent: 'Precise to every pour.',
      description:
        'Structure, shoring and formwork, organised with rigour — every phase of the build transparent, safe and on schedule, starting from a BIM model and a soil survey.',
      cta: 'Explore projects',
    },
    structure: {
      kicker: 'Structure & materials',
      headline: 'A concrete frame\nbuilt to standard.',
      accent: 'M350 concrete, CB400 steel.',
      description:
        'Columns, beams and slabs sized for the real loads; the rebar inspected before every pour, concrete cubes tested at 7 and 28 days, formwork struck only once the concrete is strong enough.',
      cta: 'See the structure',
    },
    progress: {
      kicker: 'Transparent building',
      headline: 'The site\nin the palm of your hand.',
      accent: 'Progress, costs and photos every day.',
      description:
        'Owners follow every work package, the site diary and the site cameras on their phone — any change is announced and approved before it is made.',
      cta: 'See the progress',
    },
    handover: {
      kicker: 'Handover & warranty',
      headline: 'Take the keys,\nrest easy for years.',
      accent: 'A 10-year structural warranty.',
      description:
        'Every package inspected with the owner, the as-built files, wiring and plumbing drawings and the maintenance plan handed over — VILLA NEST stays by your side after moving day.',
      cta: 'See the handover',
    },
  },
  drawing: 'Drawing',
  built: 'Built',
  handle: 'Drag to compare the drawing with the building',
  builtValue: '{n}% built',
  levels: [
    ['Roof', '+7.20'],
    ['Level 2', '+3.60'],
    ['Level 1', '±0.00'],
  ],
  callouts: [
    ['Column 400 × 400', 'M350 concrete'],
    ['Beam 300 × 600', 'CB400 steel'],
    ['150 mm RC slab', 'Cast monolithic'],
    ['Shoring & formwork', 'Struck after 21 days'],
  ],
  progress: {
    title: 'Site progress',
    project: 'Sample project · Two-storey villa',
    week: 'Week {n} / {total}',
    handover: 'Handover planned 12/2026',
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
    date: 'Keys handed over · 12/2026',
    items: [
      '10-year structural warranty',
      '5-year waterproofing warranty',
      'As-built files, wiring & plumbing drawings',
      'Maintenance for the first 12 months',
    ],
  },
  story: {
    title: 'The journey of a build',
    replay: 'Watch again',
    steps: [
      { time: 'Months 1–2', name: 'Design', does: 'Survey, architecture, structure, BIM model and the building permit.' },
      { time: 'Months 3–6', name: 'Structure', does: 'Footings, columns, beams, slabs — rebar inspected before every pour.' },
      { time: 'Months 7–9', name: 'Building', does: 'Roof, envelope, services, finishes — reported every week.' },
      { time: 'Month 10', name: 'Handover', does: 'Inspection, as-built files, warranty and maintenance.' },
    ],
  },
}

export const constructionCopy: Record<Lang, ConstructionCopy> = { vi, en }
