import React, { useState, useEffect } from 'react'
import useNakama from './hooks/useNakama'
import LoginScreen from './components/LoginScreen'
import LobbyScreen from './components/LobbyScreen'
import GameScreen from './components/GameScreen'
import LeaderboardScreen from './components/LeaderboardScreen'

export default function App() {
  const nakama = useNakama()
  const [screen, setScreen] = useState('login')

  // Only go to game when BOTH players are present (playing), not just waiting
  useEffect(() => {
    if (nakama.status === 'playing' || (nakama.status === 'waiting' && nakama.players.length >= 2)) {
      setScreen('game')
    }
  }, [nakama.status, nakama.players])

  const handleLogin = async (username) => {
    await nakama.login(username)
    setScreen('lobby')
  }

  const handleLeave = async () => {
    await nakama.leaveMatch()
    setScreen('lobby')
  }

  const isInMatch = nakama.status === 'waiting' || nakama.status === 'playing' || nakama.status === 'finished'

  return (
    <div style={appStyles.root}>
      {/* Top nav */}
      {nakama.session && (
        <nav style={appStyles.nav}>
          {/* Logo */}
          <div style={appStyles.logo}>
            <svg viewBox="0 0 36 36" width="22" height="22" style={{ marginRight: 8, flexShrink: 0 }}>
              <line x1="3" y1="3" x2="33" y2="33" stroke="#ff4466" strokeWidth="4" strokeLinecap="round"/>
              <line x1="33" y1="3" x2="3" y2="33" stroke="#ff4466" strokeWidth="4" strokeLinecap="round"/>
            </svg>
            <svg viewBox="0 0 36 36" width="22" height="22" style={{ marginRight: 10, flexShrink: 0 }}>
              <circle cx="18" cy="18" r="13" fill="none" stroke="#00d4ff" strokeWidth="4"/>
            </svg>
            <span style={appStyles.logoText}>TIC TAC TOE</span>
          </div>

          {/* Center — match indicator */}
          {isInMatch && (
            <div style={appStyles.matchPill}>
              <span style={{ animation: 'pulse 1.5s infinite', marginRight: 6 }}>●</span>
              {nakama.status === 'waiting' ? 'ROOM OPEN' : nakama.status === 'playing' ? 'IN MATCH' : 'FINISHED'}
            </div>
          )}

          {/* Right nav */}
          <div style={appStyles.navRight}>
            <span style={appStyles.username}>{nakama.session.username}</span>

            <button
              style={{ ...appStyles.navBtn, ...(screen === 'lobby' ? appStyles.navBtnActive : {}) }}
              onClick={() => setScreen('lobby')}
            >
              LOBBY
            </button>

            {(screen === 'game' || isInMatch) && (
              <button
                style={{ ...appStyles.navBtn, color: 'var(--amber)', borderColor: 'rgba(245,166,35,0.4)' }}
                onClick={() => setScreen('game')}
              >
                GAME
              </button>
            )}

            <button
              style={{ ...appStyles.navBtn, ...(screen === 'leaderboard' ? appStyles.navBtnActive : {}) }}
              onClick={() => setScreen('leaderboard')}
            >
              SCORES
            </button>
          </div>
        </nav>
      )}

      {/* Thin accent line */}
      {nakama.session && <div style={appStyles.accentLine} />}

      {/* Content */}
      <div style={appStyles.content}>
        {screen === 'login' && (
          <LoginScreen onLogin={handleLogin} error={nakama.error} loading={nakama.loading} />
        )}

        {screen === 'lobby' && nakama.session && (
          <LobbyScreen nakama={nakama} />
        )}

        {screen === 'game' && (
          <GameScreen
            gameState={nakama.gameState}
            players={nakama.players}
            myPresence={nakama.myPresence}
            makeMove={nakama.makeMove}
            leaveMatch={handleLeave}
            matchId={nakama.matchId}
            createdRoomId={nakama.createdRoomId}
          />
        )}

        {screen === 'leaderboard' && nakama.session && (
          <LeaderboardScreen
            getLeaderboard={nakama.getLeaderboard}
            myUserId={nakama.session.user_id}
          />
        )}
      </div>
    </div>
  )
}

const appStyles = {
  root: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    background: 'var(--bg)',
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 20px',
    height: 52,
    background: 'var(--bg2)',
    borderBottom: '1px solid var(--border)',
    gap: 12,
    position: 'sticky',
    top: 0,
    zIndex: 100,
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: 'var(--font-head)',
    fontSize: 13,
    letterSpacing: 4,
    color: 'var(--text-bright)',
  },
  matchPill: {
    display: 'flex',
    alignItems: 'center',
    fontSize: 10,
    letterSpacing: 2,
    color: 'var(--green)',
    padding: '4px 10px',
    border: '1px solid rgba(0,255,136,0.25)',
    background: 'rgba(0,255,136,0.05)',
    marginLeft: 'auto',
  },
  navRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginLeft: 'auto',
  },
  username: {
    fontSize: 11,
    letterSpacing: 2,
    color: 'var(--amber)',
    padding: '3px 8px',
    border: '1px solid var(--amber-dim)',
    marginRight: 4,
    fontFamily: 'var(--font-mono)',
  },
  navBtn: {
    background: 'transparent',
    border: '1px solid transparent',
    color: 'var(--text-dim)',
    fontSize: 11,
    letterSpacing: 2,
    padding: '5px 10px',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
    transition: 'all 0.15s',
  },
  navBtnActive: {
    color: 'var(--cyan)',
    borderColor: 'rgba(0,212,255,0.3)',
    background: 'rgba(0,212,255,0.05)',
  },
  accentLine: {
    height: 2,
    background: 'linear-gradient(90deg, var(--red) 0%, var(--amber) 33%, var(--cyan) 66%, var(--green) 100%)',
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
}
