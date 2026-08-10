/**
 * Nuvia i18n — Centralized translations
 * All UI strings live here. Never hardcode language strings in JSX.
 * Usage: t('talk.listening', lang)
 */

export type AppLanguage = 'english' | 'hindi' | 'hinglish'

type Translations = {
  // Navigation
  'nav.home': string
  'nav.talk': string
  'nav.conversations': string
  'nav.memory': string
  'nav.timeline': string
  'nav.insights': string
  'nav.howItWorks': string
  'nav.underTheHood': string
  'nav.trust': string
  'nav.trustSub': string
  'nav.backToLanding': string

  // Talk page header
  'talk.title': string
  'talk.subtitle': string

  // Orb states
  'orb.idle': string
  'orb.idleNoMic': string
  'orb.listening': string
  'orb.processing': string
  'orb.speaking': string
  'orb.interrupted': string

  // Input area
  'input.label': string
  'input.placeholder': string
  'input.loadDemo': string
  'input.clear': string
  'input.understand': string
  'input.processing': string

  // Pipeline steps
  'step1.title': string
  'step1.confirm': string
  'step1.confirmBtn': string
  'step2.title': string
  'step2.noContext': string
  'step3.title': string
  'step3.supportLevel': string
  'step3.notDiagnosis': string
  'step3.guidance': string
  'step3.why': string
  'step3.speakBtn': string
  'step3.speaking': string
  'step3.newBtn': string
  'step3.demoTTS': string
  'step3.urgent': string

  // Errors
  'error.noMic': string
  'error.noMicBrowser': string
  'error.connection': string
  'error.tryAgain': string
  'error.useText': string

  // Dashboard
  'dash.greeting.morning': string
  'dash.greeting.afternoon': string
  'dash.greeting.evening': string
  'dash.greeting.night': string
  'dash.ready': string
  'dash.conversations': string
  'dash.memory': string
  'dash.flow.title': string

  // Conversations page
  'convPage.title': string
  'convPage.subtitle': string
  'convPage.newSession': string
  'convPage.detail.title': string
  'convPage.detail.youSaid': string
  'convPage.detail.understood': string
  'convPage.detail.context': string
  'convPage.detail.followUp': string
  'convPage.detail.guidance': string

  // Memory page
  'mem.title': string
  'mem.subtitle': string
  'mem.forget': string
  'mem.noMemories': string
  'mem.howWorks': string
  'mem.relevance': string

  // Timeline
  'timeline.title': string
  'timeline.subtitle': string
  'timeline.sessions': string
  'timeline.empty': string

  // Insights
  'insights.title': string
  'insights.subtitle': string
  'insights.disclaimer': string
  'insights.notMedical': string

  // Barge-in
  'bargeIn.hint': string

  // Language debug
  'debug.selectedLang': string
  'debug.rimeModel': string
  'debug.rimeVoice': string
  'debug.responseLang': string
  'nav.riskMonitor': string
}

const en: Translations = {
  'nav.home': 'Home',
  'nav.talk': 'Talk to Nuvia',
  'nav.conversations': 'Conversations',
  'nav.memory': 'Memory',
  'nav.timeline': 'Timeline',
  'nav.insights': 'Health Insights',
  'nav.howItWorks': 'How it works',
  'nav.underTheHood': 'Under the hood',
  'nav.trust': 'High-trust mode',
  'nav.trustSub': 'Support, not diagnosis.',
  'nav.backToLanding': 'Back to landing',

  'talk.title': 'Voice-first health support',
  'talk.subtitle': 'Speak naturally. Nuvia listens.',

  'orb.idle': 'Tap to talk',
  'orb.idleNoMic': 'Type below',
  'orb.listening': 'Listening…',
  'orb.processing': 'Understanding…',
  'orb.speaking': 'Nuvia is speaking… (speak to interrupt)',
  'orb.interrupted': 'Interrupted',

  'input.label': 'YOU SAID',
  'input.placeholder': 'Tap the orb to speak, or type here…',
  'input.loadDemo': 'Load demo',
  'input.clear': 'Clear',
  'input.understand': 'Understand this',
  'input.processing': 'Processing…',

  'step1.title': 'WHAT I UNDERSTOOD',
  'step1.confirm': 'Is this what you meant? Confirm to continue.',
  'step1.confirmBtn': 'Yes, continue',
  'step2.title': 'RELEVANT CONTEXT',
  'step2.noContext': 'No relevant previous context found.',
  'step3.title': 'FOLLOW-UP & GUIDANCE',
  'step3.supportLevel': 'SUPPORT LEVEL',
  'step3.notDiagnosis': 'Not a diagnosis.',
  'step3.guidance': 'GUIDANCE',
  'step3.why': 'WHY NUVIA IS SAYING THIS',
  'step3.speakBtn': 'Speak with Nuvia',
  'step3.speaking': 'Nuvia is speaking…',
  'step3.newBtn': 'New',
  'step3.demoTTS': 'Using browser speech synthesis (Rime demo mode)',
  'step3.urgent': 'Please contact a qualified healthcare professional or emergency service.',

  'error.noMic': 'Voice not supported in this browser — type below',
  'error.noMicBrowser': 'Microphone access is needed for voice input.',
  'error.connection': 'Could not reach Nuvia. Please check your connection.',
  'error.tryAgain': 'Try again',
  'error.useText': 'Use text instead',

  'dash.greeting.morning': 'Good morning.',
  'dash.greeting.afternoon': 'Good afternoon.',
  'dash.greeting.evening': 'Good evening.',
  'dash.greeting.night': 'Good night.',
  'dash.ready': 'Nuvia is ready to listen.',
  'dash.conversations': 'Recent conversations',
  'dash.memory': 'Relevant memory',
  'dash.flow.title': 'How Nuvia works',

  'convPage.title': 'Your conversations',
  'convPage.subtitle': 'Nuvia keeps continuity across all your voice sessions.',
  'convPage.newSession': 'Start a new conversation',
  'convPage.detail.title': 'Conversation detail',
  'convPage.detail.youSaid': 'You said',
  'convPage.detail.understood': 'What Nuvia understood',
  'convPage.detail.context': 'Relevant context used',
  'convPage.detail.followUp': 'Follow-up',
  'convPage.detail.guidance': 'Guidance',

  'mem.title': 'Nuvia Memory',
  'mem.subtitle': 'Relevant context helps Nuvia keep conversations continuous.',
  'mem.forget': 'Forget',
  'mem.noMemories': 'No memories stored yet.',
  'mem.howWorks': 'How memory retrieval works',
  'mem.relevance': 'Relevance',

  'timeline.title': 'Your Nuvia Timeline',
  'timeline.subtitle': 'Every conversation, remembered in context.',
  'timeline.sessions': 'session(s)',
  'timeline.empty': 'No conversations yet',

  'insights.title': 'Conversation Insights',
  'insights.subtitle': 'Patterns from your conversation history. These are conversational observations — not medical analysis.',
  'insights.disclaimer': 'Not a medical tool.',
  'insights.notMedical': 'This is a conversation pattern, not a medical diagnosis.',

  'bargeIn.hint': 'speak to interrupt',

  'debug.selectedLang': 'Selected language',
  'debug.rimeModel': 'Rime model',
  'debug.rimeVoice': 'Rime voice',
  'debug.responseLang': 'Response language',
  'nav.riskMonitor': 'Risk Monitor',
}

const hi: Translations = {
  'nav.home': 'होम',
  'nav.talk': 'Nuvia से बात करें',
  'nav.conversations': 'बातचीत',
  'nav.memory': 'यादें',
  'nav.timeline': 'टाइमलाइन',
  'nav.insights': 'स्वास्थ्य जानकारी',
  'nav.howItWorks': 'यह कैसे काम करता है',
  'nav.underTheHood': 'तकनीक के पीछे',
  'nav.trust': 'विश्वसनीय मोड',
  'nav.trustSub': 'सहायता, निदान नहीं।',
  'nav.backToLanding': 'वापस जाएं',

  'talk.title': 'आवाज़ के ज़रिए स्वास्थ्य सहायता',
  'talk.subtitle': 'स्वाभाविक रूप से बोलें। Nuvia सुनता है।',

  'orb.idle': 'बात करने के लिए टैप करें',
  'orb.idleNoMic': 'नीचे टाइप करें',
  'orb.listening': 'सुन रहा हूँ…',
  'orb.processing': 'समझ रहा हूँ…',
  'orb.speaking': 'Nuvia बोल रहा है… (बीच में बोलें)',
  'orb.interrupted': 'रुका',

  'input.label': 'आपने कहा',
  'input.placeholder': 'बोलने के लिए orb टैप करें, या यहाँ टाइप करें…',
  'input.loadDemo': 'उदाहरण लोड करें',
  'input.clear': 'साफ़ करें',
  'input.understand': 'समझो',
  'input.processing': 'प्रक्रिया हो रही है…',

  'step1.title': 'मैंने क्या समझा',
  'step1.confirm': 'क्या मैंने सही समझा? जारी रखने के लिए पुष्टि करें।',
  'step1.confirmBtn': 'हाँ, जारी रखें',
  'step2.title': 'पिछली जानकारी',
  'step2.noContext': 'कोई पुरानी जानकारी नहीं मिली।',
  'step3.title': 'फॉलो-अप और मार्गदर्शन',
  'step3.supportLevel': 'सहायता स्तर',
  'step3.notDiagnosis': 'यह कोई निदान नहीं है।',
  'step3.guidance': 'मार्गदर्शन',
  'step3.why': 'Nuvia यह क्यों कह रहा है',
  'step3.speakBtn': 'Nuvia से सुनें',
  'step3.speaking': 'Nuvia बोल रहा है…',
  'step3.newBtn': 'नई बातचीत',
  'step3.demoTTS': 'ब्राउज़र स्पीच उपयोग हो रहा है (Rime डेमो मोड)',
  'step3.urgent': 'कृपया किसी योग्य स्वास्थ्य पेशेवर या आपातकालीन सेवा से संपर्क करें।',

  'error.noMic': 'इस ब्राउज़र में आवाज़ समर्थित नहीं — नीचे टाइप करें',
  'error.noMicBrowser': 'आवाज़ इनपुट के लिए माइक्रोफ़ोन अनुमति चाहिए।',
  'error.connection': 'Nuvia से संपर्क नहीं हो पाया। कनेक्शन जांचें।',
  'error.tryAgain': 'फिर कोशिश करें',
  'error.useText': 'टेक्स्ट उपयोग करें',

  'dash.greeting.morning': 'सुप्रभात।',
  'dash.greeting.afternoon': 'नमस्ते।',
  'dash.greeting.evening': 'शुभ संध्या।',
  'dash.greeting.night': 'शुभ रात्रि।',
  'dash.ready': 'Nuvia सुनने के लिए तैयार है।',
  'dash.conversations': 'हाल की बातचीत',
  'dash.memory': 'प्रासंगिक यादें',
  'dash.flow.title': 'Nuvia कैसे काम करता है',

  'convPage.title': 'आपकी बातचीत',
  'convPage.subtitle': 'Nuvia सभी वॉयस सेशन में निरंतरता बनाए रखता है।',
  'convPage.newSession': 'नई बातचीत शुरू करें',
  'convPage.detail.title': 'बातचीत विवरण',
  'convPage.detail.youSaid': 'आपने कहा',
  'convPage.detail.understood': 'Nuvia ने क्या समझा',
  'convPage.detail.context': 'उपयोग की गई पुरानी जानकारी',
  'convPage.detail.followUp': 'अगला सवाल',
  'convPage.detail.guidance': 'मार्गदर्शन',

  'mem.title': 'Nuvia की यादें',
  'mem.subtitle': 'प्रासंगिक संदर्भ Nuvia को बातचीत में निरंतरता बनाए रखने में मदद करता है।',
  'mem.forget': 'भूल जाओ',
  'mem.noMemories': 'अभी तक कोई याद नहीं है।',
  'mem.howWorks': 'मेमोरी रिट्रीवल कैसे काम करता है',
  'mem.relevance': 'प्रासंगिकता',

  'timeline.title': 'आपकी Nuvia टाइमलाइन',
  'timeline.subtitle': 'हर बातचीत, संदर्भ में याद की गई।',
  'timeline.sessions': 'सेशन',
  'timeline.empty': 'अभी कोई बातचीत नहीं',

  'insights.title': 'बातचीत की जानकारी',
  'insights.subtitle': 'आपकी बातचीत से पैटर्न। ये चिकित्सा विश्लेषण नहीं है।',
  'insights.disclaimer': 'यह कोई चिकित्सा उपकरण नहीं है।',
  'insights.notMedical': 'यह बातचीत का पैटर्न है, कोई चिकित्सा निदान नहीं।',

  'bargeIn.hint': 'बीच में बोलें',

  'debug.selectedLang': 'चुनी हुई भाषा',
  'debug.rimeModel': 'Rime मॉडल',
  'debug.rimeVoice': 'Rime आवाज़',
  'debug.responseLang': 'प्रतिक्रिया भाषा',
  'nav.riskMonitor': 'जोखिम मॉनिटर',
}

const hinglish: Translations = {
  'nav.home': 'Home',
  'nav.talk': 'Nuvia se baat karo',
  'nav.conversations': 'Conversations',
  'nav.memory': 'Yaadein',
  'nav.timeline': 'Timeline',
  'nav.insights': 'Health Insights',
  'nav.howItWorks': 'Yeh kaise kaam karta hai',
  'nav.underTheHood': 'Technical details',
  'nav.trust': 'High-trust mode',
  'nav.trustSub': 'Sahayata, nirdaan nahi.',
  'nav.backToLanding': 'Wapas jaao',

  'talk.title': 'Voice-first health support',
  'talk.subtitle': 'Swabhavik taur pe bolein. Nuvia sunta hai.',

  'orb.idle': 'Talk karne ke liye tap karein',
  'orb.idleNoMic': 'Neeche type karein',
  'orb.listening': 'Sun raha hoon…',
  'orb.processing': 'Samajh raha hoon…',
  'orb.speaking': 'Nuvia bol raha hai… (beech mein bolein)',
  'orb.interrupted': 'Ruka',

  'input.label': 'AAPNE KAHA',
  'input.placeholder': 'Bolne ke liye orb tap karein, ya yahan type karein…',
  'input.loadDemo': 'Demo phrase load karein',
  'input.clear': 'Clear',
  'input.understand': 'Samjho',
  'input.processing': 'Processing…',

  'step1.title': 'MAINE KYA SAMJHA',
  'step1.confirm': 'Kya maine sahi samjha? Continue karne ke liye confirm karein.',
  'step1.confirmBtn': 'Haan, continue karein',
  'step2.title': 'PURANI JAANKARI',
  'step2.noContext': 'Koi purani jaankari nahi mili.',
  'step3.title': 'FOLLOW-UP AUR GUIDANCE',
  'step3.supportLevel': 'SUPPORT LEVEL',
  'step3.notDiagnosis': 'Yeh koi diagnosis nahi hai.',
  'step3.guidance': 'GUIDANCE',
  'step3.why': 'NUVIA YEH KYUN KAH RAHA HAI',
  'step3.speakBtn': 'Nuvia se sunein',
  'step3.speaking': 'Nuvia bol raha hai…',
  'step3.newBtn': 'Nayi baat',
  'step3.demoTTS': 'Browser speech use ho raha hai (Rime demo mode)',
  'step3.urgent': 'Kripya kisi qualified healthcare professional ya emergency service se sampark karein.',

  'error.noMic': 'Is browser mein voice supported nahi — neeche type karein',
  'error.noMicBrowser': 'Voice input ke liye microphone permission chahiye.',
  'error.connection': 'Nuvia se connect nahi ho paya. Connection check karein.',
  'error.tryAgain': 'Phir try karein',
  'error.useText': 'Text use karein',

  'dash.greeting.morning': 'Good morning.',
  'dash.greeting.afternoon': 'Good afternoon.',
  'dash.greeting.evening': 'Good evening.',
  'dash.greeting.night': 'Good night.',
  'dash.ready': 'Nuvia sunne ke liye ready hai.',
  'dash.conversations': 'Recent conversations',
  'dash.memory': 'Relevant yaadein',
  'dash.flow.title': 'Nuvia kaise kaam karta hai',

  'convPage.title': 'Aapki conversations',
  'convPage.subtitle': 'Nuvia saari voice sessions mein continuity rakhta hai.',
  'convPage.newSession': 'Nayi conversation shuru karein',
  'convPage.detail.title': 'Conversation detail',
  'convPage.detail.youSaid': 'Aapne kaha',
  'convPage.detail.understood': 'Nuvia ne kya samjha',
  'convPage.detail.context': 'Purani jaankari use ki',
  'convPage.detail.followUp': 'Agla sawaal',
  'convPage.detail.guidance': 'Guidance',

  'mem.title': 'Nuvia ki Yaadein',
  'mem.subtitle': 'Relevant context Nuvia ko conversations mein continuity banaye rakhne mein madad karta hai.',
  'mem.forget': 'Bhool jao',
  'mem.noMemories': 'Abhi koi yaadein nahi hain.',
  'mem.howWorks': 'Memory retrieval kaise kaam karta hai',
  'mem.relevance': 'Relevance',

  'timeline.title': 'Aapki Nuvia Timeline',
  'timeline.subtitle': 'Har conversation, context mein yaad ki gayi.',
  'timeline.sessions': 'session(s)',
  'timeline.empty': 'Abhi koi conversations nahi',

  'insights.title': 'Conversation Insights',
  'insights.subtitle': 'Aapki conversations se patterns. Yeh medical analysis nahi hai.',
  'insights.disclaimer': 'Yeh medical tool nahi hai.',
  'insights.notMedical': 'Yeh conversation ka pattern hai, koi medical diagnosis nahi.',

  'bargeIn.hint': 'beech mein bolein',

  'debug.selectedLang': 'Chuni hui bhasha',
  'debug.rimeModel': 'Rime model',
  'debug.rimeVoice': 'Rime voice',
  'debug.responseLang': 'Response language',
  'nav.riskMonitor': 'Risk Monitor',
}

const TRANSLATIONS: Record<AppLanguage, Translations> = { english: en, hindi: hi, hinglish }

export function t(key: keyof Translations, lang: AppLanguage = 'english'): string {
  return TRANSLATIONS[lang]?.[key] ?? TRANSLATIONS.english[key] ?? key
}

export function getGreeting(lang: AppLanguage): string {
  const h = new Date().getHours()
  if (h < 12) return t('dash.greeting.morning', lang)
  if (h < 17) return t('dash.greeting.afternoon', lang)
  if (h < 21) return t('dash.greeting.evening', lang)
  return t('dash.greeting.night', lang)
}
