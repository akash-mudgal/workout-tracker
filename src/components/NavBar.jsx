import { NavLink } from 'react-router-dom'

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
    <nav className="fixed bottom-4 left-0 right-0 px-4 z-50">
      <div
        className="w-full max-w-lg mx-auto flex items-center rounded-2xl px-2 py-1.5"
        style={{
          background: 'rgba(10, 10, 18, 0.94)',
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
                style={isActive ? { background: 'rgba(124, 58, 237, 0.18)' } : {}}
              >
                <Icon active={isActive} />
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
  )
}

function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" fill="none" stroke={active ? '#a78bfa' : '#71717a'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955a1.126 1.126 0 011.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
    </svg>
  )
}

function DumbbellIcon({ active }) {
  const c = active ? '#a78bfa' : '#71717a'
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="2" y="10.5" width="3.5" height="3" rx="0.75" fill={c} />
      <rect x="5.5" y="8.5" width="2.5" height="7" rx="0.75" fill={c} />
      <rect x="16" y="8.5" width="2.5" height="7" rx="0.75" fill={c} />
      <rect x="18.5" y="10.5" width="3.5" height="3" rx="0.75" fill={c} />
      <rect x="8" y="11.25" width="8" height="1.5" rx="0.75" fill={c} />
    </svg>
  )
}

function NutritionIcon({ active }) {
  return (
    <svg width="22" height="22" fill="none" stroke={active ? '#a78bfa' : '#71717a'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v7a4 4 0 004 4v7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 3v7M7 3v7" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 3c0 0 4 2 4 9H15V3z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 12v9" />
    </svg>
  )
}

function BodyIcon({ active }) {
  return (
    <svg width="22" height="22" fill="none" stroke={active ? '#a78bfa' : '#71717a'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <circle cx="12" cy="5.5" r="2.5" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.5 9.5C8 9 10 8.5 12 8.5s4 .5 5.5 1m-11 0L5 15l3 1.5.5 4h7l.5-4L19 15l-1.5-5.5" />
    </svg>
  )
}

function ChartIcon({ active }) {
  return (
    <svg width="22" height="22" fill="none" stroke={active ? '#a78bfa' : '#71717a'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l4-5 4 3 4-6" />
    </svg>
  )
}

function SessionsIcon({ active }) {
  return (
    <svg width="22" height="22" fill="none" stroke={active ? '#a78bfa' : '#71717a'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path strokeLinecap="round" d="M8 4v4M16 4v4M3 10h18" />
      <path strokeLinecap="round" d="M8 14h4M8 17h6" />
    </svg>
  )
}
