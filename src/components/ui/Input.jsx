import { useState, forwardRef } from 'react'
import { Eye, EyeOff } from './icons/Globe'

/**
 * Input
 *
 * Props:
 *   id          string   — unique id (required for label association)
 *   label       string   — visible label text
 *   type        string   — html input type (default: 'text')
 *   error       string   — validation / server error message
 *   className   string   — additional classes on the wrapper div
 *   ...rest              — passed directly to <input>
 */
const Input = forwardRef(function Input(
  { id, label, type = 'text', error, className = '', ...rest },
  ref
) {
  const [showPassword, setShowPassword] = useState(false)
  const isPassword = type === 'password'
  const resolvedType = isPassword ? (showPassword ? 'text' : 'password') : type

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
        </label>
      )}

      <div className="relative">
        <input
          id={id}
          ref={ref}
          type={resolvedType}
          className={`input-base ${isPassword ? 'pr-11 rtl:pr-4 rtl:pl-11' : ''} ${
            error ? 'input-error' : ''
          }`}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          {...rest}
        />

        {/* Password toggle eye */}
        {isPassword && (
          <button
            type="button"
            tabIndex={-1}
            onClick={() => setShowPassword((v) => !v)}
            className="absolute inset-y-0 right-3 rtl:right-auto rtl:left-3
              flex items-center text-slate-500 hover:text-slate-300
              transition-colors duration-150 focus:outline-none"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-xs text-red-400 animate-fade-in"
        >
          {error}
        </p>
      )}
    </div>
  )
})

export default Input
