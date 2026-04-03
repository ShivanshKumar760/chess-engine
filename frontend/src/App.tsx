import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import AuthPage from './pages/AuthPage'
import HomePage from './pages/HomePage'
import GamePage from './pages/GamePage'
import LeaderboardPage from './pages/LeaderboardPage'
import HistoryPage from './pages/HistoryPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p>Loading...</p>
      </div>
    )
  }

  if (!user) return <Navigate to="/auth" replace />
  return <>{children}</>
}

function AppRoutes() {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p>Preparing the board...</p>
      </div>
    )
  }

  return (
    <div className="app-layout">
      {user && <Navbar />}
      <main className={user ? 'main-content' : ''}>
        <Routes>
          <Route
            path="/auth"
            element={user ? <Navigate to="/" replace /> : <AuthPage />}
          />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/game/:gameId"
            element={
              <ProtectedRoute>
                <GamePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <ProtectedRoute>
                <LeaderboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <HistoryPage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#302e2b',
            color: '#fff',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '10px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
        }}
      />
    </AuthProvider>
  )
}
