export type Player = {
  id: string;
  user_id?: string;
  name: string;
  vote: number | null;
};

export type Room = {
  id: string;
  name: string;
  code?: string;
  players: Player[];
  revealed: boolean;
};

const API_URL = 'http://127.0.0.1:8000';

export async function fetchRooms(): Promise<Room[]> {
  const res = await fetch(`${API_URL}/rooms`);
  return res.json();
}


export async function fetchRoom(roomId: string): Promise<Room> {
  const res = await fetch(`${API_URL}/rooms/${roomId}`);
  return res.json();
}


export async function createRoom(
  name: string,
  code: string,
  userId?: string,
  userName?: string
): Promise<Room> {
  const body: any = { name, code };
  if (userId && userName) {
    body.user_id = userId;
    body.user_name = userName;
  }

  const res = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  return res.json();
}


export async function joinRoom(
  roomId: string,
  userId: string,
  name: string
): Promise<Room> {
  const res = await fetch(`${API_URL}/rooms/${roomId}/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_id: userId, name }),
  });

  return res.json();
}


export function connectRoomWS(
  roomId: string,
  onMessage: (room: Room) => void,
  onOpen?: () => void,
  onClose?: () => void
): WebSocket {
  const ws = new WebSocket(`ws://127.0.0.1:8000/rooms/ws/${roomId}`);

  ws.onopen = () => {
    console.log(`WS connected to room ${roomId}`);
    onOpen?.();
  };

  ws.onmessage = (event) => {
    const data: Room = JSON.parse(event.data);
    onMessage(data);
  };

  ws.onclose = () => {
    console.log(`WS disconnected from room ${roomId}`);
    onClose?.();
  };

  ws.onerror = (err) => {
    console.error('WebSocket error:', err);
  };

  return ws;
}


export function sendVote(ws: WebSocket, userId: string, vote: number) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ vote, user_id: userId }));
  }
}


export function sendReveal(ws: WebSocket) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ reveal: true }));
  }
}


export function sendReset(ws: WebSocket) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ reset: true }));
  }
}
