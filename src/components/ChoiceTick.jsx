// Empty circle on an unselected option, filled tick on a selected one. The
// parent's aria-pressed decides which (see .choice-tick in index.css), so
// callers just drop it in.
export default function ChoiceTick() {
  return (
    <span className="choice-tick" aria-hidden="true">
      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 6.5L4.8 8.8L9.5 3.5" stroke="#0B0D10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  )
}
