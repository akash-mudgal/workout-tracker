import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LogoMark } from './Logo'

// `short` keeps the mobile labels readable at the 12px floor. Sessions is a
// rarely-touched management screen, so it no longer takes a seventh of the
// phone bar — it stays in the sidebar and is linked from the dashboard.
const links = [
  { to: '/', label: 'Home', short: 'Home', icon: HomeIcon, mobile: true },
  { to: '/workout', label: 'Train', short: 'Train', icon: DumbbellIcon, mobile: true },
  { to: '/nutrition', label: 'Nutrition', short: 'Food', icon: NutritionIcon, mobile: true },
  { to: '/metrics', label: 'Body', short: 'Body', icon: BodyIcon, mobile: true },
  { to: '/progress', label: 'Progress', short: 'Progress', icon: ChartIcon, mobile: true },
  { to: '/sessions', label: 'Sessions', short: 'Cycles', icon: SessionsIcon, mobile: false },
  { to: '/profile', label: 'Profile', short: 'Profile', icon: ProfileIcon, mobile: true },
]

const mobileLinks = links.filter((l) => l.mobile)

export default function NavBar() {
  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 flex-col z-50"
        style={{ background: 'var(--ground)', borderRight: '1px solid var(--rule)' }}
      >
        <div className="px-5 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <LogoMark size={26} />
            <span className="text-base font-semibold tracking-tight">Kinetiq</span>
          </div>
        </div>

        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className="block">
              {({ isActive }) => (
                <div
                  className={`flex items-center gap-3 px-3 rounded-lg transition-colors duration-150 min-h-[44px] ${
                    isActive ? 'text-ink' : 'text-muted hover:text-ink'
                  }`}
                  style={isActive ? { background: 'var(--raised)' } : undefined}
                >
                  <Icon size={19} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-6 pt-2" style={{ borderTop: '1px solid var(--rule)' }}>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-3 px-3 rounded-lg text-sm text-muted hover:text-ink transition-colors min-h-[44px]"
          >
            <SignOutIcon />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom bar ───────────────────────────── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'var(--ground)',
          borderTop: '1px solid var(--rule)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div className="flex items-stretch">
          {mobileLinks.map(({ to, short, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className="flex-1 min-w-0">
              {({ isActive }) => (
                <div
                  className={`flex flex-col items-center justify-center gap-1 min-h-[56px] px-0.5 transition-colors duration-150 ${
                    isActive ? 'text-ink' : 'text-muted'
                  }`}
                >
                  <Icon size={21} />
                  <span className={`text-micro leading-none truncate w-full text-center ${isActive ? 'font-semibold' : ''}`}>
                    {short}
                  </span>
                </div>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  )
}

function HomeIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function DumbbellIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <rect x="2" y="10.5" width="3.5" height="3" rx="0.75" />
      <rect x="5.5" y="8.5" width="2.5" height="7" rx="0.75" />
      <rect x="16" y="8.5" width="2.5" height="7" rx="0.75" />
      <rect x="18.5" y="10.5" width="3.5" height="3" rx="0.75" />
      <rect x="8" y="11.25" width="8" height="1.5" rx="0.75" />
    </svg>
  )
}

function NutritionIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4v7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v7M7 3v7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3c0 0 4 2 4 9H15V3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 12v9" />
    </svg>
  )
}

function BodyIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="5.5" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 9.5C8 9 10 8.5 12 8.5s4 .5 5.5 1m-11 0L5 15l3 1.5.5 4h7l.5-4L19 15l-1.5-5.5" />
    </svg>
  )
}

function ChartIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l4-5 4 3 4-6" />
    </svg>
  )
}

function SessionsIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M8 4v4M16 4v4M3 10h18" />
      <path strokeLinecap="round" d="M8 14h4M8 17h6" />
    </svg>
  )
}

function ProfileIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="8" r="4" strokeLinecap="round" strokeLinejoin="round" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  )
}
