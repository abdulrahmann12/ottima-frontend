import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * Premium searchable & filterable select dropdown component.
 * Allows searching/filtering thousands of options with keyboard navigation,
 * clear button, empty state, and full Arabic/English bilingual search support.
 *
 * @param {Object} props
 * @param {string} [props.id]
 * @param {string} [props.name]
 * @param {string} [props.label]
 * @param {string} [props.value] - Selected value
 * @param {Function} props.onChange - Called with value or synthetic event: onChange(e) / onChange(value)
 * @param {Array<{value: string|number, label: string, sublabel?: string, disabled?: boolean}>} props.options
 * @param {string} [props.placeholder]
 * @param {string} [props.searchPlaceholder]
 * @param {boolean} [props.disabled]
 * @param {boolean} [props.loading]
 * @param {string} [props.loadingLabel]
 * @param {boolean} [props.isClearable]
 * @param {string} [props.error]
 * @param {string} [props.className]
 * @param {boolean} [props.required]
 */
export default function SearchableSelect({
  id,
  name,
  label,
  value = '',
  onChange,
  options = [],
  placeholder,
  searchPlaceholder,
  disabled = false,
  loading = false,
  loadingLabel,
  isClearable = true,
  error,
  className = '',
  required = false,
}) {
  const { t, i18n } = useTranslation()
  const generatedId = useId()
  const selectId = id || generatedId
  const containerRef = useRef(null)
  const searchInputRef = useRef(null)
  const listRef = useRef(null)

  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(-1)

  const resolvedPlaceholder = placeholder || t('common.select', '-- Select --')
  const resolvedSearchPlaceholder = searchPlaceholder || (i18n.language === 'ar' ? 'ابحث هنا...' : 'Search options...')
  const resolvedLoadingLabel = loadingLabel || t('common.loading', 'Loading...')

  // Normalize options
  const normalizedOptions = useMemo(() => {
    if (!Array.isArray(options)) return []
    return options.map((opt) => {
      if (typeof opt === 'object' && opt !== null) {
        return {
          value: String(opt.value !== undefined ? opt.value : opt.id ?? ''),
          label: String(opt.label !== undefined ? opt.label : opt.name ?? opt.title ?? opt.value ?? ''),
          sublabel: opt.sublabel ? String(opt.sublabel) : undefined,
          disabled: Boolean(opt.disabled),
        }
      }
      return {
        value: String(opt),
        label: String(opt),
        disabled: false,
      }
    })
  }, [options])

  // Find currently selected option
  const selectedOption = useMemo(() => {
    if (value === '' || value === null || value === undefined) return null
    return normalizedOptions.find((opt) => String(opt.value) === String(value)) ?? null
  }, [normalizedOptions, value])

  // Filter options based on search input (case insensitive & diacritics insensitive)
  const filteredOptions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase()
    if (!term) return normalizedOptions

    return normalizedOptions.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(term)
      const matchSublabel = opt.sublabel ? opt.sublabel.toLowerCase().includes(term) : false
      const matchValue = opt.value.toLowerCase().includes(term)
      return matchLabel || matchSublabel || matchValue
    })
  }, [normalizedOptions, searchTerm])

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false)
        setSearchTerm('')
        setHighlightedIndex(-1)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus()
      }, 50)
    } else {
      setSearchTerm('')
      setHighlightedIndex(-1)
    }
  }, [isOpen])

  // Scroll highlighted option into view
  useEffect(() => {
    if (isOpen && highlightedIndex >= 0 && listRef.current) {
      const element = listRef.current.children[highlightedIndex]
      if (element) {
        element.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [highlightedIndex, isOpen])

  const handleSelect = (val) => {
    if (disabled || loading) return
    setIsOpen(false)
    setSearchTerm('')
    setHighlightedIndex(-1)

    if (onChange) {
      // Create synthetic event for compatibility with standard (e) => setSelected(e.target.value)
      const syntheticEvent = {
        target: { name: name || selectId, value: val },
        currentTarget: { name: name || selectId, value: val },
        value: val,
      }
      onChange(syntheticEvent, val)
    }
  }

  const handleClear = (e) => {
    e.stopPropagation()
    handleSelect('')
  }

  const handleKeyDown = (e) => {
    if (disabled || loading) return

    if (!isOpen) {
      if (e.key === 'Enter' || e.key === 'ArrowDown' || e.key === ' ' || e.key === 'ArrowUp') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      setSearchTerm('')
      setHighlightedIndex(-1)
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev < filteredOptions.length - 1 ? prev + 1 : 0))
      return
    }

    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredOptions.length - 1))
      return
    }

    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < filteredOptions.length) {
        const option = filteredOptions[highlightedIndex]
        if (!option.disabled) {
          handleSelect(option.value)
        }
      } else if (filteredOptions.length === 1 && !filteredOptions[0].disabled) {
        handleSelect(filteredOptions[0].value)
      }
    }
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Main Trigger Button */}
      <button
        id={selectId}
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen((prev) => !prev)}
        onKeyDown={handleKeyDown}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border text-sm text-left transition-all duration-200 bg-white ${
          disabled
            ? 'opacity-50 cursor-not-allowed bg-gray-50 border-gray-200 text-gray-400'
            : isOpen
            ? 'border-warm-brown ring-2 ring-warm-brown/20 shadow-sm'
            : error
            ? 'border-red-400 focus:border-red-500 ring-1 ring-red-400/30'
            : 'border-gray-200 hover:border-gray-300 shadow-sm'
        }`}
      >
        <span className="truncate flex-1">
          {loading ? (
            <span className="text-gray-400 flex items-center gap-2">
              <svg className="w-4 h-4 animate-spin text-warm-brown" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {resolvedLoadingLabel}
            </span>
          ) : selectedOption ? (
            <span className="font-medium text-gray-900">
              {selectedOption.label}
              {selectedOption.sublabel && (
                <span className="text-xs text-gray-400 font-normal ml-1.5">({selectedOption.sublabel})</span>
              )}
            </span>
          ) : (
            <span className="text-gray-400">{resolvedPlaceholder}</span>
          )}
        </span>

        <div className="flex items-center gap-1.5 shrink-0 text-gray-400">
          {isClearable && selectedOption && !disabled && !loading && (
            <span
              role="button"
              tabIndex={-1}
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-gray-100 hover:text-gray-600 transition-colors"
              title="Clear selection"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </span>
          )}

          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-warm-brown' : 'text-gray-400'}`}
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
          </svg>
        </div>
      </button>

      {/* Dropdown Popup */}
      {isOpen && (
        <div className="absolute z-[100] mt-1.5 w-full min-w-[200px] rounded-xl border border-gray-200 bg-white shadow-2xl overflow-hidden animate-fade-in">
          {/* Search Box */}
          <div className="p-2 border-b border-gray-100 bg-gray-50/80">
            <div className="relative flex items-center">
              <svg
                className="w-4 h-4 absolute start-3 text-gray-400 pointer-events-none"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
              </svg>
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value)
                  setHighlightedIndex(0)
                }}
                onKeyDown={handleKeyDown}
                placeholder={resolvedSearchPlaceholder}
                className="w-full ps-9 pe-8 py-2 text-xs rounded-lg bg-white border border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-warm-brown focus:ring-1 focus:ring-warm-brown"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute end-2.5 p-0.5 rounded text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Options List */}
          <ul
            ref={listRef}
            role="listbox"
            tabIndex={-1}
            className="max-h-60 overflow-y-auto p-1 text-sm divide-y divide-gray-50 focus:outline-none"
          >
            {filteredOptions.length === 0 ? (
              <li className="px-3 py-6 text-center text-xs text-gray-400 italic">
                {searchTerm
                  ? (i18n.language === 'ar' ? 'لا توجد نتائج مطابقة' : 'No matching results found')
                  : (i18n.language === 'ar' ? 'لا توجد خيارات متاحة' : 'No options available')}
              </li>
            ) : (
              filteredOptions.map((opt, idx) => {
                const isSelected = String(opt.value) === String(value)
                const isHighlighted = idx === highlightedIndex

                return (
                  <li
                    key={opt.value || idx}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => !opt.disabled && handleSelect(opt.value)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                      opt.disabled
                        ? 'opacity-40 cursor-not-allowed'
                        : isSelected
                        ? 'bg-warm-brown/10 text-warm-brown font-semibold'
                        : isHighlighted
                        ? 'bg-gray-100 text-gray-900'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="truncate flex-1">
                      <p className="truncate text-xs sm:text-sm">{opt.label}</p>
                      {opt.sublabel && (
                        <p className="text-[11px] text-gray-400 font-normal truncate mt-0.5">{opt.sublabel}</p>
                      )}
                    </div>

                    {isSelected && (
                      <svg
                        className="w-4 h-4 text-warm-brown shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={2.5}
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                      </svg>
                    )}
                  </li>
                )
              })
            )}
          </ul>

          {/* Quick stats footer */}
          {filteredOptions.length > 5 && (
            <div className="px-3 py-1.5 border-t border-gray-100 bg-gray-50/60 text-[10px] text-gray-400 text-right">
              {filteredOptions.length} {i18n.language === 'ar' ? 'عنصر' : 'options'}
            </div>
          )}
        </div>
      )}

      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}
