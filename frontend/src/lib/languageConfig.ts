/**
 * Canonical language configuration for Nuvia.
 * All language-specific values live here — never scattered in components.
 *
 * Rime model notes (verified against Rime API docs):
 *   - "mist"   → English only, high quality
 *   - "arcana" → Multilingual including Hindi/Devanagari
 * Speaker "luna" is English-only on mist model.
 * For Hindi we use "arcana" model which supports lang:"hi".
 * For Hinglish we use "arcana" with lang:"hi" — it handles code-switching naturally.
 */
import type { AppLanguage } from './i18n'

export interface LangConfig {
  label: string
  code: AppLanguage
  sttLang: string          // BCP-47 for SpeechRecognition
  rimeModel: string        // Rime model identifier
  rimeSpeaker: string      // Rime speaker identifier
  rimeLang: string         // Rime lang parameter
  aiInstruction: string    // Injected into AI system prompt
  demoPhrase: string       // Demo phrase for this language
}

export const LANGUAGE_CONFIG: Record<AppLanguage, LangConfig> = {
  english: {
    label: 'English',
    code: 'english',
    sttLang: 'en-IN',
    rimeModel: 'mist',
    rimeSpeaker: 'luna',
    rimeLang: 'en',
    aiInstruction: `You are Nuvia, a calm voice-first health support companion.
Respond naturally in English. Keep spoken responses concise and conversational.
Do not diagnose. Use careful language: "Based on what you've shared..." Never say "You have [disease]."`,
    demoPhrase: 'I have had a headache since yesterday and some dizziness today.',
  },

  hindi: {
    label: 'Hindi',
    code: 'hindi',
    sttLang: 'hi-IN',
    rimeModel: 'arcana',
    rimeSpeaker: 'ananya',
    rimeLang: 'hi',
    aiInstruction: `You are Nuvia, a calm voice-first health support companion.
Respond naturally in Hindi. Use conversational Hindi suitable for spoken audio.
Keep responses concise and easy to listen to.
Do not diagnose. Use careful phrases like "Aapne jo bataya uske aadhar par..." 
Never say "Aapko [bimari] hai." Always respond in Hindi, not English.`,
    demoPhrase: 'Mujhe kal se sir dard ho raha hai aur aaj thoda chakkar bhi aa raha hai.',
  },

  hinglish: {
    label: 'Hinglish',
    code: 'hinglish',
    sttLang: 'hi-IN',
    rimeModel: 'arcana',
    rimeSpeaker: 'ananya',
    rimeLang: 'hi',
    aiInstruction: `You are Nuvia, a calm voice-first health support companion.
Respond naturally in conversational Hinglish — the way a bilingual Indian speaker talks.
Mix Hindi and English naturally. Do not force formal Hindi translations of English words.
Keep responses short and natural for voice.
Do not diagnose. Use careful language. Never say "Aapko [bimari] hai."
Example of good Hinglish response: "Theek hai. Aapko kal se headache hai aur aaj dizziness bhi. Kya yeh pehle bhi hua hai?"`,
    demoPhrase: 'Mujhe kal se headache ho raha hai aur aaj thoda dizziness bhi hai.',
  },
}

export function getLangConfig(lang: AppLanguage): LangConfig {
  return LANGUAGE_CONFIG[lang] ?? LANGUAGE_CONFIG.english
}
