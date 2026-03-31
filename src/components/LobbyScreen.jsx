// src/components/LobbyScreen.jsx
import React, { useState, useEffect } from 'react'

export default function LobbyScreen({ nakama }) {
  const { findMatch, createRoom, joinRoom, listRooms, leaveMatch, status, error } = nakama

  const [mode, setMode]               = useState(null) // null | 'join' | 'browse'
  const [joinId, setJoinId]           = useState('')
  const [rooms, setRooms]             = useState([])
  const [loadingRooms, setLoadingRooms] = useState(false)
  const [createdRoomId, setCreatedRoomId] = useState(null)

  const isWaiting = status === 'waiting'

  const handleFindMatch = async () => {
    setMode(null)
    setCreatedRoomId(null)
    await findMatch()
  }

  const handleCreateRoom = async () => {
    setMode(null)
    const id = await createRoom()
    if (id) setCreatedRoomId(id)
  }

  const handleBrowse = async () => {
    setMode('browse')
    setLoadingRooms(true)
    const list = await listRooms()
    setRooms(list)
    setLoadingRooms(false)
  }

  const handleJoinRoom = async (id) => {
    await joinRoom(id || joinId.trim())
    setJoinId('')
    setMode(null)
  }

  // Refresh room list every 3 seconds when browsing
  useEffect(() => {
    if (mode !== 'browse') return
    const interval = setInterval(async () => {
      const list = await listRooms()
      setRooms(list)
    }, 3000)
    return () => clearInterval(interval)
  }, [mode, listRooms])

  return (
    <div className="lobby-wrap">
      <p className="screen-title">lobby</p>

      {/* Waiting for opponent */}
      {isWaiting && (
        <div className="card" style={{ textAlign: 'center', marginBottom: '20px' }}>
          {createdRoomId ? (
            <>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                room created — share this id
              </p>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--accent-x)', marginBottom: '16px', wordBreak: 'break-all', padding: '0 8px' }}>
                {createdRoomId}
              </p>
              <button className="btn" style={{ fontSize: '11px' }} onClick={() => navigator.clipboard.writeText(createdRoomId)}>
                copy room id
              </button>
            </>
          ) : (
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>
              searching for opponent<span className="waiting-dot">...</span>
            </p>
          )}
          <div style={{ marginTop: '16px' }}>
            <span className="status-badge status-waiting">waiting for player 2</span>
          </div>
          <button className="btn" style={{ marginTop: '16px', fontSize: '12px' }} onClick={leaveMatch}>
            cancel
          </button>
        </div>
      )}

      {/* Action cards */}
      {!isWaiting && (
        <>
          <div className="lobby-actions">
            <div className="lobby-action-card" onClick={handleFindMatch}>
              <div className="lac-icon">⚡</div>
              <div className="lac-title">quick match</div>
              <div className="lac-desc">auto-pair with any player</div>
            </div>

            <div className="lobby-action-card" onClick={handleCreateRoom}>
              <div className="lac-icon">＋</div>
              <div className="lac-title">create room</div>
              <div className="lac-desc">get a room id to share</div>
            </div>

            <div
              className={`lobby-action-card ${mode === 'join' ? 'active' : ''}`}
              onClick={() => setMode(mode === 'join' ? null : 'join')}
            >
              <div className="lac-icon">→</div>
              <div className="lac-title">join room</div>
              <div className="lac-desc">enter a room id</div>
            </div>

            <div
              className={`lobby-action-card ${mode === 'browse' ? 'active' : ''}`}
              onClick={handleBrowse}
            >
              <div className="lac-icon">◫</div>
              <div className="lac-title">browse rooms</div>
              <div className="lac-desc">see open games</div>
            </div>
          </div>

          {/* Join by ID */}
          {mode === 'join' && (
            <div className="card" style={{ marginBottom: '16px' }}>
              <p className="screen-title">join by room id</p>
              <div className="join-input-row">
                <input
                  type="text"
                  placeholder="paste room id here"
                  value={joinId}
                  onChange={(e) => setJoinId(e.target.value)}
                />
                <button
                  className="btn btn-outline-o"
                  disabled={!joinId.trim()}
                  onClick={() => handleJoinRoom()}
                >
                  join
                </button>
              </div>
            </div>
          )}

          {/* Browse rooms */}
          {mode === 'browse' && (
            <div>
              <div className="rooms-header">
                <span className="rooms-label">open rooms</span>
                <button
                  className="btn"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={handleBrowse}
                >
                  refresh
                </button>
              </div>

              {loadingRooms && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                  loading<span className="waiting-dot">...</span>
                </p>
              )}

              {!loadingRooms && rooms.length === 0 && (
                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)' }}>
                  no open rooms found
                </p>
              )}

              {rooms.map((room) => (
                <div className="room-item" key={room.matchId}>
                  <span className="room-id">{room.matchId.slice(0, 20)}…</span>
                  <div className="room-players">
                    <div className={`room-dot ${room.size >= 1 ? '' : 'empty'}`} />
                    <div className={`room-dot ${room.size >= 2 ? '' : 'empty'}`} />
                    {room.size === 1 && (
                      <button
                        className="btn btn-outline-o"
                        style={{ fontSize: '11px', padding: '4px 10px' }}
                        onClick={() => handleJoinRoom(room.matchId)}
                      >
                        join
                      </button>
                    )}
                    {room.size === 2 && (
                      <span className="status-badge status-playing">full</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {error && <p className="error-msg" style={{ marginTop: '16px' }}>{error}</p>}
    </div>
  )
}
