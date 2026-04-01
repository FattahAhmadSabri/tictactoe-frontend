import { useCallback, useEffect, useRef, useState } from "react"
import { Client } from "@heroiclabs/nakama-js"

// ---------- HELPERS ----------
const createInitialGameState = () => ({
  board: Array(9).fill(""),
  turn: 1,
  winner: null,
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

// ---------- HOOK ----------
export default function useNakama() {
  const clientRef = useRef(
    new Client("defaultkey", "127.0.0.1", "7350", false)
  )

  const socketRef = useRef(null)
  const sessionRef = useRef(null)
  const matchIdRef = useRef(null)

  const [session, setSession] = useState(null)
  const [status, setStatus] = useState("idle")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [matchId, setMatchId] = useState(null)
  const [players, setPlayers] = useState([])
  const [myPresence, setMyPresence] = useState(null)
  const [gameState, setGameState] = useState(createInitialGameState())
  const [createdRoomId, setCreatedRoomId] = useState(null)

  // ---------- RESET ----------
  const resetBoard = useCallback(() => {
    setGameState(createInitialGameState())
  }, [])

  // ---------- SOCKET EVENTS ----------
  const attachSocketListeners = useCallback(() => {
    if (!socketRef.current) return

    // PRESENCE
    socketRef.current.onmatchpresence = (event) => {
      console.log("PRESENCE:", event)

      setPlayers((curr) => {
        let updated = [...curr]

        updated = updated.filter(
          (p) =>
            !event.leaves?.some(
              (l) =>
                l.user_id === p.user_id &&
                l.session_id === p.session_id
            )
        )

        event.joins?.forEach((j) => {
          const exists = updated.some(
            (p) =>
              p.user_id === j.user_id &&
              p.session_id === j.session_id
          )
          if (!exists) updated.push(j)
        })

        return updated
      })
    }

    // MATCH DATA (FIXED)
    socketRef.current.onmatchdata = (msg) => {
      console.log("MATCH DATA RECEIVED:", msg)

      if (msg.op_code !== 1) return

      const data = decodeMatchData(msg.data)
      if (!data) return

      console.log("GAME STATE:", data)

      // ✅ FIX APPLIED HERE
      setGameState({
        board: data.board,
        turn: data.turn,
        winner: data.winner,
        draw: data.draw,
      })

      if (data.winner || data.draw) {
        setStatus("finished")
      } else {
        setStatus("playing")
      }
    }

    socketRef.current.ondisconnect = () => {
      setError("Disconnected")
      setStatus("idle")
    }
  }, [])

  // ---------- LOGIN ----------
  const login = useCallback(async (username) => {
    try {
      setLoading(true)
      setError(null)

      const deviceId =
        localStorage.getItem("deviceId") || crypto.randomUUID()
      localStorage.setItem("deviceId", deviceId)

      const session = await clientRef.current.authenticateDevice(
        deviceId,
        true,
        username
      )

      sessionRef.current = session
      setSession({ ...session, username })

      const socket = clientRef.current.createSocket()
      socketRef.current = socket

      attachSocketListeners()
      await socket.connect(session, true)

      setStatus("idle")
    } catch {
      setError("Login failed")
      setStatus("idle")
    } finally {
      setLoading(false)
    }
  }, [attachSocketListeners])

  // ---------- JOIN MATCH ----------
  const joinExistingMatch = useCallback(async (id) => {
    if (!socketRef.current) throw new Error("Socket not connected")

    console.log("Joining room:", id)

    const match = await socketRef.current.joinMatch(id)

    matchIdRef.current = match.match_id

    setMatchId(match.match_id)
    setMyPresence(match.self)
    setPlayers([])

    setStatus("waiting")

    resetBoard()

    console.log("Joined successfully:", match)

    return match
  }, [resetBoard])

  // ---------- CREATE ROOM ----------
  const createRoom = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await clientRef.current.rpc(
        sessionRef.current,
        "create_room",
        {}
      )

      let data

      if (typeof res.payload === "string") {
        data = JSON.parse(res.payload)
        if (typeof data === "string") {
          data = JSON.parse(data)
        }
      } else {
        data = res.payload
      }

      console.log("CREATE ROOM RESPONSE:", data)

      if (!data?.matchId) {
        throw new Error("Invalid match data")
      }

      setCreatedRoomId(data.matchId)

      await joinExistingMatch(data.matchId)

    } catch (e) {
      console.error("CREATE ROOM ERROR:", e)
      setError("Create room failed")
      setStatus("idle")
    } finally {
      setLoading(false)
    }
  }, [joinExistingMatch])

  // ---------- JOIN ROOM ----------
  const joinRoom = useCallback(async (roomId) => {
    try {
      setLoading(true)
      await joinExistingMatch(roomId)
    } catch (e) {
      console.error(e)
      setError("Join failed")
    } finally {
      setLoading(false)
    }
  }, [joinExistingMatch])

  // ---------- FIND MATCH ----------
  const findMatch = useCallback(async () => {
    try {
      setLoading(true)

      const res = await clientRef.current.rpc(
        sessionRef.current,
        "find_match",
        {}
      )

      const data = JSON.parse(res.payload)

      await joinExistingMatch(data.matchId)

    } catch {
      setError("Matchmaking failed")
    } finally {
      setLoading(false)
    }
  }, [joinExistingMatch])

  // ---------- MOVE ----------
  const makeMove = useCallback(async (index) => {
    if (!socketRef.current || !matchIdRef.current) return
    if (status !== "playing") return

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
    resetBoard()
    setStatus("idle")
  }, [resetBoard])

  // ---------- CLEANUP ----------
  useEffect(() => {
    return () => {
      socketRef.current?.disconnect()
    }
  }, [])

  return {
    session,
    status,
    loading,
    error,
    matchId,
    players,
    myPresence,
    gameState,
    createdRoomId,
    login,
    findMatch,
    createRoom,
    joinRoom,
    leaveMatch,
    makeMove,
  }
}