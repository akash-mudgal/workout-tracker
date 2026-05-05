import { NavLink } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { LogoMark } from './Logo'

const links = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/workout', label: 'Train', icon: DumbbellIcon },
  { to: '/nutrition', label: 'Nutrition', icon: NutritionIcon },
  { to: '/metrics', label: 'Body', icon: BodyIcon },
  { to: '/progress', label: 'Progress', icon: ChartIcon },
  { to: '/sessions', label: 'Sessions', icon: SessionsIcon },
]

export default function NavBar() {
  return (
    <>
      {/* ── Desktop sidebar ─────────────────────────────── */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 flex-col z-50"
        style={{
          background: 'rgba(7,7,15,0.96)',
          borderRight: '1px solid rgba(255,255,255,0.07)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
        }}
      >
        {/* Logo */}
        <div className="px-5 pt-7 pb-6">
          <div className="flex items-center gap-2.5">
            <LogoMark size={28} id="nav" />
            <span className="text-lg font-black gradient-text">Kinetiq</span>
          </div>
        </div>

        {/* Links */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className="block">
              {({ isActive }) => (
                <div
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer"
                  style={
                    isActive
                      ? { background: 'rgba(124,58,237,0.18)', color: '#a78bfa' }
                      : { color: '#71717a' }
                  }
                >
                  <Icon active={isActive} size={20} />
                  <span className="text-sm font-medium">{label}</span>
                </div>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sign out */}
        <div className="px-3 pb-6 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => supabase.auth.signOut()}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            <SignOutIcon />
            Sign out
          </button>
        </div>
      </aside>

      {/* ── Mobile bottom pill ──────────────────────────── */}
      <nav className="md:hidden fixed bottom-4 left-0 right-0 px-4 z-50">
        <div
          className="w-full max-w-lg mx-auto flex items-center rounded-2xl px-2 py-1.5"
          style={{
            background: 'rgba(10,10,18,0.94)',
            border: '1px solid rgba(255,255,255,0.09)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.7), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
          }}
        >
          {links.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === '/'} className="flex-1">
              {({ isActive }) => (
                <div
                  className="flex flex-col items-center gap-1 py-2 rounded-xl transition-all duration-200"
                  style={isActive ? { background: 'rgba(124,58,237,0.18)' } : {}}
                >
                  <Icon active={isActive} size={22} />
                  <span
                    className="font-semibold transition-colors duration-200 leading-none"
                    style={{ fontSize: '10px', color: isActive ? '#a78bfa' : '#71717a' }}
                  >
                    {label}
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

function HomeIcon({ active, size = 22 }) {
  return (
    <svg width={size} height={size} fill="none" stroke={active ? '#a78bfa' : 'currentColor'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function DumbbellIcon({ active, size = 22 }) {
  const c = active ? '#a78bfa' : 'currentColor'
  const s = size / 24
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="10.5" width="3.5" height="3" rx="0.75" fill={c} />
      <rect x="5.5" y="8.5" width="2.5" height="7" rx="0.75" fill={c} />
      <rect x="16" y="8.5" width="2.5" height="7" rx="0.75" fill={c} />
      <rect x="18.5" y="10.5" width="3.5" height="3" rx="0.75" fill={c} />
      <rect x="8" y="11.25" width="8" height="1.5" rx="0.75" fill={c} />
    </svg>
  )
}

function NutritionIcon({ active, size = 22 }) {
  return (
    <svg width={size} height={size} fill="none" stroke={active ? '#a78bfa' : 'currentColor'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4v7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v7M7 3v7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3c0 0 4 2 4 9H15V3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 12v9" />
    </svg>
  )
}

function BodyIcon({ active, size = 22 }) {
  return (
    <svg width={size} height={size} fill="none" stroke={active ? '#a78bfa' : 'currentColor'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <circle cx="12" cy="5.5" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 9.5C8 9 10 8.5 12 8.5s4 .5 5.5 1m-11 0L5 15l3 1.5.5 4h7l.5-4L19 15l-1.5-5.5" />
    </svg>
  )
}

function ChartIcon({ active, size = 22 }) {
  return (
    <svg width={size} height={size} fill="none" stroke={active ? '#a78bfa' : 'currentColor'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l4-5 4 3 4-6" />
    </svg>
  )
}

function SessionsIcon({ active, size = 22 }) {
  return (
    <svg width={size} height={size} fill="none" stroke={active ? '#a78bfa' : 'currentColor'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M8 4v4M16 4v4M3 10h18" />
      <path strokeLinecap="round" d="M8 14h4M8 17h6" />
    </svg>
  )
}

function SignOutIcon() {
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
    </svg>
  )
}
