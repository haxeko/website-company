/**
 * Generative ambient sound, synthesised with the Web Audio API — no audio files, so it
 * works offline and weighs nothing. A soft pad (one chord per space) breathes through a
 * slowly moving low-pass filter and a light echo, with a whisper of "air" noise; moving
 * to another space glides the chord and adds a soft whoosh.
 *
 * Browsers only allow sound after a user gesture, so `enable()` must be called from a
 * click / tap handler.
 */

type Chord = number[]

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12)

/** One chord per space, in slide order (low, warm voicings). */
const CHORDS: Chord[] = [
  [50, 57, 61, 64, 69].map(midi), // Smart Home   — D maj9 colour
  [47, 54, 59, 62, 66].map(midi), // Construction — B minor, grounded
  [43, 50, 55, 59, 64].map(midi), // Interior     — G maj7, warm
]

const MASTER_LEVEL = 0.16
const FADE = 1.6 // seconds

export class AmbientSound {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private voices: OscillatorNode[][] = []
  private noise: AudioBuffer | null = null
  private scene = 0
  private enabled = false

  get isEnabled() {
    return this.enabled
  }

  async enable(scene = this.scene) {
    this.scene = scene
    if (!this.ctx) this.build()
    const ctx = this.ctx!
    if (ctx.state === 'suspended') await ctx.resume()
    this.enabled = true
    this.glide(scene, 0.05)
    const gain = this.master!.gain
    gain.cancelScheduledValues(ctx.currentTime)
    gain.setValueAtTime(gain.value, ctx.currentTime)
    gain.linearRampToValueAtTime(MASTER_LEVEL, ctx.currentTime + FADE)
  }

  disable() {
    this.enabled = false
    if (!this.ctx || !this.master) return
    const ctx = this.ctx
    const gain = this.master.gain
    gain.cancelScheduledValues(ctx.currentTime)
    gain.setValueAtTime(gain.value, ctx.currentTime)
    gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6)
    window.setTimeout(() => {
      if (!this.enabled) void ctx.suspend()
    }, 700)
  }

  /** Called whenever another space comes to the centre. */
  setScene(scene: number) {
    if (scene === this.scene) return
    this.scene = scene
    if (!this.enabled || !this.ctx) return
    this.glide(scene, 1.2)
    this.whoosh()
  }

  dispose() {
    this.enabled = false
    void this.ctx?.close()
    this.ctx = null
  }

  private build() {
    const ctx = new AudioContext()
    this.ctx = ctx

    this.master = ctx.createGain()
    this.master.gain.value = 0

    // Light echo for space: two filtered feedback delays.
    const wet = ctx.createGain()
    wet.gain.value = 0.35
    for (const time of [0.37, 0.53]) {
      const delay = ctx.createDelay(1)
      delay.delayTime.value = time
      const feedback = ctx.createGain()
      feedback.gain.value = 0.42
      const tone = ctx.createBiquadFilter()
      tone.type = 'lowpass'
      tone.frequency.value = 1800
      this.master.connect(delay)
      delay.connect(tone)
      tone.connect(feedback)
      feedback.connect(delay)
      tone.connect(wet)
    }
    this.master.connect(ctx.destination)
    wet.connect(ctx.destination)

    // Pad: two slightly detuned oscillators per note through a breathing low-pass.
    const filter = ctx.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 900
    filter.Q.value = 0.4
    const lfo = ctx.createOscillator()
    lfo.frequency.value = 0.045
    const lfoDepth = ctx.createGain()
    lfoDepth.gain.value = 380
    lfo.connect(lfoDepth).connect(filter.frequency)
    lfo.start()
    filter.connect(this.master)

    const chord = CHORDS[this.scene] ?? CHORDS[0]
    this.voices = chord.map((freq, i) => {
      const voiceGain = ctx.createGain()
      voiceGain.gain.value = 0.07 / (1 + i * 0.25)
      voiceGain.connect(filter)
      return [
        { type: 'sine' as OscillatorType, detune: -4 },
        { type: 'triangle' as OscillatorType, detune: 5 },
      ].map(({ type, detune }) => {
        const osc = ctx.createOscillator()
        osc.type = type
        osc.frequency.value = freq
        osc.detune.value = detune
        osc.connect(voiceGain)
        osc.start()
        return osc
      })
    })

    // "Air": quiet band-passed noise that swells slowly.
    this.noise = this.makeNoise(ctx, 4)
    const air = ctx.createBufferSource()
    air.buffer = this.noise
    air.loop = true
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.frequency.value = 700
    band.Q.value = 0.6
    const airGain = ctx.createGain()
    airGain.gain.value = 0.05
    const airLfo = ctx.createOscillator()
    airLfo.frequency.value = 0.07
    const airDepth = ctx.createGain()
    airDepth.gain.value = 0.03
    airLfo.connect(airDepth).connect(airGain.gain)
    airLfo.start()
    air.connect(band).connect(airGain).connect(this.master)
    air.start()
  }

  private glide(scene: number, seconds: number) {
    const ctx = this.ctx
    if (!ctx) return
    const chord = CHORDS[scene % CHORDS.length]
    this.voices.forEach((pair, i) => {
      for (const osc of pair) osc.frequency.setTargetAtTime(chord[i % chord.length], ctx.currentTime, seconds / 3)
    })
  }

  private whoosh() {
    const ctx = this.ctx
    if (!ctx || !this.noise || !this.master) return
    const now = ctx.currentTime
    const src = ctx.createBufferSource()
    src.buffer = this.noise
    const band = ctx.createBiquadFilter()
    band.type = 'bandpass'
    band.Q.value = 1.2
    band.frequency.setValueAtTime(260, now)
    band.frequency.exponentialRampToValueAtTime(1600, now + 0.55)
    band.frequency.exponentialRampToValueAtTime(380, now + 1.2)
    const gain = ctx.createGain()
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(0.22, now + 0.45)
    gain.gain.linearRampToValueAtTime(0, now + 1.25)
    src.connect(band).connect(gain).connect(this.master)
    src.start(now)
    src.stop(now + 1.3)
  }

  private makeNoise(ctx: AudioContext, seconds: number) {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate)
    const data = buffer.getChannelData(0)
    // Pinkish noise (Paul Kellet's economy filter): softer than white noise.
    let b0 = 0
    let b1 = 0
    let b2 = 0
    for (let i = 0; i < data.length; i++) {
      const white = Math.random() * 2 - 1
      b0 = 0.99765 * b0 + white * 0.099046
      b1 = 0.963 * b1 + white * 0.2965164
      b2 = 0.57 * b2 + white * 1.0526913
      data[i] = (b0 + b1 + b2 + white * 0.1848) * 0.18
    }
    return buffer
  }
}
