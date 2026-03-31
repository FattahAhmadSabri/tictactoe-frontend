// src/components/LoginScreen.jsx
import React, { useState } from 'react'

export default function LoginScreen({ onLogin, error, loading }) {
  const [username, setUsername] = useState('')

  const handleSubmit = (e) => {
    e.preventDefault()
    if (username.trim().length < 2) return
    onLogin(username.trim())
  }

  return (
    <div className="login-wrap">
      <div className="login-hero">
        <div className="login-hero-symbols">
          <span className="login-hero-x">✕</span>
          <span className="login-hero-o">◯</span>
        </div>
        <p className="login-hero-title">multiplayer · server-authoritative</p>
      </div>

      <div className="card">
        <p className="screen-title">enter to play</p>
        <form className="login-form" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            maxLength={20}
            autoFocus
            disabled={loading}
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || username.trim().length < 2}
          >
            {loading ? 'connecting...' : 'enter game →'}
          </button>
        </form>
        {error && <p className="error-msg">{error}</p>}
      </div>
    </div>
  )
}
