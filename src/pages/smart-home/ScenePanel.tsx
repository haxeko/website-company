import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useI18n } from '../../i18n/context'
import type { PageCopy, SceneId } from './content'
import {
  AirConIcon,
  BulbIcon,
  CurtainIcon,
  GearIcon,
  HomeIcon,
  LeafIcon,
  MoonIcon,
  ScenesIcon,
  ShieldIcon,
  WeatherIcon,
} from './icons'
import { MAX_TEMP, MIN_TEMP, type PageDevice, type PageHome } from './usePageHome'

export interface ScenePanelProps {
  home: PageHome
  copy: PageCopy['panel']
  /** The clock shows the time of the scene on show while the demo plays. */
  clock?: string
  onToggle: (key: PageDevice) => void
  onSetLevel: (key: 'lights' | 'curtain', level: number) => void
  onSetTemp: (temp: number) => void
  onScene: (scene: SceneId) => void
  onToggleArmed: () => void
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

interface DeviceCardProps {
  kind: PageDevice
  icon: ReactNode
  title: string
  note: string
  on: boolean
  value: number
  min: number
  max: number
  sliderLabel: string
  valueText: string
  onToggle: () => void
  onChange: (value: number) => void
}

function DeviceCard({ kind, icon, title, note, on, value, min, max, sliderLabel, valueText, onToggle, onChange }: DeviceCardProps) {
  return (
    <div className="shp-card" data-kind={kind} data-on={on || undefined}>
      <button type="button" className="shp-card__hit" aria-pressed={on} aria-label={`${title}: ${note}`} onClick={onToggle} />
      {icon}
      <b>{title}</b>
      <small>{note}</small>
      <input
        type="range"
        className="shp-slider"
        min={min}
        max={max}
        value={value}
        aria-label={sliderLabel}
        aria-valuetext={valueText}
        style={{ '--pos': (value - min) / (max - min) } as CSSProperties}
        onChange={(e) => onChange(Number(e.currentTarget.value))}
      />
    </div>
  )
}

interface ModeCardProps {
  kind: string
  icon: ReactNode
  title: string
  note: string
  active: boolean
  onClick: () => void
}

function ModeCard({ kind, icon, title, note, active, onClick }: ModeCardProps) {
  return (
    <button type="button" className="shp-card shp-card--mode" data-kind={kind} data-on={active || undefined} aria-pressed={active} onClick={onClick}>
      {icon}
      <b>{title}</b>
      <small>{note}</small>
    </button>
  )
}

/**
 * The control screen of the wall panel in the photo: a working (demo) interface laid over the
 * glass, as in the design — side menu, clock and weather, devices and scenes.
 */
export function ScenePanel({ home, copy: p, clock, onToggle, onSetLevel, onSetTemp, onScene, onToggleArmed }: ScenePanelProps) {
  const { lang } = useI18n()
  const now = useNow(15_000)
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const time = clock ?? now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })
  const { lights, curtain, ac, armed, mode } = home

  return (
    <div className="shp-panel__ui" role="group" aria-label={p.label}>
      <nav className="shp-panel__nav">
        <span className="shp-panel__chevron" aria-hidden="true" />
        <a href="#top" aria-current="page">
          <HomeIcon />
          {p.nav.home}
        </a>
        <a href="#scenes">
          <ScenesIcon />
          {p.nav.scenes}
        </a>
        <a href="#energy">
          <LeafIcon />
          {p.nav.energy}
        </a>
        <a href="#security">
          <ShieldIcon />
          {p.nav.security}
        </a>
        <a href="#open">
          <GearIcon />
          {p.nav.settings}
        </a>
      </nav>

      <div className="shp-panel__main">
        <header className="shp-panel__top">
          <div>
            <p className="shp-panel__time">{time}</p>
            <p className="shp-panel__date">{date}</p>
          </div>
          <p className="shp-panel__weather">
            <WeatherIcon />
            <b>28°C</b>
            <small>{p.city}</small>
          </p>
        </header>

        <div className="shp-panel__cards">
          <DeviceCard
            kind="lights"
            icon={<BulbIcon />}
            title={p.lights}
            note={lights.on ? `${p.lightsNote} · ${lights.level}%` : p.off}
            on={lights.on}
            value={lights.level}
            min={1}
            max={100}
            sliderLabel={p.brightness}
            valueText={`${lights.level}%`}
            onToggle={() => onToggle('lights')}
            onChange={(v) => onSetLevel('lights', v)}
          />
          <DeviceCard
            kind="curtain"
            icon={<CurtainIcon />}
            title={p.curtain}
            note={curtain.on ? p.closed.replace('{n}', String(curtain.level)) : p.curtainNote}
            on={curtain.on}
            value={curtain.level}
            min={1}
            max={100}
            sliderLabel={p.curtainLevel}
            valueText={`${curtain.level}%`}
            onToggle={() => onToggle('curtain')}
            onChange={(v) => onSetLevel('curtain', v)}
          />
          <DeviceCard
            kind="ac"
            icon={<AirConIcon />}
            title={p.ac}
            note={ac.on ? `${ac.temp}°C` : `${p.off} · ${ac.temp}°C`}
            on={ac.on}
            value={ac.temp}
            min={MIN_TEMP}
            max={MAX_TEMP}
            sliderLabel={p.temperature}
            valueText={`${ac.temp} °C`}
            onToggle={() => onToggle('ac')}
            onChange={onSetTemp}
          />
          <ModeCard
            kind="home"
            icon={<LeafIcon />}
            title={p.homeMode}
            note={p.homeModeNote}
            active={mode === 'home'}
            onClick={() => onScene('home')}
          />
          <ModeCard
            kind="sleep"
            icon={<MoonIcon />}
            title={p.sleepMode}
            note={p.sleepModeNote}
            active={mode === 'sleep'}
            onClick={() => onScene('sleep')}
          />
          <ModeCard
            kind="security"
            icon={<ShieldIcon />}
            title={p.security}
            note={armed ? p.armed : p.disarmed}
            active={armed}
            onClick={onToggleArmed}
          />
        </div>
      </div>
    </div>
  )
}
