import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { CoverPage } from './pages/CoverPage'
import { LandingPage } from './pages/LandingPage'
import { OnboardingPage } from './pages/OnboardingPage'
import { DashboardHome } from './pages/DashboardHome'
import { TalkPage } from './pages/TalkPage'
import { ConversationsPage } from './pages/ConversationsPage'
import { MemoryPage } from './pages/MemoryPage'
import { HowItWorksPage } from './pages/HowItWorksPage'
import { UnderTheHoodPage } from './pages/UnderTheHoodPage'
import { TimelinePage } from './pages/TimelinePage'
import { InsightsPage } from './pages/InsightsPage'
import { RiskMonitorPage } from './pages/RiskMonitorPage'
import { AppLayout } from './layouts/AppLayout'

function wrap(el: React.ReactNode) {
  return <AppLayout>{el}</AppLayout>
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"            element={<CoverPage />} />
        <Route path="/landing"     element={<LandingPage />} />
        <Route path="/onboarding"  element={<OnboardingPage />} />
        <Route path="/app"                   element={wrap(<DashboardHome />)} />
        <Route path="/app/talk"              element={wrap(<TalkPage />)} />
        <Route path="/app/conversations"     element={wrap(<ConversationsPage />)} />
        <Route path="/app/memory"            element={wrap(<MemoryPage />)} />
        <Route path="/app/timeline"          element={wrap(<TimelinePage />)} />
        <Route path="/app/insights"          element={wrap(<InsightsPage />)} />
        <Route path="/app/risk"              element={wrap(<RiskMonitorPage />)} />
        <Route path="/app/how-it-works"      element={wrap(<HowItWorksPage />)} />
        <Route path="/app/under-the-hood"    element={wrap(<UnderTheHoodPage />)} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
