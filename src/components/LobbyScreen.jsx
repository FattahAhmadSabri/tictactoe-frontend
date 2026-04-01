import React, { useState } from 'react'

export default function LobbyScreen({ nakama }) {
  const { findMatch, createRoom, joinRoom, status, error, loading, createdRoomId, matchId } = nakama

  const [joinId, setJoinId] = useState('')
  const [copied, setCopied] = useState(false)
  const [activePanel, setActivePanel] = useState(null) // 'join' | null

  const isWaiting = status === 'waiting'
  const roomId = createdRoomId || matchId

  const handleCreate = async () => {
    setActivePanel(null)
    await createRoom()
  }

  const handleQuickMatch = async () => {
    setActivePanel(null)
    await findMatch()
  }

  const handleJoin = async () => {
    const id = joinId.trim()
    if (!id) return
    setJoinId('')
    setActivePanel(null)
    await joinRoom(id)
  }

  const handleCopy = () => {
    if (!roomId) return
    navigator.clipboard.writeText(roomId).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div style={styles.wrap}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerLine} />
        <span style={styles.headerText}>// MATCH_LOBBY</span>
        <div style={styles.headerLine} />
      </div>

      {/* Status line */}
      <div style={styles.statusBar}>
        <span style={{ color: 'var(--text-dim)', fontSize: 11 }}>STATUS</span>
        <span style={styles.statusDivider}>//</span>
        <span style={{
          fontSize: 12, letterSpacing: 2,
          color: isWaiting ? 'var(--amber)' : loading ? 'var(--cyan)' : 'var(--green)',
          animation: isWaiting || loading ? 'pulse 1.5s infinite' : 'none',
        }}>
          {isWaiting ? '⏳ WAITING FOR OPPONENT' : loading ? '◌ CONNECTING...' : '● ONLINE — READY'}
        </span>
      </div>

      {/* Waiting state: show room ID prominently */}
      {isWaiting && roomId && (
        <div style={styles.roomCard}>
          <div style={styles.roomCardHeader}>
            <span style={{ color: 'var(--cyan)', fontSize: 10, letterSpacing: 3 }}>ROOM ID — SHARE WITH OPPONENT</span>
          </div>
          <div style={styles.roomIdRow}>
            <span style={styles.roomId}>{roomId}</span>
            <button style={{ ...styles.copyBtn, ...(copied ? styles.copyBtnDone : {}) }} onClick={handleCopy}>
              {copied ? '✓ COPIED' : 'COPY'}
            </button>
          </div>
          <div style={styles.roomHint}>
            opponent must paste this ID in "JOIN ROOM" to connect
          </div>
        </div>
      )}

      {/* Action buttons — hide while waiting */}
      {!isWaiting && (
        <div style={styles.actions}>
          {/* Quick match */}
          <button
            style={{ ...styles.actionBtn, borderColor: 'var(--cyan)', color: 'var(--cyan)' }}
            onClick={handleQuickMatch}
            disabled={loading}
          >
            <span style={styles.actionIcon}>⚡</span>
            <div>
              <div style={styles.actionTitle}>QUICK MATCH</div>
              <div style={styles.actionSub}>auto-matchmake with any player</div>
            </div>
          </button>

          {/* Create room */}
          <button
            style={{ ...styles.actionBtn, borderColor: 'var(--amber)', color: 'var(--amber)' }}
            onClick={handleCreate}
            disabled={loading}
          >
            <span style={styles.actionIcon}>⊞</span>
            <div>
              <div style={styles.actionTitle}>CREATE ROOM</div>
              <div style={styles.actionSub}>get a room ID to share with friend</div>
            </div>
          </button>

          {/* Join room toggle */}
          <button
            style={{
              ...styles.actionBtn,
              borderColor: activePanel === 'join' ? 'var(--green)' : 'var(--border2)',
              color: activePanel === 'join' ? 'var(--green)' : 'var(--text)',
            }}
            onClick={() => setActivePanel(p => p === 'join' ? null : 'join')}
            disabled={loading}
          >
            <span style={styles.actionIcon}>→</span>
            <div>
              <div style={styles.actionTitle}>JOIN ROOM</div>
              <div style={styles.actionSub}>enter a room ID from your opponent</div>
            </div>
          </button>
        </div>
      )}

      {/* Join input panel */}
      {activePanel === 'join' && !isWaiting && (
        <div style={styles.joinPanel}>
          <div style={styles.joinLabel}>
            <span style={{ color: 'var(--cyan)' }}>PASTE &gt;</span>
            <span style={{ color: 'var(--text-dim)', marginLeft: 8 }}>room ID from opponent</span>
          </div>
          <div style={styles.joinRow}>
            <input
              style={styles.joinInput}
              value={joinId}
              onChange={e => setJoinId(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleJoin()}
              placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.nakama"
              autoFocus
            />
            <button
              style={{
                ...styles.joinBtn,
                opacity: !joinId.trim() || loading ? 0.4 : 1,
                cursor: !joinId.trim() || loading ? 'not-allowed' : 'pointer',
              }}
              onClick={handleJoin}
              disabled={!joinId.trim() || loading}
            >
              JOIN
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={styles.error}>
          <span style={{ color: 'var(--red)' }}>ERR &gt;</span>
          <span style={{ color: 'var(--red)', marginLeft: 8 }}>{error}</span>
        </div>
      )}

      {/* Footer grid decoration */}
      <div style={styles.footer}>
        {Array.from({ length: 9 }).map((_, i) => (
          <div key={i} style={{
            ...styles.footerCell,
            opacity: Math.random() > 0.5 ? 0.15 : 0.05,
          }}>
            {Math.random() > 0.5 ? 'X' : 'O'}
          </div>
        ))}
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    maxWidth: 560,
    margin: '0 auto',
    padding: '32px 16px',
    animation: 'slideUp 0.4s ease',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  headerLine: {
    flex: 1,
    height: 1,
    background: 'var(--border)',
  },
  headerText: {
    fontSize: 11,
    letterSpacing: 3,
    color: 'var(--text-dim)',
    whiteSpace: 'nowrap',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 28,
    padding: '10px 14px',
    border: '1px solid var(--border)',
    background: 'var(--bg2)',
  },
  statusDivider: {
    color: 'var(--border2)',
    fontSize: 12,
  },
  roomCard: {
    border: '1px solid var(--amber)',
    background: 'rgba(245,166,35,0.04)',
    padding: '20px',
    marginBottom: 28,
    boxShadow: '0 0 20px rgba(245,166,35,0.1)',
    animation: 'slideUp 0.3s ease',
  },
  roomCardHeader: {
    marginBottom: 12,
  },
  roomIdRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  roomId: {
    flex: 1,
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(9px, 1.5vw, 12px)',
    color: 'var(--amber)',
    wordBreak: 'break-all',
    letterSpacing: 1,
    lineHeight: 1.6,
    padding: '8px 10px',
    background: 'var(--bg)',
    border: '1px solid var(--border2)',
  },
  copyBtn: {
    padding: '8px 14px',
    background: 'transparent',
    border: '1px solid var(--amber)',
    color: 'var(--amber)',
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: 'var(--font-mono)',
    transition: 'all 0.2s',
    flexShrink: 0,
    cursor: 'pointer',
  },
  copyBtnDone: {
    background: 'var(--green)',
    borderColor: 'var(--green)',
    color: 'var(--bg)',
  },
  roomHint: {
    fontSize: 10,
    color: 'var(--text-dim)',
    letterSpacing: 1,
  },
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: 10,
    marginBottom: 20,
  },
  actionBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: 16,
    padding: '16px 20px',
    background: 'var(--bg2)',
    border: '1px solid',
    textAlign: 'left',
    transition: 'all 0.15s',
    fontFamily: 'var(--font-mono)',
    cursor: 'pointer',
  },
  actionIcon: {
    fontSize: 22,
    flexShrink: 0,
    width: 28,
    textAlign: 'center',
  },
  actionTitle: {
    fontSize: 13,
    letterSpacing: 2,
    marginBottom: 2,
  },
  actionSub: {
    fontSize: 10,
    color: 'var(--text-dim)',
    letterSpacing: 1,
  },
  joinPanel: {
    border: '1px solid var(--green)',
    background: 'rgba(0,255,136,0.03)',
    padding: '18px 20px',
    marginBottom: 20,
    animation: 'slideUp 0.2s ease',
  },
  joinLabel: {
    fontSize: 12,
    marginBottom: 12,
  },
  joinRow: {
    display: 'flex',
    gap: 10,
  },
  joinInput: {
    flex: 1,
    background: 'var(--bg)',
    border: '1px solid var(--border2)',
    color: 'var(--cyan)',
    fontSize: 12,
    padding: '10px 12px',
    fontFamily: 'var(--font-mono)',
    letterSpacing: 1,
  },
  joinBtn: {
    padding: '10px 18px',
    background: 'transparent',
    border: '1px solid var(--green)',
    color: 'var(--green)',
    fontSize: 12,
    letterSpacing: 2,
    fontFamily: 'var(--font-mono)',
    flexShrink: 0,
    transition: 'all 0.2s',
  },
  error: {
    padding: '10px 14px',
    border: '1px solid rgba(255,68,102,0.4)',
    background: 'rgba(255,68,102,0.05)',
    fontSize: 12,
    marginBottom: 16,
  },
  footer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(9, 1fr)',
    gap: 4,
    marginTop: 40,
  },
  footerCell: {
    fontFamily: 'var(--font-head)',
    fontSize: 12,
    color: 'var(--text-dim)',
    textAlign: 'center',
    padding: '4px 0',
  },
}
