import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import type { PanelRect } from '../../data/slides'
import { useI18n } from '../../i18n/context'
import { MAX_TEMP, MIN_TEMP, type Appliance, type HomeState } from './homeState'
import { SevenSegment } from './SevenSegment'
import './SmartHome.css'

interface ControlScreenProps {
  home: HomeState
  onToggle: (key: Appliance) => void
  onNudgeTemp: (delta: number) => void
  /** Placement on the photographed panel; omitted for the enlarged copy. */
  rect?: { landscape: PanelRect; portrait: PanelRect }
  /** Too small to use on the wall (phones): a tap asks for the enlarged copy instead. */
  onExpand?: () => void
}

/** The demo wash cycle: 32 of 45 minutes left when the page opens. */
const WASH_TOTAL = 45
const WASH_LEFT_AT_LOAD = 32
const loadedAt = Date.now()

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

const rectVars = (r: PanelRect, prefix: string) => ({
  [`--sh-${prefix}-l`]: `${r.left}%`,
  [`--sh-${prefix}-t`]: `${r.top}%`,
  [`--sh-${prefix}-w`]: `${r.width}%`,
  [`--sh-${prefix}-h`]: `${r.height}%`,
  [`--sh-${prefix}-r`]: `${r.radiusX}% / ${r.radiusY}%`,
})

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="sh-card__icon" viewBox="0 0 48 48" aria-hidden="true">
      {children}
    </svg>
  )
}

/**
 * The live screen of the wall panel in the Smart Home photo: a working (demo) control
 * screen with lights, air-con, fan and a washer status card. It sits exactly on the dark
 * glass of the photographed panel, inside the slide, so it turns and dims with it.
 */
export function ControlScreen({ home, onToggle, onNudgeTemp, rect, onExpand }: ControlScreenProps) {
  const { lang, t } = useI18n()
  const now = useNow(15_000)
  const hour = now.getHours()
  const greeting = hour < 11 ? t.morning : hour < 18 ? t.afternoon : t.evening
  const time = now.toLocaleTimeString(lang === 'vi' ? 'vi-VN' : 'en-GB', { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString(lang === 'vi' ? 'vi-VN' : 'en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const washLeft = Math.max(0, WASH_LEFT_AT_LOAD - Math.floor((now.getTime() - loadedAt) / 60_000))
  const washProgress = 1 - washLeft / WASH_TOTAL

  const style = rect ? ({ ...rectVars(rect.landscape, 'l'), ...rectVars(rect.portrait, 'p') } as CSSProperties) : undefined
  const state = (on: boolean) => (on ? t.on : t.off)

  return (
    <div
      className={rect ? 'sh-screen' : 'sh-screen sh-screen--sheet'}
      style={style}
      data-live={rect ? true : undefined}
      role="group"
      aria-label={t.homePanel}
    >
      {onExpand && (
        <button type="button" className="sh-screen__zoom" aria-label={t.homeOpen} onClick={onExpand} />
      )}
      <div className="sh-screen__inner">
        <header className="sh-top">
          <div>
            <p className="sh-top__time">{time}</p>
            <p className="sh-top__date">{date}</p>
          </div>
          <div className="sh-top__right">
            <p className="sh-top__hello">{greeting}</p>
            <p className="sh-top__hint">{t.homeTouch}</p>
          </div>
        </header>

        <div className="sh-cards">
          <div className="sh-card" data-kind="lights" data-on={home.lights || undefined}>
            <button
              type="button"
              className="sh-card__hit"
              aria-pressed={home.lights}
              aria-label={`${t.lights}: ${state(home.lights)}`}
              onClick={() => onToggle('lights')}
            />
            <Icon>
              <path d="M18 34h12M19.5 39h9M24 7a12 12 0 0 0-7 21.7c1 .8 1.5 1.9 1.5 3.1V34h11v-2.2c0-1.2.6-2.3 1.5-3.1A12 12 0 0 0 24 7Z" />
            </Icon>
            <div className="sh-card__text">
              <b>{t.lights}</b>
              <small>{home.lights ? t.lightsOn : t.off}</small>
            </div>
            <i className="sh-card__switch" aria-hidden="true" />
          </div>

          <div className="sh-card" data-kind="ac" data-on={home.ac || undefined}>
            <button
              type="button"
              className="sh-card__hit"
              aria-pressed={home.ac}
              aria-label={`${t.ac}: ${state(home.ac)}${home.ac ? `, ${home.temp} °C` : ''}`}
              onClick={() => onToggle('ac')}
            />
            <div className="sh-ac" aria-hidden="true">
              <SevenSegment value={home.ac ? String(home.temp) : '--'} />
              <span className="sh-ac__unit">°C</span>
            </div>
            <div className="sh-ac__nudge">
              <button
                type="button"
                aria-label={t.cooler}
                disabled={!home.ac || home.temp <= MIN_TEMP}
                onClick={() => onNudgeTemp(-1)}
              >
                −
              </button>
              <button
                type="button"
                aria-label={t.warmer}
                disabled={!home.ac || home.temp >= MAX_TEMP}
                onClick={() => onNudgeTemp(1)}
              >
                +
              </button>
            </div>
            <div className="sh-card__text">
              <b>{t.ac}</b>
              <small>{state(home.ac)}</small>
            </div>
          </div>

          <div className="sh-card" data-kind="fan" data-on={home.fan || undefined}>
            <button
              type="button"
              className="sh-card__hit"
              aria-pressed={home.fan}
              aria-label={`${t.fan}: ${state(home.fan)}`}
              onClick={() => onToggle('fan')}
            />
            <Icon>
              <g className="sh-fan">
                <path d="M24 21c-1.5-5-1-11 3.5-12.5 4.7-1.5 6 4.5 1.8 8.2L24 21Z" />
                <path d="M26.6 25.5c5.1-1.2 11 .6 11.8 5.2.9 4.9-5.1 5.8-8.4 1.3l-3.4-6.5Z" />
                <path d="M21.4 25.5c-3.6 3.8-9.6 5.3-12.7 1.8-3.3-3.7 1.4-7.6 6.5-5.4l6.2 3.6Z" />
                <circle cx="24" cy="24" r="2.6" />
              </g>
            </Icon>
            <div className="sh-card__text">
              <b>{t.fan}</b>
              <small>{home.fan ? t.fanOn : t.off}</small>
            </div>
            <i className="sh-card__switch" aria-hidden="true" />
          </div>

          <div className="sh-card" data-kind="washer" data-on={washLeft > 0 || undefined}>
            <Icon>
              <rect x="10" y="6" width="28" height="36" rx="3" />
              <path d="M10 14h28" />
              <circle cx="24" cy="28" r="8.5" />
              <path className="sh-drum" d="M18.5 29c2-1.6 3.6-1.6 5.5 0s3.5 1.6 5.5 0" />
            </Icon>
            <div className="sh-card__text">
              <b>{t.washer}</b>
              <small>{washLeft > 0 ? t.washing : t.washDone}</small>
              {washLeft > 0 && <em>{t.minutesLeft.replace('{n}', String(washLeft))}</em>}
            </div>
            <span className="sh-card__bar" aria-hidden="true">
              <span style={{ width: `${Math.round(washProgress * 100)}%` }} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
