import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { useI18n } from '../../i18n/context'
import { MAX_TEMP, MIN_TEMP, type Appliance, type Device, type Dimmable, type HomeState } from './homeState'
import { SevenSegment } from './SevenSegment'
import './SmartHome.css'

export interface ControlScreenProps {
  home: HomeState
  onToggle: (key: Appliance) => void
  onSetLevel: (key: Dimmable, level: number) => void
  onNudgeTemp: (delta: number) => void
  /** `wall`: on the photographed panel (placed by the surrounding HomeWall); `sheet`: the enlarged copy. */
  variant: 'wall' | 'sheet'
  /** Wall screen too small to use (phones): a tap asks for the enlarged copy instead. */
  onExpand?: () => void
}

function useNow(intervalMs: number) {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs])
  return now
}

function Icon({ children }: { children: ReactNode }) {
  return (
    <svg className="sh-card__icon" viewBox="0 0 48 48" aria-hidden="true">
      {children}
    </svg>
  )
}

interface LevelCardProps {
  kind: Dimmable
  device: Device
  label: string
  status: string
  sliderLabel: string
  icon: ReactNode
  onToggle: (key: Appliance) => void
  onSetLevel: (key: Dimmable, level: number) => void
}

/** Lights, fan, curtains: a tap on the card switches on / off, the slider sets the level. */
function LevelCard({ kind, device, label, status, sliderLabel, icon, onToggle, onSetLevel }: LevelCardProps) {
  const style = {
    '--sh-level': device.level / 100,
    '--sh-pos': (device.level - 1) / 99,
  } as CSSProperties
  return (
    <div className="sh-card" data-kind={kind} data-on={device.on || undefined} style={style}>
      <button
        type="button"
        className="sh-card__hit"
        aria-pressed={device.on}
        aria-label={`${label}: ${status}`}
        onClick={() => onToggle(kind)}
      />
      <Icon>{icon}</Icon>
      <i className="sh-card__switch" aria-hidden="true" />
      <div className="sh-card__text">
        <b>{label}</b>
        <small>{status}</small>
      </div>
      <input
        type="range"
        className="sh-slider"
        min={1}
        max={100}
        step={1}
        value={device.level}
        aria-label={sliderLabel}
        aria-valuetext={`${device.level}%`}
        onChange={(e) => onSetLevel(kind, Number(e.currentTarget.value))}
      />
    </div>
  )
}

/**
 * The live screen of the wall panel in the Smart Home photo: a working (demo) control
 * screen for the lights, air-con, fan and curtains.
 */
export function ControlScreen({ home, onToggle, onSetLevel, onNudgeTemp, variant, onExpand }: ControlScreenProps) {
  const { lang, t } = useI18n()
  const now = useNow(15_000)
  const locale = lang === 'vi' ? 'vi-VN' : 'en-GB'
  const hour = now.getHours()
  const greeting = hour < 11 ? t.morning : hour < 18 ? t.afternoon : t.evening
  const time = now.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  const date = now.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })

  const { lights, fan, curtain, ac } = home
  const active = [lights.on, fan.on, curtain.on, ac.on].filter(Boolean).length
  const summary = active === 0 ? t.allOff : active === 1 ? t.oneDeviceOn : t.devicesOn.replace('{n}', String(active))
  const level = (device: Device) => (device.on ? `${device.level}%` : t.off)
  // Stronger fan, faster blades.
  const fanSpin = { animationDuration: `${(1.9 - 1.5 * (fan.level / 100)).toFixed(2)}s` }

  return (
    <div
      className={`sh-screen sh-screen--${variant}`}
      data-live={variant === 'wall' || undefined}
      role="group"
      aria-label={t.homePanel}
    >
      {onExpand && <button type="button" className="sh-screen__zoom" aria-label={t.homeOpen} onClick={onExpand} />}
      <div className="sh-screen__inner">
        <header className="sh-top">
          <div>
            <p className="sh-top__time">{time}</p>
            <p className="sh-top__date">{date}</p>
          </div>
          <div className="sh-top__right">
            <p className="sh-top__hello">{greeting}</p>
            <p className="sh-top__summary">{summary}</p>
          </div>
        </header>

        <div className="sh-cards">
          <LevelCard
            kind="lights"
            device={lights}
            label={t.lights}
            status={level(lights)}
            sliderLabel={t.brightness}
            onToggle={onToggle}
            onSetLevel={onSetLevel}
            icon={
              <path d="M18 34h12M19.5 39h9M24 7a12 12 0 0 0-7 21.7c1 .8 1.5 1.9 1.5 3.1V34h11v-2.2c0-1.2.6-2.3 1.5-3.1A12 12 0 0 0 24 7Z" />
            }
          />

          <div className="sh-card" data-kind="ac" data-on={ac.on || undefined}>
            <button
              type="button"
              className="sh-card__hit"
              aria-pressed={ac.on}
              aria-label={`${t.ac}: ${ac.on ? `${t.on}, ${ac.temp} °C` : t.off}`}
              onClick={() => onToggle('ac')}
            />
            <div className="sh-ac" aria-hidden="true">
              <SevenSegment value={ac.on ? String(ac.temp) : '--'} />
              <span className="sh-ac__unit">°C</span>
            </div>
            <div className="sh-card__text">
              <b>{t.ac}</b>
              <small>{ac.on ? t.on : t.off}</small>
            </div>
            <div className="sh-ac__nudge">
              <button
                type="button"
                aria-label={t.cooler}
                disabled={!ac.on || ac.temp <= MIN_TEMP}
                onClick={() => onNudgeTemp(-1)}
              >
                −
              </button>
              <button
                type="button"
                aria-label={t.warmer}
                disabled={!ac.on || ac.temp >= MAX_TEMP}
                onClick={() => onNudgeTemp(1)}
              >
                +
              </button>
            </div>
          </div>

          <LevelCard
            kind="fan"
            device={fan}
            label={t.fan}
            status={level(fan)}
            sliderLabel={t.fanSpeed}
            onToggle={onToggle}
            onSetLevel={onSetLevel}
            icon={
              <g className="sh-fan" style={fanSpin}>
                <path d="M24 21c-1.5-5-1-11 3.5-12.5 4.7-1.5 6 4.5 1.8 8.2L24 21Z" />
                <path d="M26.6 25.5c5.1-1.2 11 .6 11.8 5.2.9 4.9-5.1 5.8-8.4 1.3l-3.4-6.5Z" />
                <path d="M21.4 25.5c-3.6 3.8-9.6 5.3-12.7 1.8-3.3-3.7 1.4-7.6 6.5-5.4l6.2 3.6Z" />
                <circle cx="24" cy="24" r="2.6" />
              </g>
            }
          />

          <LevelCard
            kind="curtain"
            device={curtain}
            label={t.curtain}
            status={curtain.on ? t.curtainClosed.replace('{n}', String(curtain.level)) : t.curtainOpen}
            sliderLabel={t.curtainLevel}
            onToggle={onToggle}
            onSetLevel={onSetLevel}
            icon={
              <>
                <path d="M5 8h38" />
                <path d="M9 8v32c3 1.5 6 1.5 9 0-2.5-9-2.5-21 1-32" />
                <path d="M39 8v32c-3 1.5-6 1.5-9 0 2.5-9 2.5-21-1-32" />
                <path d="M13 12v25M35 12v25" />
              </>
            }
          />
        </div>
      </div>
    </div>
  )
}
