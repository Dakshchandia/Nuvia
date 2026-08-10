/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        nuvia: {
          // Warm cream backgrounds
          bg:       '#f7f3ee',
          surface:  '#f2ece4',
          card:     '#ffffff',
          border:   '#e8ddd3',

          // Deep brown / burgundy — primary brand
          brown:    '#4a1f1f',
          'brown-light': '#7a3f3f',
          'brown-muted': '#9b6b6b',

          // Warm rose — user bubble / accent
          rose:     '#f9e8e8',
          'rose-dark': '#e8c4c4',

          // Soft sage green — AI / memory accent
          sage:     '#e8f0e8',
          'sage-dark': '#c4d9c4',

          // Typography
          text:     '#1a1008',
          muted:    '#6b5b4e',
          subtle:   '#a09080',

          // Keep these for backward compat with existing components
          violet:         '#4a1f1f',
          'violet-light': '#9b6b6b',
          'violet-glow':  '#7a3f3f',
          cyan:           '#5a8a6a',
          'cyan-light':   '#7aaa8a',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'nuvia-hero':      'linear-gradient(135deg, #fdf6f0 0%, #f7f3ee 50%, #f0f4ef 100%)',
        'nuvia-cta':       'linear-gradient(135deg, #fce8e8 0%, #f7f3ee 50%, #e8f0e8 100%)',
      },
      animation: {
        'orb-idle':  'orbIdle 4s ease-in-out infinite',
        'wave-bar':  'waveBar 1.2s ease-in-out infinite',
        'fade-up':   'fadeUp 0.5s ease-out forwards',
        'slide-in':  'slideIn 0.4s ease-out forwards',
        'breathe':   'breathe 4s ease-in-out infinite',
      },
      keyframes: {
        orbIdle: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%':      { transform: 'scale(1.05)' },
        },
        waveBar: {
          '0%, 100%': { transform: 'scaleY(0.3)' },
          '50%':      { transform: 'scaleY(1)' },
        },
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)',    opacity: '0.8' },
          '50%':      { transform: 'scale(1.08)', opacity: '1'   },
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(74,31,31,0.08)',
        'warm':    '0 4px 16px rgba(74,31,31,0.08)',
        'warm-lg': '0 8px 32px rgba(74,31,31,0.1)',
      },
    },
  },
  plugins: [],
}
