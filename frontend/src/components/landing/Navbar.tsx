import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])

  const scrollTo = (id: string) => {
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-md border-b border-nuvia-border shadow-warm-sm' : ''
    }`}>
      <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">

        {/* Logo */}
        <Link to="/landing" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full orb-warm flex-shrink-0" />
          <span className="text-base font-bold" style={{ color: '#4a1f1f', fontFamily: '"Playfair Display", serif' }}>
            Nuvia
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8">
          {[
            { label: 'How it works', id: 'how-it-works' },
            { label: 'Features',     id: 'features'    },
            { label: 'Trust',        id: 'trust'        },
          ].map((item) => (
            <button key={item.id} onClick={() => scrollTo(item.id)}
              className="text-sm text-nuvia-muted hover:text-nuvia-text transition-colors duration-150"
            >{item.label}</button>
          ))}
        </div>

        {/* CTAs */}
        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => navigate('/app')} className="btn-secondary text-sm py-2 px-4">
            Open Nuvia
          </button>
          <button onClick={() => navigate('/onboarding')} className="btn-primary text-sm py-2 px-5">
            Try the Demo →
          </button>
        </div>

        {/* Mobile hamburger */}
        <button onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden text-nuvia-muted hover:text-nuvia-text transition-colors"
          aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="md:hidden bg-white border-b border-nuvia-border px-6 py-4 flex flex-col gap-3"
          >
            {[
              { label: 'How it works', id: 'how-it-works' },
              { label: 'Features',     id: 'features'     },
              { label: 'Trust',        id: 'trust'         },
            ].map(item => (
              <button key={item.id} onClick={() => scrollTo(item.id)}
                className="text-left text-sm text-nuvia-muted hover:text-nuvia-text py-1"
              >{item.label}</button>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-nuvia-border">
              <button onClick={() => { setMobileOpen(false); navigate('/app') }} className="btn-secondary text-sm py-2.5">Open Nuvia</button>
              <button onClick={() => { setMobileOpen(false); navigate('/app/talk') }} className="btn-primary text-sm py-2.5">Try the Demo →</button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
