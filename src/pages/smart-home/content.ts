import type { Lang } from '../../i18n/strings'

/** The four themes of the hero carousel, each with its own section further down the page. */
export type SectionId = 'scenes' | 'security' | 'energy' | 'open'
export type SceneId = 'home' | 'relax' | 'sleep'

/** One theme of the hero carousel: the text beside the panel, and its call to action. */
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
  back: string
  protocols: { name: string; note: string }[]
  index: string
  watch: string
  stop: string
  features: Record<SectionId, { title: string; note: string }>
  themes: Record<SectionId, ThemeCopy>
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
  sections: {
    scenes: { lead: string; steps: string }
    security: { lead: string; points: [string, string][]; status: [string, string][] }
    energy: { lead: string; points: [string, string][]; chartTitle: string; chartNote: string; days: string[] }
    open: { lead: string; platforms: [string, string][] }
  }
  outro: { title: string; text: string; home: string; construction: string; interior: string }
}

const vi: PageCopy = {
  documentTitle: 'Smart Home — VILLA NEST',
  description:
    'Nhà thông minh VILLA NEST: ánh sáng, rèm, điều hòa, an ninh và cảm biến liên kết trong một hệ sinh thái mở — Matter, Zigbee, Thread, Wi-Fi.',
  back: 'Trang chủ',
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
  features: {
    scenes: { title: 'Kịch bản sống', note: 'Về nhà, thư giãn, ngủ ngon.' },
    security: { title: 'An ninh thông minh', note: 'Theo dõi và kiểm soát từ xa.' },
    energy: { title: 'Tiết kiệm năng lượng', note: 'Thông minh trong từng chuyển động.' },
    open: { title: 'Hệ mở', note: 'Matter • Zigbee • Thread • Wi-Fi.' },
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
  sections: {
    scenes: {
      lead: 'Một chạm cho cả chuỗi thao tác: ánh sáng, rèm, điều hòa và an ninh tự đổi theo từng khoảnh khắc trong ngày — theo giờ, theo cảm biến, hay khi bạn vừa về tới cổng.',
      steps: 'Chạm một kịch bản để xem ngôi nhà đổi theo.',
    },
    security: {
      lead: 'Camera, khóa cửa và cảm biến báo về điện thoại ngay khi có chuyển động — bạn luôn biết ngôi nhà đang thế nào, dù ở bất cứ đâu.',
      points: [
        ['Camera nhận diện', 'Phân biệt người, xe và vật nuôi; ghi hình khi có sự kiện.'],
        ['Khóa cửa thông minh', 'Vân tay, mã số hoặc từ xa; biết ai mở cửa, lúc nào.'],
        ['Cảm biến an toàn', 'Cửa, chuyển động, khói, rò nước — cảnh báo tức thì.'],
      ],
      status: [
        ['Cửa chính', 'Đã khóa'],
        ['Camera sân vườn', 'Đang ghi'],
        ['Cảm biến khói', 'Bình thường'],
        ['Cảm biến rò nước', 'Bình thường'],
      ],
    },
    energy: {
      lead: 'Đèn và điều hòa chỉ chạy khi có người, rèm tự điều chỉnh theo nắng, thiết bị chờ được ngắt khi không dùng — và bạn thấy điện năng của từng thiết bị theo thời gian thực.',
      points: [
        ['Cảm biến hiện diện', 'Phòng trống thì đèn, điều hòa tự tắt.'],
        ['Theo nắng và mùa', 'Rèm, ánh sáng, điều hòa đổi theo giờ trong ngày.'],
        ['Đo điện từng thiết bị', 'Biết thiết bị nào tốn điện để điều chỉnh.'],
      ],
      chartTitle: 'Điện năng tuần này',
      chartNote: 'Minh họa giao diện theo dõi điện năng',
      days: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
    },
    open: {
      lead: 'Không khóa chặt vào một hãng: VILLA NEST thiết kế trên các chuẩn mở, để bạn thêm thiết bị mới bất cứ lúc nào và điều khiển bằng ứng dụng quen thuộc.',
      platforms: [
        ['Matter', 'Chuẩn chung giữa các hãng lớn'],
        ['Zigbee', 'Cảm biến, công tắc tiết kiệm pin'],
        ['Thread', 'Mạng lưới tự phục hồi, phản hồi nhanh'],
        ['Wi-Fi', 'Camera, thiết bị băng thông lớn'],
        ['Home Assistant', 'Trung tâm tự động hóa tại chỗ'],
        ['HomeKit', 'Điều khiển bằng iPhone, Siri'],
      ],
    },
  },
  outro: {
    title: 'Sẵn sàng cho ngôi nhà biết lắng nghe?',
    text: 'Smart Home được thiết kế cùng kiến trúc và nội thất ngay từ đầu — dây, cảm biến và bảng điều khiển ẩn gọn trong từng không gian.',
    home: 'Về trang chủ',
    construction: 'Xây dựng',
    interior: 'Nội thất',
  },
}

const en: PageCopy = {
  documentTitle: 'Smart Home — VILLA NEST',
  description:
    'VILLA NEST smart homes: lighting, curtains, climate, security and sensors in one open ecosystem — Matter, Zigbee, Thread, Wi-Fi.',
  back: 'Home',
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
  features: {
    scenes: { title: 'Living scenes', note: 'Home, unwind, sleep well.' },
    security: { title: 'Smart security', note: 'Watch and control from anywhere.' },
    energy: { title: 'Energy saving', note: 'Smart in every movement.' },
    open: { title: 'Open system', note: 'Matter • Zigbee • Thread • Wi-Fi.' },
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
  sections: {
    scenes: {
      lead: 'One touch for a whole chain of actions: light, curtains, climate and security follow every moment of the day — by the clock, by the sensors, or the moment you reach the gate.',
      steps: 'Tap a scene to watch the home follow.',
    },
    security: {
      lead: 'Cameras, locks and sensors report to your phone the moment something moves — you always know how your home is, wherever you are.',
      points: [
        ['Smart cameras', 'Tell people, cars and pets apart; record when something happens.'],
        ['Smart locks', 'Fingerprint, code or remote; know who opened the door, and when.'],
        ['Safety sensors', 'Doors, motion, smoke, leaks — instant alerts.'],
      ],
      status: [
        ['Front door', 'Locked'],
        ['Garden camera', 'Recording'],
        ['Smoke sensor', 'Normal'],
        ['Leak sensor', 'Normal'],
      ],
    },
    energy: {
      lead: 'Lights and air con run only when someone is there, curtains follow the sun, idle devices are switched off — and you see the power of every device in real time.',
      points: [
        ['Presence sensors', 'An empty room switches its lights and air con off.'],
        ['Sun and season', 'Curtains, light and climate follow the time of day.'],
        ['Per-device metering', 'See which device uses the most, and adjust.'],
      ],
      chartTitle: 'Energy this week',
      chartNote: 'Illustration of the energy-monitoring screen',
      days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    },
    open: {
      lead: 'No lock-in to one brand: VILLA NEST designs on open standards, so you can add new devices at any time and use the apps you already know.',
      platforms: [
        ['Matter', 'The common standard of the big brands'],
        ['Zigbee', 'Battery-friendly sensors and switches'],
        ['Thread', 'A self-healing, fast mesh'],
        ['Wi-Fi', 'Cameras and high-bandwidth devices'],
        ['Home Assistant', 'A local automation hub'],
        ['HomeKit', 'Control from iPhone and Siri'],
      ],
    },
  },
  outro: {
    title: 'Ready for a home that listens?',
    text: 'Smart Home is designed together with the architecture and interior from day one — wiring, sensors and panels tucked neatly into every space.',
    home: 'Back to home',
    construction: 'Construction',
    interior: 'Interior',
  },
}

export const pageCopy: Record<Lang, PageCopy> = { vi, en }
