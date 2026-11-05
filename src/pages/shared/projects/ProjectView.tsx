import { gsap } from 'gsap'
import { useEffect, useEffectEvent, useLayoutEffect, useRef, type KeyboardEvent, type UIEvent } from 'react'
import { zaloHref } from '../../../config/contact'
import { useI18n } from '../../../i18n/context'
import { REDUCED_MOTION_QUERY } from '../../../utils/device'
import { CtaArrow, SideArrow } from '../icons'
import { imagePosition, imageSrc, imageSrcSet, type Project, type ProjectImage } from './data'
import { AreaIcon, PlaceIcon, ScopeIcon, YearIcon } from './icons'
import { PagesArc } from './PagesArc'

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
  /** Shown as it is, without its opening (the browser has already shown it: a swipe forward). */
  instant?: boolean
  /** The project's square on the page, to shrink back into (null: fade out instead). */
  target: () => DOMRect | null
  closing: boolean
  /** The page's name ("Nội thất"), over the title. */
  page: string
  /** The page's projects, for the way back ("Construction projects"). */
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

/** A bare number of square metres gets its unit ("300" → "300 m²"). */
const withUnit = (area: string) => (/^\d+(?:[.,]\d+)?$/.test(area.trim()) ? `${area.trim()} m²` : area)

/**
 * A project, over the page: its cover grows from the square that was tapped into the banner,
 * then the title, the facts and the photos rise in under it. Closing shrinks the banner back
 * into its square. Esc, the back button or the browser's Back close it.
 */
export function ProjectView({ project, origin, instant, target, closing, page, category, onClose, onClosed }: ProjectViewProps) {
  const { t, lang } = useI18n()
  const rootRef = useRef<HTMLDivElement>(null)
  const bgRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const arcRef = useRef<HTMLElement>(null)

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
    if (instant) {
      gsap.set(bg, { opacity: 1 })
      return
    }
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
  }, [origin, instant])

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
    const content = root.querySelectorAll('[data-pv-line], .pv__bar, .pages-arc')
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
      // (the menu's buttons are there only once the banner is scrolled away)
      const stops = Array.from(e.currentTarget.querySelectorAll<HTMLElement>('a[href], button')).filter(
        (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden',
      )
      const edge = e.shiftKey ? stops[0] : stops.at(-1)
      if (document.activeElement === edge || !e.currentTarget.contains(document.activeElement)) {
        e.preventDefault()
        ;(e.shiftKey ? stops.at(-1) : stops[0])?.focus()
      }
    }
  }
  // Past the top of the banner, the bar gets its shade; once the banner is above the menu, the
  // menu comes in (it never lies over the photo).
  const onScroll = (e: UIEvent<HTMLDivElement>) => {
    const view = e.currentTarget
    view.toggleAttribute('data-scrolled', view.scrollTop > 60)
    const arc = arcRef.current
    const banner = heroRef.current?.getBoundingClientRect().bottom ?? 0
    arc?.toggleAttribute('data-on', banner < (window.innerHeight - arc.offsetHeight) / 2 - 24)
  }

  const facts = [
    project.place && { icon: <PlaceIcon />, label: t.projectPlace, value: project.place[lang] },
    project.year && { icon: <YearIcon />, label: t.projectYear, value: project.year },
    project.area && { icon: <AreaIcon />, label: t.projectArea, value: withUnit(project.area) },
    project.scope && { icon: <ScopeIcon category={project.category} />, label: t.projectScope, value: project.scope[lang] },
  ].filter((f) => !!f)

  return (
    <div
      ref={rootRef}
      className="pv"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pv-title"
      tabIndex={-1}
      onKeyDown={onKeyDown}
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

      {/* (the project's own page: back to its projects) */}
      <PagesArc variant="side" current={project.category} onCurrent={onClose} navRef={arcRef} />

      <div ref={heroRef} className="pv__hero">
        <Picture img={project.cover} sizes="100vw" alt={project.title[lang]} />
      </div>

      <article className="pv__body">
        <header className="pv__head">
          <p className="pv__kicker" data-pv-line>
            {page}
          </p>
          <h2 className="pv__title" id="pv-title" data-pv-line>
            {project.title[lang]}
          </h2>
        </header>

        {/* (as the strip under the pages' header: an icon, the value, what it is) */}
        {facts.length > 0 && (
          <dl className="pv__facts" data-pv-line>
            {facts.map(({ icon, label, value }) => (
              <div key={label} className="pv__fact" data-wide={value.length > 20 || undefined}>
                <dt>
                  {icon}
                  {label}
                </dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {project.summary && (
          <p className="pv__summary" data-pv-line>
            {project.summary[lang]}
          </p>
        )}
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
