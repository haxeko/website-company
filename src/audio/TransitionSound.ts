/**
 * A soft gust of air when the carousel moves to another space — no background music.
 * Synthesised with the Web Audio API (no audio files, works offline): filtered pink noise
 * whose band sweeps up and back down while it pans in the direction of travel.
 *
 * Browsers only allow audio after a user gesture, so the AudioContext is created (or
 * resumed) on the first pointer / key press; transitions before that stay silent.
 */

const STORAGE_KEY = 'villa-nest-sound'
/** Peak level of one gust — deliberately quiet. */
const LEVEL = 0.07
/** Gusts closer together than this are merged into the one already playing. */
const MIN_GAP = 0.18 // seconds
const DURATION = 0.85 // seconds

/** The visitor's saved choice (on unless they turned it off). */
export function readSoundOn() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

export class TransitionSound {
  private ctx: AudioContext | null = null
  private noise: AudioBuffer | null = null
  private lastPlay = -Infinity
  private muted = !readSoundOn()

  constructor() {
    window.addEventListener('pointerdown', this.unlock, { capture: true, passive: true })
    window.addEventListener('keydown', this.unlock, { capture: true, passive: true })
  }

  get isOn() {
    return !this.muted
  }

  setOn(on: boolean) {
    this.muted = !on
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
    } catch {
      // Private mode: the choice simply isn't remembered.
    }
    if (on) this.unlock()
  }

  /** @param direction 1 = towards the next space (air travels left → right), -1 = back. */
  play(direction: 1 | -1 = 1) {
    const ctx = this.ctx
    if (this.muted || !ctx || !this.noise || ctx.state === 'closed') return
    if (ctx.state === 'suspended') void ctx.resume()
    const now = ctx.currentTime
    if (now - this.lastPlay < MIN_GAP) return
    this.lastPlay = now

    const src = ctx.createBufferSource()
    src.buffer = this.noise
    // Random start so consecutive gusts never sound identical.
    const offset = Math.random() * (this.noise.duration - DURATION - 0.1)

    // Body of the gust: a wide band sweeping up and settling back.
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = 0.7
    band.frequency.setValueAtTime(420, now)
    band.frequency.exponentialRampToValueAtTime(1900, now + 0.32)
    band.frequency.exponentialRampToValueAtTime(650, now + DURATION)

    // Take the rumble out so it stays light and airy.
    const highpass = ctx.createBiquadFilter()
    highpass.type = 'highpass'
    highpass.frequency.value = 240

    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0.0001, now)
    gain.gain.exponentialRampToValueAtTime(LEVEL, now + 0.26)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + DURATION)

    const pan = ctx.createStereoPanner()
    pan.pan.setValueAtTime(-0.45 * direction, now)
    pan.pan.linearRampToValueAtTime(0.45 * direction, now + DURATION)

    src.connect(highpass).connect(band).connect(gain).connect(pan).connect(ctx.destination)
    src.start(now, offset, DURATION + 0.05)
  }

  dispose() {
    window.removeEventListener('pointerdown', this.unlock, { capture: true })
    window.removeEventListener('keydown', this.unlock, { capture: true })
    void this.ctx?.close()
    this.ctx = null
  }

  private unlock = () => {
    if (this.muted) return
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      this.ctx = new Ctx()
      this.noise = makePinkNoise(this.ctx, 3)
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }
}

function makePinkNoise(ctx: AudioContext, seconds: number) {
  const buffer = ctx.createBuffer(1, Math.round(ctx.sampleRate * seconds), ctx.sampleRate)
  const data = buffer.getChannelData(0)
  // Paul Kellet's economy pink filter: softer and more "windy" than white noise.
  let b0 = 0
  let b1 = 0
  let b2 = 0
  for (let i = 0; i < data.length; i++) {
    const white = Math.random() * 2 - 1
    b0 = 0.99765 * b0 + white * 0.099046
    b1 = 0.963 * b1 + white * 0.2965164
    b2 = 0.57 * b2 + white * 1.0526913
    data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.2
  }
  return buffer
}
