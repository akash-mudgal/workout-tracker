/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // "Instrument" palette. Two accents, each with exactly one job:
        // `signal` only ever means a target met or a new best, and never
        // appears on a button; `ink` carries primary actions.
        ground: '#0B0D10',
        raised: '#14181D',
        rule: '#313B45',
        ink: '#E8EBED',
        muted: '#8B949E',
        signal: '#D7FF3E',
        warn: '#FF6B5B',
      },
      fontFamily: {
        // One variable family. Width, not a second typeface, separates the
        // numerals from the interface text.
        sans: ['Archivo', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        // 12px is the floor. Nothing smaller is defined, so nothing can use it.
        micro: ['0.75rem', { lineHeight: '1rem' }],
        xs: ['0.8125rem', { lineHeight: '1.125rem' }],
      },
    },
  },
  plugins: [],
}
