import React, { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  CircularProgress,
} from "@mui/material";

export default function LoginScreen({ onLogin, error, loading }) {
  const [username, setUsername] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (username.trim().length < 2) return;
    onLogin(username.trim());
  };

  return (
    <Box
      minHeight="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
      flexDirection="column"
      px={2}
    >
      {/* Hero Section */}
      <Box textAlign="center" mb={3}>
        <Typography variant="h3">✕ ◯</Typography>
        <Typography variant="body2" color="text.secondary">
          multiplayer · server-authoritative
        </Typography>
      </Box>

      {/* Card */}
      <Card sx={{ width: 350 }}>
        <CardContent>
          <Typography variant="h6" mb={2} textAlign="center">
            Enter to Play
          </Typography>

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Username"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              inputProps={{ maxLength: 20 }}
              autoFocus
              disabled={loading}
              margin="normal"
            />

            <Button
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading || username.trim().length < 2}
              sx={{ mt: 2 }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                "Enter Game →"
              )}
            </Button>
          </form>

          {error && (
            <Typography color="error" mt={2} textAlign="center">
              {error}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}