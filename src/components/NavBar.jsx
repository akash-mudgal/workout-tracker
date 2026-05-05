import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Home', icon: HomeIcon },
  { to: '/workout', label: 'Train', icon: DumbbellIcon },
  { to: '/nutrition', label: 'Nutrition', icon: LeafIcon },
  { to: '/metrics', label: 'Body', icon: BodyIcon },
  { to: '/progress', label: 'Progress', icon: ChartIcon },
  { to: '/sessions', label: 'Sessions', icon: SessionsIcon },
]

export default function NavBar() {
  return (
    <nav className="fixed bottom-4 left-0 right-0 px-3 z-50">
      <div
        className="w-full max-w-lg mx-auto flex items-center rounded-2xl px-1 py-1"
        style={{
          background: 'rgba(10, 10, 18, 0.92)',
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.6), 0 0 0 0.5px rgba(255,255,255,0.04) inset',
        }}
      >
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} className="flex-1">
            {({ isActive }) => (
              <div
                className="flex flex-col items-center gap-0.5 py-2 rounded-xl transition-all duration-200"
                style={isActive ? { background: 'rgba(124, 58, 237, 0.15)' } : {}}
              >
                <Icon active={isActive} />
                <span
                  className="font-semibold transition-colors duration-200"
                  style={{ fontSize: '8.5px', color: isActive ? '#a78bfa' : '#52525b' }}
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
    <svg className="w-[18px] h-[18px]" fill="none" stroke={active ? '#a78bfa' : '#52525b'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    </svg>
  )
}

function DumbbellIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke={active ? '#a78bfa' : '#52525b'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h2m0 0v12m0-12h4m0 0v12m0-12h4m0 0v12m0-12h2M4 12h16" />
    </svg>
  )
}

function LeafIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke={active ? '#a78bfa' : '#52525b'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  )
}

function BodyIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke={active ? '#a78bfa' : '#52525b'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  )
}

function ChartIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke={active ? '#a78bfa' : '#52525b'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  )
}

function SessionsIcon({ active }) {
  return (
    <svg className="w-[18px] h-[18px]" fill="none" stroke={active ? '#a78bfa' : '#52525b'} strokeWidth={active ? 2 : 1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  )
}
