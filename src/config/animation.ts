/**
 * Hero carousel tuning
 * ────────────────────
 * Every visual and motion parameter of the 3D carousel lives here, so the look can be
 * adjusted without touching component code. In development, saving this file hot-reloads
 * the page. See README.md ("Tinh chỉnh hiệu ứng") for a description of each value.
 */

export interface LayoutConfig {
  /** Media query that enables this layout. The first matching layout wins. */
  query: string
  /** Centre slide width as a fraction of the viewport width. */
  slideWidth: number
  /** Upper bound for the slide height as a fraction of the viewport height. */
  maxSlideHeight: number
  /** Frame aspect ratio (width / height). */
  aspectRatio: number
  /** Distance between the centre and a side slide, as a fraction of the slide width. */
  sideOffset: number
  /** Vertical centre of the slides as a fraction of the viewport height. */
  centerY: number
  /** Optional per-layout overrides of the global values below. */
  perspective?: number
  sideRotate?: number
  sideBlur?: number
}

export interface CarouselConfig {
  /** Slide placed in the centre on first load (0 Smart Home · 1 Construction · 2 Interior). */
  initialIndex: number

  /** Seconds for one slide-to-slide transition (click, arrows, keyboard, labels). */
  transitionDuration: number
  /** GSAP ease for those transitions. */
  ease: string
  /** Ease used to settle after a drag / swipe, and when a new move interrupts a running one. */
  releaseEase: string
  /** Drag & swipe sensitivity. 1 = the slide follows the pointer 1:1, 1.5 = 50% faster. */
  dragSensitivity: number
  /** Release speed (slides per second) above which a swipe counts as a flick to the next slide. */
  flickVelocity: number
  /** Navigate with the mouse wheel / trackpad swipe. */
  wheel: boolean

  /** LEFT / RIGHT state. */
  sideScale: number
  /** Y rotation of the side slides in degrees (left = +value, right = −value). */
  sideRotate: number
  sideOpacity: number
  /** Blur of the side slides in px (0 disables the blur filter entirely). */
  sideBlur: number
  /** Brightness of the side slides (1 = unchanged). */
  sideBrightness: number

  /** CSS perspective distance in px. Smaller = stronger 3D. */
  perspective: number
  /** Softness of the borderless edges: 0 = almost hard edges, 1 = very soft, dreamy fade. */
  fadeStrength: number
  /** 1 = all slides stand on the same floor line, 0 = vertically centred. */
  floorAlign: number
  /** Opacity of the floor reflection (0 disables it). */
  reflection: number
  /** Height of the floor reflection as a fraction of the slide height. */
  reflectionHeight: number
  /** Opacity of the coloured light the centre image casts on the room (0 disables it). */
  ambientLight: number
  /** Max tilt in degrees following the mouse on desktop (0 disables it). */
  parallaxTilt: number
  /** Image drift inside its frame while moving, as a fraction of the frame width (0 disables it). */
  innerParallax: number

  /** Desktop hover on a side slide. */
  hover: {
    /** How far (in slide units) the hovered side slide leans towards the centre. */
    nudge: number
    /** Brightness added on hover. */
    brighten: number
    /** Blur (px) removed on hover. */
    unblur: number
  }

  /** Entrance animation played once the images are loaded. */
  intro: {
    enabled: boolean
    /** Seconds for the centre image to come into focus. */
    duration: number
  }

  /** Used when the visitor prefers reduced motion. */
  reducedMotion: {
    transitionDuration: number
    ease: string
  }

  /**
   * Low-power mode: switched on automatically when the frame rate stays low during
   * transitions (or with ?quality=low). Drops the blur filter, reflections and grain.
   */
  lowPower: {
    /** Average FPS during a transition below which a transition counts as slow. */
    minFps: number
    /** Number of slow transitions before switching to low-power mode. */
    strikes: number
  }

  layouts: {
    /** Phones and other portrait screens. */
    portrait: LayoutConfig
    /** Desktop, laptops, tablets in landscape. */
    landscape: LayoutConfig
  }
}

export const carouselConfig: CarouselConfig = {
  initialIndex: 1,

  transitionDuration: 1.1,
  ease: 'power3.inOut',
  releaseEase: 'power3.out',
  dragSensitivity: 1,
  flickVelocity: 0.35,
  wheel: true,

  sideScale: 0.8,
  sideRotate: 12,
  sideOpacity: 0.65,
  sideBlur: 4,
  sideBrightness: 0.6,

  perspective: 1300,
  fadeStrength: 0.5,
  floorAlign: 1,
  reflection: 0.22,
  reflectionHeight: 0.42,
  ambientLight: 0.36,
  parallaxTilt: 2.2,
  innerParallax: 0.04,

  hover: {
    nudge: 0.04,
    brighten: 0.16,
    unblur: 1.5,
  },

  intro: {
    enabled: true,
    duration: 2.2,
  },

  reducedMotion: {
    transitionDuration: 0.45,
    ease: 'power2.out',
  },

  lowPower: {
    minFps: 40,
    strikes: 2,
  },

  layouts: {
    portrait: {
      query: '(max-aspect-ratio: 1/1)',
      slideWidth: 0.8,
      maxSlideHeight: 0.6,
      aspectRatio: 4 / 5,
      sideOffset: 0.76,
      centerY: 0.44,
      perspective: 1000,
      sideBlur: 3,
    },
    landscape: {
      query: 'all',
      slideWidth: 0.58,
      maxSlideHeight: 0.62,
      aspectRatio: 16 / 10,
      sideOffset: 0.8,
      centerY: 0.47,
    },
  },
}
