import { useEffect, useState, type ComponentType, type CSSProperties, type ReactNode } from 'react'
import media from '../../data/media.json'
import { useI18n } from '../../i18n/context'
import type { PageCopy, SceneId } from './content'
import {
  AirConIcon,
  BulbIcon,
  CameraIcon,
  CurtainIcon,
  GearIcon,
  HomeIcon,
  LeafIcon,
  LockIcon,
  MoonIcon,
  PersonIcon,
  ProtocolIcon,
  ScenesIcon,
  SensorIcon,
  ShieldIcon,
  SunIcon,
  WeatherIcon,
} from './icons'
import { MAX_TEMP, MIN_TEMP, type PageDevice, type PageHome } from './usePageHome'

/** The screens of the panel, one per item of its side menu. */
export type PanelView = 'home' | 'scenes' | 'security' | 'energy' | 'settings'

export interface ScenePanelProps {
  home: PageHome
  copy: PageCopy['panel']
  scenes: PageCopy['scenes']
  view: PanelView
  /** Which way the screen slides when it changes (1 = to the next). */
  dir: 1 | -1
  onNavigate: (view: PanelView) => void
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

const NAV: { view: PanelView; Icon: ComponentType<{ className?: string }>; label: keyof PageCopy['panel']['nav'] }[] = [
  { view: 'home', Icon: HomeIcon, label: 'home' },
  { view: 'scenes', Icon: ScenesIcon, label: 'scenes' },
  { view: 'energy', Icon: LeafIcon, label: 'energy' },
  { view: 'security', Icon: ShieldIcon, label: 'security' },
  { view: 'settings', Icon: GearIcon, label: 'settings' },
]

const SCENE_ICONS: Record<SceneId, ReactNode> = { home: <PersonIcon />, relax: <SunIcon />, sleep: <MoonIcon /> }
/** Illustrative: kWh per day this week, and what the devices draw (kW). */
const WEEK = [18.2, 16.9, 17.4, 15.8, 16.3, 21.5, 12.4]
const DRAW = { lights: 0.36, ac: 1.2, pool: 0.75, standby: 0.08 }

/**
 * The control screen of the wall panel in the photo: a working (demo) interface laid over the
 * glass, as in the design — side menu, clock and weather, and one screen per menu item: the
 * devices and scenes, the scenes of the day, security, energy and the connected standards.
 */
export function ScenePanel(props: ScenePanelProps) {
  const { home, copy: p, scenes, view, dir, onNavigate, clock } = props
  const { lang } = useI18n()
  const now = useNow(15_000)
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const time = clock ?? now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="shp-panel__ui" role="group" aria-label={p.label}>
      <nav className="shp-panel__nav">
        <span className="shp-panel__chevron" aria-hidden="true" />
        {NAV.map(({ view: v, Icon, label }) => (
          <button key={v} type="button" aria-current={view === v ? 'page' : undefined} onClick={() => onNavigate(v)}>
            <Icon />
            {p.nav[label]}
          </button>
        ))}
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

        <div key={view} className="shp-panel__view" data-view={view} data-dir={dir}>
          {view === 'home' && <HomeView {...props} />}
          {view === 'scenes' && (
            <div className="shp-panel__scenes">
              {(Object.keys(scenes) as SceneId[]).map((id) => (
                <button key={id} type="button" className="shp-card shp-card--mode" data-on={home.mode === id || undefined} onClick={() => props.onScene(id)}>
                  {SCENE_ICONS[id]}
                  <span className="shp-card__time">{scenes[id].time}</span>
                  <b>{scenes[id].name}</b>
                  <small>{scenes[id].does}</small>
                </button>
              ))}
            </div>
          )}
          {view === 'security' && <SecurityView {...props} />}
          {view === 'energy' && <EnergyView {...props} />}
          {view === 'settings' && (
            <div className="shp-panel__networks">
              {p.networks.map(([count, state], i) => (
                <div key={i} className="shp-card shp-card--network">
                  <ProtocolIcon index={i} />
                  <b>{['Matter', 'Zigbee', 'Thread', 'Wi-Fi', 'Home Assistant', 'HomeKit'][i]}</b>
                  <small>{count}</small>
                  <span className="shp-card__state">{state}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function HomeView({ home, copy: p, onToggle, onSetLevel, onSetTemp, onScene, onToggleArmed }: ScenePanelProps) {
  const { lights, curtain, ac, armed, mode } = home
  return (
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
      <ModeCard kind="home" icon={<LeafIcon />} title={p.homeMode} note={p.homeModeNote} active={mode === 'home'} onClick={() => onScene('home')} />
      <ModeCard kind="sleep" icon={<MoonIcon />} title={p.sleepMode} note={p.sleepModeNote} active={mode === 'sleep'} onClick={() => onScene('sleep')} />
      <ModeCard kind="security" icon={<ShieldIcon />} title={p.security} note={armed ? p.armed : p.disarmed} active={armed} onClick={onToggleArmed} />
    </div>
  )
}

/** The two cameras: the courtyard in colour, the front gate in infrared with a car picked out. */
const CAMS = [
  { file: 'cam-garden', mode: 'colour' },
  { file: 'cam-gate', mode: 'ir', box: { left: 3, top: 37, width: 37, height: 19 } },
] as const
const CAM_BASE = `../${media.pages.publicPath}`
const CAM_WIDTHS = Object.fromEntries(media.pages['smart-home'].extras.map(({ name, widths }) => [name, widths]))
const camSet = (file: string, format: string) => CAM_WIDTHS[file].map((w) => `${CAM_BASE}/${file}-${w}.${format} ${w}w`).join(', ')

/** A camera's own clock, to the second (the scene's time while the demo plays). */
function CamClock({ clock }: { clock?: string }) {
  const { lang } = useI18n()
  const now = useNow(1000)
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const seconds = String(now.getSeconds()).padStart(2, '0')
  const time = clock ? `${clock}:${seconds}` : now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  return <span className="shp-camera__clock">{time}</span>
}

function SecurityView({ home, copy: p, clock, onToggleArmed }: ScenePanelProps) {
  return (
    <div className="shp-panel__security">
      {CAMS.map((cam, i) => (
        <figure key={cam.file} className="shp-camera" data-mode={cam.mode}>
          <picture>
            <source type="image/avif" srcSet={camSet(cam.file, 'avif')} sizes="(min-width: 761px) 22vw, 40vw" />
            <img
              src={`${CAM_BASE}/${cam.file}-${CAM_WIDTHS[cam.file][0]}.webp`}
              srcSet={camSet(cam.file, 'webp')}
              sizes="(min-width: 761px) 22vw, 40vw"
              alt=""
              decoding="async"
            />
          </picture>
          {'box' in cam && (
            <span
              className="shp-camera__box"
              style={{ left: `${cam.box.left}%`, top: `${cam.box.top}%`, width: `${cam.box.width}%`, height: `${cam.box.height}%` }}
            >
              <i>{p.detected}</i>
            </span>
          )}
          <figcaption>
            <span className="shp-camera__live">{p.live}</span>
            <CamClock clock={clock} />
            <b>
              <CameraIcon />
              {p.cameras[i]}
            </b>
            <small>
              CAM 0{i + 1} · {p.cameraModes[i]}
            </small>
          </figcaption>
        </figure>
      ))}
      <ul className="shp-panel__locks">
        <li>
          <button type="button" className="shp-panel__arm" aria-pressed={home.armed} onClick={onToggleArmed}>
            <ShieldIcon />
            <span>{p.security}</span>
            <b>{home.armed ? p.armed : p.disarmed}</b>
          </button>
        </li>
        {p.locks.map(([name, state], i) => (
          <li key={name}>
            {i < 2 ? <LockIcon /> : <SensorIcon />}
            <span>{name}</span>
            <b>{state}</b>
          </li>
        ))}
      </ul>
    </div>
  )
}

function EnergyView({ home, copy: p }: ScenePanelProps) {
  const { lang } = useI18n()
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const num = (n: number) => n.toLocaleString(locale, { maximumFractionDigits: 2 })
  const draw = {
    lights: home.lights.on ? (DRAW.lights * home.lights.level) / 100 : 0,
    ac: home.ac.on ? DRAW.ac : 0,
    pool: DRAW.pool,
    standby: DRAW.standby,
  }
  const total = draw.lights + draw.ac + draw.pool + draw.standby
  const max = Math.max(...WEEK)
  return (
    <div className="shp-panel__energy">
      <div className="shp-card shp-card--chart">
        <small>{p.today}</small>
        <b>
          {num(WEEK[WEEK.length - 1])} <small>{p.unit}</small>
        </b>
        <div className="shp-panel__bars" aria-hidden="true">
          {WEEK.map((v, i) => (
            <i key={i} style={{ '--h': v / max } as CSSProperties} data-today={i === WEEK.length - 1 || undefined} />
          ))}
        </div>
      </div>
      <div className="shp-card shp-card--draw">
        <small>
          {p.drawTitle} · {num(total)} kW
        </small>
        <ul>
          {(Object.keys(draw) as (keyof typeof draw)[]).map((k) => (
            <li key={k} data-off={draw[k] === 0 || undefined}>
              <span>{p.draw[k]}</span>
              <b>{num(draw[k])} kW</b>
              <i style={{ '--w': draw[k] / DRAW.ac } as CSSProperties} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
