<template>
  <div class="login-page">
    <h1 class="title">Planning Poker</h1>

    <div class="mode-switch">
      <div
        class="mode-pill"
        :class="{ active: activeTab === 'join' }"
        @click="activeTab = 'join'"
      >
        Войти
      </div>
      <div
        class="mode-pill"
        :class="{ active: activeTab === 'create' }"
        @click="activeTab = 'create'"
      >
        Создать
      </div>
    </div>

    <div class="form">
      <input v-model="name" placeholder="Название комнаты" />
      <input v-model="code" placeholder="Код доступа" />

      <button class="primary" @click="activeTab === 'join' ? joinRoom() : createRoom()">
        {{ activeTab === 'join' ? 'Войти в комнату' : 'Создать комнату' }}
      </button>

      <p class="error" v-if="error">{{ error }}</p>
    </div>

    <div v-if="auth.user && myRooms.length" class="my-rooms">
      <h3>Ваши комнаты</h3>

      <div class="rooms-list">
        <div class="room-card" v-for="room in myRooms" :key="room.id">
          <div class="room-info">
            <p class="room-name">{{ room.name }}</p>
            <p class="room-code">Код: {{ room.code }}</p>
          </div>
          <button @click="enterRoom(room.id)">Войти</button>
        </div>
      </div>
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

onMounted(async () => {
  try {
    await roomStore.loadRooms()
  } catch {
    error.value = 'Ошибка загрузки комнат'
  }
})

async function createRoom() {
  error.value = ''
  if (!name.value || !code.value) {
    error.value = 'Введите название и код'
    return
  }

  try {
    const roomId = await roomStore.createRoom(name.value, code.value)
    router.push(`/room/${roomId}`)
  } catch (e: any) {
    error.value = e.message || 'Ошибка создания комнаты'
  }
}

async function joinRoom() {
  error.value = ''
  if (!name.value || !code.value) {
    error.value = 'Введите название и код'
    return
  }

  try {
    const room = await roomStore.joinByNameAndCode(name.value, code.value)
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
  router.push(`/room/${roomId}`)
}
</script>

<style scoped>

.mode-switch {
  display: flex;
  background: #e9e9f3;
  border-radius: 999px;
  padding: 4px;
  margin-bottom: 28px;
}

.mode-pill {
  flex: 1;
  padding: 10px 0;
  text-align: center;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
  color: #5b5b7a;
  transition: all 0.25s ease;
}

.mode-pill.active {
  background: #4a00e0;
  color: #fff;
  box-shadow: 0 6px 14px rgba(142,45,226,0.35);
}

.form input {
  width: 100%;
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  font-size: 14px;
}

.form input:focus {
  outline: none;
  border-color: #8e2de2;
  box-shadow: 0 0 6px rgba(142,45,226,0.25);
}

button.primary {
  width: 100%;
  padding: 14px;
  margin-top: 10px;
  border-radius: 14px;
  border: none;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  background: #4a00e0;
  color: white;
  transition: all 0.25s ease;
}

button.primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 22px rgba(74,0,224,0.35);
}

.error {
  margin-top: 12px;
  color: #e74c3c;
  font-size: 14px;
  text-align: center;
}


.login-page {
  max-width: 500px;
  margin: 20px auto;
  padding: 30px 20px;
  background: linear-gradient(145deg, #fdfbfb, #ebedee);
  border-radius: 16px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.1);
  text-align: center;
  font-family: 'Poppins', sans-serif;
}

.title {
  font-size: 30px;
  margin-bottom: 20px;
  color: #4b4b6a;
  font-weight: 700;
}

.tabs {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-bottom: 25px;
}

.tabs button {
  flex: 1;
  padding: 12px 0;
  border: none;
  border-radius: 10px;
  background: #e0e0e5;
  cursor: pointer;
  font-weight: 600;
  color: #4b4b6a;
  transition: all 0.3s;
}

.tabs button.active {
  background: #4a00e0;
  color: #fff;
  box-shadow: 0 6px 16px rgba(138,43,226,0.4);
  transform: translateY(-2px);
}

.form input {
  width: 95%;
  margin-bottom: 14px;
  padding: 12px;
  border-radius: 12px;
  border: 1px solid #d1d5db;
  font-size: 14px;
  transition: all 0.3s;
}

.form input:focus {
  outline: none;
  border-color: #8e2de2;
  box-shadow: 0 0 6px rgba(142,45,226,0.3);
}

.form button {
  width: 100%;
  padding: 12px;
  margin-top: 6px;
  border: none;
  border-radius: 12px;
  background: #4a00e0;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.form button:hover {
  background: #4a00e0;
  transform: translateY(-2px);
}

.error {
  margin-top: 10px;
  color: #e74c3c;
  font-size: 14px;
}

.my-rooms {
  margin-top: 35px;
}

.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.room-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(135deg, #ffffff, #f0f0f5);
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.06);
  transition: all 0.3s;
}

.room-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(138,43,226,0.2);
}

.room-info {
  text-align: left;
}

.room-name {
  font-weight: 600;
  color: #4b4b6a;
}

.room-code {
  font-size: 13px;
  color: #7d7d9a;
}

.room-card button {
  background: #4a00e0;
  color: white;
  border: none;
  border-radius: 10px;
  padding: 8px 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
}

.no-rooms {
  margin-top: 20px;
  color: #7d7d9a;
}
</style>
