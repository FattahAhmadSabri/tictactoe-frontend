import React, { useState, useEffect } from 'react'

export default function LoginScreen({ onLogin, error, loading }) {
  const [username, setUsername] = useState('')
  const [cursor, setCursor] = useState(true)

  useEffect(() => {
    const t = setInterval(() => setCursor(c => !c), 530)
    return () => clearInterval(t)
  }, [])

  const handle = () => {
    const u = username.trim()
    if (u.length < 2) return
    onLogin(u)
  }

  return (
    <div style={styles.wrap}>
      {/* ASCII art header */}
      <div style={styles.ascii}>
        <pre style={styles.asciiText}>{`
 ████████╗██╗ ██████╗    ████████╗ █████╗  ██████╗    ████████╗ ██████╗ ███████╗
    ██╔══╝██║██╔════╝       ██╔══╝██╔══██╗██╔════╝       ██╔══╝██╔═══██╗██╔════╝
    ██║   ██║██║            ██║   ███████║██║            ██║   ██║   ██║█████╗
    ██║   ██║██║            ██║   ██╔══██║██║            ██║   ██║   ██║██╔══╝
    ██║   ██║╚██████╗       ██║   ██║  ██║╚██████╗       ██║   ╚██████╔╝███████╗
    ╚═╝   ╚═╝ ╚═════╝       ╚═╝   ╚═╝  ╚═╝ ╚═════╝       ╚═╝    ╚═════╝ ╚══════╝`}
        </pre>
      </div>

      <div style={styles.terminal}>
        <div style={styles.termHeader}>
          <span style={styles.dot} />
          <span style={{ ...styles.dot, background: '#f5a623' }} />
          <span style={{ ...styles.dot, background: '#00d4ff' }} />
          <span style={styles.termTitle}>PLAYER_AUTH.exe</span>
        </div>

        <div style={styles.termBody}>
          <div style={styles.line}>
            <span style={styles.prompt}>SYS &gt;</span>
            <span style={styles.typeText}> NAKAMA MULTIPLAYER ENGINE v2.0</span>
          </div>
          <div style={styles.line}>
            <span style={styles.prompt}>SYS &gt;</span>
            <span style={{ color: 'var(--text-dim)' }}> awaiting player identification...</span>
          </div>
          <div style={{ height: 16 }} />

          <div style={styles.inputRow}>
            <span style={styles.prompt}>ID &nbsp;&gt;</span>
            <input
              style={styles.input}
              value={username}
              onChange={e => setUsername(e.target.value.toUpperCase().replace(/[^A-Z0-9_]/g, '').slice(0, 12))}
              onKeyDown={e => e.key === 'Enter' && handle()}
              placeholder="ENTER_CALLSIGN"
              autoFocus
              maxLength={12}
            />
            <span style={{ ...styles.cursor, opacity: cursor ? 1 : 0 }}>█</span>
          </div>

          {error && (
            <div style={styles.errorLine}>
              <span style={styles.prompt}>ERR &gt;</span>
              <span style={{ color: 'var(--red)' }}> {error}</span>
            </div>
          )}

          <div style={{ height: 20 }} />

          <button
            style={{
              ...styles.btn,
              opacity: username.trim().length < 2 || loading ? 0.4 : 1,
              cursor: username.trim().length < 2 || loading ? 'not-allowed' : 'pointer',
            }}
            onClick={handle}
            disabled={username.trim().length < 2 || loading}
          >
            {loading ? (
              <span>AUTHENTICATING<span style={styles.blink}>...</span></span>
            ) : (
              '[ ENTER THE GRID ]'
            )}
          </button>

          <div style={styles.hint}>min 2 chars — max 12 — alphanumeric + underscore</div>
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    animation: 'flicker 8s infinite',
  },
  ascii: {
    marginBottom: 32,
    overflow: 'hidden',
  },
  asciiText: {
    fontFamily: 'var(--font-mono)',
    fontSize: 'clamp(3px, 0.8vw, 9px)',
    color: 'var(--amber)',
    lineHeight: 1.2,
    textShadow: '0 0 8px rgba(245,166,35,0.6)',
    whiteSpace: 'pre',
  },
  terminal: {
    width: '100%',
    maxWidth: 520,
    border: '1px solid var(--border2)',
    borderRadius: 4,
    background: 'var(--bg2)',
    boxShadow: '0 0 40px rgba(0,0,0,0.8), 0 0 1px var(--border2) inset',
    animation: 'slideUp 0.5s ease',
  },
  termHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: 6,
    padding: '8px 14px',
    borderBottom: '1px solid var(--border)',
    background: 'var(--bg3)',
  },
  dot: {
    width: 10, height: 10,
    borderRadius: '50%',
    background: '#333',
  },
  termTitle: {
    marginLeft: 8,
    fontSize: 11,
    color: 'var(--text-dim)',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  termBody: {
    padding: '24px 28px 28px',
  },
  line: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: 6,
    fontSize: 13,
  },
  prompt: {
    color: 'var(--cyan)',
    fontWeight: 'bold',
    fontSize: 13,
    letterSpacing: 1,
    flexShrink: 0,
  },
  typeText: {
    color: 'var(--amber)',
    fontSize: 13,
  },
  inputRow: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  input: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid var(--border2)',
    color: 'var(--amber)',
    fontSize: 18,
    letterSpacing: 3,
    padding: '4px 0',
    fontFamily: 'var(--font-mono)',
    textTransform: 'uppercase',
  },
  cursor: {
    color: 'var(--amber)',
    fontSize: 18,
    lineHeight: 1,
    transition: 'opacity 0.1s',
  },
  errorLine: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 8,
    fontSize: 13,
  },
  btn: {
    width: '100%',
    padding: '14px',
    background: 'transparent',
    border: '1px solid var(--amber)',
    color: 'var(--amber)',
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
    transition: 'all 0.2s',
    fontFamily: 'var(--font-mono)',
  },
  hint: {
    marginTop: 10,
    fontSize: 10,
    color: 'var(--text-dim)',
    letterSpacing: 1,
    textAlign: 'center',
  },
  blink: {
    animation: 'blink 1s infinite',
    display: 'inline-block',
  },
}
