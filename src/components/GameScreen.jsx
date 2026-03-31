// src/components/GameScreen.jsx
import React, { useRef, useEffect } from 'react'

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
]

function getWinCells(board) {
  for (const [a,b,c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return [a, b, c]
    }
  }
  return []
}

export default function GameScreen({ nakama, onLeave }) {
  const { gameState, players, myPresence, status, makeMove } = nakama
  const prevBoardRef = useRef([])

  const board  = gameState?.board  || ['','','','','','','','','']
  const winner = gameState?.winner
  const draw   = gameState?.draw
  const result = gameState?.result
  const turn   = gameState?.turn

  const myIndex  = players.findIndex(p => p.user_id === myPresence?.user_id)
  const isMyTurn = turn === myIndex + 1
  const mySymbol  = myIndex === 0 ? 'X' : 'O'
  const oppSymbol = myIndex === 0 ? 'O' : 'X'
  const opponent  = players.find(p => p.user_id !== myPresence?.user_id)

  const winCells = winner ? getWinCells(board) : []

  // Detect newly filled cells for pop animation
  const newCells = board.map((cell, i) =>
    cell !== '' && (prevBoardRef.current[i] === '' || prevBoardRef.current[i] === undefined)
  )
  useEffect(() => { prevBoardRef.current = [...board] }, [board])

  const handleClick = (i) => {
    if (!isMyTurn || board[i] !== '' || winner || draw) return
    makeMove(i)
  }

  const getResult = () => {
    if (status === 'finished' && result === 'opponent_left')
      return { emoji: '🏃', text: 'opponent left', cls: 'result-win' }
    if (result === 'win')  return { emoji: '🏆', text: 'you win!', cls: 'result-win' }
    if (result === 'lose') return { emoji: '💀', text: 'you lose',  cls: 'result-lose' }
    if (result === 'draw') return { emoji: '🤝', text: 'draw!',    cls: 'result-draw' }
    return null
  }

  const resultContent = getResult()

  return (
    <div className="game-wrap">

      {/* Player header */}
      <div className="game-header">
        <div className="players-info">
          <div className={`player-tag ${isMyTurn ? 'my-turn' : ''}`}>
            <span className="sym-x">{mySymbol}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              {myPresence?.username || 'you'}
            </span>
          </div>
          <span className="vs-divider">vs</span>
          <div className={`player-tag ${!isMyTurn && status === 'playing' ? 'opp-turn' : ''}`}>
            <span className="sym-o">{oppSymbol}</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
              {opponent?.username || (status === 'waiting' ? 'waiting…' : 'opponent')}
            </span>
          </div>
        </div>
        <button className="btn" style={{ fontSize: '11px', padding: '5px 12px' }} onClick={onLeave}>
          leave
        </button>
      </div>

      {/* Turn indicator */}
      <div className="turn-indicator">
        {status === 'waiting' && (
          <span>waiting for opponent<span className="waiting-dot">...</span></span>
        )}
        {status === 'playing' && !winner && !draw && (
          isMyTurn
            ? <span>your turn — <span className="hl-x">{mySymbol}</span></span>
            : <span>opponent's turn — <span className="hl-o">{oppSymbol}</span></span>
        )}
      </div>

      {/* Board */}
      <div className="board-container">
        <div className="board">
          {board.map((cell, i) => (
            <div
              key={i}
              className={[
                'cell',
                cell === 'X' ? 'x-cell' : '',
                cell === 'O' ? 'o-cell' : '',
                cell !== ''  ? 'filled'  : '',
                winCells.includes(i) ? 'win-cell' : '',
                !isMyTurn && cell === '' ? 'not-my-turn' : '',
                newCells[i] ? 'cell-pop' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => handleClick(i)}
            >
              {cell}
            </div>
          ))}
        </div>

        {/* Result overlay */}
        {resultContent && (
          <div className="result-overlay">
            <div className="result-emoji">{resultContent.emoji}</div>
            <div className={`result-text ${resultContent.cls}`}>{resultContent.text}</div>
            <button className="btn btn-primary" style={{ marginTop: '8px' }} onClick={onLeave}>
              back to lobby
            </button>
          </div>
        )}
      </div>

    </div>
  )
}
