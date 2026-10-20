import './Loader.css'

interface LoaderProps {
  /** 0 → 1 */
  progress: number
  done: boolean
}

/** Minimal brand mark + progress line; only becomes visible if loading takes a moment. */
export function Loader({ progress, done }: LoaderProps) {
  return (
    <div className="loader" data-done={done || undefined} aria-hidden="true">
      <div className="loader__inner">
        <span className="loader__brand">VILLA NEST</span>
        <span className="loader__track">
          <span className="loader__bar" style={{ transform: `scaleX(${progress})` }} />
        </span>
      </div>
    </div>
  )
}
