/**
 * useVoiceSession — manages session_id, turn_id, and barge-in state.
 *
 * Barge-in: when Nuvia is speaking (orbState === 'speaking') and the user
 * starts talking, we immediately:
 *   1. Cancel current audio/speechSynthesis
 *   2. Set orbState → 'listening'
 *   3. Emit 'barge_in' event so the parent can record it
 *
 * Reconnect: session_id persists across component remounts via sessionStorage
 * so a page refresh can restore the last session context.
 */
import { useRef, useCallback, useEffect } from 'react'
import { v4 as uuidv4 } from '../lib/uuid'

export interface VoiceSessionHandle {
  sessionId: string
  newTurnId: () => string
  cancelAudio: () => void
  registerAudio: (a: HTMLAudioElement) => void
  onBargeIn: (cb: () => void) => void
}

export function useVoiceSession(): VoiceSessionHandle {
  const sessionIdRef   = useRef<string>('')
  const audioRef       = useRef<HTMLAudioElement | null>(null)
  const bargeInCbRef   = useRef<(() => void) | null>(null)

  // Restore or create session id
  useEffect(() => {
    const stored = sessionStorage.getItem('nuvia_session_id')
    sessionIdRef.current = stored || uuidv4()
    sessionStorage.setItem('nuvia_session_id', sessionIdRef.current)
  }, [])

  const newTurnId = useCallback(() => {
    const tid = uuidv4()
    return tid
  }, [])

  const cancelAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current = null
    }
    window.speechSynthesis.cancel()
  }, [])

  const registerAudio = useCallback((a: HTMLAudioElement) => {
    audioRef.current = a
  }, [])

  const onBargeIn = useCallback((cb: () => void) => {
    bargeInCbRef.current = cb
  }, [])

  return {
    get sessionId() { return sessionIdRef.current },
    newTurnId,
    cancelAudio,
    registerAudio,
    onBargeIn,
  }
}
