import React, { useEffect, useState } from 'react'

export default function LeaderboardScreen({ getLeaderboard, myUserId }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      try {
        const data = await getLeaderboard?.()
        if (mounted) setRecords(data || [])
      } catch {
        if (mounted) setRecords([])
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [getLeaderboard])

  const medals = ['🥇', '🥈', '🥉']

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <div style={styles.line} />
        <span style={styles.title}>// HIGH_SCORES.db</span>
        <div style={styles.line} />
      </div>

      <div style={styles.table}>
        {/* Table header */}
        <div style={styles.tableHead}>
          <span style={{ width: 40 }}>RANK</span>
          <span style={{ flex: 1 }}>CALLSIGN</span>
          <span style={{ width: 60, textAlign: 'right' }}>WINS</span>
        </div>
        <div style={styles.divider} />

        {loading && (
          <div style={styles.empty}>
            <span style={{ animation: 'pulse 1s infinite' }}>◌</span>
            <span style={{ marginLeft: 8 }}>FETCHING RECORDS...</span>
          </div>
        )}

        {!loading && records.length === 0 && (
          <div style={styles.empty}>
            NO RECORDS YET — PLAY SOME GAMES
          </div>
        )}

        {!loading && records.map((r, i) => (
          <div
            key={r.owner_id}
            style={{
              ...styles.row,
              background: r.owner_id === myUserId ? 'rgba(245,166,35,0.05)' : 'transparent',
              borderLeft: r.owner_id === myUserId ? '2px solid var(--amber)' : '2px solid transparent',
            }}
          >
            <span style={{ width: 40, fontSize: 16 }}>
              {medals[i] ?? <span style={{ fontSize: 11, color: 'var(--text-dim)' }}>{i + 1}th</span>}
            </span>
            <span style={{
              flex: 1, fontSize: 13, letterSpacing: 2,
              color: i === 0 ? 'var(--amber)' : i === 1 ? 'var(--text-bright)' : i === 2 ? 'var(--cyan)' : 'var(--text)',
            }}>
              {r.username || 'ANONYMOUS'}
              {r.owner_id === myUserId && (
                <span style={{ marginLeft: 8, fontSize: 9, color: 'var(--amber)', letterSpacing: 1, border: '1px solid var(--amber-dim)', padding: '1px 5px' }}>
                  YOU
                </span>
              )}
            </span>
            <span style={{
              width: 60, textAlign: 'right',
              fontFamily: 'var(--font-head)',
              fontSize: 18,
              color: i === 0 ? 'var(--amber)' : 'var(--text)',
              textShadow: i === 0 ? 'var(--glow-amber)' : 'none',
            }}>
              {r.score}
            </span>
          </div>
        ))}
      </div>

      <div style={styles.footer}>
        score = total match wins
      </div>
    </div>
  )
}

const styles = {
  wrap: {
    maxWidth: 520,
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
  line: {
    flex: 1, height: 1,
    background: 'var(--border)',
  },
  title: {
    fontSize: 11,
    letterSpacing: 3,
    color: 'var(--text-dim)',
    whiteSpace: 'nowrap',
  },
  table: {
    border: '1px solid var(--border)',
    background: 'var(--bg2)',
    overflow: 'hidden',
  },
  tableHead: {
    display: 'flex',
    alignItems: 'center',
    padding: '10px 16px',
    fontSize: 10,
    letterSpacing: 3,
    color: 'var(--text-dim)',
    background: 'var(--bg3)',
    gap: 12,
  },
  divider: {
    height: 1,
    background: 'var(--border)',
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    padding: '14px 16px',
    gap: 12,
    borderBottom: '1px solid var(--border)',
    transition: 'background 0.15s',
  },
  empty: {
    padding: '40px 16px',
    textAlign: 'center',
    color: 'var(--text-dim)',
    fontSize: 12,
    letterSpacing: 2,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    marginTop: 12,
    fontSize: 10,
    color: 'var(--text-dim)',
    letterSpacing: 2,
    textAlign: 'center',
  },
}
