import { useState, useRef, useCallback, useEffect } from 'react'

export type SpeechError =
  | 'not-allowed'
  | 'no-speech'
  | 'audio-capture'
  | 'network'
  | 'aborted'
  | 'service-not-allowed'
  | 'unsupported'
  | 'unknown'

const ERROR_MESSAGES: Record<SpeechError, string> = {
  'not-allowed': 'Microphone access was denied. Please allow microphone access and try again.',
  'no-speech': 'No speech was detected. Please try speaking again.',
  'audio-capture': 'Microphone not found. Please check your microphone.',
  'network': "Voice input couldn't connect right now. Try again, or type your message below.",
  'aborted': 'Voice input was stopped.',
  'service-not-allowed': 'Speech recognition is not available in this context.',
  'unsupported': 'Your browser does not support voice input. Please type your message below.',
  'unknown': 'Something went wrong with voice input. Try again, or type your message below.',
}

export interface UseSpeechRecognitionReturn {
  start: () => void
  stop: () => void
  transcript: string
  isListening: boolean
  error: SpeechError | null
  errorMessage: string | null
  supported: boolean
  clearTranscript: () => void
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList
}

interface SpeechRecognitionResultList {
  length: number
  [index: number]: SpeechRecognitionResult
}

interface SpeechRecognitionResult {
  isFinal: boolean
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  transcript: string
}

interface SpeechRecognitionInstance extends EventTarget {
  lang: string
  continuous: boolean
  interimResults: boolean
  maxAlternatives: number
  start: () => void
  stop: () => void
  abort: () => void
  onresult: ((event: SpeechRecognitionEvent) => void) | null
  onerror: ((event: { error: string }) => void) | null
  onend: (() => void) | null
  onstart: (() => void) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance
    webkitSpeechRecognition: new () => SpeechRecognitionInstance
  }
}

const LANG_MAP: Record<string, string> = {
  english: 'en-IN',
  hindi: 'hi-IN',
  hinglish: 'hi-IN',
}

export function useSpeechRecognition(language = 'hinglish'): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('')
  const [isListening, setIsListening] = useState(false)
  const [error, setError] = useState<SpeechError | null>(null)
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)

  const SpeechRecognitionClass =
    typeof window !== 'undefined'
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : null

  const supported = Boolean(SpeechRecognitionClass)

  const clearTranscript = useCallback(() => {
    setTranscript('')
    setError(null)
  }, [])

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.abort()
      recognitionRef.current = null
    }
    setIsListening(false)
  }, [])

  const start = useCallback(() => {
    if (!SpeechRecognitionClass) {
      setError('unsupported')
      return
    }

    // Stop existing instance
    if (recognitionRef.current) {
      recognitionRef.current.abort()
    }

    setError(null)
    setTranscript('')

    const recognition = new SpeechRecognitionClass()
    recognition.lang = LANG_MAP[language] || 'hi-IN'
    recognition.continuous = false
    recognition.interimResults = true
    recognition.maxAlternatives = 1

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = 0; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalTranscript += result[0].transcript
        } else {
          interimTranscript += result[0].transcript
        }
      }

      setTranscript(finalTranscript || interimTranscript)
    }

    recognition.onerror = (event: { error: string }) => {
      const errorCode = event.error as SpeechError
      const knownErrors: SpeechError[] = [
        'not-allowed', 'no-speech', 'audio-capture',
        'network', 'aborted', 'service-not-allowed',
      ]
      if (knownErrors.includes(errorCode)) {
        setError(errorCode)
      } else {
        setError('unknown')
      }
      setIsListening(false)
    }

    recognition.onend = () => {
      setIsListening(false)
      recognitionRef.current = null
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      setError('unknown')
      setIsListening(false)
    }
  }, [SpeechRecognitionClass, language])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort()
      }
    }
  }, [])

  return {
    start,
    stop,
    transcript,
    isListening,
    error,
    errorMessage: error ? ERROR_MESSAGES[error] : null,
    supported,
    clearTranscript,
  }
}
