import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * SearchBar — debounced search input
 *
 * Props:
 *   value         string   — controlled value
 *   onChange      (v: string) => void — called after debounce delay
 *   placeholder   string
 *   debounceMs    number   (default 400)
 *   className     string
 */
export default function SearchBar({
  value,
  onChange,
  placeholder,
  debounceMs = 400,
  className = '',
}) {
  const { t } = useTranslation()
  const [localValue, setLocalValue] = useState(value ?? '')
  const timerRef = useRef(null)

  // Sync parent value → local when parent resets
  useEffect(() => {
    setLocalValue(value ?? '')
  }, [value])

  const handleChange = (e) => {
    const v = e.target.value
    setLocalValue(v)
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onChange(v), debounceMs)
  }

  const handleClear = () => {
    setLocalValue('')
    clearTimeout(timerRef.current)
    onChange('')
  }

  return (
    <div className={`relative ${className}`}>
      {/* Search icon */}
      <span className="absolute inset-y-0 start-3 flex items-center text-slate-500 pointer-events-none">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
        </svg>
      </span>

      <input
        id="admin-search-input"
        type="search"
        value={localValue}
        onChange={handleChange}
        placeholder={placeholder ?? t('table.loading')}
        className="input-base ps-9 pe-8 text-sm"
        aria-label={placeholder}
      />

      {/* Clear button */}
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className="absolute inset-y-0 end-3 flex items-center text-slate-500
            hover:text-slate-300 transition-colors duration-150 focus:outline-none"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
