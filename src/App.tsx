import { useCallback, useEffect, useRef, useState } from 'react'
import { getSound, useSoundOn } from './audio/sound'
import { Header } from './components/Header'
import { HeroCarousel, type HeroCarouselHandle } from './components/HeroCarousel'
import { Loader } from './components/Loader'
import { carouselConfig } from './config/animation'
import { slides } from './data/slides'
import { useI18n } from './i18n/context'
import './App.css'

/** `#construction` → its index, so every space has a shareable link. */
function indexFromHash(): number | null {
  const id = decodeURIComponent(window.location.hash.slice(1))
  const index = slides.findIndex((slide) => slide.id === id)
  return index >= 0 ? index : null
}

export default function App() {
  const { t } = useI18n()
  const carouselRef = useRef<HeroCarouselHandle>(null)
  const [initialIndex] = useState(() => indexFromHash() ?? carouselConfig.initialIndex)
  const [loadProgress, setLoadProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const soundOn = useSoundOn()

  const handleActiveChange = useCallback((index: number) => {
    const hash = `#${slides[index].id}`
    if (window.location.hash !== hash) window.history.replaceState(null, '', hash)
  }, [])

  // Typing or following a link to another #space moves the carousel there.
  useEffect(() => {
    const onHashChange = () => {
      const index = indexFromHash()
      if (index !== null) carouselRef.current?.goTo(index)
    }
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const toggleSound = useCallback(() => getSound().setOn(!getSound().isOn), [])

  const goHome = useCallback(() => carouselRef.current?.goTo(carouselConfig.initialIndex), [])
  const handleReady = useCallback(() => setReady(true), [])

  return (
    <div className="app" data-ready={ready}>
      <Loader progress={loadProgress} done={ready} />
      <Header soundOn={soundOn} onToggleSound={toggleSound} onLogoClick={goHome} />
      <main className="app__main">
        <h1 className="visually-hidden">{t.heading}</h1>
        <HeroCarousel
          ref={carouselRef}
          slides={slides}
          initialIndex={initialIndex}
          onActiveChange={handleActiveChange}
          onLoadProgress={setLoadProgress}
          onReady={handleReady}
        />
      </main>
    </div>
  )
}
