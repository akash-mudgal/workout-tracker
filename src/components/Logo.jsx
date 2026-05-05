export function LogoMark({ size = 32, id = 'logo' }) {
  const g = `${id}-g`
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <defs>
        <linearGradient id={g} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
      {/* Vertical bar of K */}
      <rect x="3.5" y="3" width="6" height="26" rx="3" fill={`url(#${g})`} />
      {/* Upper arm */}
      <path d="M9.5 16.5L26.5 3.5" stroke={`url(#${g})`} strokeWidth="5" strokeLinecap="round" />
      {/* Lower arm */}
      <path d="M9.5 15.5L26.5 28.5" stroke={`url(#${g})`} strokeWidth="5" strokeLinecap="round" />
      {/* Speed dot — kinetic accent */}
      <circle cx="28.5" cy="16" r="2.5" fill={`url(#${g})`} opacity="0.55" />
    </svg>
  )
}
