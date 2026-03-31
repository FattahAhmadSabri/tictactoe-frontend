// src/components/LeaderboardScreen.jsx
import React, { useEffect, useState } from 'react'

export default function LeaderboardScreen({ getLeaderboard, myUserId }) {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    const load = async () => {
      setLoading(true)
      const data = await getLeaderboard()
      if (mounted) { setRecords(data); setLoading(false) }
    }
    load()
    return () => { mounted = false }
  }, [getLeaderboard])

  const rankLabel = (i) => ['1st','2nd','3rd'][i] ?? `${i+1}th`
  const rankCls   = (i) => ['rank-1','rank-2','rank-3'][i] ?? ''

  return (
    <div className="leaderboard-wrap">
      <p className="screen-title">leaderboard — wins</p>

      <div className="card" style={{ padding: 0 }}>
        {loading && (
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)', padding: '32px', textAlign: 'center' }}>
            loading<span className="waiting-dot">...</span>
          </p>
        )}

        {!loading && records.length === 0 && (
          <p className="lb-empty">no records yet — play some games!</p>
        )}

        {!loading && records.map((record, i) => (
          <div key={record.owner_id} className={`lb-row ${record.owner_id === myUserId ? 'me' : ''}`}>
            <span className={`lb-rank ${rankCls(i)}`}>{rankLabel(i)}</span>
            <span className="lb-name">
              {record.username || 'anonymous'}
              {record.owner_id === myUserId && <span className="lb-you">(you)</span>}
            </span>
            <span className="lb-score">{record.score}</span>
          </div>
        ))}
      </div>

      <p style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-dim)', marginTop: '16px', textAlign: 'center' }}>
        score = total wins
      </p>
    </div>
  )
}
