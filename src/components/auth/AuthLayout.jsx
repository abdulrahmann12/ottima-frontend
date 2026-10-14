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
      {/* ── Left: Pure, Minimalist Luxury Brand Panel ── */}
      <div
        className="hidden lg:flex lg:w-1/2 xl:w-[50%] relative overflow-hidden
          flex-col items-center justify-center p-10 xl:p-14 select-none border-r rtl:border-r-0 rtl:border-l border-[#D9C7B8]"
        style={{
          background: 'linear-gradient(150deg, #FAF6F0 0%, #EFE5DA 55%, #E4D5C6 100%)',
        }}
      >
        {/* Soft, calm ambient background with ultra-subtle architectural grid */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-warm-brown/[0.04] blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-[#C6AB7C]/[0.07] blur-3xl" />
          <svg className="absolute inset-0 w-full h-full opacity-[0.035]" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="clean-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#7D583F" strokeWidth="0.75" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#clean-grid)" />
          </svg>
        </div>

        {/* Brand Showcase — Clean, Prestigious & Calm */}
        <div className="relative z-10 text-center max-w-sm mx-auto flex flex-col items-center">
          {/* Logo */}
          <div className="flex flex-col items-center justify-center mb-8">
            <OttimaLogo
              variant="full"
              color="c1"
              className="h-36 sm:h-44 xl:h-48 w-auto max-w-[260px] xl:max-w-[290px] drop-shadow-sm transition-transform duration-300 hover:scale-[1.01]"
              alt="OTTIMA"
            />
          </div>

          {/* Tagline */}
          <h2 className="text-gray-900 text-lg xl:text-xl font-medium tracking-wide">
            {t('app.tagline')}
          </h2>

          {/* Minimalist Divider */}
          <div className="mt-5 mb-5 flex items-center gap-3 justify-center w-full">
            <div className="h-px w-14 bg-gradient-to-r from-transparent to-warm-brown/30" />
            <span className="text-warm-brown/60 text-[9px] select-none">◆</span>
            <div className="h-px w-14 bg-gradient-to-l from-transparent to-warm-brown/30" />
          </div>

          {/* Subtitle */}
          <p className="text-gray-600 text-sm font-light leading-relaxed max-w-xs">
            {t('app.subtitle')}
          </p>

          {/* Subtle Inline Pillars (Clean, No Cards, No Fake Stats) */}
          <div className="mt-10 flex items-center justify-center gap-2.5 text-xs text-warm-brown/80 font-medium tracking-wide">
            <span>{i18n.language === 'ar' ? 'إشراف ميداني' : 'Site Supervision'}</span>
            <span className="text-warm-brown/30">•</span>
            <span>{i18n.language === 'ar' ? 'ضبط الجودة' : 'Quality Assurance'}</span>
            <span className="text-warm-brown/30">•</span>
            <span>{i18n.language === 'ar' ? 'تسليم دقيق' : 'Precision Handover'}</span>
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


