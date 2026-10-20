import { gsap } from 'gsap'
import type { CarouselConfig, LayoutConfig } from '../../config/animation'
import { FINE_POINTER_QUERY, REDUCED_MOTION_QUERY } from '../../utils/device'
import {
  clamp,
  computeSlideVisual,
  featherGradient,
  featherSizes,
  mod,
  reflectionGradient,
  wrapOffset,
  type VisualParams,
} from './carouselMath'

export interface CarouselEngineOptions {
  /** Carousel root: receives layout CSS variables and data-phase / data-layout / data-quality. */
  root: HTMLElement
  /** Drag surface that contains the slides. */
  stage: HTMLElement
  /** One element per slide (data order). */
  slides: HTMLElement[]
  /** Per slide: elements that receive the inner (image-in-frame) parallax transform. */
  inner: HTMLElement[][]
  /** Per slide: ambient light layer (cross-faded with the slide's distance from the centre). */
  ambient: HTMLElement[]
  config: CarouselConfig
  initialIndex: number
  lowPower: boolean
  /** Quality was forced via URL — never switch automatically. */
  qualityForced: boolean
  onActiveChange: (index: number) => void
}

interface DragState {
  pointerId: number
  startX: number
  startY: number
  startProgress: number
  active: boolean
  samples: { t: number; x: number }[]
}

interface Metrics {
  width: number
  height: number
  perspective: number
}

interface SlideCache {
  transform: string
  opacity: string
  zIndex: string
  filter: string
  visibility: string
  inner: string
  ambient: string
  position: string
}

const DRAG_THRESHOLD = 6
const SNAP_THRESHOLD = 0.25 // fraction of a slide a slow drag must cover to change slide
const VELOCITY_WINDOW = 100 // ms of pointer history used for the release velocity
const WHEEL_STEP = 40 // accumulated wheel delta (px) that triggers one step
const WHEEL_GESTURE_GAP = 200 // ms of silence that ends a wheel / trackpad gesture
const KEY_REPEAT_INTERVAL = 380 // ms between steps while an arrow key is held down

const fmt = (n: number, digits = 2) => n.toFixed(digits)

function listen(
  target: EventTarget,
  type: string,
  handler: (event: never) => void,
  options?: AddEventListenerOptions | boolean,
) {
  target.addEventListener(type, handler as EventListener, options)
  return () => target.removeEventListener(type, handler as EventListener, options)
}

/**
 * Imperative engine behind <HeroCarousel>. It owns one tweened value (`progress`), maps it
 * to every slide's 3D transform / opacity / blur / brightness on each frame, and turns
 * clicks, drags, swipes, wheel and keyboard input into GSAP tweens of that value.
 */
export class CarouselEngine {
  private readonly o: CarouselEngineOptions
  private readonly count: number
  private readonly state: { progress: number }
  private target: number
  private activeIndex = -1

  private tween: gsap.core.Tween | null = null
  private intro: gsap.core.Timeline | null = null
  private readonly hover: { value: number }[]
  private readonly pointer = { x: 0, y: 0 }
  private readonly pointerTo: { x: gsap.QuickToFunc; y: gsap.QuickToFunc }

  private metrics: Metrics = { width: 0, height: 0, perspective: 1800 }
  private params!: VisualParams
  private tilt = 0

  private enabled = true
  private started = false
  private destroyed = false
  private reducedMotion: boolean
  private lowPower: boolean
  private finePointer: boolean

  private drag: DragState | null = null
  private suppressClick = false
  private wheel = { acc: 0, last: 0, locked: false }
  private lastKeyStep = 0

  private dirty = true
  private ticking = false
  private idleFrames = 0
  private readonly cache: SlideCache[]
  private perf = { frames: 0, time: 0, last: 0, strikes: 0 }
  private readonly cleanups: (() => void)[] = []

  constructor(options: CarouselEngineOptions) {
    this.o = options
    this.count = options.slides.length
    this.state = { progress: options.initialIndex }
    this.target = options.initialIndex
    this.hover = options.slides.map(() => ({ value: 0 }))
    this.cache = options.slides.map(() => ({
      transform: '',
      opacity: '',
      zIndex: '',
      filter: '',
      visibility: '',
      inner: '',
      ambient: '',
      position: '',
    }))
    this.reducedMotion = window.matchMedia(REDUCED_MOTION_QUERY).matches
    this.finePointer = window.matchMedia(FINE_POINTER_QUERY).matches
    this.lowPower = options.lowPower
    this.pointerTo = {
      x: gsap.quickTo(this.pointer, 'x', { duration: 1.4, ease: 'power3.out', onUpdate: this.markDirty }),
      y: gsap.quickTo(this.pointer, 'y', { duration: 1.4, ease: 'power3.out', onUpdate: this.markDirty }),
    }
  }

  /* ── Lifecycle ─────────────────────────────────────────────────────────── */

  init() {
    const { root, stage, slides, config } = this.o
    root.dataset.phase = 'loading'
    root.dataset.quality = this.lowPower ? 'low' : 'high'
    this.applyMasks()
    this.measure()
    this.updateActive(this.target)

    const resize = new ResizeObserver(() => this.measure())
    resize.observe(root)
    this.cleanups.push(() => resize.disconnect())

    const watch = (query: string, onChange: (matches: boolean) => void) => {
      const mql = window.matchMedia(query)
      this.cleanups.push(listen(mql, 'change', (e: MediaQueryListEvent) => onChange(e.matches)))
    }
    watch(config.layouts.portrait.query, () => this.measure())
    watch(REDUCED_MOTION_QUERY, (matches) => {
      this.reducedMotion = matches
      this.measure()
    })
    watch(FINE_POINTER_QUERY, (matches) => {
      this.finePointer = matches
      this.measure()
    })

    this.cleanups.push(
      listen(stage, 'pointerdown', this.onPointerDown),
      listen(stage, 'click', this.onClick, true),
      listen(stage, 'lostpointercapture', this.onPointerUp),
      listen(window, 'pointermove', this.onPointerMove, { passive: true }),
      listen(window, 'pointerup', this.onPointerUp),
      listen(window, 'pointercancel', this.onPointerUp),
      listen(window, 'keydown', this.onKeyDown),
      listen(window, 'wheel', this.onWheel, { passive: false }),
      listen(document.documentElement, 'mouseleave', this.onMouseLeave),
      listen(stage, 'dragstart', (e: DragEvent) => e.preventDefault()),
    )
    slides.forEach((slide, i) => {
      this.cleanups.push(
        listen(slide, 'pointerenter', (e: PointerEvent) => this.setHover(i, e, 1)),
        listen(slide, 'pointerleave', (e: PointerEvent) => this.setHover(i, e, 0)),
      )
    })

    this.render()
  }

  destroy() {
    this.destroyed = true
    this.tween?.kill()
    this.intro?.kill()
    gsap.killTweensOf(this.state)
    gsap.killTweensOf(this.hover)
    gsap.killTweensOf(this.pointer)
    gsap.ticker.remove(this.tick)
    this.ticking = false
    this.cleanups.forEach((fn) => fn())
    this.cleanups.length = 0
  }

  /** Reveals the scene once the images are decoded. */
  playIntro(onComplete?: () => void) {
    if (this.destroyed || this.started) return
    this.started = true
    const { root, slides, config } = this.o
    const atmosphere = Array.from(root.querySelectorAll<HTMLElement>('[data-atmosphere]'))
    const reveals = slides.map((s) => s.querySelector<HTMLElement>('[data-reveal]'))
    const finish = () => {
      root.dataset.phase = 'ready'
      onComplete?.()
    }

    // Opening states are written synchronously with gsap.set() *before* the scene is
    // un-hidden, so the very first painted frame is already the dark, out-of-focus shot.
    const tl = gsap.timeline({ onComplete: finish })
    if (!config.intro.enabled || this.reducedMotion) {
      const targets = [...atmosphere, ...reveals.filter((el) => el !== null)]
      gsap.set(targets, { opacity: 0 })
      tl.to(targets, { opacity: 1, duration: 0.6, ease: 'power1.out', clearProps: 'opacity' })
    } else {
      const d = config.intro.duration
      gsap.set(atmosphere, { opacity: 0 })
      tl.to(atmosphere, { opacity: 1, duration: d * 0.9, ease: 'power2.inOut', stagger: 0.15, clearProps: 'opacity' }, 0)
      reveals.forEach((el, i) => {
        if (!el) return
        const offset = Math.round(wrapOffset(i, this.state.progress, this.count))
        if (offset === 0) {
          // Centre: the lights come up while the lens pulls focus.
          const soft = this.lowPower ? {} : { filter: 'blur(18px) brightness(0.35)' }
          const sharp = this.lowPower ? {} : { filter: 'blur(0px) brightness(1)' }
          gsap.set(el, { opacity: 0, scale: 1.12, ...soft })
          tl.to(el, { opacity: 1, duration: d * 0.6, ease: 'power2.out' }, 0.1).to(
            el,
            { scale: 1, ...sharp, duration: d, ease: 'expo.out', clearProps: 'opacity,transform,filter' },
            0.1,
          )
        } else {
          // Sides glide in from the walls of the room.
          gsap.set(el, { opacity: 0, xPercent: offset * 24, scale: 0.92 })
          tl.to(
            el,
            { opacity: 1, xPercent: 0, scale: 1, duration: d * 0.9, ease: 'expo.out', clearProps: 'opacity,transform' },
            0.5,
          )
        }
      })
    }
    this.intro = tl
    root.dataset.phase = 'intro'
  }

  /* ── Public navigation API ─────────────────────────────────────────────── */

  next() {
    this.step(1)
  }

  prev() {
    this.step(-1)
  }

  /** Brings slide `index` to the centre along the shortest way round the ring. */
  goTo(index: number) {
    const base = Math.round(this.target)
    let delta = mod(index - mod(base, this.count), this.count)
    if (delta > this.count / 2) delta -= this.count
    if (delta !== 0) this.animateTo(base + delta)
  }

  step(delta: number) {
    this.animateTo(Math.round(this.target) + delta)
  }

  /** Disables pointer / wheel / keyboard input (e.g. while the menu is open). */
  setEnabled(enabled: boolean) {
    this.enabled = enabled
    if (!enabled) this.cancelDrag()
  }

  /* ── Animation ─────────────────────────────────────────────────────────── */

  private get motion() {
    const { config } = this.o
    return this.reducedMotion
      ? { duration: config.reducedMotion.transitionDuration, ease: config.reducedMotion.ease }
      : { duration: config.transitionDuration, ease: config.ease }
  }

  private animateTo(target: number, velocity?: number) {
    if (this.destroyed) return
    if (this.drag?.active) {
      // e.g. an arrow key pressed mid-drag: the programmatic move wins.
      this.drag = null
      this.o.stage.classList.remove('is-dragging')
    }
    const from = this.state.progress
    const distance = Math.abs(target - from)
    const interrupting = this.tween?.isActive() ?? false
    this.tween?.kill()
    this.tween = null
    this.target = target
    this.updateActive(target)
    this.perf.frames = 0
    this.perf.time = 0
    this.perf.last = 0
    if (distance < 1e-4) {
      this.state.progress = target
      this.markDirty()
      return
    }

    const { duration: base, ease: baseEase } = this.motion
    const { releaseEase } = this.o.config
    let duration = base * clamp(0.45 + 0.55 * distance, 0.45, 1.6)
    let ease = interrupting ? releaseEase : baseEase

    if (velocity !== undefined) {
      // Hand-off from a drag: start at the finger's speed, then decelerate (power3.out
      // starts at 3 × distance / duration), so there is no jolt on release.
      ease = this.reducedMotion ? baseEase : releaseEase
      const speed = Math.abs(velocity)
      duration =
        speed > 0.05 && Math.sign(velocity) === Math.sign(target - from)
          ? clamp((3 * distance) / speed, 0.35, base)
          : clamp(base * (0.4 + 0.6 * distance), 0.35, base)
    }

    this.tween = gsap.to(this.state, {
      progress: target,
      duration,
      ease,
      onUpdate: this.markDirty,
      onComplete: this.onSettled,
    })
  }

  private onSettled = () => {
    this.tween = null
    this.evaluatePerformance()
    // Keep the numbers small; the visual state is identical modulo `count`.
    const shift = Math.floor(this.state.progress / this.count) * this.count
    if (shift !== 0 && !this.drag?.active) {
      this.state.progress -= shift
      this.target -= shift
    }
  }

  private updateActive(position: number) {
    const index = mod(Math.round(position), this.count)
    if (index === this.activeIndex) return
    this.activeIndex = index
    this.o.onActiveChange(index)
  }

  /* ── Rendering ─────────────────────────────────────────────────────────── */

  private markDirty = () => {
    this.dirty = true
    if (!this.ticking && !this.destroyed) {
      this.ticking = true
      this.idleFrames = 0
      gsap.ticker.add(this.tick)
    }
  }

  private tick = () => {
    if (this.tween) this.sampleFrame()
    if (this.dirty) {
      this.dirty = false
      this.idleFrames = 0
      this.render()
    } else if (++this.idleFrames > 30) {
      gsap.ticker.remove(this.tick)
      this.ticking = false
    }
  }

  private render() {
    const { slides, inner, ambient, config } = this.o
    const { progress } = this.state
    const camera = this.tilt
      ? `rotateX(${fmt(-this.pointer.y * this.tilt * 0.55, 3)}deg) rotateY(${fmt(this.pointer.x * this.tilt, 3)}deg) `
      : ''

    for (let i = 0; i < this.count; i++) {
      const offset = wrapOffset(i, progress, this.count)
      const v = computeSlideVisual(offset, this.hover[i].value, this.params)
      const cache = this.cache[i]
      const el = slides[i]

      const transform = `perspective(${this.metrics.perspective}px) ${camera}translate3d(${fmt(v.x)}px, ${fmt(v.y)}px, 0) rotateY(${fmt(v.rotateY, 3)}deg) scale(${fmt(v.scale, 4)})`
      if (transform !== cache.transform) el.style.transform = cache.transform = transform

      const opacity = fmt(v.opacity, 3)
      if (opacity !== cache.opacity) el.style.opacity = cache.opacity = opacity

      const visibility = v.opacity < 0.002 ? 'hidden' : 'visible'
      if (visibility !== cache.visibility) el.style.visibility = cache.visibility = visibility

      const zIndex = String(v.zIndex)
      if (zIndex !== cache.zIndex) el.style.zIndex = cache.zIndex = zIndex

      const parts: string[] = []
      if (v.blur > 0.05) parts.push(`blur(${fmt(v.blur)}px)`)
      if (Math.abs(v.brightness - 1) > 0.004) parts.push(`brightness(${fmt(v.brightness, 3)})`)
      const filter = parts.length ? parts.join(' ') : 'none'
      if (filter !== cache.filter) el.style.filter = cache.filter = filter

      const innerTransform = `translate3d(${fmt(v.innerShift, 3)}%, 0, 0) scale(${fmt(v.innerScale, 4)})`
      if (innerTransform !== cache.inner) {
        cache.inner = innerTransform
        for (const node of inner[i]) node.style.transform = innerTransform
      }

      const light = fmt(config.ambientLight * clamp(1 - Math.abs(offset), 0, 1), 3)
      if (light !== cache.ambient && ambient[i]) ambient[i].style.opacity = cache.ambient = light

      const distance = Math.abs(offset)
      const position = distance < 0.5 ? 'center' : distance < 1.5 ? 'side' : 'hidden'
      if (position !== cache.position) {
        el.dataset.position = cache.position = position
        el.setAttribute('aria-hidden', String(position !== 'center'))
      }
    }
  }

  /* ── Layout ────────────────────────────────────────────────────────────── */

  private resolveLayout(): { name: 'portrait' | 'landscape'; layout: LayoutConfig } {
    const { portrait, landscape } = this.o.config.layouts
    return window.matchMedia(portrait.query).matches
      ? { name: 'portrait', layout: portrait }
      : { name: 'landscape', layout: landscape }
  }

  private measure() {
    const { root, config } = this.o
    const width = root.clientWidth || window.innerWidth
    const height = root.clientHeight || window.innerHeight
    const { name, layout } = this.resolveLayout()
    const slideW = Math.round(Math.min(width * layout.slideWidth, height * layout.maxSlideHeight * layout.aspectRatio))
    const slideH = Math.round(slideW / layout.aspectRatio)

    this.metrics = { width, height, perspective: layout.perspective ?? config.perspective }
    this.params = {
      spacing: slideW * layout.sideOffset,
      exitDistance: slideW * 0.35,
      slideHeight: slideH,
      sideScale: config.sideScale,
      sideRotate: layout.sideRotate ?? config.sideRotate,
      sideOpacity: config.sideOpacity,
      sideBlur: this.lowPower ? 0 : (layout.sideBlur ?? config.sideBlur),
      sideBrightness: config.sideBrightness,
      floorAlign: config.floorAlign,
      innerParallax: this.reducedMotion || this.lowPower ? 0 : config.innerParallax,
      hoverNudge: this.reducedMotion ? 0 : config.hover.nudge,
      hoverBrighten: config.hover.brighten,
      hoverUnblur: this.lowPower ? 0 : config.hover.unblur,
    }
    this.tilt = this.reducedMotion || this.lowPower || !this.finePointer ? 0 : config.parallaxTilt
    if (!this.tilt) {
      this.pointer.x = 0
      this.pointer.y = 0
    }

    const style = root.style
    style.setProperty('--hc-w', `${slideW}px`)
    style.setProperty('--hc-h', `${slideH}px`)
    style.setProperty('--hc-cy', `${Math.round(height * layout.centerY)}px`)
    root.dataset.layout = name
    this.markDirty()
  }

  private applyMasks() {
    const { root, config } = this.o
    const fade = featherSizes(config.fadeStrength)
    const style = root.style
    style.setProperty('--hc-mask-x', featherGradient('right', fade.x, fade.x))
    style.setProperty('--hc-mask-y', featherGradient('bottom', fade.top, fade.bottom))
    style.setProperty('--hc-mask-reflection', reflectionGradient(fade.bottom, config.reflectionHeight))
    style.setProperty('--hc-reflection-h', `${config.reflectionHeight * 100}%`)
    style.setProperty('--hc-reflection-opacity', String(config.reflection))
  }

  /* ── Low-power detection ───────────────────────────────────────────────── */

  private sampleFrame() {
    const now = performance.now()
    if (this.perf.last) {
      const dt = now - this.perf.last
      if (dt < 250) {
        this.perf.frames++
        this.perf.time += dt
      }
    }
    this.perf.last = now
  }

  private evaluatePerformance() {
    const { frames, time } = this.perf
    this.perf.frames = 0
    this.perf.time = 0
    this.perf.last = 0
    if (this.lowPower || this.o.qualityForced || frames < 20 || document.visibilityState !== 'visible') return
    const fps = (frames * 1000) / time
    if (fps < this.o.config.lowPower.minFps && ++this.perf.strikes >= this.o.config.lowPower.strikes) {
      this.lowPower = true
      this.o.root.dataset.quality = 'low'
      this.measure()
    }
  }

  /* ── Input: pointer (click, drag, swipe, hover, parallax) ──────────────── */

  private onPointerDown = (e: PointerEvent) => {
    if (!this.enabled || !this.started || !e.isPrimary) return
    if (e.pointerType === 'mouse' && e.button !== 0) return
    if ((e.target as Element | null)?.closest('button, a')) return
    this.drag = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      startProgress: this.state.progress,
      active: false,
      samples: [{ t: e.timeStamp, x: e.clientX }],
    }
  }

  private onPointerMove = (e: PointerEvent) => {
    if (this.tilt && e.pointerType === 'mouse' && !this.drag?.active) {
      this.pointerTo.x(clamp((e.clientX / this.metrics.width) * 2 - 1, -1, 1))
      this.pointerTo.y(clamp((e.clientY / this.metrics.height) * 2 - 1, -1, 1))
    }

    const drag = this.drag
    if (!drag || e.pointerId !== drag.pointerId) return
    const dx = e.clientX - drag.startX
    const dy = e.clientY - drag.startY

    if (!drag.active) {
      if (Math.abs(dx) < DRAG_THRESHOLD && Math.abs(dy) < DRAG_THRESHOLD) return
      if (Math.abs(dy) > Math.abs(dx)) {
        this.drag = null // vertical gesture: not ours
        return
      }
      // Catch the slides wherever they are, even mid-transition.
      // The slides follow the full pointer travel since pointerdown (threshold included).
      drag.active = true
      drag.startProgress = this.state.progress
      this.tween?.kill()
      this.tween = null
      this.o.stage.classList.add('is-dragging')
      try {
        this.o.stage.setPointerCapture(e.pointerId)
      } catch {
        /* pointer already released */
      }
    }

    this.state.progress = drag.startProgress - (e.clientX - drag.startX) / this.dragDistance
    drag.samples.push({ t: e.timeStamp, x: e.clientX })
    while (drag.samples.length > 2 && e.timeStamp - drag.samples[0].t > VELOCITY_WINDOW) drag.samples.shift()
    this.target = this.state.progress
    this.updateActive(this.state.progress)
    this.markDirty()
  }

  private onPointerUp = (e: PointerEvent) => {
    const drag = this.drag
    if (!drag || e.pointerId !== drag.pointerId) return
    this.drag = null
    if (!drag.active) return
    this.o.stage.classList.remove('is-dragging')
    if (this.o.stage.hasPointerCapture?.(e.pointerId)) this.o.stage.releasePointerCapture(e.pointerId)

    // A mouse drag still ends with a click on the slide underneath: swallow it.
    this.suppressClick = true
    window.setTimeout(() => (this.suppressClick = false), 0)

    const velocity = this.releaseVelocity(drag, e.timeStamp)
    const p = this.state.progress
    const origin = Math.round(drag.startProgress)
    const moved = p - origin
    let target = Math.round(p)
    if (Math.abs(velocity) > this.o.config.flickVelocity) {
      // A flick goes to the next slide in the flick direction.
      target = velocity > 0 ? Math.ceil(p) : Math.floor(p)
    } else if (Math.abs(moved) >= SNAP_THRESHOLD && Math.abs(moved) < 1) {
      // A slow but deliberate drag past the threshold still changes slide.
      target = origin + Math.sign(moved)
    }
    this.animateTo(target, velocity)
  }

  private cancelDrag() {
    if (!this.drag) return
    const wasActive = this.drag.active
    this.drag = null
    this.o.stage.classList.remove('is-dragging')
    if (wasActive) this.animateTo(Math.round(this.state.progress), 0)
  }

  /** Release speed in slides per second (positive = towards the next slide). */
  private releaseVelocity(drag: DragState, now: number) {
    const samples = drag.samples.filter((s) => now - s.t <= VELOCITY_WINDOW)
    if (samples.length < 2) return 0
    const first = samples[0]
    const last = samples[samples.length - 1]
    const dt = last.t - first.t
    if (dt <= 0) return 0
    return -((last.x - first.x) / dt) * (1000 / this.dragDistance)
  }

  private get dragDistance() {
    return Math.max(80, this.params.spacing) / Math.max(0.1, this.o.config.dragSensitivity)
  }

  private onClick = (e: MouseEvent) => {
    if (this.suppressClick) {
      e.preventDefault()
      e.stopPropagation()
      return
    }
    if (!this.enabled || !this.started) return
    const slide = (e.target as Element | null)?.closest<HTMLElement>('[data-slide-index]')
    if (!slide) return
    const offset = Math.round(wrapOffset(Number(slide.dataset.slideIndex), this.target, this.count))
    if (offset !== 0) this.step(offset)
  }

  private setHover(index: number, e: PointerEvent, value: number) {
    if (e.pointerType !== 'mouse' || (value && this.drag?.active)) return
    gsap.to(this.hover[index], {
      value,
      duration: value ? 0.6 : 0.8,
      ease: 'power3.out',
      overwrite: true,
      onUpdate: this.markDirty,
    })
  }

  private onMouseLeave = () => {
    if (!this.tilt) return
    this.pointerTo.x(0)
    this.pointerTo.y(0)
  }

  /* ── Input: keyboard & wheel ───────────────────────────────────────────── */

  private onKeyDown = (e: KeyboardEvent) => {
    if (!this.enabled || !this.started || e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
    const el = e.target as HTMLElement | null
    if (el && (el.isContentEditable || /^(input|textarea|select)$/i.test(el.tagName))) return
    const dir = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0
    if (!dir) return
    e.preventDefault()
    const now = performance.now()
    if (e.repeat && now - this.lastKeyStep < KEY_REPEAT_INTERVAL) return
    this.lastKeyStep = now
    this.step(dir)
  }

  private onWheel = (e: WheelEvent) => {
    if (!this.enabled || !this.started || !this.o.config.wheel || e.ctrlKey) return
    const scale = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? this.metrics.height : 1
    const delta = (Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * scale
    if (!delta) return
    e.preventDefault()
    // One step per gesture: trackpad inertia keeps firing events, so a gesture only ends
    // after a short silence.
    const w = this.wheel
    if (e.timeStamp - w.last > WHEEL_GESTURE_GAP) {
      w.locked = false
      w.acc = 0
    }
    w.last = e.timeStamp
    if (w.locked) return
    w.acc += delta
    if (Math.abs(w.acc) >= WHEEL_STEP) {
      this.step(Math.sign(w.acc))
      w.locked = true
      w.acc = 0
    }
  }
}
