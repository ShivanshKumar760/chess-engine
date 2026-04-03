import { useState, useEffect } from 'react'
import { getLeaderboard } from '../services/api'

interface LeaderboardEntry {
  rank: number
  username: string
  wins: number
  losses: number
  draws: number
  gamesPlayed: number
  winRate: number
}

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLeaderboard()
      .then((data) => setEntries(data.leaderboard))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const getRankBadge = (rank: number) => {
    if (rank === 1) return 'rank-badge gold'
    if (rank === 2) return 'rank-badge silver'
    if (rank === 3) return 'rank-badge bronze'
    return 'rank-badge default'
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p>Loading leaderboard...</p>
      </div>
    )
  }

  return (
    <div className="leaderboard-page">
      <h1>🏆 Leaderboard</h1>

      <div className="card">
        {entries.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🏆</div>
            <h3>No rankings yet</h3>
            <p>Play some games to appear on the leaderboard!</p>
          </div>
        ) : (
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>Rank</th>
                <th>Player</th>
                <th>W</th>
                <th>L</th>
                <th>D</th>
                <th>Played</th>
                <th>Win Rate</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.username}>
                  <td>
                    <span className={getRankBadge(entry.rank)}>
                      {entry.rank}
                    </span>
                  </td>
                  <td>
                    <div className="player-cell">
                      <div className="avatar">
                        {entry.username.charAt(0).toUpperCase()}
                      </div>
                      <strong>{entry.username}</strong>
                    </div>
                  </td>
                  <td className="stat-wins">{entry.wins}</td>
                  <td className="stat-losses">{entry.losses}</td>
                  <td className="stat-draws">{entry.draws}</td>
                  <td>{entry.gamesPlayed}</td>
                  <td>
                    <span className="win-rate-bar">
                      <span
                        className="win-rate-fill"
                        style={{ width: `${entry.winRate}%` }}
                      />
                    </span>
                    {entry.winRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
