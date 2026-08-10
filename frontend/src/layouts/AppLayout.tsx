import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, Mic, MessageSquare, Database, HelpCircle,
  Code, Menu, X, Shield, ArrowLeft, Calendar, Sparkles, Activity
} from 'lucide-react'
import { useLanguage } from '../hooks/useLanguage'
import { t } from '../lib/i18n'
import type { AppLanguage } from '../lib/i18n'

interface AppLayoutProps { children: React.ReactNode }

function SidebarContent({ onClose, lang }: { onClose: () => void; lang: AppLanguage }) {
  const navigate = useNavigate()

  const navItems = [
    { to: '/app',                icon: <Home size={15} />,          labelKey: 'nav.home' as const,         end: true  },
    { to: '/app/talk',           icon: <Mic size={15} />,           labelKey: 'nav.talk' as const,         end: false },
    { to: '/app/conversations',  icon: <MessageSquare size={15} />, labelKey: 'nav.conversations' as const,end: false },
    { to: '/app/memory',         icon: <Database size={15} />,      labelKey: 'nav.memory' as const,       end: false },
    { to: '/app/timeline',       icon: <Calendar size={15} />,      labelKey: 'nav.timeline' as const,     end: false },
    { to: '/app/insights',       icon: <Sparkles size={15} />,      labelKey: 'nav.insights' as const,     end: false },
    { to: '/app/risk',           icon: <Activity size={15} />,      labelKey: 'nav.riskMonitor' as const,  end: false },
    { to: '/app/how-it-works',   icon: <HelpCircle size={15} />,    labelKey: 'nav.howItWorks' as const,   end: false },
    { to: '/app/under-the-hood', icon: <Code size={15} />,          labelKey: 'nav.underTheHood' as const, end: false },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 flex-shrink-0 border-b border-nuvia-border">
        <Link to="/app" onClick={onClose} className="flex flex-col leading-none">
          <span className="text-base font-bold tracking-tight"
            style={{ color: '#4a1f1f', fontFamily: '"Playfair Display", serif' }}>
            Nuvia
          </span>
          <span className="text-[10px] font-medium tracking-wider mt-0.5 text-nuvia-muted">
            Your health, heard.
          </span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto" aria-label="App navigation">
        {navItems.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-150 group ${
                isActive ? 'nav-active' : 'text-nuvia-muted hover:text-nuvia-text hover:bg-nuvia-surface'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span className={isActive
                  ? 'text-nuvia-brown'
                  : 'text-nuvia-subtle group-hover:text-nuvia-muted'
                }>
                  {item.icon}
                </span>
                {t(item.labelKey, lang)}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Trust badge */}
      <div className="px-3 pb-5 pt-2 flex-shrink-0 border-t border-nuvia-border space-y-3">
        <div className="trust-badge px-3 py-3 mt-3">
          <div className="flex items-center gap-2 mb-1">
            <Shield size={11} style={{ color: '#3d6b4a' }} />
            <span className="text-[11px] font-bold" style={{ color: '#3d6b4a' }}>
              {t('nav.trust', lang)}
            </span>
          </div>
          <p className="text-[11px] text-nuvia-subtle">
            {t('nav.trustSub', lang)}
          </p>
        </div>
        <button
          onClick={() => navigate('/landing')}
          className="flex items-center gap-1.5 text-[11px] text-nuvia-subtle hover:text-nuvia-muted transition-colors w-full px-1"
        >
          <ArrowLeft size={10} />
          {t('nav.backToLanding', lang)}
        </button>
      </div>
    </div>
  )
}

export function AppLayout({ children }: AppLayoutProps) {
  const [open, setOpen] = useState(false)
  const { language } = useLanguage()

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#f7f3ee' }}>

      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-52 flex-shrink-0 flex-col border-r border-nuvia-border bg-white">
        <SidebarContent onClose={() => {}} lang={language} />
      </aside>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/20 z-40 lg:hidden"
              onClick={() => setOpen(false)}
            />
            <motion.aside
              initial={{ x: -208 }} animate={{ x: 0 }} exit={{ x: -208 }}
              transition={{ type: 'spring', damping: 28, stiffness: 220 }}
              className="fixed left-0 top-0 bottom-0 w-52 z-50 bg-white border-r border-nuvia-border"
            >
              <div className="flex justify-end p-3">
                <button onClick={() => setOpen(false)}
                  className="p-1.5 text-nuvia-muted hover:text-nuvia-text rounded-lg hover:bg-nuvia-surface transition-colors"
                  aria-label="Close navigation"
                >
                  <X size={15} />
                </button>
              </div>
              <div className="h-[calc(100%-44px)]">
                <SidebarContent onClose={() => setOpen(false)} lang={language} />
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 h-13 border-b border-nuvia-border bg-white flex-shrink-0">
          <button
            onClick={() => setOpen(true)}
            className="p-1.5 text-nuvia-muted hover:text-nuvia-text rounded-lg hover:bg-nuvia-surface"
            aria-label="Open navigation"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-bold"
            style={{ color: '#4a1f1f', fontFamily: '"Playfair Display", serif' }}>
            Nuvia
          </span>
          <div className="w-8" />
        </header>

        <main className="flex-1 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {children}
          </motion.div>
        </main>
      </div>
    </div>
  )
}
