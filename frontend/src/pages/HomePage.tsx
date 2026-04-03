import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { createGame, joinGame } from '../services/api'
import toast from 'react-hot-toast'

export default function HomePage() {
  const { user, token } = useAuth()
  const navigate = useNavigate()
  const [joinId, setJoinId] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)

  const handleCreate = async () => {
    if (!token) return
    setCreating(true)
    try {
      const data = await createGame(token)
      toast.success(`Game created! ID: ${data.gameId}`)
      navigate(`/game/${data.gameId}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token || !joinId.trim()) return
    setJoining(true)
    try {
      await joinGame(token, joinId.trim().toUpperCase())
      toast.success('Joined the game!')
      navigate(`/game/${joinId.trim().toUpperCase()}`)
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="home-page">
      <div className="home-hero">
        <h1>Welcome, {user?.username}! ♟️</h1>
        <p>Create a new game or join a friend's match using a game code</p>
      </div>

      {/* Create Game Card */}
      <div className="card action-card" onClick={!creating ? handleCreate : undefined}>
        <span className="action-icon">⚔️</span>
        <h3>New Game</h3>
        <p>Create a game and share the code with a friend</p>
        <button
          id="create-game-btn"
          className="btn btn-primary"
          style={{ marginTop: 16 }}
          disabled={creating}
          onClick={(e) => { e.stopPropagation(); handleCreate() }}
        >
          {creating ? 'Creating...' : 'Create Game'}
        </button>
      </div>

      {/* Join Game Card */}
      <div >
        <span className="action-icon">🤝</span>
        <h3>Join Game</h3>
        <p>Enter a game code shared by your friend</p>
        <form className="join-form" onSubmit={handleJoin}>
          <input
            id="join-game-input"
            className="form-input"
            type="text"
            placeholder="GAME ID"
            value={joinId}
            onChange={(e) => setJoinId(e.target.value)}
            maxLength={6}
            style={{ flex: 1 }}
          />
          <button
            className="btn btn-primary"
            type="submit"
            disabled={joining || !joinId.trim()}
          >
            {joining ? '...' : 'Join'}
          </button>
        </form>
      </div>

      {/* Quick Links */}
      <div className="card action-card" onClick={() => navigate('/leaderboard')}>
        <span className="action-icon">🏆</span>
        <h3>Leaderboard</h3>
        <p>See top players and rankings</p>
      </div>

      <div className="card action-card" onClick={() => navigate('/history')}>
        <span className="action-icon">📜</span>
        <h3>Game History</h3>
        <p>Review your past games</p>
      </div>
    </div>
  )
}