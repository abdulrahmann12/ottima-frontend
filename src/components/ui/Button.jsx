import { Spinner } from './icons/Globe'

/**
 * Button
 *
 * Props:
 *   variant     'primary' | 'ghost'   (default: 'primary')
 *   loading     boolean               — shows spinner, disables interaction
 *   children    ReactNode
 *   ...rest                           — passed to <button>
 */
export default function Button({
  variant = 'primary',
  loading = false,
  children,
  className = '',
  ...rest
}) {
  const base =
    variant === 'primary'
      ? 'btn-primary flex items-center justify-center gap-2'
      : 'btn-ghost flex items-center justify-center gap-2'

  return (
    <button
      disabled={loading || rest.disabled}
      className={`${base} ${className}`}
      {...rest}
    >
      {loading && <Spinner className="w-4 h-4" />}
      {children}
    </button>
  )
}
