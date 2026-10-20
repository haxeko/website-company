import type { CSSProperties, ReactNode } from 'react'
import type { PageCopy, SceneId, SectionId } from './content'
import {
  ArrowIcon,
  CameraIcon,
  LockIcon,
  MeterIcon,
  MoonIcon,
  PersonIcon,
  ProtocolIcon,
  SensorIcon,
  ShieldIcon,
  SunIcon,
} from './icons'

const ORDER: SectionId[] = ['scenes', 'security', 'energy', 'open']

function Section({ id, copy, lead, children, aside }: { id: SectionId; copy: PageCopy; lead: string; children?: ReactNode; aside: ReactNode }) {
  const n = ORDER.indexOf(id) + 1
  return (
    <section id={id} className="shp-section" aria-labelledby={`${id}-title`}>
      <div className="shp-section__text">
        <p className="shp-section__index">
          <span>{String(n).padStart(2, '0')}</span>
          {copy.features[id].note}
        </p>
        <h2 id={`${id}-title`}>{copy.features[id].title}</h2>
        <p className="shp-section__lead">{lead}</p>
        {children}
      </div>
      <div className="shp-section__aside">{aside}</div>
    </section>
  )
}

function Points({ items, icons }: { items: [string, string][]; icons: ReactNode[] }) {
  return (
    <ul className="shp-points">
      {items.map(([title, text], i) => (
        <li key={title}>
          {icons[i]}
          <b>{title}</b>
          <span>{text}</span>
        </li>
      ))}
    </ul>
  )
}

const SCENE_ICONS: Record<SceneId, ReactNode> = { home: <PersonIcon />, relax: <SunIcon />, sleep: <MoonIcon /> }

/** The bars of the illustrative energy chart, kWh per day. */
const ENERGY = [18.2, 16.9, 17.4, 15.8, 16.3, 21.5, 20.1]

interface SectionsProps {
  copy: PageCopy
  /** The scene on show (demo) or last applied. */
  scene: SceneId | null
  armed: boolean
  onScene: (scene: SceneId) => void
  onToggleArmed: () => void
}

export function Sections({ copy, scene, armed, onScene, onToggleArmed }: SectionsProps) {
  const { sections: s } = copy
  const max = Math.max(...ENERGY)
  const total = ENERGY.reduce((a, b) => a + b, 0)

  return (
    <>
      <Section
        id="scenes"
        copy={copy}
        lead={s.scenes.lead}
        aside={
          <div className="shp-scenes">
            {(Object.keys(copy.scenes) as SceneId[]).map((id) => (
              <button key={id} type="button" className="shp-scene" data-on={scene === id || undefined} onClick={() => onScene(id)}>
                {SCENE_ICONS[id]}
                <span className="shp-scene__time">{copy.scenes[id].time}</span>
                <b>{copy.scenes[id].name}</b>
                <small>{copy.scenes[id].does}</small>
                <ArrowIcon className="shp-scene__go" />
              </button>
            ))}
          </div>
        }
      >
        <p className="shp-section__hint">{s.scenes.steps}</p>
      </Section>

      <Section
        id="security"
        copy={copy}
        lead={s.security.lead}
        aside={
          <div className="shp-status">
            <button type="button" className="shp-status__arm" aria-pressed={armed} onClick={onToggleArmed}>
              <ShieldIcon />
              <b>{copy.panel.security}</b>
              <span>{armed ? copy.panel.armed : copy.panel.disarmed}</span>
              <i aria-hidden="true" />
            </button>
            <ul>
              {s.security.status.map(([name, state]) => (
                <li key={name}>
                  <span>{name}</span>
                  <b>{state}</b>
                </li>
              ))}
            </ul>
          </div>
        }
      >
        <Points items={s.security.points} icons={[<CameraIcon key="c" />, <LockIcon key="l" />, <SensorIcon key="s" />]} />
      </Section>

      <Section
        id="energy"
        copy={copy}
        lead={s.energy.lead}
        aside={
          <figure className="shp-energy">
            <figcaption>
              <b>{s.energy.chartTitle}</b>
              <span>{total.toFixed(1)} kWh</span>
            </figcaption>
            <div className="shp-energy__bars" aria-hidden="true">
              {ENERGY.map((v, i) => (
                <div key={s.energy.days[i]} style={{ '--h': v / max } as CSSProperties}>
                  <i />
                  <small>{s.energy.days[i]}</small>
                </div>
              ))}
            </div>
            <p>{s.energy.chartNote}</p>
          </figure>
        }
      >
        <Points items={s.energy.points} icons={[<PersonIcon key="p" />, <SunIcon key="s" />, <MeterIcon key="m" />]} />
      </Section>

      <Section
        id="open"
        copy={copy}
        lead={s.open.lead}
        aside={
          <ul className="shp-platforms">
            {s.open.platforms.map(([name, note], i) => (
              <li key={name}>
                <ProtocolIcon index={i} />
                <b>{name}</b>
                <small>{note}</small>
              </li>
            ))}
          </ul>
        }
      />

      <section className="shp-outro" aria-labelledby="outro-title">
        <h2 id="outro-title">{copy.outro.title}</h2>
        <p>{copy.outro.text}</p>
        <div className="shp-outro__links">
          <a className="shp-button" href="../">
            {copy.outro.home}
            <span className="shp-button__icon">
              <ArrowIcon />
            </span>
          </a>
          <a className="shp-link" href="../#construction">
            {copy.outro.construction}
          </a>
          <a className="shp-link" href="../#interior">
            {copy.outro.interior}
          </a>
        </div>
      </section>
    </>
  )
}
