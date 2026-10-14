/**
 * OttimaLogo — Reusable Brand Logo Component
 *
 * Supports all official Ottima brand assets:
 * - variant: 'icon' | 'type' | 'full' | 'lockup'
 * - color:   'c1' (bronze brown, default) | 'c2' (champagne gold) | 'black' | 'white'
 */
import React from 'react'

const LOGO_PATHS = {
  icon: {
    c1:    '/logos/ICON_C1.png',
    c2:    '/logos/ICON_C2.png',
    black: '/logos/ICON_BLCK.png',
    white: '/logos/ICON_WHITE.png',
  },
  type: {
    c1:    '/logos/TYPE_C1.png',
    c2:    '/logos/TYPE_C2.png',
    black: '/logos/TYPE_BLCK.png',
    white: '/logos/TYPE_WHITE.png',
  },
  full: {
    c1:    '/logos/FULL_C1.png',
    c2:    '/logos/FULL_C2.png',
    black: '/logos/FULL_BLCK.png',
    white: '/logos/FULL_WHITE.png',
  },
}

export default function OttimaLogo({
  variant = 'icon',
  color = 'c1',
  className = '',
  imgClassName = '',
  subtitle = null,
  collapsed = false,
  alt = 'OTTIMA',
  ...props
}) {
  const selectedColor = LOGO_PATHS[variant]?.[color] ? color : 'c1'

  if (variant === 'lockup') {
    const iconSrc = LOGO_PATHS.icon[selectedColor]
    const typeSrc = LOGO_PATHS.type[selectedColor]

    return (
      <div className={`flex items-center gap-3 ${className}`} {...props}>
        <img
          src={iconSrc}
          alt={alt}
          className={`w-9 h-9 object-contain shrink-0 drop-shadow-xs ${imgClassName}`}
          loading="eager"
        />
        {!collapsed && (
          <div className="min-w-0 flex flex-col justify-center">
            <img
              src={typeSrc}
              alt="OTTIMA"
              className="h-3.5 w-auto object-contain object-left rtl:object-right"
              loading="eager"
            />
            {subtitle && (
              <p className="text-gray-700 text-[11px] font-light tracking-wide truncate mt-0.5 font-sans">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  const src = LOGO_PATHS[variant]?.[selectedColor] || LOGO_PATHS.icon.c1

  return (
    <img
      src={src}
      alt={alt}
      className={`object-contain ${className} ${imgClassName}`}
      loading="eager"
      {...props}
    />
  )
}
