import { useState } from "react";
import LoginScreen from "./components/LoginScreen";
import LobbyScreen from "./components/LobbyScreen";
import GameScreen from "./components/GameScreen";

function App() {
  const [screen, setScreen] = useState("login");
  const [session, setSession] = useState(null);
  const [socket, setSocket] = useState(null);
  const [matchId, setMatchId] = useState(null);

  return (
    <>
      {screen === "login" && (
        <LoginScreen setSession={setSession} setScreen={setScreen} />
      )}

      {screen === "lobby" && (
        <LobbyScreen
          session={session}
          setSocket={setSocket}
          setMatchId={setMatchId}
          setScreen={setScreen}
        />
      )}

      {screen === "game" && (
        <GameScreen socket={socket} matchId={matchId} />
      )}
    </>
  );
}

export default App;