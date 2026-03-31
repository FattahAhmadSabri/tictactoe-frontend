import { Button, Container, Typography } from "@mui/material";
import { login } from "../nakama";

export default function LoginScreen({ setSession, setScreen }) {
  const handleLogin = async () => {
    const session = await login();
    setSession(session);
    setScreen("lobby");
  };

  return (
    <Container>
      <Typography variant="h4">Login</Typography>
      <Button variant="contained" onClick={handleLogin}>
        Login
      </Button>
    </Container>
  );
}