import { gsap } from 'gsap'
import { useEffect, useEffectEvent, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent } from 'react'
import { createPortal, flushSync } from 'react-dom'
import { useI18n } from '../../../i18n/context'
import { REDUCED_MOTION_QUERY } from '../../../utils/device'
import { preloadCover, useProjects, type Project, type ProjectCategory } from './data'
import { Picture, ProjectView, type CoverOrigin } from './ProjectView'
import './projects.css'

/** The same scatter every time (−1…1), so the arrival is the same on every visit. */
const scatter = (i: number, k: number) => Math.sin(i * 12.9898 + k * 78.233) * 0.5 + Math.sin(i * 3.7 + k * 1.3) * 0.5

const reducedMotion = () => window.matchMedia(REDUCED_MOTION_QUERY).matches

interface ProjectsProps {
  category: ProjectCategory
  /** The page's name ("Xây dựng"), for the grid's label and the way back from a project. */
  name: string
  /** The page is shown: the covers arrange themselves. */
  ready: boolean
}

interface Open {
  project: Project
  origin: CoverOrigin | null
  /** Shown as it is, without its opening (the browser has already shown it: a swipe forward). */
  instant?: boolean
}

/** iOS starts its swipe back at the screen's left edge (forward: the right one). */
const EDGE = 24

/**
 * Did the browser animate this Back / Forward itself — a swipe, during which it already showed
 * the page as it will be? Browsers that know say so; for the others, a touch from the screen's
 * edge just before is taken for that swipe.
 */
function browserAnimated(e: PopStateEvent, edgeTouch: { side: 'left' | 'right'; at: number } | null, forward: boolean) {
  if ((e as PopStateEvent & { hasUAVisualTransition?: boolean }).hasUAVisualTransition) return true
  return !!edgeTouch && edgeTouch.side === (forward ? 'right' : 'left') && performance.now() - edgeTouch.at < 3000
}

/** How many squares the grid has to a row (its CSS decides: two on phones, more on computers). */
function columns(els: HTMLElement[]) {
  const top = els[0]?.offsetTop
  const n = els.findIndex((el) => el.offsetTop !== top)
  return n < 0 ? els.length : Math.max(1, n)
}

/**
 * The page's projects, under its first screen: square covers, two to a row on phones and as
 * many as fit on a computer, which arrive scattered and arrange themselves square by square
 * (the dark squares of a chessboard first, then the light ones), as the icons of a phone's
 * home screen do. Tapping a project throws the others off the screen while its cover grows
 * into the project's page — the photos under it (ProjectView). Each project has its own link:
 * /construction/#<id>.
 */
export function Projects({ category, name, ready }: ProjectsProps) {
  const { t, lang } = useI18n()
  const list = useProjects(category)
  const rootRef = useRef<HTMLElement>(null)
  const gridRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState<Open | null>(null)
  const [closing, setClosing] = useState(false)
  /** The view was opened here (with history.pushState): closing goes back. */
  const pushed = useRef(false)
  const arrived = useRef(false)

  const items = () => Array.from(gridRef.current?.children ?? []) as HTMLElement[]
  const itemOf = (id: string) => items().find((el) => el.dataset.id === id) ?? null

  /** The covers come into their squares, scattered at first. */
  const play = (els: HTMLElement[]) => {
    const cols = columns(els)
    els.forEach((el, i) => {
      const row = Math.floor(i / cols)
      const light = (row + (i % cols)) % 2
      gsap.fromTo(
        el,
        { opacity: 0, x: scatter(i, 1) * 70, y: 60 + Math.abs(scatter(i, 2)) * 80, rotation: scatter(i, 3) * 16, scale: 0.5 },
        {
          opacity: 1,
          x: 0,
          y: 0,
          rotation: 0,
          scale: 1,
          duration: 0.9,
          ease: 'back.out(1.6)',
          delay: 0.12 + light * 0.2 + row * 0.08,
          clearProps: 'transform,opacity',
        },
      )
    })
  }

  // Arrival: scattered covers settle into their squares (the dark squares first) once the grid
  // comes into view, under the page's first screen; once only — a new list is simply there.
  useLayoutEffect(() => {
    const grid = gridRef.current
    const els = items()
    if (!grid || !els.length) return
    if (!ready) {
      gsap.set(els, { opacity: 0 })
      return
    }
    if (arrived.current) return
    if (reducedMotion()) {
      arrived.current = true
      gsap.fromTo(els, { opacity: 0 }, { opacity: 1, duration: 0.3, clearProps: 'opacity' })
      return
    }
    gsap.set(els, { opacity: 0 })
    const watch = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return
        watch.disconnect()
        arrived.current = true
        play(els)
      },
      { threshold: 0.2 },
    )
    watch.observe(grid)
    return () => watch.disconnect()
  }, [list, ready])

  /** While the others fly, the grid is drawn over the view's dark (it fades in under them). */
  const lift = (on: boolean) => rootRef.current?.toggleAttribute('data-lifted', on)

  /** The other projects are thrown off the screen, away from the one tapped. */
  const fling = (id: string) => {
    const chosen = itemOf(id)
    if (!chosen || reducedMotion()) return
    const c = chosen.getBoundingClientRect()
    const reach = Math.hypot(window.innerWidth, window.innerHeight)
    lift(true)
    items().forEach((el, i) => {
      if (el === chosen) {
        gsap.to(el.querySelectorAll('.pj__label'), { opacity: 0, duration: 0.2 })
        return
      }
      const r = el.getBoundingClientRect()
      let dx = r.left + r.width / 2 - (c.left + c.width / 2)
      let dy = r.top + r.height / 2 - (c.top + c.height / 2)
      const len = Math.hypot(dx, dy) || 1
      dx /= len
      dy /= len
      const delay = Math.min(0.12, (len / reach) * 0.25)
      // (thrown: off at once, and only fading once well on its way)
      gsap.to(el, {
        x: dx * reach * 0.8,
        y: dy * reach * 0.8 - 30,
        rotation: (dx >= 0 ? 1 : -1) * (22 + Math.abs(scatter(i, 4)) * 26),
        scale: 0.75,
        duration: 0.75,
        ease: 'power3.out',
        delay,
        onComplete: () => lift(false),
      })
      gsap.to(el, { opacity: 0, duration: 0.75, ease: 'power2.in', delay })
    })
  }

  /** …and come back into their squares when the project closes. */
  const gather = (id: string) => {
    const chosen = itemOf(id)
    const others = items().filter((el) => el !== chosen)
    lift(true)
    gsap.to(others, {
      x: 0,
      y: 0,
      rotation: 0,
      scale: 1,
      opacity: 1,
      duration: 0.8,
      ease: 'back.out(1.25)',
      delay: 0.05,
      stagger: 0.04,
      clearProps: 'transform,opacity',
      onComplete: () => lift(false),
    })
    if (chosen) gsap.to(chosen.querySelectorAll('.pj__label'), { opacity: 1, duration: 0.4, delay: 0.55, clearProps: 'opacity' })
  }

  const show = (project: Project, origin: CoverOrigin | null, instant = false) => {
    setClosing(false)
    setOpen({ project, origin, instant })
  }

  /**
   * The browser has already shown the page under the view (a swipe back): the view goes at once
   * and the squares are back in place in the same frame — playing the closing then would show
   * the project again, then close it.
   */
  const closeNow = () => {
    const id = open?.project.id
    const els = items()
    const labels = els.flatMap((el) => Array.from(el.querySelectorAll<HTMLElement>('.pj__label')))
    gsap.killTweensOf([...els, ...labels])
    gsap.set([...els, ...labels], { clearProps: 'transform,opacity' })
    lift(false)
    const html = document.documentElement
    // (the text over the grid comes back without its fade)
    html.setAttribute('data-project-instant', '')
    html.removeAttribute('data-project-open')
    flushSync(() => {
      setOpen(null)
      setClosing(false)
    })
    if (id) itemOf(id)?.querySelector('a')?.focus({ preventScroll: true })
    requestAnimationFrame(() => requestAnimationFrame(() => html.removeAttribute('data-project-instant')))
  }

  // While a project is open the page under it keeps still (projects.css).
  useEffect(() => {
    document.documentElement.toggleAttribute('data-project-open', open !== null)
    return () => document.documentElement.removeAttribute('data-project-open')
  }, [open])

  // A page opened at #<id> shows that project as soon as the list is read.
  const [listRead, setListRead] = useState<Project[] | null>(null)
  if (list && listRead !== list) {
    setListRead(list)
    const project = list.find((p) => p.id === decodeURIComponent(location.hash.slice(1)))
    if (project) show(project, null)
  }

  const onTile = (project: Project) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
    e.preventDefault()
    if (open) return
    const cover = e.currentTarget.querySelector<HTMLElement>('.pj__cover')
    const img = cover?.querySelector('img')
    const origin =
      cover && img
        ? {
            rect: cover.getBoundingClientRect(),
            src: img.currentSrc || img.src,
            radius: parseFloat(getComputedStyle(cover).borderTopLeftRadius) || 0,
          }
        : null
    history.pushState({ project: project.id }, '', `#${project.id}`)
    pushed.current = true
    fling(project.id)
    show(project, origin)
  }

  /** The view's own way back is closing (its history.back() is never a swipe). */
  const viaButton = useRef(false)
  /** The last touch, when it started at the screen's edge (see browserAnimated). */
  const edgeTouch = useRef<{ side: 'left' | 'right'; at: number } | null>(null)

  /** Close: back through the history when the view added to it, so Back and × agree. */
  const requestClose = () => {
    if (closing) return
    if (pushed.current) {
      viaButton.current = true
      history.back()
      return
    }
    history.replaceState(null, '', `${location.pathname}${location.search}`)
    setClosing(true)
  }

  // The address decides: Back / Forward, a link to #<id>, a page opened at #<id>.
  const sync = useEffectEvent((e: PopStateEvent) => {
    const id = decodeURIComponent(location.hash.slice(1))
    const project = list?.find((p) => p.id === id)
    const ours = viaButton.current
    viaButton.current = false
    if (project && open?.project.id !== project.id) {
      pushed.current = false
      if (browserAnimated(e, edgeTouch.current, true)) flushSync(() => show(project, null, true))
      else show(project, null)
    } else if (!project && open && !closing) {
      pushed.current = false
      if (!ours && browserAnimated(e, edgeTouch.current, false)) closeNow()
      else setClosing(true)
    }
  })
  useEffect(() => {
    const touch = (e: TouchEvent) => {
      const x = e.touches[0]?.clientX ?? EDGE
      edgeTouch.current =
        x < EDGE ? { side: 'left', at: performance.now() } : x > innerWidth - EDGE ? { side: 'right', at: performance.now() } : null
    }
    window.addEventListener('popstate', sync)
    window.addEventListener('touchstart', touch, { capture: true, passive: true })
    return () => {
      window.removeEventListener('popstate', sync)
      window.removeEventListener('touchstart', touch, { capture: true })
    }
  }, [])

  // The closing animation starts: the others come back.
  const onClosing = useEffectEvent(() => {
    if (open) gather(open.project.id)
  })
  useEffect(() => {
    if (closing) onClosing()
  }, [closing])

  const target = () => (open ? (itemOf(open.project.id)?.querySelector('.pj__cover')?.getBoundingClientRect() ?? null) : null)

  const closed = () => {
    const id = open?.project.id
    setOpen(null)
    setClosing(false)
    if (id) itemOf(id)?.querySelector('a')?.focus({ preventScroll: true })
  }

  // (empty until the list is read, or when the page has no project on show)
  if (!list?.length) return <section ref={rootRef} className="pj" hidden />

  return (
    <section ref={rootRef} className="pj" aria-labelledby={`pj-title-${category}`}>
      <p className="pj__head" aria-hidden="true">
        <span>{t.projects}</span>
        <i />
        <span>{String(list.length).padStart(2, '0')}</span>
      </p>
      {/* (computers: a title over the grid; phones have the line above only) */}
      <h2 className="pj__title" id={`pj-title-${category}`}>
        {t.projectsOf.replace('{name}', lang === 'vi' ? name.toLowerCase() : name)}
      </h2>
      <ul ref={gridRef} className="pj__grid">
        {list.map((project, i) => (
          <li
            key={project.id}
            className="pj__item"
            data-id={project.id}
            data-open={open?.project.id === project.id || undefined}
            style={{ '--i': i } as CSSProperties}
          >
            <a
              className="pj__tile"
              href={`#${project.id}`}
              aria-label={t.projectOpen.replace('{name}', project.title[lang])}
              onClick={onTile(project)}
              onPointerEnter={() => preloadCover(project)}
              onFocus={() => preloadCover(project)}
            >
              <span className="pj__cover">
                <Picture img={project.cover} sizes="(max-width: 760px) 46vw, 300px" />
              </span>
              <span className="pj__label">
                <b>{project.title[lang]}</b>
                <small>{[project.place?.[lang], project.year].filter(Boolean).join(' · ')}</small>
              </span>
            </a>
          </li>
        ))}
      </ul>
      {open &&
        createPortal(
          <ProjectView
            key={open.project.id}
            project={open.project}
            origin={open.origin}
            instant={open.instant}
            target={target}
            closing={closing}
            page={name}
            category={t.projectsOf.replace('{name}', name)}
            onClose={requestClose}
            onClosed={closed}
          />,
          document.body,
        )}
    </section>
  )
}
