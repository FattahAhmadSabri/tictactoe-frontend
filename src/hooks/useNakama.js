import { useCallback, useEffect, useRef, useState } from "react"
import { Client } from "@heroiclabs/nakama-js"

// ---------- HELPERS ----------
const createInitialGameState = () => ({
  board: Array(9).fill(""),
  turn: 1,
  winner: null,   // will be a user_id string or null (as sent by backend)
  draw: false,
})

const decodeMatchData = (data) => {
  try {
    if (!data) return null
    if (typeof data === "string") return JSON.parse(data)
    if (data instanceof Uint8Array)
      return JSON.parse(new TextDecoder().decode(data))
    return data
  } catch {
    return null
  }
}

// Backend sorts presences by session_id to assign player 1 / player 2.
// We must replicate that same sort so our player index matches the server's.
const sortPresences = (list) =>
  [...list].sort((a, b) => a.session_id.localeCompare(b.session_id))

// ---------- HOOK ----------
export default function useNakama() {
  const clientRef = useRef(
    new Client("defaultkey", "127.0.0.1", "7350", false)
  )

  const socketRef    = useRef(null)
  const sessionRef   = useRef(null)
  const matchIdRef   = useRef(null)

  const [session,      setSession]      = useState(null)
  const [status,       setStatus]       = useState("idle")
  const [loading,      setLoading]      = useState(false)
  const [error,        setError]        = useState(null)

  const [matchId,      setMatchId]      = useState(null)
  const [players,      setPlayers]      = useState([])   // sorted by session_id
  const [myPresence,   setMyPresence]   = useState(null)
  const [gameState,    setGameState]    = useState(createInitialGameState())
  const [createdRoomId,setCreatedRoomId]= useState(null)

  // ---------- RESET ----------
  const resetBoard = useCallback(() => {
    setGameState(createInitialGameState())
  }, [])

  // ---------- SOCKET EVENTS ----------
  const attachSocketListeners = useCallback(() => {
    if (!socketRef.current) return

    // PRESENCE — keep players sorted by session_id (mirrors backend logic)
    socketRef.current.onmatchpresence = (event) => {
      console.log("PRESENCE:", event)

      setPlayers((curr) => {
        let updated = [...curr]

        // Remove leavers
        updated = updated.filter(
          (p) => !event.leaves?.some(
            (l) => l.user_id === p.user_id && l.session_id === p.session_id
          )
        )

        // Add joiners (dedup)
        event.joins?.forEach((j) => {
          const exists = updated.some(
            (p) => p.user_id === j.user_id && p.session_id === j.session_id
          )
          if (!exists) updated.push(j)
        })

        // ✅ CRITICAL: sort by session_id to match backend player ordering
        return sortPresences(updated)
      })
    }

    // MATCH DATA
    socketRef.current.onmatchdata = (msg) => {
      console.log("MATCH DATA:", msg)
      if (msg.op_code !== 1) return

      const data = decodeMatchData(msg.data)
      if (!data) return

      console.log("GAME STATE:", data)

      setGameState({
        board:  data.board,
        turn:   data.turn,
        winner: data.winner,  // user_id string or null
        draw:   data.draw,
      })

      if (data.winner || data.draw) {
        setStatus("finished")
      } else {
        setStatus("playing")
      }
    }

    socketRef.current.ondisconnect = () => {
      setError("Disconnected from server")
      setStatus("idle")
    }
  }, [])

  // ---------- LOGIN ----------
  const login = useCallback(async (username) => {
    try {
      setLoading(true)
      setError(null)

      const deviceId = localStorage.getItem("deviceId") || crypto.randomUUID()
      localStorage.setItem("deviceId", deviceId)

      const sess = await clientRef.current.authenticateDevice(deviceId, true, username)
      sessionRef.current = sess
      setSession({ ...sess, username })

      const socket = clientRef.current.createSocket()
      socketRef.current = socket
      attachSocketListeners()
      await socket.connect(sess, true)

      setStatus("idle")
    } catch {
      setError("Login failed — is Nakama running?")
      setStatus("idle")
    } finally {
      setLoading(false)
    }
  }, [attachSocketListeners])

  // ---------- JOIN MATCH (internal) ----------
  const joinExistingMatch = useCallback(async (id) => {
    if (!socketRef.current) throw new Error("Socket not connected")

    const match = await socketRef.current.joinMatch(id)
    matchIdRef.current = match.match_id

    setMatchId(match.match_id)
    setMyPresence(match.self)

    // Seed players with whoever is already in the match, sorted
    const existing = match.presences ?? []
    // Exclude self — presence events will add everyone including self
    setPlayers(sortPresences(existing))

    setStatus("waiting")
    resetBoard()

    console.log("Joined:", match)
    return match
  }, [resetBoard])

  // ---------- CREATE ROOM ----------
  const createRoom = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setCreatedRoomId(null)

      const res = await clientRef.current.rpc(sessionRef.current, "create_room", {})

      let data = res.payload
      if (typeof data === "string") {
        data = JSON.parse(data)
        if (typeof data === "string") data = JSON.parse(data)
      }

      if (!data?.matchId) throw new Error("No matchId in response")

      setCreatedRoomId(data.matchId)
      await joinExistingMatch(data.matchId)

    } catch (e) {
      console.error("CREATE ROOM:", e)
      setError("Failed to create room")
      setStatus("idle")
    } finally {
      setLoading(false)
    }
  }, [joinExistingMatch])

  // ---------- JOIN ROOM ----------
  const joinRoom = useCallback(async (roomId) => {
    try {
      setLoading(true)
      setError(null)
      setCreatedRoomId(null)
      await joinExistingMatch(roomId)
    } catch (e) {
      console.error("JOIN ROOM:", e)
      setError("Failed to join — check the room ID")
    } finally {
      setLoading(false)
    }
  }, [joinExistingMatch])

  // ---------- FIND MATCH ----------
  const findMatch = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      setCreatedRoomId(null)

      const res  = await clientRef.current.rpc(sessionRef.current, "find_match", {})
      const data = JSON.parse(res.payload)
      await joinExistingMatch(data.matchId)

    } catch (e) {
      console.error("FIND MATCH:", e)
      setError("Matchmaking failed")
    } finally {
      setLoading(false)
    }
  }, [joinExistingMatch])

  // ---------- LIST ROOMS (backend RPC exists) ----------
  const listRooms = useCallback(async () => {
    try {
      const res  = await clientRef.current.rpc(sessionRef.current, "list_rooms", {})
      const data = JSON.parse(res.payload)
      return Array.isArray(data) ? data : []
    } catch {
      return []
    }
  }, [])

  // ---------- MAKE MOVE ----------
  const makeMove = useCallback(async (index) => {
    if (!socketRef.current || !matchIdRef.current) return
    if (status !== "playing" && status !== "waiting") return

    try {
      await socketRef.current.sendMatchState(
        matchIdRef.current,
        1,
        JSON.stringify({ index })
      )
    } catch {
      setError("Move failed")
    }
  }, [status])

  // ---------- LEAVE ----------
  const leaveMatch = useCallback(async () => {
    try {
      if (socketRef.current && matchIdRef.current) {
        await socketRef.current.leaveMatch(matchIdRef.current)
      }
    } catch {}

    matchIdRef.current = null
    setMatchId(null)
    setPlayers([])
    setMyPresence(null)
    setCreatedRoomId(null)
    resetBoard()
    setStatus("idle")
  }, [resetBoard])

  // ---------- LEADERBOARD ----------
  const getLeaderboard = useCallback(async () => {
    try {
      // Nakama built-in leaderboard — record wins under "tictactoe_wins"
      const result = await clientRef.current.listLeaderboardRecords(
        sessionRef.current,
        "tictactoe_wins",
        [],
        null,
        20
      )
      return (result.records ?? []).map(r => ({
        owner_id: r.ownerId,
        username: r.username,
        score: r.score,
      }))
    } catch {
      return []
    }
  }, [])

  // ---------- CLEANUP ----------
  useEffect(() => {
    return () => { socketRef.current?.disconnect() }
  }, [])

  return {
    session,
    status,
    loading,
    error,
    matchId,
    players,        // sorted by session_id — index 0 = P1 (X), index 1 = P2 (O)
    myPresence,
    gameState,      // winner field = user_id string or null
    createdRoomId,
    login,
    findMatch,
    createRoom,
    joinRoom,
    listRooms,
    leaveMatch,
    makeMove,
    getLeaderboard,
  }
}
