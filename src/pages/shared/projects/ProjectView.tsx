import { gsap } from 'gsap'
import { useEffect, useEffectEvent, useLayoutEffect, useRef, type KeyboardEvent, type UIEvent, type WheelEvent } from 'react'
import { zaloHref } from '../../../config/contact'
import { useI18n } from '../../../i18n/context'
import { REDUCED_MOTION_QUERY } from '../../../utils/device'
import { CtaArrow, SideArrow } from '../icons'
import { imagePosition, imageSrc, imageSrcSet, type Project, type ProjectImage } from './data'

/** Where the cover was on the page when the project was opened: it grows from there. */
export interface CoverOrigin {
  rect: DOMRect
  /** The image the square showed (already loaded: the morph starts with it). */
  src: string
  radius: number
}

interface ProjectViewProps {
  project: Project
  /** null: opened from a link (no square to grow from). */
  origin: CoverOrigin | null
  /** The project's square on the page, to shrink back into (null: fade out instead). */
  target: () => DOMRect | null
  closing: boolean
  /** The page's name, for the way back ("Construction projects"). */
  category: string
  onClose: () => void
  /** The closing animation is over. */
  onClosed: () => void
}

export function Picture({ img, sizes, alt = '', className }: { img: ProjectImage; sizes: string; alt?: string; className?: string }) {
  return (
    <picture className={className}>
      <source type="image/avif" srcSet={imageSrcSet(img, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={imageSrcSet(img, 'webp')} sizes={sizes} />
      <img
        src={imageSrc(img)}
        alt={alt}
        width={img.w}
        height={img.h}
        decoding="async"
        draggable={false}
        style={{ objectPosition: imagePosition(img) }}
      />
    </picture>
  )
}

/** A picture over the view's dark (under its text), to fly between the page's square and the banner. */
function flyer(view: HTMLElement, src: string, rect: DOMRect, radius: number, position?: string) {
  const img = document.createElement('img')
  img.className = 'pv-flyer'
  img.src = src
  img.alt = ''
  Object.assign(img.style, {
    left: `${rect.left}px`,
    top: `${rect.top}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    borderRadius: `${radius}px`,
    objectPosition: position ?? '',
  })
  view.querySelector('.pv__bg')?.after(img)
  return img
}

const box = (rect: DOMRect, radius: number) => ({
  left: rect.left,
  top: rect.top,
  width: rect.width,
  height: rect.height,
  borderRadius: radius,
})

const onScreen = (rect: DOMRect) => rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0

/**
 * A project, over the page: its cover grows from the square that was tapped into the banner,
 * then the title, the facts and the photos rise in under it. Closing shrinks the banner back
 * into its square. Esc, the back button or the browser's Back close it.
 */
export function ProjectView({ project, origin, target, closing, category, onClose, onClosed }: ProjectViewProps) {
  const { t, lang } = useI18n()
  const rootRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  // Opening.
  useLayoutEffect(() => {
    const root = rootRef.current
    const hero = heroRef.current
    const bg = bgRef.current
    if (!root || !hero || !bg) return
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches
    const lines = root.querySelectorAll('[data-pv-line]')
    const bar = root.querySelector('.pv__bar')
    const heroImg = hero.querySelector('img')
    closeRef.current?.focus({ preventScroll: true })
    const tl = gsap.timeline()
    if (!origin || reduced) {
      tl.fromTo([bg, bar], { opacity: 0 }, { opacity: 1, duration: reduced ? 0.2 : 0.45, ease: 'power2.out' })
        .fromTo(
          hero,
          { opacity: 0, scale: reduced ? 1 : 1.04 },
          { opacity: 1, scale: 1, duration: reduced ? 0.2 : 0.9, ease: 'power3.out' },
          0.05,
        )
        .fromTo(lines, { opacity: 0, y: reduced ? 0 : 22 }, { opacity: 1, y: 0, duration: 0.6, stagger: 0.05, ease: 'power3.out' }, 0.2)
      return () => {
        tl.kill()
      }
    }
    // The square grows into the banner, over the page fading to the project's dark.
    const to = hero.getBoundingClientRect()
    const fly = flyer(root, origin.src, origin.rect, origin.radius, heroImg?.style.objectPosition)
    gsap.set([hero, bar], { opacity: 0 })
    gsap.set(lines, { opacity: 0, y: 26 })
    // (it leaves the square at once and settles slowly, as an app opens from its icon)
    tl.to(bg, { opacity: 1, duration: 0.5, ease: 'power2.out' }, 0.12)
      .to(bar, { opacity: 1, duration: 0.4, ease: 'power1.out' }, 0.5)
      .fromTo(fly, box(origin.rect, origin.radius), { ...box(to, 0), duration: 0.9, ease: 'expo.out' }, 0)
      .to(lines, { opacity: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out' }, 0.45)
    // The banner's own (sharper) picture takes over once it is decoded.
    let live = true
    const swap = () => {
      if (!live) return
      gsap.to(hero, { opacity: 1, duration: 0.35, ease: 'power1.out', onComplete: () => fly.remove() })
    }
    tl.add(() => {
      if (!heroImg || heroImg.complete) swap()
      else void heroImg.decode().then(swap, swap)
    }, 0.75)
    return () => {
      live = false
      tl.kill()
      fly.remove()
    }
  }, [origin])

  // Closing: the banner shrinks back into its square (or the view fades, when the square is
  // not on screen).
  const squareRect = useEffectEvent(() => target())
  const finished = useEffectEvent(() => onClosed())
  useEffect(() => {
    if (!closing) return
    const root = rootRef.current
    const hero = heroRef.current
    const bg = bgRef.current
    if (!root || !hero || !bg) return
    const reduced = window.matchMedia(REDUCED_MOTION_QUERY).matches
    const rect = squareRect()
    const from = hero.getBoundingClientRect()
    const content = root.querySelectorAll('[data-pv-line], .pv__bar')
    const tl = gsap.timeline({ onComplete: () => finished() })
    let fly: HTMLImageElement | null = null
    if (rect && onScreen(rect) && onScreen(from) && !reduced) {
      const img = hero.querySelector('img')
      fly = flyer(root, img?.currentSrc || img?.src || '', from, 0, img?.style.objectPosition)
      gsap.set(hero, { opacity: 0 })
      tl.to(content, { opacity: 0, duration: 0.2, ease: 'power1.in' }, 0)
        .to(bg, { opacity: 0, duration: 0.45, ease: 'power2.inOut' }, 0.1)
        .to(fly, { ...box(rect, origin?.radius ?? 18), duration: 0.75, ease: 'expo.out' }, 0)
    } else {
      tl.to(root, { opacity: 0, duration: reduced ? 0.15 : 0.35, ease: 'power1.in' })
    }
    return () => {
      tl.kill()
      fly?.remove()
    }
  }, [closing, origin])

  // Keys stay in the view (the page's arrow keys would change its theme behind it), and so
  // does Tab.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    e.stopPropagation()
    if (e.key === 'Escape') {
      e.preventDefault()
      onClose()
    } else if (e.key === 'Tab') {
      const stops = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('a[href], button'))
      const edge = e.shiftKey ? stops[0] : stops.at(-1)
      if (document.activeElement === edge || !e.currentTarget.contains(document.activeElement)) {
        e.preventDefault()
        ;(e.shiftKey ? stops.at(-1) : stops[0])?.focus()
      }
    }
  }
  // (and so does the wheel: it scrolls the view, not the page's themes)
  const onWheel = (e: WheelEvent<HTMLDivElement>) => e.stopPropagation()
  // Past the top of the banner, the bar gets its shade.
  const onScroll = (e: UIEvent<HTMLDivElement>) => e.currentTarget.toggleAttribute('data-scrolled', e.currentTarget.scrollTop > 60)

  const facts = [
    project.place && [t.projectPlace, project.place[lang]],
    project.year && [t.projectYear, project.year],
    project.area && [t.projectArea, project.area],
    project.scope && [t.projectScope, project.scope[lang]],
  ].filter((f): f is [string, string] => Boolean(f))

  return (
    <div
      ref={rootRef}
      className="pv"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pv-title"
      tabIndex={-1}
      onKeyDown={onKeyDown}
      onWheel={onWheel}
      onScroll={onScroll}
    >
      <div ref={bgRef} className="pv__bg" aria-hidden="true" />
      <div className="pv__bar">
        <button type="button" className="pv__back" onClick={onClose}>
          <SideArrow direction="left" />
          <span>{category}</span>
        </button>
        <button ref={closeRef} type="button" className="pv__close" aria-label={t.close} title={t.close} onClick={onClose}>
          <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div ref={heroRef} className="pv__hero">
        <Picture img={project.cover} sizes="100vw" alt={project.title[lang]} />
      </div>

      <article className="pv__body">
        <header className="pv__head">
          {project.scope && (
            <p className="pv__kicker" data-pv-line>
              {project.scope[lang]}
            </p>
          )}
          <h2 className="pv__title" id="pv-title" data-pv-line>
            {project.title[lang]}
          </h2>
          {project.place && (
            <p className="pv__place" data-pv-line>
              {[project.place[lang], project.year].filter(Boolean).join(' · ')}
            </p>
          )}
        </header>

        <div className="pv__about" data-pv-line>
          {project.summary && <p className="pv__summary">{project.summary[lang]}</p>}
          <dl className="pv__facts">
            {facts.map(([label, value]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
        {project.sample && (
          <p className="pv__note" data-pv-line>
            {t.projectSample}
          </p>
        )}

        {project.photos.length > 0 && (
          <ul className="pv__photos" aria-label={t.projectPhotos.replace('{n}', String(project.photos.length))}>
            {project.photos.map((photo, i) => (
              <li key={photo.base} className="pv__photo" data-pv-line data-wide={photo.w / photo.h > 1.9 || undefined}>
                <figure>
                  <Picture
                    img={photo}
                    sizes={i === 0 ? '(min-width: 761px) 92vw, 100vw' : '(min-width: 761px) 46vw, 100vw'}
                    alt={photo.caption?.[lang] ?? ''}
                  />
                  {photo.caption && <figcaption>{photo.caption[lang]}</figcaption>}
                </figure>
              </li>
            ))}
          </ul>
        )}

        <a className="hc-copy__cta pv__contact" href={zaloHref} target="_blank" rel="noopener" data-pv-line>
          <span>{t.projectContact}</span>
          <span className="hc-copy__cta-icon" aria-hidden="true">
            <CtaArrow />
          </span>
        </a>
      </article>
    </div>
  )
}
