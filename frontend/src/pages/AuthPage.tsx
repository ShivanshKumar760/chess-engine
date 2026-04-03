import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { register, login } from '../services/api'
import toast from 'react-hot-toast'

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setAuth } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (tab === 'register') {
        const data = await register(username, email, password)
        setAuth(data.token, data.user)
        toast.success('Welcome to ChessMaster!')
      } else {
        const data = await login(email, password)
        setAuth(data.token, data.user)
        toast.success('Welcome back!')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-logo">
          <div className="auth-logo-icon">♔</div>
          <h1>
            Chess<span>Master</span>
          </h1>
          <p>Play chess online with friends</p>
        </div>

        <div className="auth-card">
          <div className="auth-tabs">
            <button
              className={`auth-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => { setTab('login'); setError('') }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => { setTab('register'); setError('') }}
            >
              Register
            </button>
          </div>

          {error && <div className="auth-error">⚠ {error}</div>}

          <form className="auth-form" onSubmit={handleSubmit}>
            {tab === 'register' && (
              <div className="form-group">
                <label className="form-label">Username</label>
                <input
                  id="register-username"
                  className="form-input"
                  type="text"
                  placeholder="Enter your username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  minLength={3}
                  maxLength={20}
                />
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                id="auth-email"
                className="form-input"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                id="auth-password"
                className="form-input"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button
              id="auth-submit"
              className="btn btn-primary btn-lg auth-submit"
              type="submit"
              disabled={loading}
            >
              {loading ? (
                <span>Loading...</span>
              ) : tab === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
