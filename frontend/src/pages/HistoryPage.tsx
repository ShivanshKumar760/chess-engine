import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getGameHistory } from '../services/api'

interface GameEntry {
  gameId: string
  whitePlayer: string
  blackPlayer: string | null
  status: string
  winner: string | null
  createdAt: string
}

export default function HistoryPage() {
  const { token, user } = useAuth()
  const navigate = useNavigate()
  const [games, setGames] = useState<GameEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!token) return
    getGameHistory(token)
      .then((data) => setGames(data.games))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [token])

  const getResult = (game: GameEntry) => {
    if (game.status !== 'completed') return null
    if (game.winner === 'draw') return 'draw'
    if (game.winner === user?.username) return 'win'
    return 'loss'
  }

  const getResultEmoji = (result: string | null) => {
    if (result === 'win') return '🏆'
    if (result === 'loss') return '😔'
    if (result === 'draw') return '🤝'
    return '⏳'
  }

  const getResultLabel = (result: string | null) => {
    if (result === 'win') return 'Victory'
    if (result === 'loss') return 'Defeat'
    if (result === 'draw') return 'Draw'
    return 'In Progress'
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p>Loading history...</p>
      </div>
    )
  }

  return (
    <div className="history-page">
      <h1>📜 Game History</h1>

      {games.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">📜</div>
            <h3>No games yet</h3>
            <p>Start a new game to see your history here!</p>
          </div>
        </div>
      ) : (
        <div className="history-list">
          {games.map((game) => {
            const result = getResult(game)
            return (
              <div
                key={game.gameId}
                className="history-item"
                onClick={() => navigate(`/game/${game.gameId}`)}
              >
                <span className="history-result">
                  {getResultEmoji(result)}
                </span>
                <div className="history-players">
                  <strong>{game.whitePlayer}</strong>
                  <span> vs </span>
                  <strong>{game.blackPlayer || '—'}</strong>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                    Game #{game.gameId}
                  </div>
                </div>
                <span className={`history-winner ${result || ''}`}>
                  {getResultLabel(result)}
                </span>
                <span className="history-date">
                  {formatDate(game.createdAt)}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
