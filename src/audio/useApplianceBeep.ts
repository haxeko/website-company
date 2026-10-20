import { useEffect, useRef } from 'react'
import { getSound } from './sound'

/**
 * An air-conditioner or a fan beeps when it takes a command, as a real unit does: two
 * rising beeps when it is switched on, one lower beep when it is switched off, a short one
 * for each change of its setting (temperature, speed) while it runs. Silent when the page
 * first shows the saved state.
 */
export function useApplianceBeep(on: boolean, setting: number) {
  const last = useRef<{ on: boolean; setting: number } | null>(null)
  useEffect(() => {
    const before = last.current
    last.current = { on, setting }
    if (!before) return
    if (before.on !== on) getSound().beep(on ? 'on' : 'off')
    else if (on && before.setting !== setting) getSound().beep('step')
  }, [on, setting])
}
