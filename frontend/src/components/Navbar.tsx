import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const { user, logout } = useAuth()
  const location = useLocation()

  const isActive = (path: string) =>
    location.pathname === path ? 'navbar-link active' : 'navbar-link'

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">
        <span className="navbar-brand-icon">♔</span>
        <span className="navbar-brand-text">
          Chess<span>Master</span>
        </span>
      </Link>

      <div className="navbar-links">
        <Link to="/" className={isActive('/')}>
          Play
        </Link>
        <Link to="/leaderboard" className={isActive('/leaderboard')}>
          Leaderboard
        </Link>
        <Link to="/history" className={isActive('/history')}>
          History
        </Link>
      </div>

      <div className="navbar-user">
        <span className="navbar-username">{user?.username}</span>
        <div className="navbar-avatar">
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <button className="navbar-link" onClick={logout}>
          Logout
        </button>
      </div>
    </nav>
  )
}
