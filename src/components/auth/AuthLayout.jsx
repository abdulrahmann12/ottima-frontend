import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

/**
 * AuthLayout
 *
 * Two-column layout:
 *   Left  — Brand panel (decorative, hidden on mobile)
 *   Right — Form panel (children slot)
 *
 * The brand panel features:
 *   - Deep indigo/slate gradient background
 *   - Animated geometric SVG shapes
 *   - OTTIMA logo wordmark + tagline
 */
export default function AuthLayout({ children }) {
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh flex bg-auth-pattern">

      {/* ── Left: Brand Panel ──────────────────────────────── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden
          bg-gradient-brand flex-col items-center justify-center p-12"
      >
        {/* Decorative animated geometry */}
        <DecorativeGeometry />

        {/* Brand content */}
        <div className="relative z-10 text-center select-none">
          {/* Logo mark */}
          <div className="flex items-center justify-center mb-8">
            <OttimaLogo className="w-20 h-20" />
          </div>

          {/* Wordmark */}
          <h1 className="text-5xl xl:text-6xl font-extrabold tracking-tight text-white mb-4">
            OT<span className="text-gradient">TIM</span>A
          </h1>

          {/* Tagline */}
          <p className="text-slate-300 text-lg xl:text-xl font-light max-w-xs mx-auto leading-relaxed">
            {t('app.tagline')}
          </p>

          {/* Divider */}
          <div className="mt-8 flex items-center gap-4 justify-center">
            <div className="h-px w-16 bg-gradient-to-r from-transparent to-brand-500/60" />
            <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse-soft" />
            <div className="h-px w-16 bg-gradient-to-l from-transparent to-brand-500/60" />
          </div>

          {/* Subtitle */}
          <p className="mt-6 text-slate-500 text-sm max-w-xs mx-auto leading-relaxed">
            {t('app.subtitle')}
          </p>

          {/* Stats badges */}
          <div className="mt-12 flex gap-6 justify-center">
            {[
              { label: 'Projects', value: '500+' },
              { label: 'Engineers', value: '1,200+' },
              { label: 'Accuracy', value: '99.9%' },
            ].map(({ label, value }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-500 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-dvh overflow-y-auto scrollbar-thin">

        {/* Top bar: mobile logo + language switcher */}
        <div className="flex items-center justify-between px-6 py-4 lg:px-8 lg:py-5">
          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center gap-2">
            <OttimaLogoSmall />
            <span className="font-bold text-white text-lg tracking-tight">OTTIMA</span>
          </div>
          {/* Desktop spacer */}
          <div className="hidden lg:block" />

          <LanguageSwitcher />
        </div>

        {/* Form slot */}
        <div className="flex-1 flex items-center justify-center px-6 py-8 lg:py-12">
          <div className="w-full max-w-md animate-slide-up">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center">
          <p className="text-xs text-slate-600">
            © {new Date().getFullYear()} OTTIMA — Finishing Project Tracking System
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function OttimaLogo({ className }) {
  return (
    <div className={`${className} relative flex items-center justify-center`}>
      {/* Outer ring */}
      <div className="absolute inset-0 rounded-2xl border border-brand-500/30 animate-pulse-soft" />
      {/* Inner glow */}
      <div className="absolute inset-2 rounded-xl bg-brand-600/20 backdrop-blur-sm" />
      {/* Icon */}
      <svg className="relative z-10 w-10 h-10 text-brand-400" fill="none"
        viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 32 L20 8 L32 32" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M12 24 L28 24" stroke="currentColor" strokeWidth="2.5"
          strokeLinecap="round"/>
        <circle cx="20" cy="8" r="2.5" fill="currentColor" className="text-accent"/>
      </svg>
    </div>
  )
}

function OttimaLogoSmall() {
  return (
    <div className="w-8 h-8 rounded-lg bg-brand-900/80 border border-brand-700/50
      flex items-center justify-center flex-shrink-0">
      <svg className="w-4 h-4 text-brand-400" fill="none" viewBox="0 0 40 40">
        <path d="M8 32 L20 8 L32 32" stroke="currentColor" strokeWidth="3"
          strokeLinecap="round" strokeLinejoin="round" fill="none"/>
        <path d="M13 24 L27 24" stroke="currentColor" strokeWidth="3"
          strokeLinecap="round"/>
      </svg>
    </div>
  )
}

function DecorativeGeometry() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Large orbit ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[600px] h-[600px] rounded-full
        border border-brand-500/10 animate-spin-slow" />

      {/* Medium orbit ring */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[420px] h-[420px] rounded-full
        border border-brand-400/15" />

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-1/4 w-72 h-72 rounded-full
        bg-brand-600/15 blur-3xl animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-56 h-56 rounded-full
        bg-accent/10 blur-3xl animate-float" style={{ animationDelay: '2s' }} />

      {/* Small floating squares */}
      {[
        { top: '15%', left: '10%', size: 'w-3 h-3', delay: '0s' },
        { top: '70%', left: '15%', size: 'w-2 h-2', delay: '1.5s' },
        { top: '25%', right: '12%', size: 'w-4 h-4', delay: '0.8s' },
        { top: '80%', right: '20%', size: 'w-2.5 h-2.5', delay: '2.5s' },
        { top: '50%', left: '5%',   size: 'w-1.5 h-1.5', delay: '1.2s' },
      ].map(({ top, left, right, size, delay }, i) => (
        <div
          key={i}
          className={`absolute ${size} rounded border border-brand-500/30 animate-float`}
          style={{ top, left, right, animationDelay: delay }}
        />
      ))}

      {/* Grid dots overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.04]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="white" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>
  )
}
