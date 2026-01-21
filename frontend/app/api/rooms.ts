export type Player = {
  id: string
  user_id?: string
  name: string
  vote: number | null
}

export type Room = {
  id: string
  name: string
  code?: string
  players: Player[]
  revealed: boolean
}

export function useRoomsApi() {
  const config = useRuntimeConfig()
  const API_URL = config.public.apiUrl

  async function fetchRoomsApi(): Promise<Room[]> {
    const res = await fetch(`${API_URL}/rooms`)
    return res.json()
  }

  async function fetchRoomApi(roomId: string): Promise<Room> {
    const res = await fetch(`${API_URL}/rooms/${roomId}`)
    return res.json()
  }

  async function createRoomApi(
    name: string,
    code: string,
    userId?: string,
    userName?: string
  ): Promise<Room> {
    const body: any = { name, code }

    if (userId && userName) {
      body.user_id = userId
      body.user_name = userName
    }

    const res = await fetch(`${API_URL}/rooms`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    return res.json()
  }

  async function joinRoomApi(
    roomId: string,
    userId: string,
    name: string
  ): Promise<Room> {
    const res = await fetch(`${API_URL}/rooms/${roomId}/join`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: userId, name }),
    })

    return res.json()
  }

  /* ================= WebSocket ================= */

  function connectRoomWSApi(
    roomId: string,
    onMessage: (room: Room) => void,
    onOpen?: () => void,
    onClose?: () => void
  ): WebSocket {
    const wsProtocol = location.protocol === 'https:' ? 'wss' : 'ws'
    const wsHost = API_URL.replace(/^https?:\/\//, '')
    const ws = new WebSocket(`${wsProtocol}://${wsHost}/rooms/ws/${roomId}`)

    ws.onopen = () => {
      console.log(`WS connected to room ${roomId}`)
      onOpen?.()
    }

    ws.onmessage = (event) => {
      try {
        const data: Room = JSON.parse(event.data)
        onMessage(data)
      } catch (e) {
        console.error('Invalid WS message', e)
      }
    }

    ws.onclose = () => {
      console.log(`WS disconnected from room ${roomId}`)
      onClose?.()
    }

    ws.onerror = (err) => {
      console.error('WebSocket error:', err)
    }

    return ws
  }

  function sendVoteApi(ws: WebSocket, userId: string, vote: number) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ vote, user_id: userId }))
    }
  }

  function sendRevealApi(ws: WebSocket) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ reveal: true }))
    }
  }

  function sendResetApi(ws: WebSocket) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ reset: true }))
    }
  }

  return {
    fetchRoomsApi,
    fetchRoomApi,
    createRoomApi,
    joinRoomApi,
    connectRoomWSApi,
    sendVoteApi,
    sendRevealApi,
    sendResetApi,
  }
}
