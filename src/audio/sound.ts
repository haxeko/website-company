import { useSyncExternalStore } from 'react'

/**
 * The site's one sound, synthesised with the Web Audio API (no audio files, works offline):
 * the short "beep" an air-conditioner or a fan gives when it takes a command — a pure tone
 * with a soft attack, heard through a little room reverb so it sounds like the unit on the
 * wall rather than a buzzer in the ear. Changing space or theme makes no sound.
 *
 * Quiet by design, and the visitor can turn it off (remembered). Browsers only allow audio
 * after a user gesture, so the AudioContext is created (or resumed) on the first pointer or
 * key press; sounds before that stay silent.
 */

const STORAGE_KEY = 'villa-nest-sound'

/** Peak level of a beep. */
const BEEP_LEVEL = 0.032
/** Share of the beep sent to the room. */
const ROOM_SEND = 0.22

/** What an appliance answers: switched on (two rising beeps), off (one lower beep), a setting changed. */
export type Beep = 'on' | 'off' | 'step'

/** [frequency (Hz), start (s), length (s)] of each beep. */
const BEEPS: Record<Beep, [number, number, number][]> = {
  on: [
    [1760, 0, 0.07],
    [2093, 0.115, 0.1],
  ],
  off: [[1568, 0, 0.15]],
  step: [[1865, 0, 0.06]],
}

/** The visitor's saved choice (on unless they turned it off). */
export function readSoundOn() {
  try {
    return window.localStorage.getItem(STORAGE_KEY) !== 'off'
  } catch {
    return true
  }
}

class SiteSound {
  private ctx: AudioContext | null = null
  private out: AudioNode | null = null
  private room: AudioNode | null = null
  private lastBeep = -Infinity
  private muted = !readSoundOn()
  private readonly listeners = new Set<() => void>()

  constructor() {
    window.addEventListener('pointerdown', this.unlock, { capture: true, passive: true })
    window.addEventListener('keydown', this.unlock, { capture: true, passive: true })
  }

  get isOn() {
    return !this.muted
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  setOn(on: boolean) {
    this.muted = !on
    try {
      window.localStorage.setItem(STORAGE_KEY, on ? 'on' : 'off')
    } catch {
      // Private mode: the choice simply isn't remembered.
    }
    if (on) this.unlock()
    this.listeners.forEach((listener) => listener())
  }

  /** The beep of the air-conditioner (or fan) taking a command from its remote. */
  beep(kind: Beep) {
    const ctx = this.live()
    if (!ctx) return
    const now = ctx.currentTime
    // A slider dragged quickly: one beep per step, as fast as a remote's button can be pressed.
    if (now - this.lastBeep < 0.085) return
    this.lastBeep = now
    for (const [frequency, start, length] of BEEPS[kind]) this.tone(ctx, frequency, now + start, length)
  }

  private tone(ctx: AudioContext, frequency: number, start: number, length: number) {
    const end = start + length + 0.1
    const env = ctx.createGain()
    env.gain.setValueAtTime(0, start)
    env.gain.linearRampToValueAtTime(BEEP_LEVEL, start + 0.006)
    env.gain.setValueAtTime(BEEP_LEVEL, start + length * 0.6)
    env.gain.exponentialRampToValueAtTime(0.0001, end)

    // A pure tone with a trace of its octave: an appliance's beep, without a buzzer's edge.
    const tone = ctx.createOscillator()
    tone.frequency.value = frequency
    const octave = ctx.createOscillator()
    octave.frequency.value = frequency * 2
    const octaveLevel = ctx.createGain()
    octaveLevel.gain.value = 0.07
    tone.connect(env)
    octave.connect(octaveLevel).connect(env)

    const soft = filter(ctx, 'lowpass', 3400, 0.6)
    env.connect(soft)
    this.send(soft)
    for (const osc of [tone, octave]) {
      osc.start(start)
      osc.stop(end + 0.02)
    }
  }

  /** To the speakers, and a share of it to the room. */
  private send(node: AudioNode) {
    if (!this.ctx || !this.out || !this.room) return
    node.connect(this.out)
    const wet = this.ctx.createGain()
    wet.gain.value = ROOM_SEND
    node.connect(wet).connect(this.room)
  }

  /** The context, once the browser lets it play and the visitor has not muted it. */
  private live() {
    const ctx = this.ctx
    if (this.muted || !ctx || ctx.state === 'closed') return null
    if (ctx.state === 'suspended') void ctx.resume()
    return ctx
  }

  private unlock = () => {
    if (this.muted) return
    if (!this.ctx) {
      const Ctx = window.AudioContext ?? (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!Ctx) return
      const ctx = new Ctx()
      // Never clips, however many sounds overlap.
      const limiter = ctx.createDynamicsCompressor()
      limiter.threshold.value = -8
      limiter.knee.value = 6
      limiter.ratio.value = 8
      limiter.attack.value = 0.003
      limiter.release.value = 0.15
      limiter.connect(ctx.destination)
      const room = ctx.createConvolver()
      room.buffer = makeRoom(ctx, 0.7)
      room.connect(limiter)
      this.ctx = ctx
      this.out = limiter
      this.room = room
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume()
  }
}

function filter(ctx: AudioContext, type: BiquadFilterType, frequency: number, q: number) {
  const node = ctx.createBiquadFilter()
  node.type = type
  node.frequency.value = frequency
  node.Q.value = q
  return node
}

/** A small, soft room: decaying noise, a little darker as it fades, slightly different per ear. */
function makeRoom(ctx: AudioContext, seconds: number) {
  const length = Math.round(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let channel = 0; channel < 2; channel++) {
    const data = buffer.getChannelData(channel)
    let smooth = 0
    for (let i = 0; i < length; i++) {
      const t = i / length
      // Low-passed more and more towards the end, as a real room's tail.
      smooth += (Math.random() * 2 - 1 - smooth) * (0.6 - 0.45 * t)
      data[i] = smooth * Math.pow(1 - t, 3.2) * (i < 90 ? i / 90 : 1)
    }
  }
  return buffer
}

let shared: SiteSound | null = null

/** The page's one sound engine, shared by everything that makes a sound. */
export function getSound() {
  shared ??= new SiteSound()
  return shared
}

/** On / off, for the header's switch. */
export function useSoundOn() {
  const sound = getSound()
  return useSyncExternalStore(sound.subscribe, () => sound.isOn)
}
