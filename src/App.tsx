import { useCallback, useRef, useState } from 'react'
import { Header } from './components/Header'
import { HeroCarousel, type HeroCarouselHandle } from './components/HeroCarousel'
import { Loader } from './components/Loader'
import { MenuOverlay } from './components/MenuOverlay'
import { carouselConfig } from './config/animation'
import { slides } from './data/slides'
import './App.css'

export default function App() {
  const carouselRef = useRef<HeroCarouselHandle>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(carouselConfig.initialIndex)
  const [loadProgress, setLoadProgress] = useState(0)
  const [ready, setReady] = useState(false)

  const closeMenu = useCallback(() => {
    setMenuOpen(false)
    toggleRef.current?.focus({ preventScroll: true })
  }, [])

  const toggleMenu = useCallback(() => {
    if (menuOpen) closeMenu()
    else setMenuOpen(true)
  }, [menuOpen, closeMenu])

  const selectFromMenu = useCallback(
    (index: number) => {
      closeMenu()
      carouselRef.current?.goTo(index)
    },
    [closeMenu],
  )

  const goHome = useCallback(() => {
    setMenuOpen(false)
    carouselRef.current?.goTo(carouselConfig.initialIndex)
  }, [])

  const handleReady = useCallback(() => setReady(true), [])

  return (
    <div className="app" data-ready={ready}>
      <Loader progress={loadProgress} done={ready} />
      <Header menuOpen={menuOpen} onToggleMenu={toggleMenu} onLogoClick={goHome} toggleRef={toggleRef} />
      <MenuOverlay
        open={menuOpen}
        slides={slides}
        activeIndex={activeIndex}
        onSelect={selectFromMenu}
        onClose={closeMenu}
      />
      <main className="app__main" inert={menuOpen}>
        <h1 className="visually-hidden">VILLA NEST — Architecture, Interior &amp; Smart Home</h1>
        <HeroCarousel
          ref={carouselRef}
          slides={slides}
          interactive={!menuOpen}
          onActiveChange={setActiveIndex}
          onLoadProgress={setLoadProgress}
          onReady={handleReady}
        />
      </main>
    </div>
  )
}
