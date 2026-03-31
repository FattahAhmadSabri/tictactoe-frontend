import React, { useState, useEffect } from "react";
import { useNakama } from "./hooks/useNakama";
import LoginScreen from "./components/LoginScreen";
import LobbyScreen from "./components/LobbyScreen";
import GameScreen from "./components/GameScreen";
import LeaderboardScreen from "./components/LeaderboardScreen";

import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Box,
  Stack,
} from "@mui/material";

export default function App() {
  const nakama = useNakama();
  const [screen, setScreen] = useState("login");

  // Auto switch to game
  useEffect(() => {
    if (nakama.status === "playing" || nakama.status === "waiting") {
      setScreen("game");
    }
  }, [nakama.status]);

  const handleLogin = async (username) => {
    await nakama.login(username);
    setScreen("lobby");
  };

  const handleLeave = async () => {
    await nakama.leaveMatch();
    setScreen("lobby");
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "#f5f5f5" }}>
      
      {/* 🔝 Top Navigation */}
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            ✕ ◯ Tic Tac Toe
          </Typography>

          {nakama.session && (
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography variant="body1">
                {nakama.session.username}
              </Typography>

              <Button
                color="inherit"
                variant={screen === "lobby" ? "outlined" : "text"}
                onClick={() => setScreen("lobby")}
              >
                Lobby
              </Button>

              <Button
                color="inherit"
                variant={screen === "leaderboard" ? "outlined" : "text"}
                onClick={() => setScreen("leaderboard")}
              >
                Scores
              </Button>
            </Stack>
          )}
        </Toolbar>
      </AppBar>

      {/* 📦 Main Content */}
      <Container maxWidth="md" sx={{ mt: 4 }}>
        
        {screen === "login" && (
          <LoginScreen
            onLogin={handleLogin}
            error={nakama.error}
            loading={nakama.status === "connecting"}
          />
        )}

        {screen === "lobby" && nakama.session && (
          <LobbyScreen nakama={nakama} />
        )}

        {screen === "game" && (
          <GameScreen nakama={nakama} onLeave={handleLeave} />
        )}

        {screen === "leaderboard" && nakama.session && (
          <LeaderboardScreen
            getLeaderboard={nakama.getLeaderboard}
            myUserId={nakama.session.user_id}
          />
        )}

      </Container>
    </Box>
  );
}