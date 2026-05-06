import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './store.jsx'
import { useEffect } from 'react'
import { supabase } from './lib/supabase'
import AuthGate from './components/AuthGate'
import OnboardingFlow from './components/OnboardingFlow'
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
  const { user, authLoading, syncing, needsOnboarding, refetchSessionData } = useStore()
  const location = useLocation()

  useEffect(() => {
    if (user) refetchSessionData()
  }, [location.pathname])

  return (
    <AuthGate user={user} loading={authLoading}>
      {needsOnboarding ? (
        <OnboardingFlow />
      ) : (
        <div className="flex min-h-screen">
          <NavBar />

          {/* Main content — offset by sidebar on md+ */}
          <div className="flex-1 flex flex-col min-w-0 md:pl-56">
            {syncing && (
              <div className="fixed top-2 right-3 z-50 text-xs text-violet-400 animate-pulse">
                syncing…
              </div>
            )}

            {/* Mobile sign-out (desktop version lives in sidebar) */}
            <button
              onClick={() => supabase.auth.signOut()}
              className="md:hidden fixed top-3 right-3 text-xs text-zinc-500 hover:text-zinc-300 transition-colors z-50"
            >
              Sign out
            </button>

            <main className="flex-1 pb-28 md:pb-10 px-4 md:px-8 pt-6">
              <div className="max-w-2xl mx-auto">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/workout" element={<WorkoutLogger />} />
                  <Route path="/progress" element={<Progress />} />
                  <Route path="/nutrition" element={<NutritionPage />} />
                  <Route path="/metrics" element={<BodyMetrics />} />
                  <Route path="/sessions" element={<SessionsPage />} />
                  <Route path="*" element={<Navigate to="/" />} />
                </Routes>
              </div>
            </main>
          </div>
        </div>
      )}
    </AuthGate>
  )
}
