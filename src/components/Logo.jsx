// The mark inherits its colour so it sits in whatever context it's placed in.
// The violet gradient it used to carry is gone: colour now means something
// specific in this interface, and a logo is not one of those meanings.
export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden="true">
      {/* Vertical bar of K */}
      <rect x="3.5" y="3" width="6" height="26" rx="3" fill="currentColor" />
      {/* Upper arm */}
      <path d="M9.5 16.5L26.5 3.5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {/* Lower arm */}
      <path d="M9.5 15.5L26.5 28.5" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      {/* Speed dot — kinetic accent */}
      <circle cx="28.5" cy="16" r="2.5" fill="currentColor" opacity="0.5" />
    </svg>
  )
}
