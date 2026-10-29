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
export type ReactionEvent = {
  type: 'reaction'
  style?: 'throw'
  side?: 'left' | 'right'
  emoji: string
  user_id: string
  target_user_id?: string | null
}
export const MAX_VOTE = 2_147_483_647
export const REACTIONS = ['🐸', '✈️', '📄', '❤️', '🐱'] as const

export function useRoomsApi() {
  const config = useRuntimeConfig()
  const API_URL = config.public.apiUrl.replace(/\/$/, '')

  function fetchRoomsApi() {
    return $fetch<Room[]>(`${API_URL}/rooms/`)
  }
  function fetchRoomApi(roomId: string) {
    return $fetch<Room>(`${API_URL}/rooms/${roomId}`)
  }
  function createRoomApi(name: string, code: string, userId?: string, userName?: string) {
    return $fetch<Room>(`${API_URL}/rooms/`, {
      method: 'POST',
      body: { name, code, user_id: userId, user_name: userName },
    })
  }
  function joinRoomApi(roomId: string, userId: string, name: string) {
    return $fetch<Room>(`${API_URL}/rooms/${roomId}/join`, {
      method: 'POST',
      body: { user_id: userId, name },
    })
  }
  function connectRoomWSApi(
    roomId: string,
    onMessage: (room: Room) => void,
    onOpen?: () => void,
    onClose?: () => void,
    onReaction?: (reaction: ReactionEvent) => void,
    onError?: (message: string) => void,
  ): WebSocket {
    const url = new URL(`${API_URL}/rooms/ws/${roomId}`)
    url.protocol = url.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(url)
    ws.onopen = () => onOpen?.()
    ws.onclose = () => onClose?.()
    ws.onerror = () => onError?.('Соединение с комнатой потеряно. Обновите страницу.')
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as
          Room | ReactionEvent | { type: 'error'; message: string }
        if ('type' in data) {
          if (data.type === 'reaction') onReaction?.(data)
          else onError?.(data.message)
          return
        }
        onMessage(data)
      } catch {
        onError?.('Не удалось прочитать обновление комнаты')
      }
    }
    return ws
  }
  function send(ws: WebSocket, message: Record<string, unknown>) {
    if (ws.readyState !== WebSocket.OPEN) return false
    ws.send(JSON.stringify(message))
    return true
  }
  function sendVoteApi(ws: WebSocket, userId: string, vote: number) {
    return send(ws, { vote, user_id: userId })
  }
  function sendRevealApi(ws: WebSocket) {
    return send(ws, { reveal: true })
  }
  function sendResetApi(ws: WebSocket) {
    return send(ws, { reset: true })
  }
  function sendLeaveApi(ws: WebSocket, userId: string) {
    return send(ws, { leave: true, user_id: userId })
  }
  let nextReactionSide: 'left' | 'right' = 'left'
  function sendReactionApi(ws: WebSocket, userId: string, emoji: string, targetUserId?: string) {
    const sent = send(ws, {
      side: nextReactionSide,
      reaction: emoji,
      user_id: userId,
      target_user_id: targetUserId,
      style: 'throw',
    })
    if (sent) nextReactionSide = nextReactionSide === 'left' ? 'right' : 'left'
    return sent
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
    sendLeaveApi,
    sendReactionApi,
  }
}
