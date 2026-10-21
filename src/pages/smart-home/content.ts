import type { Lang } from '../../i18n/strings'

/** The four themes of the page. */
export type ThemeId = 'scenes' | 'security' | 'energy' | 'open'
export type SceneId = 'home' | 'relax' | 'sleep'

/** One theme: the text beside the panel, and its call to action. */
export interface ThemeCopy {
  kicker: string
  /** `\n` = a line break of its own. */
  headline: string
  accent: string
  description: string
  cta: string
}

export interface PageCopy {
  documentTitle: string
  description: string
  protocolsLabel: string
  protocols: { name: string; note: string }[]
  index: string
  watch: string
  stop: string
  /** After "Explore": the panel can be used. */
  tryIt: string
  /** Phones: the living scene told step by step under the photo. */
  story: { title: string; replay: string }
  features: Record<ThemeId, { title: string; note: string }>
  themes: Record<ThemeId, ThemeCopy>
  panel: {
    label: string
    nav: { home: string; scenes: string; energy: string; security: string; settings: string }
    city: string
    lights: string
    lightsNote: string
    curtain: string
    curtainNote: string
    ac: string
    homeMode: string
    homeModeNote: string
    sleepMode: string
    sleepModeNote: string
    security: string
    armed: string
    disarmed: string
    on: string
    off: string
    open: string
    closed: string
    brightness: string
    curtainLevel: string
    temperature: string
    /** The other screens of the panel. */
    scenesTitle: string
    securityTitle: string
    cameras: [string, string]
    /** How each camera sees at night. */
    cameraModes: [string, string]
    /** What the gate camera has picked out. */
    detected: string
    live: string
    locks: [string, string][]
    energyTitle: string
    today: string
    unit: string
    drawTitle: string
    draw: { lights: string; ac: string; pool: string; standby: string }
    networksTitle: string
    networks: [string, string][]
  }
  scenes: Record<SceneId, { time: string; name: string; does: string }>
}

const vi: PageCopy = {
  documentTitle: 'Smart Home — VILLA NEST',
  description:
    'Nhà thông minh VILLA NEST: ánh sáng, rèm, điều hòa, an ninh và cảm biến liên kết trong một hệ sinh thái mở — Matter, Zigbee, Thread, Wi-Fi.',
  protocolsLabel: 'Chuẩn kết nối và nền tảng',
  protocols: [
    { name: 'Matter', note: 'Tương thích rộng rãi' },
    { name: 'Zigbee', note: 'Kết nối ổn định' },
    { name: 'Thread', note: 'Mạng lưới bền vững' },
    { name: 'Wi-Fi', note: 'Linh hoạt mọi không gian' },
    { name: 'Home Assistant', note: 'Tự động hóa mạnh mẽ' },
    { name: 'HomeKit', note: 'An toàn & riêng tư' },
  ],
  index: 'Smart Home',
  watch: 'Xem kịch bản sống',
  stop: 'Dừng kịch bản',
  tryIt: 'Chạm vào bảng điều khiển để thử: đèn, rèm, điều hòa, an ninh.',
  story: { title: 'Một buổi tối ở Villa Nest', replay: 'Xem lại kịch bản' },
  features: {
    scenes: { title: 'Kịch bản', note: 'Về nhà, thư giãn, ngủ ngon.' },
    security: { title: 'An ninh', note: 'Theo dõi và kiểm soát từ xa.' },
    energy: { title: 'Năng lượng', note: 'Thông minh trong từng chuyển động.' },
    open: { title: 'Hệ thống', note: 'Matter • Zigbee • Thread • Wi-Fi.' },
  },
  themes: {
    scenes: {
      kicker: 'Ngôi nhà biết lắng nghe',
      headline: 'Chạm nhẹ, cả ngôi nhà\nchuyển động.',
      accent: 'Công nghệ ẩn mình, trải nghiệm lên tiếng.',
      description:
        'Ánh sáng, rèm, điều hòa, an ninh và cảm biến liên kết trong một hệ sinh thái tinh gọn — để ngôi nhà hiểu thói quen sống của bạn và phản hồi đúng lúc.',
      cta: 'Khám phá Smart Home',
    },
    security: {
      kicker: 'An ninh thông minh',
      headline: 'Ở đâu cũng thấy\nngôi nhà của mình.',
      accent: 'Theo dõi và kiểm soát từ xa.',
      description:
        'Camera, khóa cửa và cảm biến báo về điện thoại ngay khi có chuyển động — mở cửa cho người thân, bật báo động khi đi vắng, chỉ với một chạm.',
      cta: 'Khám phá an ninh',
    },
    energy: {
      kicker: 'Tiết kiệm năng lượng',
      headline: 'Điện chỉ dùng\nkhi thật sự cần.',
      accent: 'Thông minh trong từng chuyển động.',
      description:
        'Đèn và điều hòa tự tắt khi phòng trống, rèm điều chỉnh theo nắng, thiết bị chờ được ngắt khi không dùng — và bạn thấy điện năng của từng thiết bị theo thời gian thực.',
      cta: 'Khám phá năng lượng',
    },
    open: {
      kicker: 'Hệ mở',
      headline: 'Một hệ sinh thái,\nmọi thiết bị.',
      accent: 'Matter • Zigbee • Thread • Wi-Fi.',
      description:
        'Không khóa chặt vào một hãng: VILLA NEST thiết kế trên các chuẩn mở, để bạn thêm thiết bị mới bất cứ lúc nào và điều khiển bằng Home Assistant, Apple Home hay ứng dụng quen thuộc.',
      cta: 'Khám phá hệ mở',
    },
  },
  panel: {
    label: 'Bảng điều khiển nhà thông minh',
    nav: { home: 'Trang chủ', scenes: 'Kịch bản', energy: 'Năng lượng', security: 'An ninh', settings: 'Cài đặt' },
    city: 'Hà Nội',
    lights: 'Đèn',
    lightsNote: '4 phòng',
    curtain: 'Rèm cửa',
    curtainNote: 'Phòng khách',
    ac: 'Điều hòa',
    homeMode: 'Chế độ về nhà',
    homeModeNote: 'Bật tất cả',
    sleepMode: 'Chế độ ngủ',
    sleepModeNote: 'Tắt đèn, khóa cửa',
    security: 'An ninh',
    armed: 'Đang kích hoạt',
    disarmed: 'Đã tắt',
    on: 'Đang bật',
    off: 'Đã tắt',
    open: 'Đang mở',
    closed: 'Đóng {n}%',
    brightness: 'Độ sáng đèn',
    curtainLevel: 'Độ đóng rèm',
    temperature: 'Nhiệt độ điều hòa',
    scenesTitle: 'Kịch bản',
    securityTitle: 'An ninh',
    cameras: ['Sân vườn', 'Cổng chính'],
    cameraModes: ['Màu ban đêm', 'Hồng ngoại'],
    detected: 'Xe · 97%',
    live: 'Trực tiếp',
    locks: [
      ['Cửa chính', 'Đã khóa'],
      ['Cửa gara', 'Đã khóa'],
      ['Cảm biến khói', 'Bình thường'],
    ],
    energyTitle: 'Năng lượng',
    today: 'Hôm nay',
    unit: 'kWh',
    drawTitle: 'Đang dùng',
    draw: { lights: 'Đèn', ac: 'Điều hòa', pool: 'Bơm hồ bơi', standby: 'Thiết bị chờ' },
    networksTitle: 'Thiết bị & nền tảng',
    networks: [
      ['18 thiết bị', 'Hoạt động'],
      ['24 thiết bị', 'Hoạt động'],
      ['9 thiết bị', 'Hoạt động'],
      ['6 thiết bị', 'Hoạt động'],
      ['Trung tâm tự động hóa', 'Đã kết nối'],
      ['Apple Home', 'Đã kết nối'],
    ],
  },
  scenes: {
    home: { time: '18:00', name: 'Về nhà', does: 'Bật đèn, mở rèm, điều hòa 25 °C, tắt báo động' },
    relax: { time: '20:30', name: 'Thư giãn', does: 'Đèn ấm 40 %, rèm khép hờ, điều hòa 26 °C' },
    sleep: { time: '23:00', name: 'Ngủ ngon', does: 'Tắt đèn, kéo rèm, khóa cửa, bật báo động' },
  },
}

const en: PageCopy = {
  documentTitle: 'Smart Home — VILLA NEST',
  description:
    'VILLA NEST smart homes: lighting, curtains, climate, security and sensors in one open ecosystem — Matter, Zigbee, Thread, Wi-Fi.',
  protocolsLabel: 'Standards and platforms',
  protocols: [
    { name: 'Matter', note: 'Works with everything' },
    { name: 'Zigbee', note: 'Rock-solid links' },
    { name: 'Thread', note: 'A resilient mesh' },
    { name: 'Wi-Fi', note: 'Flexible in every room' },
    { name: 'Home Assistant', note: 'Powerful automation' },
    { name: 'HomeKit', note: 'Safe & private' },
  ],
  index: 'Smart Home',
  watch: 'Watch a living scene',
  stop: 'Stop the scene',
  tryIt: 'Touch the panel to try it: lights, curtains, air con, security.',
  story: { title: 'An evening at Villa Nest', replay: 'Watch again' },
  features: {
    scenes: { title: 'Scenes', note: 'Home, unwind, sleep well.' },
    security: { title: 'Security', note: 'Watch and control from anywhere.' },
    energy: { title: 'Energy', note: 'Smart in every movement.' },
    open: { title: 'System', note: 'Matter • Zigbee • Thread • Wi-Fi.' },
  },
  themes: {
    scenes: {
      kicker: 'A home that listens',
      headline: 'One light touch, and the\nwhole home moves.',
      accent: 'Technology out of sight, experience in the spotlight.',
      description:
        'Lighting, curtains, climate, security and sensors joined in one lean ecosystem — so your home learns how you live and answers at the right moment.',
      cta: 'Explore Smart Home',
    },
    security: {
      kicker: 'Smart security',
      headline: 'Your home in view,\nwherever you are.',
      accent: 'Watch and control from anywhere.',
      description:
        'Cameras, locks and sensors report to your phone the moment something moves — let family in, arm the alarm when you are away, all with one touch.',
      cta: 'Explore security',
    },
    energy: {
      kicker: 'Energy saving',
      headline: 'Power only\nwhen it is needed.',
      accent: 'Smart in every movement.',
      description:
        'Lights and air con switch off in empty rooms, curtains follow the sun, idle devices are cut off — and you see the power of every device in real time.',
      cta: 'Explore energy',
    },
    open: {
      kicker: 'Open system',
      headline: 'One ecosystem,\nevery device.',
      accent: 'Matter • Zigbee • Thread • Wi-Fi.',
      description:
        'No lock-in to one brand: VILLA NEST designs on open standards, so you can add new devices at any time and use Home Assistant, Apple Home or the apps you know.',
      cta: 'Explore the open system',
    },
  },
  panel: {
    label: 'Smart-home control panel',
    nav: { home: 'Home', scenes: 'Scenes', energy: 'Energy', security: 'Security', settings: 'Settings' },
    city: 'Hanoi',
    lights: 'Lights',
    lightsNote: '4 rooms',
    curtain: 'Curtains',
    curtainNote: 'Living room',
    ac: 'Air con',
    homeMode: 'Home mode',
    homeModeNote: 'All on',
    sleepMode: 'Sleep mode',
    sleepModeNote: 'Lights off, doors locked',
    security: 'Security',
    armed: 'Armed',
    disarmed: 'Off',
    on: 'On',
    off: 'Off',
    open: 'Open',
    closed: '{n}% closed',
    brightness: 'Light brightness',
    curtainLevel: 'How far the curtains are closed',
    temperature: 'Air-con temperature',
    scenesTitle: 'Scenes',
    securityTitle: 'Security',
    cameras: ['Garden', 'Front gate'],
    cameraModes: ['Colour night', 'Infrared'],
    detected: 'Car · 97%',
    live: 'Live',
    locks: [
      ['Front door', 'Locked'],
      ['Garage door', 'Locked'],
      ['Smoke sensor', 'Normal'],
    ],
    energyTitle: 'Energy',
    today: 'Today',
    unit: 'kWh',
    drawTitle: 'In use',
    draw: { lights: 'Lights', ac: 'Air con', pool: 'Pool pump', standby: 'Standby' },
    networksTitle: 'Devices & platforms',
    networks: [
      ['18 devices', 'Running'],
      ['24 devices', 'Running'],
      ['9 devices', 'Running'],
      ['6 devices', 'Running'],
      ['Automation hub', 'Connected'],
      ['Apple Home', 'Connected'],
    ],
  },
  scenes: {
    home: { time: '18:00', name: 'Coming home', does: 'Lights on, curtains open, air con 25 °C, alarm off' },
    relax: { time: '20:30', name: 'Unwind', does: 'Warm light at 40 %, curtains half drawn, air con 26 °C' },
    sleep: { time: '23:00', name: 'Good night', does: 'Lights off, curtains drawn, doors locked, alarm on' },
  },
}

export const pageCopy: Record<Lang, PageCopy> = { vi, en }
