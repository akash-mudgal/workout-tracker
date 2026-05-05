import { Routes, Route, Navigate } from 'react-router-dom'
import { StoreProvider, useStore } from './store.jsx'
import { supabase } from './lib/supabase'
import AuthGate from './components/AuthGate'
import NavBar from './components/NavBar'
import Dashboard from './pages/Dashboard'
import WorkoutLogger from './pages/WorkoutLogger'
import Progress from './pages/Progress'
import NutritionPage from './pages/NutritionPage'
import BodyMetrics from './pages/BodyMetrics'
import SessionsPage from './pages/SessionsPage'

export default function App() {
  return (
    <StoreProvider>
      <AppInner />
    </StoreProvider>
  )
}

function AppInner() {
  const { user, authLoading, syncing } = useStore()

  return (
    <AuthGate user={user} loading={authLoading}>
      <div className="flex flex-col min-h-screen max-w-lg mx-auto relative">
        {syncing && (
          <div className="fixed top-2 right-3 z-50 text-xs text-violet-400 animate-pulse">
            syncing…
          </div>
        )}
        <main className="flex-1 pb-24 px-4 pt-6">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/workout" element={<WorkoutLogger />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/metrics" element={<BodyMetrics />} />
            <Route path="/sessions" element={<SessionsPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </main>
        <NavBar />
        <SignOutButton />
      </div>
    </AuthGate>
  )
}

function SignOutButton() {
  const { user } = useStore()
  if (!user) return null
  return (
    <button
      onClick={() => supabase.auth.signOut()}
      className="fixed top-3 right-3 text-xs text-zinc-600 hover:text-zinc-400 transition-colors z-50"
    >
      Sign out
    </button>
  )
}
