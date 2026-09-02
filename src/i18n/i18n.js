import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import enTranslation from '../locales/en/translation.json'
import arTranslation from '../locales/ar/translation.json'

/**
 * Applies RTL/LTR direction and language to the <html> element.
 * Called on init and every time the language changes.
 */
function applyDocumentDirection(lng) {
  const dir = lng === 'ar' ? 'rtl' : 'ltr'
  document.documentElement.setAttribute('dir', dir)
  document.documentElement.setAttribute('lang', lng)
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslation },
      ar: { translation: arTranslation },
    },
    fallbackLng: 'en',
    supportedLngs: ['en', 'ar'],
    defaultNS: 'translation',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  })

// Apply direction when i18n initialises
applyDocumentDirection(i18n.language || 'en')

// Apply direction on every language change
i18n.on('languageChanged', (lng) => {
  applyDocumentDirection(lng)
})

export default i18n
