import { useCallback, useEffect, useRef, useState } from 'react'
import { readSoundOn, TransitionSound } from './audio/TransitionSound'
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
  const soundRef = useRef<TransitionSound | null>(null)
  const [initialIndex] = useState(() => indexFromHash() ?? carouselConfig.initialIndex)
  const activeRef = useRef(initialIndex)
  const [loadProgress, setLoadProgress] = useState(0)
  const [ready, setReady] = useState(false)
  const [soundOn, setSoundOn] = useState(readSoundOn)

  useEffect(() => {
    const sound = new TransitionSound()
    soundRef.current = sound
    return () => {
      sound.dispose()
      soundRef.current = null
    }
  }, [])

  const handleActiveChange = useCallback((index: number) => {
    const forward = (index - activeRef.current + slides.length) % slides.length === 1
    activeRef.current = index
    soundRef.current?.play(forward ? 1 : -1)
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

  const toggleSound = useCallback(() => {
    const sound = soundRef.current
    if (!sound) return
    sound.setOn(!sound.isOn)
    setSoundOn(sound.isOn)
  }, [])

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
