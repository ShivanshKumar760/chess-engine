import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { Chessboard } from 'react-chessboard'
import { Chess, Square } from 'chess.js'
import { useAuth } from '../context/AuthContext'
import { getGameDetails, createGameSocket } from '../services/api'
import toast from 'react-hot-toast'

interface MoveEntry {
  white: string
  black?: string
}

export default function GamePage() {
  const { gameId } = useParams<{ gameId: string }>()
  const { user, token } = useAuth()
  const [game, setGame] = useState(new Chess())
  const [gameData, setGameData] = useState<any>(null)
  const [myColor, setMyColor] = useState<'w' | 'b'>('w')
  const [moveHistory, setMoveHistory] = useState<MoveEntry[]>([])
  const [gameOver, setGameOver] = useState(false)
  const [gameOverMessage, setGameOverMessage] = useState('')
  const [connected, setConnected] = useState(false)
  const [loading, setLoading] = useState(true)
  const wsRef = useRef<WebSocket | null>(null)
  const gameRef = useRef(game)
  const pendingFenRef = useRef<string | null>(null)

  useEffect(() => {
    gameRef.current = game
  }, [game])

  const buildMoveHistory = useCallback((chess: Chess) => {
    const history = chess.history()
    const entries: MoveEntry[] = []
    for (let i = 0; i < history.length; i += 2) {
      entries.push({ white: history[i], black: history[i + 1] })
    }
    setMoveHistory(entries)
  }, [])

  // Load game data
  useEffect(() => {
    if (!token || !gameId) return
    getGameDetails(token, gameId)
      .then((data) => {
        setGameData(data)
        if (data.whitePlayer === user?.username) {
          setMyColor('w')
        } else {
          setMyColor('b')
        }
        setLoading(false)
      })
      .catch((err) => {
        toast.error(err.message)
        setLoading(false)
      })
  }, [token, gameId, user])

  // WebSocket connection — only after game data is confirmed loaded
  useEffect(() => {
    if (!token || !gameId || loading || !gameData) return

    const ws = createGameSocket(token)
    wsRef.current = ws

    ws.onopen = () => {
      setConnected(true)
      ws.send(JSON.stringify({ type: 'JOIN', gameId }))
    }

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)

      if (data.type === 'AUTH_SUCCESS') {
        console.log('WebSocket authenticated as', data.username)
      }

      if (data.type === 'JOINED') {
        setMyColor(data.color === 'w' ? 'w' : 'b')
        toast.success(`Playing as ${data.color === 'w' ? 'White' : 'Black'}`)
      }

      if (data.type === 'GAME_UPDATE') {
        pendingFenRef.current = null
        const newGame = new Chess(data.fen)
        setGame(newGame)
        buildMoveHistory(newGame)
        if (data.gameOver) setGameOver(true)
      }

      if (data.type === 'GAME_OVER') {
        setGameOver(true)
        if (data.winner === 'draw') {
          setGameOverMessage('Game ended in a draw!')
        } else if (data.winner === user?.username) {
          setGameOverMessage('🎉 You won!')
          toast.success('Congratulations! You won! 🎉')
        } else {
          setGameOverMessage(`${data.winner} wins!`)
          toast('Better luck next time!', { icon: '😔' })
        }
      }

      if (data.type === 'ERROR') {
        toast.error(data.message)
        // Roll back optimistic move if server rejected it
        if (pendingFenRef.current) {
          const rolledBack = new Chess(pendingFenRef.current)
          setGame(rolledBack)
          buildMoveHistory(rolledBack)
          pendingFenRef.current = null
        }
      }
    }

    ws.onclose = () => setConnected(false)
    ws.onerror = () => toast.error('Connection error')

    return () => ws.close()
  }, [token, gameId, loading, gameData, user, buildMoveHistory])

  const onDrop = (sourceSquare: Square, targetSquare: Square): boolean => {
    if (gameRef.current.turn() !== myColor) {
      toast('Not your turn!', { icon: '⏳' })
      return false
    }

    if (gameOver) return false

    const preMovefen = gameRef.current.fen()
    const gameCopy = new Chess(preMovefen)

    try {
      const move = gameCopy.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: 'q',
      })

      if (!move) return false

      pendingFenRef.current = preMovefen
      setGame(gameCopy)
      buildMoveHistory(gameCopy)

      wsRef.current?.send(
        JSON.stringify({
          type: 'MOVE',
          gameId,
          move: { from: sourceSquare, to: targetSquare },
        })
      )

      return true
    } catch {
      return false
    }
  }

  const copyGameId = () => {
    if (gameId) {
      navigator.clipboard.writeText(gameId)
      toast.success('Game ID copied!')
    }
  }

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <p>Loading game...</p>
      </div>
    )
  }

  const whitePlayer = gameData?.whitePlayer || 'Waiting...'
  const blackPlayer = gameData?.blackPlayer || 'Waiting...'
  const isMyTurn = game.turn() === myColor
  const status = gameData?.status || 'waiting'

  return (
    <div className="game-page">
      {/* Left Sidebar */}
      <div className="game-sidebar">
        <div className="card">
          <div className="card-header">
            <h2>⚔️ Game Room</h2>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: connected ? '#81b64c' : '#e85746',
                display: 'inline-block',
              }}
            />
          </div>
          <div className="card-body">
            <div className="game-id-display" onClick={copyGameId} title="Click to copy">
              {gameId}
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', marginTop: 8 }}>
              Click to copy — share with a friend
            </p>
          </div>
        </div>

        <div className={`game-status-banner ${gameOver ? 'completed' : status === 'active' ? 'active' : 'waiting'}`}>
          {gameOver
            ? gameOverMessage || 'Game Over'
            : status === 'waiting'
            ? '⏳ Waiting for opponent...'
            : isMyTurn
            ? '🟢 Your turn!'
            : '⏳ Opponent is thinking...'}
        </div>

        <div className="card">
          <div className="card-header">
            <h2>📋 Moves</h2>
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {game.history().length} moves
            </span>
          </div>
          <div className="card-body move-list">
            {moveHistory.length === 0 ? (
              <div className="empty-state"><p>No moves yet</p></div>
            ) : (
              moveHistory.map((entry, i) => (
                <div className="move-row" key={i}>
                  <span className="move-number">{i + 1}.</span>
                  <span className="move-notation">{entry.white}</span>
                  <span className="move-notation">{entry.black || ''}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Center — Chess Board */}
      <div className="game-board-wrapper">
        <div className={`player-bar ${!isMyTurn && !gameOver ? 'active' : ''}`}>
          <div className={`player-avatar ${myColor === 'w' ? 'black' : 'white'}`}>
            {myColor === 'w' ? blackPlayer.charAt(0).toUpperCase() : whitePlayer.charAt(0).toUpperCase()}
          </div>
          <div className="player-info">
            <div className="player-name">{myColor === 'w' ? blackPlayer : whitePlayer}</div>
            <div className="player-color">{myColor === 'w' ? 'Black' : 'White'}</div>
          </div>
          {!isMyTurn && !gameOver && <div className="turn-indicator" />}
        </div>

        <Chessboard
          id="main-board"
          position={game.fen()}
          onPieceDrop={onDrop}
          boardOrientation={myColor === 'w' ? 'white' : 'black'}
          boardWidth={560}
          customBoardStyle={{ borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}
          customDarkSquareStyle={{ backgroundColor: '#779556' }}
          customLightSquareStyle={{ backgroundColor: '#ebecd0' }}
          customDropSquareStyle={{ boxShadow: 'inset 0 0 1px 6px rgba(255,255,0,0.4)' }}
          animationDuration={200}
        />

        <div className={`player-bar ${isMyTurn && !gameOver ? 'active' : ''}`}>
          <div className={`player-avatar ${myColor === 'w' ? 'white' : 'black'}`}>
            {user?.username?.charAt(0).toUpperCase()}
          </div>
          <div className="player-info">
            <div className="player-name">{user?.username} (You)</div>
            <div className="player-color">{myColor === 'w' ? 'White' : 'Black'}</div>
          </div>
          {isMyTurn && !gameOver && <div className="turn-indicator" />}
        </div>
      </div>

      {/* Right Sidebar */}
      <div className="game-sidebar">
        <div className="card">
          <div className="card-header"><h2>👥 Players</h2></div>
          <div className="card-body">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="player-avatar white" style={{ width: 28, height: 28, fontSize: 13 }}>
                  {whitePlayer.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{whitePlayer}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>White ♔</div>
                </div>
              </div>
              <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-muted)', padding: '4px 0' }}>VS</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="player-avatar black" style={{ width: 28, height: 28, fontSize: 13 }}>
                  {blackPlayer.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>{blackPlayer}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Black ♚</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><h2>ℹ️ Board</h2></div>
          <div className="card-body">
            <div style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
              <div><strong>Turn:</strong> {game.turn() === 'w' ? 'White' : 'Black'}</div>
              <div><strong>Check:</strong> {game.isCheck() ? '⚠️ Yes' : 'No'}</div>
              <div>
                <strong>Status:</strong>{' '}
                {gameOver ? 'Completed' : game.isCheck() ? 'In Check' : 'In Progress'}
              </div>
              <div><strong>Total Moves:</strong> {game.history().length}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}