import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Grid,
  TextField,
  Chip,
  CircularProgress,
} from "@mui/material";

export default function LobbyScreen({ nakama }) {
  const {
    findMatch,
    createRoom,
    joinRoom,
    listRooms,
    leaveMatch,
    status,
    error,
    loading,
    createdRoomId, // ✅ FROM HOOK
  } = nakama;

  const [mode, setMode] = useState(null);
  const [joinId, setJoinId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);

  const isWaiting = status === "waiting";

  // ---------- ACTIONS ----------

  const handleFindMatch = async () => {
    setMode(null);
    await findMatch();
  };

  const handleCreateRoom = async () => {
    setMode(null);
    await createRoom(); // ✅ hook handles roomId
  };

  const handleBrowse = async () => {
    setMode("browse");
    setLoadingRooms(true);

    try {
      const list = await listRooms();
      setRooms(list);
    } catch {
      setRooms([]);
    }

    setLoadingRooms(false);
  };

  const handleJoinRoom = async (id) => {
    const roomId = id || joinId.trim();

    if (!roomId) {
      alert("Please enter Room ID");
      return;
    }

    await joinRoom(roomId);

    setJoinId("");
    setMode(null);
  };

  // ---------- AUTO REFRESH ROOMS ----------

  useEffect(() => {
    if (mode !== "browse") return;

    const interval = setInterval(async () => {
      try {
        const list = await listRooms();
        setRooms(list);
      } catch {
        setRooms([]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [mode, listRooms]);

  // ---------- UI ----------

  return (
    <Box p={3}>
      <Typography variant="h5" mb={2}>
        Lobby
      </Typography>

      {/* ---------- WAITING STATE ---------- */}
      {isWaiting && (
        <Card sx={{ mb: 3, textAlign: "center" }}>
          <CardContent>

            {/* ✅ SHOW ROOM CODE IF CREATED */}
            {createdRoomId ? (
              <>
                <Typography variant="body2" color="text.secondary">
                  Room Created — Share this ID
                </Typography>

                <Typography
                  variant="body1"
                  sx={{ wordBreak: "break-all", my: 2 }}
                  color="primary"
                >
                  {createdRoomId}
                </Typography>

                <Button
                  variant="outlined"
                  size="small"
                  onClick={() =>
                    navigator.clipboard.writeText(createdRoomId)
                  }
                >
                  Copy Room ID
                </Button>
              </>
            ) : (
              <Box>
                <Typography variant="body2" color="text.secondary">
                  Searching for opponent...
                </Typography>
                <CircularProgress size={20} sx={{ mt: 1 }} />
              </Box>
            )}

            <Box mt={2}>
              <Chip label="Waiting for Player 2" color="warning" />
            </Box>

            <Button
              sx={{ mt: 2 }}
              variant="contained"
              color="error"
              onClick={leaveMatch}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ---------- ACTION BUTTONS ---------- */}
      {!isWaiting && (
        <>
          <Grid container spacing={2} mb={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleFindMatch}
                disabled={loading}
              >
                {loading ? "Searching..." : "⚡ Quick Match"}
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleCreateRoom}
                disabled={loading}
              >
                {loading ? "Creating..." : "+ Create Room"}
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant={mode === "join" ? "outlined" : "contained"}
                onClick={() =>
                  setMode(mode === "join" ? null : "join")
                }
                disabled={loading}
              >
                → Join Room
              </Button>
            </Grid>

            <Grid item xs={12} sm={6} md={3}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleBrowse}
                disabled={loading}
              >
                ◫ Browse Rooms
              </Button>
            </Grid>
          </Grid>

          {/* ---------- JOIN BY ID ---------- */}
          {mode === "join" && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="subtitle1" mb={2}>
                  Join by Room ID
                </Typography>

                <Box display="flex" gap={2}>
                  <TextField
                    fullWidth
                    placeholder="Paste Room ID"
                    value={joinId}
                    onChange={(e) =>
                      setJoinId(e.target.value)
                    }
                  />

                  <Button
                    variant="contained"
                    disabled={!joinId.trim() || loading}
                    onClick={() => handleJoinRoom()}
                  >
                    Join
                  </Button>
                </Box>
              </CardContent>
            </Card>
          )}

          {/* ---------- BROWSE ROOMS ---------- */}
          {mode === "browse" && (
            <Box>
              <Box
                display="flex"
                justifyContent="space-between"
                mb={2}
              >
                <Typography variant="subtitle1">
                  Open Rooms
                </Typography>

                <Button
                  size="small"
                  onClick={handleBrowse}
                  disabled={loadingRooms}
                >
                  Refresh
                </Button>
              </Box>

              {loadingRooms && <CircularProgress />}

              {!loadingRooms && rooms.length === 0 && (
                <Typography>No open rooms found</Typography>
              )}

              {rooms.map((room) => (
                <Card key={room.matchId} sx={{ mb: 1 }}>
                  <CardContent
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography variant="body2">
                      {room.matchId.slice(0, 20)}...
                    </Typography>

                    {room.size === 1 ? (
                      <Button
                        size="small"
                        variant="outlined"
                        disabled={loading}
                        onClick={() =>
                          handleJoinRoom(room.matchId)
                        }
                      >
                        Join
                      </Button>
                    ) : (
                      <Chip label="Full" color="success" />
                    )}
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </>
      )}

      {/* ---------- ERROR ---------- */}
      {error && (
        <Typography color="error" mt={2}>
          {error}
        </Typography>
      )}
    </Box>
  );
}