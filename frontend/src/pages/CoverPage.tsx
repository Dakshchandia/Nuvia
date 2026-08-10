import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './CoverPage.css'

export function CoverPage() {
  const navigate = useNavigate()

  useEffect(() => {
    const originalTitle = document.title
    document.title = 'NUVIA — AI-Powered Voice Companion for Maternal Health'
    return () => {
      document.title = originalTitle
    }
  }, [])

  return (
    <div className="cover-page-wrapper">
      <div className="screen">
        <svg className="wave top" viewBox="0 0 1440 240" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0h1440v96c-220 70-420 8-700 44S200 210 0 150Z" fill="currentColor" opacity="0.45" />
          <path d="M0 0h1440v54c-260 92-500 20-760 58S180 158 0 104Z" fill="currentColor" opacity="0.6" />
        </svg>

        <svg className="leaf right" viewBox="0 0 120 300" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" aria-hidden="true">
          <path d="M108 12C88 60 76 132 80 288" />
          <path d="M80 70c-18-6-30-24-30-42 20-2 34 12 38 30" />
          <path d="M82 122c-20-4-34-20-36-38 20-4 36 8 42 26" />
          <path d="M84 176c-18-2-32-16-36-34 20-6 36 4 44 22" />
          <path d="M86 228c-16 0-30-12-34-28 18-6 34 2 42 18" />
        </svg>

        <svg className="leaf left" viewBox="0 0 120 300" fill="none" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" aria-hidden="true">
          <path d="M108 12C88 60 76 132 80 288" />
          <path d="M80 70c-18-6-30-24-30-42 20-2 34 12 38 30" />
          <path d="M82 122c-20-4-34-20-36-38 20-4 36 8 42 26" />
          <path d="M84 176c-18-2-32-16-36-34 20-6 36 4 44 22" />
          <path d="M86 228c-16 0-30-12-34-28 18-6 34 2 42 18" />
        </svg>

        <div className="dots a" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>
        <div className="dots b" aria-hidden="true">
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
          <span></span><span></span><span></span><span></span>
        </div>

        <main>
          <div className="emblem-wrap reveal">
            <div className="glow" aria-hidden="true"></div>
            <div className="emblem-ring">
              <img className="emblem" src="/emblem.png" alt="Nuvia Emblem" />
            </div>
          </div>
          <h1 className="reveal" style={{ animationDelay: '0.15s' }}>NUVIA</h1>
          <div className="divider reveal" style={{ animationDelay: '0.3s' }}>
            <i></i>
            <span className="diamond"></span>
            <i></i>
          </div>
          <p className="tag reveal" style={{ animationDelay: '0.45s' }}>
            AI-Powered Voice Companion
            <span>for Maternal Health</span>
          </p>

          <div className="bottom reveal" style={{ animationDelay: '0.6s' }}>
            <div className="bar"><i></i></div>
            <p className="hint">Tap below to enter</p>
            <button
              className="cta"
              aria-label="Enter Application"
              onClick={() => navigate('/landing')}
            >
              <div className="halo"></div>
              <svg fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"></path>
              </svg>
            </button>
          </div>
        </main>
      </div>
    </div>
  )
}
