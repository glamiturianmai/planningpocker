import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import type { Room, Player } from '../../../api/rooms';
import * as api from '../../../api/rooms';
import { useAuthStore } from '@/entities/auth/model/use-auth-store';

const LOCAL_ROOM_KEY = 'planning-poker-current-room';

export const useRoomStore = defineStore('roomStore', () => {
  const auth = useAuthStore();
  const rooms = ref<Room[]>([]);
  const currentRoomId = ref<string | null>(null);

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
    rooms.value = await api.fetchRooms();
  }

  async function loadRoom(roomId: string) {
    const room = await api.fetchRoom(roomId);
    const index = rooms.value.findIndex(r => r.id === roomId);
    if (index >= 0) rooms.value[index] = room;
    else rooms.value.push(room);
    currentRoomId.value = roomId;
  }

async function createRoom(name: string, code: string) {
  if (!auth.user) throw new Error('User not logged in');

  const room = await api.createRoom(
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

  const room = await api.joinRoom(roomId, auth.user.id, auth.user.name);
  const index = rooms.value.findIndex(r => r.id === roomId);
  if (index >= 0) rooms.value[index] = normalizeRoom(room);
  else rooms.value.push(normalizeRoom(room));

  currentRoomId.value = roomId;
}

async function joinByNameAndCode(name: string, code: string) {
  const freshRooms = await api.fetchRooms();
  rooms.value = freshRooms.map(normalizeRoom);

  const room = rooms.value.find(r => r.name === name && r.code === code);
  if (!room) throw new Error('Комната не найдена');

  await joinRoom(room.id);

  return rooms.value.find(r => r.id === room.id)!;
}




  async function setVote(value: number) {
    if (!currentRoom.value || !auth.user) return;
    const room = await api.vote(currentRoom.value.id, auth.user.id, value);
    const index = rooms.value.findIndex(r => r.id === room.id);
    rooms.value[index] = room;
  }

  async function revealCards() {
    if (!currentRoom.value) return;
    const room = await api.reveal(currentRoom.value.id);
    const index = rooms.value.findIndex(r => r.id === room.id);
    rooms.value[index] = room;
  }

  async function resetCards() {
    if (!currentRoom.value) return;
    const room = await api.reset(currentRoom.value.id);
    const index = rooms.value.findIndex(r => r.id === room.id);
    rooms.value[index] = room;
  }

  function leaveRoom() {
    currentRoomId.value = null;
    if (process.client) localStorage.removeItem(LOCAL_ROOM_KEY);
  }

  async function updateRoom(updatedRoom: Room) {
  const index = rooms.value.findIndex(r => r.id === updatedRoom.id);
  if (index >= 0) rooms.value[index] = updatedRoom;
  else rooms.value.push(updatedRoom);

  if (currentRoomId.value === updatedRoom.id) {
    currentRoomId.value = updatedRoom.id;
  }
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
    setVote,
    revealCards,
    resetCards,
    leaveRoom,
    joinByNameAndCode,
    updateRoom,
  };
});
