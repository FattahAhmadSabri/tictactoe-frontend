import React from "react"

export default function GameScreen({
  gameState,
  players,
  myPresence,
  makeMove,
  leaveMatch,
}) {
  const { board, turn, winner, draw } = gameState

  // ✅ FIND MY INDEX
  const myIndex = players.findIndex(
    (p) =>
      p.user_id === myPresence?.user_id &&
      p.session_id === myPresence?.session_id
  )

  // ❗ FIXED CONDITION
  const isMyTurn = myIndex !== -1 && turn === myIndex + 1

  return (
    <div style={{ textAlign: "center", marginTop: "20px" }}>
      {/* PLAYERS */}
      <h3>
        {players[0]?.username || "Player 1"} vs{" "}
        {players[1]?.username || "Waiting..."}
      </h3>

      {/* STATUS */}
      {winner ? (
        <h2 style={{ color: "green" }}>Winner!</h2>
      ) : draw ? (
        <h2 style={{ color: "orange" }}>Draw!</h2>
      ) : (
        <h3>
          {isMyTurn ? "Your turn" : "Opponent turn"} —{" "}
          {myIndex === 0 ? "X" : "O"}
        </h3>
      )}

      {/* BOARD */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 100px)",
          gap: "10px",
          justifyContent: "center",
          marginTop: "20px",
        }}
      >
        {board.map((cell, index) => (
          <div
            key={index}
            onClick={() => {
              if (!cell && isMyTurn && !winner) {
                makeMove(index)
              }
            }}
            style={{
              width: "100px",
              height: "100px",
              fontSize: "32px",
              fontWeight: "bold",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid #333",
              cursor:
                !cell && isMyTurn && !winner
                  ? "pointer"
                  : "not-allowed",
              backgroundColor: "#f5f5f5",
            }}
          >
            {cell}
          </div>
        ))}
      </div>

      {/* LEAVE BUTTON */}
      <button
        onClick={leaveMatch}
        style={{
          marginTop: "20px",
          padding: "10px 20px",
          background: "red",
          color: "white",
          border: "none",
          cursor: "pointer",
        }}
      >
        Leave
      </button>
    </div>
  )
}