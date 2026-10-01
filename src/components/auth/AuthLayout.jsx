import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'
import OttimaLogo from '@/components/ui/OttimaLogo'

/**
 * AuthLayout — Dashboard-matched Modern Classic Light Aesthetic
 *
 * Two-column layout:
 *   Left  — Modern Classic brand showcase panel in refined Beige & Warm Sand
 *   Right — Form panel with crisp White card container on Cream background
 */
export default function AuthLayout({ children }) {
  const { t, i18n } = useTranslation()

  return (
    <div className="min-h-dvh flex bg-cream selection:bg-warm-brown selection:text-white">
      {/* ── Left: Modern Classic Brand Panel (Dashboard Beige Palette) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[52%] relative overflow-hidden
          flex-col items-center justify-center p-12 select-none border-r rtl:border-r-0 rtl:border-l border-[#D9C7B8]"
        style={{
          background: 'linear-gradient(150deg, #FAF6F0 0%, #EFE5DA 50%, #E2D3C4 100%)',
        }}
      >
        {/* Subtle decorative architectural geometry */}
        <DecorativeGeometry />

        {/* Brand content */}
        <div className="relative z-10 text-center max-w-md mx-auto">
          {/* Logo mark & Wordmark */}
          <div className="flex flex-col items-center justify-center mb-8">
            <OttimaLogo
              variant="full"
              color="c1"
              className="h-36 sm:h-44 xl:h-52 w-auto max-w-[280px] xl:max-w-[320px] drop-shadow-sm transition-transform duration-300 hover:scale-[1.02]"
              alt="OTTIMA"
            />
          </div>

          {/* Tagline */}
          <p className="text-gray-800 text-lg xl:text-xl font-semibold tracking-wide leading-relaxed">
            {t('app.tagline')}
          </p>

          {/* Modern Classic Divider */}
          <div className="mt-8 flex items-center gap-3 justify-center">
            <div className="h-px w-20 bg-gradient-to-r from-transparent to-warm-brown/40" />
            <span className="text-warm-brown text-[10px] select-none">◆</span>
            <div className="h-px w-20 bg-gradient-to-l from-transparent to-warm-brown/40" />
          </div>

          {/* Subtitle */}
          <p className="mt-6 text-gray-600 text-sm max-w-xs mx-auto leading-relaxed">
            {t('app.subtitle')}
          </p>

          {/* Modern Classic Stats Grid */}
          <div className="mt-14 pt-8 border-t border-[#D9C7B8] flex items-center justify-center gap-6 xl:gap-8">
            <div className="text-center px-2">
              <p className="text-2xl xl:text-3xl font-extrabold text-gray-900 tracking-tight">500+</p>
              <p className="text-xs text-gray-600 mt-1 font-medium">
                {i18n.language === 'ar' ? 'المشاريع' : 'Projects'}
              </p>
            </div>

            <div className="h-8 w-px bg-[#D9C7B8]" />

            <div className="text-center px-2">
              <p className="text-2xl xl:text-3xl font-extrabold text-warm-brown tracking-tight">1,200+</p>
              <p className="text-xs text-gray-600 mt-1 font-medium">
                {i18n.language === 'ar' ? 'المهندسين' : 'Engineers'}
              </p>
            </div>

            <div className="h-8 w-px bg-[#D9C7B8]" />

            <div className="text-center px-2">
              <p className="text-2xl xl:text-3xl font-extrabold text-gray-900 tracking-tight">99.9%</p>
              <p className="text-xs text-gray-600 mt-1 font-medium">
                {i18n.language === 'ar' ? 'دقة الإنجاز' : 'Accuracy'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right: Form Panel ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-h-dvh overflow-y-auto scrollbar-thin bg-cream">

        {/* Top bar: mobile logo + language switcher */}
        <div className="flex items-center justify-between px-6 py-4 lg:px-8 lg:py-5">
          {/* Mobile-only logo */}
          <div className="lg:hidden flex items-center gap-2.5">
            <OttimaLogo variant="lockup" color="c1" />
          </div>
          {/* Desktop spacer */}
          <div className="hidden lg:block" />

          <LanguageSwitcher className="bg-white border-gray-200 text-gray-700 hover:text-black hover:bg-light-blue/40 shadow-sm" />
        </div>

        {/* Form slot */}
        <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 lg:py-12">
          <div className="w-full max-w-md glass-card p-6 sm:p-8 md:p-9 shadow-card rounded-2xl bg-white border border-gray-200 animate-slide-up">
            {children}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 text-center border-t border-[#D9C7B8]/40">
          <p className="text-xs text-gray-500">
            © {new Date().getFullYear()} OTTIMA — {t('app.tagline')}
          </p>
        </div>
      </div>
    </div>
  )
}

/* ── Sub-components ─────────────────────────────────────────── */

function DecorativeGeometry() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Concentric Orbit Rings */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[620px] h-[620px] rounded-full
        border border-warm-brown/12 animate-spin-slow" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[440px] h-[440px] rounded-full
        border border-dashed border-warm-brown/15" />

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
        w-[260px] h-[260px] rounded-full
        border border-warm-brown/20" />

      {/* Ambient Radial Glow Blobs */}
      <div className="absolute top-1/4 left-1/4 w-80 h-80 rounded-full
        bg-warm-brown/10 blur-3xl animate-float" style={{ animationDelay: '0s' }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full
        bg-light-blue/30 blur-3xl animate-float" style={{ animationDelay: '2.5s' }} />

      {/* Small floating architectural markers */}
      {[
        { top: '14%', left: '10%', size: 'w-2.5 h-2.5', delay: '0s' },
        { top: '72%', left: '14%', size: 'w-2 h-2',     delay: '1.5s' },
        { top: '22%', right: '12%', size: 'w-3 h-3',     delay: '0.8s' },
        { top: '82%', right: '18%', size: 'w-2 h-2',     delay: '2.2s' },
      ].map(({ top, left, right, size, delay }, i) => (
        <div
          key={i}
          className={`absolute ${size} rounded-sm border border-warm-brown/25 bg-warm-brown/10 animate-float`}
          style={{ top, left, right, animationDelay: delay }}
        />
      ))}

      {/* Grid dots overlay */}
      <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <pattern id="auth-dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#7D583F" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#auth-dots)" />
      </svg>
    </div>
  )
}


