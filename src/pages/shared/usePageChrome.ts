import { useEffect, useState, type RefObject } from 'react'

/**
 * What every stand-alone page does around its content: the header comes in as on the home
 * page once the page is shown (`ready`), gets a backdrop once there is content under it
 * (`scrolled`, stacked layout), and its height is kept in --pg-header-h for the layout. The
 * meta description follows the language.
 */
export function usePageChrome(rootRef: RefObject<HTMLElement | null>, description: string) {
  const [ready, setReady] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true))
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    document.querySelector('meta[name="description"]')?.setAttribute('content', description)
  }, [description])

  useEffect(() => {
    const header = document.querySelector<HTMLElement>('.site-header')
    const root = rootRef.current
    if (!header || !root) return
    const observer = new ResizeObserver(() => root.style.setProperty('--pg-header-h', `${header.offsetHeight}px`))
    observer.observe(header)
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [rootRef])

  return { ready, scrolled }
}
