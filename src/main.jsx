import React, { Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './i18n/i18n'

/**
 * Loading fallback shown while i18next loads translation files.
 * Matches the dark theme so there's no flash of unstyled content.
 */
function I18nLoader() {
  return (
    <div
      className="min-h-dvh bg-[#0f172a] flex items-center justify-center"
      aria-label="Loading…"
    >
      <div className="flex flex-col items-center gap-4">
        {/* Animated logo mark */}
        <div className="w-12 h-12 rounded-xl border border-[#4338ca]/40 bg-[#1e1b4b]/60
          flex items-center justify-center">
          <svg className="w-6 h-6 text-[#818cf8]" fill="none" viewBox="0 0 40 40">
            <path d="M8 32 L20 8 L32 32" stroke="currentColor" strokeWidth="3"
              strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            <path d="M13 24 L27 24" stroke="currentColor" strokeWidth="3"
              strokeLinecap="round"/>
          </svg>
        </div>
        {/* Spinner */}
        <svg className="animate-spin w-5 h-5 text-[#4f46e5]" xmlns="http://www.w3.org/2000/svg"
          fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Suspense fallback={<I18nLoader />}>
      <App />
    </Suspense>
  </React.StrictMode>
)
