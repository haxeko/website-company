/**
 * Phones: scrolls the page so `el` starts just under the fixed header — or further, where what
 * is open under it in the stage (the story, a card) would otherwise end below the screen — once
 * that content is laid out; smoothly, unless the visitor prefers reduced motion.
 */
export function revealBelowHeader(el: HTMLElement | null) {
  requestAnimationFrame(() => {
    if (!el) return
    const header = document.querySelector<HTMLElement>('.site-header')?.offsetHeight ?? 0
    const top = el.getBoundingClientRect().top + window.scrollY
    // (layout boxes: an opening block's entrance animation does not move them)
    const below = [...(el.parentElement?.children ?? [])].filter(
      (block): block is HTMLElement => block instanceof HTMLElement && block.offsetHeight > 0 && block.offsetTop > el.offsetTop,
    )
    const end = Math.max(el.offsetTop + el.offsetHeight, ...below.map((block) => block.offsetTop + block.offsetHeight)) - el.offsetTop
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: Math.max(0, top - header - 4, top + end + 12 - window.innerHeight),
      behavior: smooth ? 'smooth' : 'auto',
    })
  })
}
