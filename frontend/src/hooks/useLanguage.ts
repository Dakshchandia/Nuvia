/**
 * useLanguage — persists language selection across page reloads.
 * Language is stored in sessionStorage so it survives refreshes
 * within a session but resets on a new session.
 */
import { useState, useCallback } from 'react'
import type { AppLanguage } from '../lib/i18n'

const STORAGE_KEY = 'nuvia_language'

function getStoredLang(): AppLanguage {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY)
    if (stored === 'english' || stored === 'hindi' || stored === 'hinglish') {
      return stored
    }
  } catch { /* ignore */ }
  return 'hinglish' // default
}

export function useLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>(getStoredLang)

  const setLanguage = useCallback((lang: AppLanguage) => {
    setLanguageState(lang)
    try { sessionStorage.setItem(STORAGE_KEY, lang) } catch { /* ignore */ }
  }, [])

  return { language, setLanguage }
}
