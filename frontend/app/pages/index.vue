<template>
  <div class="login-page">
    <div class="tabs">
      <button :class="{active: activeTab==='join'}" @click="activeTab='join'">
        Войти в комнату
      </button>
      <button :class="{active: activeTab==='create'}" @click="activeTab='create'">
        Создать комнату
      </button>
    </div>

    <div class="form">
      <input v-model="name" placeholder="Название комнаты" />
      <input v-model="code" placeholder="Код доступа" />

      <button v-if="activeTab==='join'" @click="joinRoom">Войти</button>
      <button v-if="activeTab==='create'" @click="createRoom">Создать</button>

      <p class="error" v-if="error">{{ error }}</p>
    </div>

    <div v-if="auth.user && myRooms.length" class="my-rooms">
      <h3>Ваши комнаты</h3>
      <table>
        <thead>
          <tr>
            <th>Название</th>
            <th>Код</th>
            <th>Действие</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="room in myRooms" :key="room.id">
            <td>{{ room.name }}</td>
            <td>{{ room.code }}</td>
            <td>
              <button @click="enterRoom(room.id)">Войти</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-else-if="auth.user">
      <p>Вы пока не в каких комнатах</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useRoomStore } from '@/entities/room/model/use-room-store'
import { useAuthStore } from '@/entities/auth/model/use-auth-store'

const roomStore = useRoomStore()
const auth = useAuthStore()
const router = useRouter()

const activeTab = ref<'join' | 'create'>('join')
const name = ref('')
const code = ref('')
const error = ref('')

let ws: WebSocket | null = null

function connectWS(roomId: string) {
  ws = new WebSocket(`ws://127.0.0.1:8000/rooms/ws/${roomId}`)

  ws.onopen = () => {
    console.log('Connected to room WS:', roomId)
  }

  ws.onmessage = event => {
    const data = JSON.parse(event.data)
    roomStore.updateRoom(data)
  }

  ws.onclose = () => {
    console.log('Disconnected from WS:', roomId)
  }
}

function sendWS(payload: object) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload))
  }
}

onMounted(async () => {
  try {
    await roomStore.loadRooms()
  } catch {
    error.value = 'Ошибка загрузки комнат'
  }
})

async function createRoom() {
  error.value = ''
  if (!name.value || !code.value) return

  try {
    const id = await roomStore.createRoom(name.value, code.value)
    enterRoom(id)
    router.push(`/room/${id}`)
  } catch (e: any) {
    error.value = e.message || 'Ошибка создания комнаты'
  }
}

async function joinRoom() {
  error.value = ''
  if (!name.value || !code.value) return

  try {
    const room = await roomStore.joinByNameAndCode(name.value, code.value)
    enterRoom(room.id)
    router.push(`/room/${room.id}`)
  } catch {
    error.value = 'Комната не найдена или неверный код'
  }
}

const myRooms = computed(() => {
  if (!auth.user) return []
  return roomStore.rooms.filter(room =>
    room.players.some(p => p.user_id === auth.user!.id)
  )
})

function enterRoom(roomId: string) {
  connectWS(roomId)
  router.push(`/room/${roomId}`)
}
</script>

<style scoped>
.login-page {
  max-width: 400px;
  margin: 100px auto;
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.tabs {
  display: flex;
  margin-bottom: 20px;
}

.tabs button {
  flex: 1;
  padding: 10px;
  border: none;
  background: #f1f5f9;
  cursor: pointer;
  border-radius: 8px 8px 0 0;
  font-weight: bold;
}

.tabs button.active {
  background: #4caf50;
  color: white;
}

.form input {
  display: block;
  width: 100%;
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
}

.form button {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: none;
  background: #4caf50;
  color: white;
  cursor: pointer;
}

.form button:hover {
  background-color: #43a047;
}

.error {
  color: red;
  margin-top: 10px;
  text-align: center;
}

.my-rooms {
  margin-top: 40px;
}

.my-rooms table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

.my-rooms th,
.my-rooms td {
  padding: 10px;
  border: 1px solid #ddd;
  text-align: center;
}

.my-rooms th {
  background-color: #f3f4f6;
}

.my-rooms button {
  padding: 6px 12px;
  border: none;
  border-radius: 6px;
  background-color: #4caf50;
  color: white;
  cursor: pointer;
}

.my-rooms button:hover {
  background-color: #43a047;
}
</style>
