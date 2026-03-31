import { Client } from "@heroiclabs/nakama-js";

export const client = new Client("defaultkey", "127.0.0.1", "7350", false);

export async function login() {
  return await client.authenticateDevice(Math.random().toString());
}

export async function findMatch(session) {
  const res = await client.rpc(session, "find_match");
  return JSON.parse(res.payload).matchId;
}

export async function connectSocket(session) {
  const socket = client.createSocket();
  await socket.connect(session);
  return socket;
}

export async function joinMatch(socket, matchId) {
  return await socket.joinMatch(matchId);
}

export function sendMove(socket, matchId, index) {
  socket.sendMatchState(matchId, 1, JSON.stringify({ index }));
}