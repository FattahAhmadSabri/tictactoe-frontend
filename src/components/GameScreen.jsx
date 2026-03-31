import { Button, Container, Typography } from "@mui/material";
import { findMatch, connectSocket, joinMatch } from "../nakama";

export default function LobbyScreen({ session, setSocket, setMatchId, setScreen }) {

  const handleFindMatch = async () => {
    const matchId = await findMatch(session);
    const socket = await connectSocket(session);

    await joinMatch(socket, matchId);

    setSocket(socket);
    setMatchId(matchId);
    setScreen("game");
  };

  return (
    <Container>
      <Typography variant="h4">Lobby</Typography>
      <Button variant="contained" onClick={handleFindMatch}>
        Find Match
      </Button>
    </Container>
  );
}