import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Room, Player } from '../../../api/rooms';
import { useRoomsApi } from '../../../api/rooms';
import { useAuthStore } from '@/entities/auth/model/use-auth-store';

const LOCAL_ROOM_KEY = 'planning-poker-current-room';

export const useRoomStore = defineStore('roomStore', () => {
  const auth = useAuthStore();
  const rooms = ref<Room[]>([]);
  const currentRoomId = ref<string | null>(null);

  const { fetchRoomsApi, fetchRoomApi, createRoomApi, joinRoomApi, sendVoteApi, sendRevealApi, sendResetApi } = useRoomsApi()

  if (process.client) {
    const saved = localStorage.getItem(LOCAL_ROOM_KEY);
    if (saved) currentRoomId.value = saved;
  }

  watch(currentRoomId, id => {
    if (process.client) localStorage.setItem(LOCAL_ROOM_KEY, id || '');
  });

  const currentRoom = computed(() => rooms.value.find(r => r.id === currentRoomId.value) || null);
  const publicRooms = computed(() => rooms.value);

  async function loadRooms() {
    rooms.value = await fetchRoomsApi();
  }

  async function loadRoom(roomId: string) {
  const room = await fetchRoomApi(roomId);
  const index = rooms.value.findIndex(r => r.id === roomId);
  if (index >= 0) rooms.value[index] = room;
  else rooms.value.push(room);
  currentRoomId.value = roomId;
  
  return room;
}

async function createRoom(name: string, code: string) {
  if (!auth.user) throw new Error('User not logged in');

  const room = await createRoomApi(
    name,
    code,
    auth.user.id,
    auth.user.name
  );

  rooms.value.push(room);
  currentRoomId.value = room.id;

  return room.id;
}


function normalizeRoom(room: Room): Room {
  const normalizedPlayers = room.players.map(p => ({
    ...p,
    user_id: p.user_id?.toString() || ''
  }));
  return {
    ...room,
    players: normalizedPlayers
  };
}

async function joinRoom(roomId: string) {
  if (!auth.user) throw new Error('User not logged in');

  const room = await joinRoomApi(roomId, auth.user.id, auth.user.name);
  const index = rooms.value.findIndex(r => r.id === roomId);
  if (index >= 0) rooms.value[index] = normalizeRoom(room);
  else rooms.value.push(normalizeRoom(room));

  currentRoomId.value = roomId;
}

async function joinByNameAndCode(name: string, code: string) {
  const freshRooms = await fetchRoomsApi();
  rooms.value = freshRooms.map(normalizeRoom);

  const room = rooms.value.find(r => r.name === name && r.code === code);
  if (!room) throw new Error('Комната не найдена');

  await joinRoom(room.id);

  return rooms.value.find(r => r.id === room.id)!;
}


function leaveRoom(roomId: string, userId: string) {
  const room = rooms.value.find(r => r.id === roomId)
  if (!room) return

  room.players = room.players.filter(p => p.user_id !== userId)

  if (room.players.length === 0) {
    rooms.value = rooms.value.filter(r => r.id !== roomId)
  }
}

function updateRoom(room: Room) {
  const index = rooms.value.findIndex(r => r.id === room.id)
  if (index >= 0) {
    rooms.value[index] = normalizeRoom(room)
  } else {
    rooms.value.push(normalizeRoom(room))
  }

  currentRoomId.value = room.id
}

  return {
    rooms,
    currentRoomId,
    currentRoom,
    publicRooms,
    loadRooms,
    loadRoom,
    createRoom,
    joinRoom,
    updateRoom,
    leaveRoom,
    joinByNameAndCode,
  };
});
