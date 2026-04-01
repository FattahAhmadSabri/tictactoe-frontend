import React, { useState, useEffect, useRef } from 'react'

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
]

function getWinningCells(board) {
  for (const line of WIN_LINES) {
    const [a, b, c] = line
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return line
  }
  return []
}

// Animated X symbol
function XMark({ winning }) {
  return (
    <svg viewBox="0 0 60 60" width="52" height="52" style={{ animation: 'popIn 0.25s cubic-bezier(.175,.885,.32,1.275)' }}>
      <line x1="8" y1="8" x2="52" y2="52"
        stroke={winning ? '#f5a623' : '#ff4466'} strokeWidth="6" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 ${winning ? 10 : 5}px ${winning ? '#f5a623' : '#ff4466'})` }}
      />
      <line x1="52" y1="8" x2="8" y2="52"
        stroke={winning ? '#f5a623' : '#ff4466'} strokeWidth="6" strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 ${winning ? 10 : 5}px ${winning ? '#f5a623' : '#ff4466'})` }}
      />
    </svg>
  )
}

// Animated O symbol
function OMark({ winning }) {
  return (
    <svg viewBox="0 0 60 60" width="52" height="52" style={{ animation: 'popIn 0.25s cubic-bezier(.175,.885,.32,1.275)' }}>
      <circle cx="30" cy="30" r="20"
        fill="none" stroke={winning ? '#f5a623' : '#00d4ff'} strokeWidth="6"
        style={{ filter: `drop-shadow(0 0 ${winning ? 10 : 5}px ${winning ? '#f5a623' : '#00d4ff'})` }}
      />
    </svg>
  )
}

// Ghost preview mark
function GhostMark({ symbol }) {
  if (symbol === 'X') return (
    <svg viewBox="0 0 60 60" width="44" height="44" style={{ opacity: 0.15 }}>
      <line x1="10" y1="10" x2="50" y2="50" stroke="#ff4466" strokeWidth="5" strokeLinecap="round" />
      <line x1="50" y1="10" x2="10" y2="50" stroke="#ff4466" strokeWidth="5" strokeLinecap="round" />
    </svg>
  )
  return (
    <svg viewBox="0 0 60 60" width="44" height="44" style={{ opacity: 0.15 }}>
      <circle cx="30" cy="30" r="18" fill="none" stroke="#00d4ff" strokeWidth="5" />
    </svg>
  )
}

function Cell({ value, index, clickable, isWin, onClick, mySymbol }) {
  const [hover, setHover] = useState(false)

  const bg = isWin
    ? 'rgba(245,166,35,0.08)'
    : hover && clickable
    ? value === '' && mySymbol === 'X' ? 'rgba(255,68,102,0.06)' : 'rgba(0,212,255,0.06)'
    : 'var(--bg2)'

  const border = isWin
    ? '2px solid var(--amber)'
    : hover && clickable
    ? mySymbol === 'X' ? '2px solid rgba(255,68,102,0.5)' : '2px solid rgba(0,212,255,0.5)'
    : '2px solid var(--border)'

  return (
    <div
      onClick={() => clickable && onClick(index)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: '100%',
        aspectRatio: '1',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: bg,
        border,
        cursor: clickable ? 'pointer' : 'default',
        transition: 'all 0.12s ease',
        transform: isWin ? 'scale(1.04)' : 'scale(1)',
        boxShadow: isWin ? 'var(--glow-amber)' : 'none',
        animation: isWin ? 'winPulse 1.5s infinite' : 'none',
        position: 'relative',
      }}
    >
      {value === 'X' && <XMark winning={isWin} />}
      {value === 'O' && <OMark winning={isWin} />}
      {!value && hover && clickable && <GhostMark symbol={mySymbol} />}
    </div>
  )
}

export default function GameScreen({ gameState, players, myPresence, makeMove, leaveMatch, matchId, createdRoomId }) {
  const { board, turn, winner, draw } = gameState
  const [copied, setCopied] = useState(false)
  const [resultShown, setResultShown] = useState(false)

  const myIndex = players.findIndex(p => p.user_id === myPresence?.user_id)
  const mySymbol = myIndex === 0 ? 'X' : myIndex === 1 ? 'O' : null
  const isMyTurn = myIndex !== -1 && !winner && !draw && turn === myIndex + 1
  const gameOver = !!winner || draw
  const winningCells = winner ? getWinningCells(board) : []

  // winner is a user_id string from backend
  const winnerIndex = players.findIndex(p => p.user_id === winner)
  const winnerSymbol = winnerIndex === 0 ? "X" : winnerIndex === 1 ? "O" : null
  const winnerName = winner ? (players[winnerIndex]?.username || `P${winnerIndex + 1}`) : null
  const isIWon = winner && myPresence?.user_id === winner
  const isILost = winner && myPresence?.user_id && myPresence.user_id !== winner

  const roomId = createdRoomId || matchId
  const waitingForOpponent = players.length < 2

  useEffect(() => {
    if (gameOver) setResultShown(true)
  }, [gameOver])

  const handleCopy = () => {
    if (!roomId) return
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  // Player name bar at top
  const p1 = players[0]?.username || (myIndex === 0 ? myPresence?.username : null) || 'PLAYER_1'
  const p2 = players[1]?.username || (waitingForOpponent ? '???' : 'PLAYER_2')

  return (
    <div style={styles.wrap}>

      {/* Players header */}
      <div style={styles.playersBar}>
        {/* Player 1 */}
        <div style={{
          ...styles.playerSlot,
          borderColor: turn === 1 && !gameOver ? 'var(--red)' : 'var(--border)',
          boxShadow: turn === 1 && !gameOver ? 'var(--glow-red)' : 'none',
          background: turn === 1 && !gameOver ? 'rgba(255,68,102,0.06)' : 'var(--bg2)',
        }}>
          <svg viewBox="0 0 40 40" width="28" height="28">
            <line x1="5" y1="5" x2="35" y2="35" stroke="#ff4466" strokeWidth="5" strokeLinecap="round"/>
            <line x1="35" y1="5" x2="5" y2="35" stroke="#ff4466" strokeWidth="5" strokeLinecap="round"/>
          </svg>
          <div>
            <div style={{ fontSize: 13, letterSpacing: 2, color: 'var(--text-bright)' }}>{p1}</div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>
              {myIndex === 0 ? 'YOU' : 'OPPONENT'}
            </div>
          </div>
          {winnerSymbol === 'X' && <span style={{ ...styles.winTag, color: 'var(--amber)', borderColor: 'var(--amber)' }}>WIN</span>}
        </div>

        {/* VS */}
        <div style={styles.vsBlock}>
          <div style={styles.vsText}>VS</div>
          {!gameOver && (
            <div style={{ fontSize: 9, color: 'var(--text-dim)', letterSpacing: 1, textAlign: 'center' }}>
              TURN {turn}/—
            </div>
          )}
        </div>

        {/* Player 2 */}
        <div style={{
          ...styles.playerSlot,
          borderColor: turn === 2 && !gameOver ? 'var(--cyan)' : 'var(--border)',
          boxShadow: turn === 2 && !gameOver ? 'var(--glow-cyan)' : 'none',
          background: turn === 2 && !gameOver ? 'rgba(0,212,255,0.06)' : 'var(--bg2)',
        }}>
          {waitingForOpponent ? (
            <div style={{ fontSize: 20, animation: 'pulse 1.5s infinite' }}>⏳</div>
          ) : (
            <svg viewBox="0 0 40 40" width="28" height="28">
              <circle cx="20" cy="20" r="14" fill="none" stroke="#00d4ff" strokeWidth="5"/>
            </svg>
          )}
          <div>
            <div style={{ fontSize: 13, letterSpacing: 2, color: waitingForOpponent ? 'var(--text-dim)' : 'var(--text-bright)' }}>
              {p2}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-dim)', letterSpacing: 1 }}>
              {waitingForOpponent ? 'WAITING...' : myIndex === 1 ? 'YOU' : 'OPPONENT'}
            </div>
          </div>
          {winnerSymbol === 'O' && <span style={{ ...styles.winTag, color: 'var(--amber)', borderColor: 'var(--amber)' }}>WIN</span>}
        </div>
      </div>

      {/* Room ID banner — only while waiting */}
      {waitingForOpponent && roomId && (
        <div style={styles.roomBanner}>
          <span style={{ color: 'var(--cyan)', fontSize: 10, letterSpacing: 2 }}>🔗 SHARE ROOM ID</span>
          <div style={styles.roomRow}>
            <span style={styles.roomIdText}>{roomId}</span>
            <button style={{ ...styles.copyBtn, ...(copied ? styles.copyDone : {}) }} onClick={handleCopy}>
              {copied ? '✓' : 'COPY'}
            </button>
          </div>
        </div>
      )}

      {/* Status bar */}
      {!gameOver && (
        <div style={{
          ...styles.statusBar,
          borderColor: isMyTurn ? (mySymbol === 'X' ? 'rgba(255,68,102,0.5)' : 'rgba(0,212,255,0.5)') : 'var(--border)',
          color: waitingForOpponent ? 'var(--text-dim)' : isMyTurn ? (mySymbol === 'X' ? 'var(--red)' : 'var(--cyan)') : 'var(--text-dim)',
        }}>
          {waitingForOpponent
            ? <><span style={{ animation: 'pulse 1.5s infinite' }}>◌</span> waiting for opponent to join...</>
            : isMyTurn
            ? <><span style={{ animation: 'blink 0.8s infinite' }}>▶</span> YOUR TURN — PLACE {mySymbol}</>
            : <><span>◻</span> OPPONENT IS THINKING...</>
          }
        </div>
      )}

      {/* Result banner */}
      {gameOver && (
        <div style={{
          ...styles.resultBanner,
          borderColor: draw ? 'var(--amber-dim)' : isIWon ? 'var(--green)' : 'var(--red)',
          background: draw
            ? 'rgba(245,166,35,0.06)'
            : isIWon
            ? 'rgba(0,255,136,0.06)'
            : 'rgba(255,68,102,0.06)',
          animation: 'scanIn 0.4s ease',
        }}>
          <div style={{ fontSize: 32, marginBottom: 4 }}>
            {draw ? '🤝' : isIWon ? '🏆' : isILost ? '💀' : '🏆'}
          </div>
          <div style={{
            fontFamily: 'var(--font-head)',
            fontSize: 22,
            letterSpacing: 4,
            color: draw ? 'var(--amber)' : isIWon ? 'var(--green)' : 'var(--red)',
            textShadow: draw
              ? 'var(--glow-amber)'
              : isIWon
              ? 'var(--glow-green)'
              : 'var(--glow-red)',
          }}>
            {draw ? 'DRAW' : isIWon ? 'YOU WIN' : isILost ? 'YOU LOSE' : `${winnerName} WINS`}
          </div>
          {!draw && (
            <div style={{ fontSize: 11, color: 'var(--text-dim)', letterSpacing: 2, marginTop: 4 }}>
              {winnerName} ({winnerSymbol}) takes the round
            </div>
          )}
        </div>
      )}

      {/* Board */}
      <div style={styles.boardWrap}>
        {/* Corner decorations */}
        <div style={{ ...styles.corner, top: -1, left: -1 }} />
        <div style={{ ...styles.corner, top: -1, right: -1, transform: 'rotate(90deg)' }} />
        <div style={{ ...styles.corner, bottom: -1, left: -1, transform: 'rotate(270deg)' }} />
        <div style={{ ...styles.corner, bottom: -1, right: -1, transform: 'rotate(180deg)' }} />

        <div style={styles.board}>
          {board.map((cell, i) => (
            <Cell
              key={i}
              value={cell}
              index={i}
              clickable={!cell && !gameOver && isMyTurn}
              isWin={winningCells.includes(i)}
              onClick={makeMove}
              mySymbol={mySymbol}
            />
          ))}
        </div>
      </div>

      {/* Who am I */}
      {mySymbol && (
        <div style={styles.identity}>
          <span style={{ color: 'var(--text-dim)' }}>YOU ARE</span>
          <span style={{ color: 'var(--border2)', margin: '0 8px' }}>//</span>
          <span style={{
            color: mySymbol === 'X' ? 'var(--red)' : 'var(--cyan)',
            fontFamily: 'var(--font-head)',
            letterSpacing: 3,
          }}>
            {mySymbol}
          </span>
          <span style={{ color: 'var(--border2)', margin: '0 8px' }}>//</span>
          <span style={{ color: 'var(--text-dim)' }}>PLAYER {myIndex + 1}</span>
        </div>
      )}

      {/* Leave button */}
      <button style={styles.leaveBtn} onClick={leaveMatch}>
        {gameOver ? '← BACK TO LOBBY' : '✕ FORFEIT MATCH'}
      </button>
    </div>
  )
}

const styles = {
  wrap: {
    maxWidth: 500,
    margin: '0 auto',
    padding: '24px 16px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 16,
    animation: 'slideUp 0.4s ease',
  },
  playersBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
  },
  playerSlot: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    border: '1px solid',
    transition: 'all 0.25s ease',
    position: 'relative',
    minWidth: 0,
  },
  winTag: {
    position: 'absolute',
    top: -10,
    right: 8,
    fontSize: 9,
    letterSpacing: 2,
    padding: '2px 6px',
    border: '1px solid',
    background: 'var(--bg)',
    fontFamily: 'var(--font-head)',
  },
  vsBlock: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    flexShrink: 0,
  },
  vsText: {
    fontFamily: 'var(--font-head)',
    fontSize: 16,
    color: 'var(--text-dim)',
    letterSpacing: 3,
  },
  roomBanner: {
    width: '100%',
    border: '1px solid rgba(0,212,255,0.3)',
    background: 'rgba(0,212,255,0.04)',
    padding: '14px 16px',
    animation: 'slideUp 0.3s ease',
  },
  roomRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  roomIdText: {
    flex: 1,
    fontSize: 'clamp(9px, 1.4vw, 11px)',
    color: 'var(--amber)',
    wordBreak: 'break-all',
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1,
    lineHeight: 1.6,
    padding: '6px 8px',
    background: 'var(--bg)',
    border: '1px solid var(--border)',
  },
  copyBtn: {
    padding: '8px 12px',
    background: 'transparent',
    border: '1px solid var(--cyan)',
    color: 'var(--cyan)',
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    flexShrink: 0,
    transition: 'all 0.15s',
  },
  copyDone: {
    background: 'var(--green)',
    borderColor: 'var(--green)',
    color: 'var(--bg)',
  },
  statusBar: {
    width: '100%',
    padding: '10px 16px',
    border: '1px solid',
    background: 'var(--bg2)',
    fontSize: 12,
    letterSpacing: 2,
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    transition: 'all 0.3s ease',
  },
  resultBanner: {
    width: '100%',
    padding: '20px',
    border: '1px solid',
    textAlign: 'center',
  },
  boardWrap: {
    position: 'relative',
    width: '100%',
    maxWidth: 380,
    padding: 8,
  },
  corner: {
    position: 'absolute',
    width: 12, height: 12,
    borderTop: '2px solid var(--amber)',
    borderLeft: '2px solid var(--amber)',
    zIndex: 1,
  },
  board: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 8,
    padding: 8,
    background: 'var(--bg)',
    border: '1px solid var(--border)',
  },
  identity: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 11,
    letterSpacing: 2,
    color: 'var(--text-dim)',
  },
  leaveBtn: {
    marginTop: 4,
    padding: '11px 28px',
    background: 'transparent',
    border: '1px solid var(--border2)',
    color: 'var(--text-dim)',
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
}
