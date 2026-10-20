/**
 * Hero carousel tuning
 * ────────────────────
 * Every visual and motion parameter of the 3D carousel lives here, so the look can be
 * adjusted without touching component code. In development, saving this file hot-reloads
 * the page. See README.md ("Tinh chỉnh hiệu ứng") for a description of each value.
 *
 * The three photos form ONE continuous panorama: the panels are hinged to each other
 * like the walls of a curved room, so the end of one image always meets the start of
 * the next, and neighbouring images cross-fade over a shared strip (`seam`).
 * Panel proportions and the seam come from src/data/media.json, because the images are
 * cropped to match them (`npm run images` after changing them).
 */
import media from '../data/media.json'

export interface LayoutConfig {
  /** Media query that enables this layout. The first matching layout wins. */
  query: string
  /** Width of one panel (its own share of the panorama) as a fraction of the viewport width. */
  slideWidth: number
  /** Upper bound for the panel height as a fraction of the viewport height. */
  maxSlideHeight: number
  /** Panel aspect ratio (width / height) — fixed by the image crops in media.json. */
  aspectRatio: number
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

  /**
   * Angle in degrees between two neighbouring panels (left panel turned +value, right
   * panel −value). The panels stay hinged at their shared edge whatever the value.
   * Recommended 6 – 20.
   */
  sideRotate: number
  /** Opacity of the side panels. Keep 1 for a seamless panorama (lower values let the dark room show through). */
  sideOpacity: number
  /** Blur of the side slides in px (0 disables the blur filter entirely). */
  sideBlur: number
  /** Brightness of the side slides (1 = unchanged). */
  sideBrightness: number

  /** CSS perspective distance in px. Smaller = stronger 3D. */
  perspective: number
  /** Softness of the top and bottom edges: 0 = almost hard edges, 1 = very soft, dreamy fade. */
  fadeStrength: number
  /** Width of the cross-fade between neighbouring images, as a fraction of a panel (from media.json). */
  seam: number
  /** Opacity of the floor reflection (0 disables it). */
  reflection: number
  /** Height of the floor reflection as a fraction of the slide height. */
  reflectionHeight: number
  /** Opacity of the coloured light the centre image casts on the room (0 disables it). */
  ambientLight: number
  /** Max tilt in degrees following the mouse on desktop (0 disables it). */
  parallaxTilt: number

  /** Desktop hover on a side panel. */
  hover: {
    /** Brightness added on hover. */
    brighten: number
    /** Blur (px) removed on hover. */
    unblur: number
  }

  /** Entrance animation played once the images are loaded. */
  intro: {
    enabled: boolean
    /** Seconds for the panorama to pan into place and the centre image to come into focus. */
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

  sideRotate: 12,
  sideOpacity: 1,
  sideBlur: 3,
  sideBrightness: 0.62,

  perspective: 1300,
  fadeStrength: 0.5,
  seam: media.geometry.seam,
  reflection: 0.22,
  reflectionHeight: 0.42,
  ambientLight: 0.36,
  parallaxTilt: 2,

  hover: {
    brighten: 0.18,
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
      maxSlideHeight: 0.4,
      aspectRatio: media.geometry.portraitAspect,
      centerY: 0.35,
      perspective: 1000,
      sideBlur: 2.5,
    },
    landscape: {
      query: 'all',
      slideWidth: 0.66,
      maxSlideHeight: 0.7,
      aspectRatio: media.geometry.landscapeAspect,
      centerY: 0.52,
    },
  },
}
