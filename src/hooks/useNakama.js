// src/hooks/useNakama.js
// All Nakama connection, auth, matchmaking and real-time game logic

import { useState, useEffect, useRef, useCallback } from 'react'
import { Client } from '@heroiclabs/nakama-js'

// Vite uses import.meta.env instead of process.env
const NAKAMA_HOST       = import.meta.env.VITE_NAKAMA_HOST       || 'localhost'
const NAKAMA_PORT       = import.meta.env.VITE_NAKAMA_PORT       || '7350'
const USE_SSL           = import.meta.env.VITE_NAKAMA_USE_SSL    === 'true'
const SERVER_KEY        = import.meta.env.VITE_NAKAMA_SERVER_KEY || 'defaultkey'

export function useNakama() {
  const clientRef  = useRef(null)
  const socketRef  = useRef(null)
  const sessionRef = useRef(null)

  const [connected,   setConnected]   = useState(false)
  const [session,     setSession]     = useState(null)
  const [matchId,     setMatchId]     = useState(null)
  const [gameState,   setGameState]   = useState(null)
  const [players,     setPlayers]     = useState([])
  const [myPresence,  setMyPresence]  = useState(null)
  const [error,       setError]       = useState(null)
  // status: idle | connecting | waiting | playing | finished
  const [status,      setStatus]      = useState('idle')

  // Create Nakama client once on mount
  useEffect(() => {
    clientRef.current = new Client(SERVER_KEY, NAKAMA_HOST, NAKAMA_PORT, USE_SSL)
  }, [])

  // ─── LOGIN ────────────────────────────────────────────────────────────────
  const login = useCallback(async (username) => {
    try {
      setStatus('connecting')
      setError(null)

      // Use device ID so the same user can log back in without a password
      let deviceId = localStorage.getItem('ttt_device_id')
      if (!deviceId) {
        deviceId = crypto.randomUUID()
        localStorage.setItem('ttt_device_id', deviceId)
      }

      // authenticateDevice creates the account on first call, logs in after
      const sess = await clientRef.current.authenticateDevice(deviceId, true, username)
      sessionRef.current = sess
      setSession(sess)

      // Update display name on Nakama
      await clientRef.current.updateAccount(sess, { displayName: username })

      // Open WebSocket connection
      const socket = clientRef.current.createSocket(USE_SSL)
      socketRef.current = socket

      // Handle socket events
      socket.ondisconnect = () => {
        setConnected(false)
        setStatus('idle')
      }

      // Server sends board updates here (opCode 1 = board update)
      socket.onmatchdata = (data) => {
        const msg = JSON.parse(new TextDecoder().decode(data.data))
        setGameState(prev => ({
          ...prev,
          board:  msg.board,
          turn:   msg.turn,
          winner: msg.winner || null,
          draw:   msg.draw   || false,
          result: msg.winner
            ? (msg.winner === sessionRef.current?.user_id ? 'win' : 'lose')
            : msg.draw ? 'draw' : null,
        }))
        if (msg.winner || msg.draw) setStatus('finished')
        else setStatus('playing')
      }

      // Player join/leave events
      socket.onmatchpresence = (event) => {
        if (event.joins) {
          setPlayers(prev => {
            const updated = [...prev]
            for (const p of event.joins) {
              if (!updated.find(x => x.user_id === p.user_id)) updated.push(p)
            }
            return updated
          })
        }
        if (event.leaves) {
          setPlayers(prev =>
            prev.filter(p => !event.leaves.find(l => l.user_id === p.user_id))
          )
          // If opponent leaves mid-game, you win by default
          setStatus('finished')
          setGameState(gs => gs ? { ...gs, result: 'opponent_left' } : gs)
        }
      }

      await socket.connect(sess, true)
      setConnected(true)
      setStatus('idle')
      setMyPresence({ user_id: sess.user_id, username: sess.username })

    } catch (e) {
      setError('Connection failed: ' + e.message)
      setStatus('idle')
    }
  }, [])

  // ─── QUICK MATCH (auto-matchmaking) ──────────────────────────────────────
  // Calls the find_match RPC defined in your backend src/main.ts
  const findMatch = useCallback(async () => {
    if (!socketRef.current || !sessionRef.current) return
    try {
      setStatus('waiting')
      setError(null)

      const res = await clientRef.current.rpcGet(sessionRef.current, 'find_match', '')
      const { matchId: mid } = JSON.parse(res.payload)

      const match = await socketRef.current.joinMatch(mid)
      setMatchId(match.match_id)
      setPlayers(match.presences || [])
      resetBoard()
      setStatus(match.presences?.length >= 2 ? 'playing' : 'waiting')

    } catch (e) {
      setError('Matchmaking failed: ' + e.message)
      setStatus('idle')
    }
  }, [])

  // ─── CREATE ROOM ─────────────────────────────────────────────────────────
  // Calls the create_room RPC defined in your backend src/main.ts
  const createRoom = useCallback(async () => {
    if (!clientRef.current || !sessionRef.current) return null
    try {
      setStatus('waiting')
      const res = await clientRef.current.rpcGet(sessionRef.current, 'create_room', '')
      const { matchId: mid } = JSON.parse(res.payload)

      const match = await socketRef.current.joinMatch(mid)
      setMatchId(match.match_id)
      setPlayers(match.presences || [])
      resetBoard()
      setStatus('waiting')
      return mid  // return the ID so lobby can show it to share

    } catch (e) {
      setError('Room creation failed: ' + e.message)
      setStatus('idle')
      return null
    }
  }, [])

  // ─── JOIN ROOM BY ID ─────────────────────────────────────────────────────
  const joinRoom = useCallback(async (mid) => {
    if (!socketRef.current) return
    try {
      setStatus('waiting')
      const match = await socketRef.current.joinMatch(mid)
      setMatchId(match.match_id)
      setPlayers(match.presences || [])
      resetBoard()
      setStatus(match.presences?.length >= 2 ? 'playing' : 'waiting')
    } catch (e) {
      setError('Join failed: ' + e.message)
      setStatus('idle')
    }
  }, [])

  // ─── LIST OPEN ROOMS ─────────────────────────────────────────────────────
  // Calls the list_rooms RPC defined in your backend src/main.ts
  const listRooms = useCallback(async () => {
    if (!clientRef.current || !sessionRef.current) return []
    try {
      const res = await clientRef.current.rpcGet(sessionRef.current, 'list_rooms', '')
      return JSON.parse(res.payload)
    } catch {
      return []
    }
  }, [])

  // ─── MAKE MOVE ────────────────────────────────────────────────────────────
  // Sends opCode 2 to server — server validates and broadcasts back via opCode 1
  const makeMove = useCallback(async (cellIndex) => {
    if (!socketRef.current || !matchId) return
    if (gameState?.winner || gameState?.draw) return

    // Only move on your turn
    const myIndex = players.findIndex(p => p.user_id === sessionRef.current?.user_id)
    if (gameState?.turn !== myIndex + 1) return

    // Only move on empty cell
    if (gameState?.board?.[cellIndex] !== '') return

    const payload = new TextEncoder().encode(JSON.stringify({ position: cellIndex }))
    await socketRef.current.sendMatchState(matchId, 2, payload)
  }, [matchId, gameState, players])

  // ─── LEADERBOARD ─────────────────────────────────────────────────────────
  const getLeaderboard = useCallback(async () => {
    if (!clientRef.current || !sessionRef.current) return []
    try {
      const result = await clientRef.current.listLeaderboardRecords(
        sessionRef.current, 'tictactoe_wins', [], 20
      )
      return result.records || []
    } catch {
      return []
    }
  }, [])

  // ─── LEAVE MATCH ─────────────────────────────────────────────────────────
  const leaveMatch = useCallback(async () => {
    if (socketRef.current && matchId) {
      try { await socketRef.current.leaveMatch(matchId) } catch {}
    }
    setMatchId(null)
    setGameState(null)
    setPlayers([])
    setStatus('idle')
    setError(null)
  }, [matchId])

  // ─── HELPERS ─────────────────────────────────────────────────────────────
  const resetBoard = () => {
    setGameState({
      board:  ['','','','','','','','',''],
      turn:   1,
      winner: null,
      draw:   false,
      result: null,
    })
  }

  return {
    session, connected, matchId, gameState,
    players, myPresence, error, status,
    login, findMatch, createRoom, joinRoom,
    listRooms, makeMove, leaveMatch, getLeaderboard,
  }
}
