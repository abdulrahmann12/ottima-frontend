/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Core Luxury Palette ─────────────────────────────────
        cream:        '#F4EDE4',   // Main app background (60%)
        beige:        '#D9C7B8',   // Sidebar, navbar, subtle borders (30%)
        'warm-brown': '#7D583F',   // Primary CTAs, active links, brand accents (10%)
        'light-blue': '#C4DAE8',   // Hover effects & subtle active states

        // ── Semantic aliases (light-theme) ──────────────────────
        // Cards, modals, table backgrounds → pure white
        'surface-card':   '#FFFFFF',
        // Dividers, table borders, card borders → crisp light gray
        'surface-border': '#E5E7EB', // = gray-200

        // ── Brand shades (used by older component code) ─────────
        // Mapped to warm-brown scale so existing brand-* classes render correctly
        'brand-300': '#C49A78',  // light warm-brown tint
        'brand-400': '#A57550',  // medium warm-brown
        'brand-500': '#7D583F',  // = warm-brown
        'brand-600': '#6B4A33',  // warm-brown dark (button hover)
        'brand-700': '#5A3D2B',  // deeper shade
        'brand-900': '#2D1E15',  // deepest shade
        'brand-950': '#1A110D',  // near-black brown

        // Semantic alias for direct use
        'brand-bg':        '#F4EDE4',
        'brand-secondary': '#D9C7B8',
        'brand-primary':   '#7D583F',
        'brand-accent':    '#C4DAE8',
        'brand-dark':      '#111827',

        // ── Accent color (used in AuthLayout decorative elements) ─
        accent: '#C4DAE8',  // = light-blue
      },

      fontFamily: {
        sans:   ['Inter', 'system-ui', 'sans-serif'],
        arabic: ['Cairo', 'system-ui', 'sans-serif'],
      },

      backgroundImage: {
        // Luxury dark gradient for Auth/Login brand panel
        'gradient-brand': 'linear-gradient(145deg, #1C1510 0%, #2D2018 50%, #15100C 100%)',
        'gradient-card':  'linear-gradient(145deg, rgba(140,109,83,0.15) 0%, rgba(22,18,14,0) 100%)',
      },

      boxShadow: {
        // Glow shadows for auth brand panel and luxury cards
        'glow-bronze':  '0 0 30px rgba(212, 163, 115, 0.25)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.20)',
        'glow-sage':    '0 0 25px rgba(107, 112, 92, 0.25)',
        // Upgraded card shadow for light theme (softer, cream-aware)
        'card':  '0 1px 3px rgba(0,0,0,0.07), 0 4px 12px rgba(0,0,0,0.05)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.10)',
      },

      animation: {
        'fade-in':    'fadeIn 0.15s ease-out',
        'slide-up':   'slideUp 0.2s ease-out',
        'float':      'float 6s ease-in-out infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'spin-slow':  'spin 8s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.4' },
          '50%':      { opacity: '0.8' },
        },
      },
    },
  },
  plugins: [],
}
