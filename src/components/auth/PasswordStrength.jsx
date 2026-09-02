/**
 * PasswordStrength
 *
 * Displays a 3-segment colored bar (weak/medium/strong) below a password input.
 *
 * Props:
 *   password  string  — the current password value
 */

function getStrength(password) {
  if (!password || password.length === 0) return 0
  let score = 0
  if (password.length >= 8)  score++
  if (password.length >= 12) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  // Normalize to 1-3
  if (score <= 1) return 1  // weak
  if (score <= 3) return 2  // medium
  return 3                   // strong
}

const LABELS = {
  en: ['', 'Weak', 'Fair', 'Strong'],
  ar: ['', 'ضعيفة', 'متوسطة', 'قوية'],
}

const COLORS = [
  '',
  'bg-red-500',     // 1 = weak
  'bg-amber-400',   // 2 = medium
  'bg-emerald-500', // 3 = strong
]

export default function PasswordStrength({ password, lang = 'en' }) {
  const strength = getStrength(password)
  const labels = LABELS[lang] ?? LABELS.en

  if (!password) return null

  return (
    <div className="mt-2 animate-fade-in">
      {/* 3-segment bar */}
      <div className="flex gap-1.5" role="presentation">
        {[1, 2, 3].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              strength >= level ? COLORS[strength] : 'bg-slate-700'
            }`}
          />
        ))}
      </div>
      {/* Label */}
      <p className={`mt-1 text-xs ${
        strength === 1 ? 'text-red-400' :
        strength === 2 ? 'text-amber-400' :
        'text-emerald-400'
      }`}>
        {labels[strength]}
      </p>
    </div>
  )
}
