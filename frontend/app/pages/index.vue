<template>
  <div class="lobby">
    <p v-if="route.query.removed" class="notice removed-notice" role="status">
      Вас удалили из комнаты. Вы можете войти в неё снова по названию и коду.
    </p>
    <section class="lobby-panel" aria-labelledby="lobby-title">
      <header class="lobby-heading">
        <h1 id="lobby-title">Комнаты</h1>
        <div class="mini-deck" aria-hidden="true">
          <span>
            3
            <small>♠</small>
          </span>
          <span>
            5
            <small>♠</small>
          </span>
          <span>
            8
            <small>♠</small>
          </span>
        </div>
      </header>
      <div class="room-workspace">
        <section class="my-rooms" aria-labelledby="my-rooms-title">
          <div class="section-heading">
            <h2 id="my-rooms-title">
              Ваши комнаты
              <span class="room-count">{{ myRooms.length }}</span>
            </h2>
            <button
              class="refresh"
              :disabled="refreshing"
              @click="refreshRooms"
              aria-label="Обновить список комнат"
            >
              ↻
            </button>
          </div>
          <p v-if="roomsError" class="error" role="alert">{{ roomsError }}</p>
          <div v-if="myRooms.length" class="rooms-list">
            <article v-for="room in myRooms" :key="room.id" class="room-card">
              <span class="room-icon" aria-hidden="true">♠</span>
              <div class="room-info">
                <h3>{{ room.name }}</h3>
                <p>{{ room.players.length }} участников · Код: {{ room.code }}</p>
              </div>
              <button
                class="room-enter"
                :aria-label="`Войти в ${room.name}`"
                :disabled="busy"
                @click="enterRoom(room.id)"
              >
                ↗
              </button>
            </article>
          </div>
          <p v-else-if="refreshing" class="list-state" role="status">Загружаем…</p>
          <div v-else-if="!roomsError" class="empty-rooms">
            <span aria-hidden="true">♧</span>
            <p>Пока нет комнат</p>
          </div>
        </section>
        <section class="room-form-panel" aria-labelledby="room-form-title">
          <h2 id="room-form-title">
            {{ activeTab === 'join' ? 'Войти в другую' : 'Новая комната' }}
          </h2>
          <div class="segmented" aria-label="Действие с комнатой">
            <button :aria-pressed="activeTab === 'join'" @click="setMode('join')">Войти</button>
            <button :aria-pressed="activeTab === 'create'" @click="setMode('create')">
              Создать
            </button>
          </div>
          <form class="room-form" @submit.prevent="submitRoom">
            <label class="field">
              Название комнаты
              <input v-model="name" placeholder="Название" required :disabled="busy" />
            </label>
            <label class="field">
              Код комнаты
              <input v-model="code" placeholder="Код" required :disabled="busy" />
            </label>
            <p v-if="error" class="error" role="alert">{{ error }}</p>
            <button class="button button-primary" :disabled="busy">
              {{
                busy
                  ? 'Подождите…'
                  : activeTab === 'join'
                    ? 'Войти в комнату ↗'
                    : 'Создать комнату ↗'
              }}
            </button>
          </form>
        </section>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoomStore } from '@/entities/room/model/use-room-store'
import { useAuthStore } from '@/entities/auth/model/use-auth-store'
const roomStore = useRoomStore()
const auth = useAuthStore()
const route = useRoute()
const router = useRouter()
const activeTab = ref<'join' | 'create'>('join')
const name = ref('')
const code = ref('')
const error = ref('')
const roomsError = ref('')
const busy = ref(false)
function setMode(mode: 'join' | 'create') {
  activeTab.value = mode
  error.value = ''
}

const refreshing = ref(false)
const myRooms = computed(() =>
  roomStore.rooms.filter((room) => room.players.some((p) => p.user_id === auth.user?.id)),
)
async function refreshRooms() {
  if (refreshing.value) return
  refreshing.value = true
  roomsError.value = ''
  try {
    await roomStore.loadRooms()
  } catch {
    roomsError.value = 'Не удалось загрузить комнаты. Попробуйте обновить список.'
  } finally {
    refreshing.value = false
  }
}
async function submitRoom() {
  if (busy.value) return
  error.value = ''
  if (!name.value.trim() || !code.value.trim()) {
    error.value = 'Введите название и код комнаты'
    return
  }
  busy.value = true
  try {
    const roomId =
      activeTab.value === 'create'
        ? await roomStore.createRoom(name.value.trim(), code.value.trim())
        : (await roomStore.joinByNameAndCode(name.value.trim(), code.value.trim())).id
    await router.push(`/room/${roomId}`)
  } catch {
    error.value =
      activeTab.value === 'join'
        ? 'Не удалось войти. Проверьте название, код комнаты и соединение.'
        : 'Не удалось создать комнату. Попробуйте ещё раз.'
  } finally {
    busy.value = false
  }
}
async function enterRoom(roomId: string) {
  if (busy.value) return
  busy.value = true
  error.value = ''
  try {
    await roomStore.joinRoom(roomId)
    await router.push(`/room/${roomId}`)
  } catch {
    error.value = 'Не удалось войти в комнату. Обновите список и попробуйте ещё раз.'
  } finally {
    busy.value = false
  }
}
onMounted(() => {
  refreshRooms()
  window.addEventListener('focus', refreshRooms)
})
onBeforeUnmount(() => window.removeEventListener('focus', refreshRooms))
</script>

<style scoped>
.lobby {
  max-width: 1000px;
  margin: 0 auto;
}
.removed-notice {
  margin-bottom: 20px;
}
.lobby-panel {
  border: 1px solid var(--line);
  border-radius: 24px;
  background: white;
  box-shadow: 0 12px 35px #20372d04;
  overflow: hidden;
}
.lobby-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  min-height: 130px;
  padding: 14px 32px;
  border-bottom: 1px solid var(--line);
  background: #fafbf7;
}
h1 {
  font-size: 32px;
  font-weight: 600;
}
.mini-deck {
  display: flex;
  align-items: center;
  flex-shrink: 0;
  height: 110px;
  padding: 13px 12px 0;
}
.mini-deck > span {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 5px;
  width: 67px;
  height: 93px;
  border-radius: 9px;
  border: 1px solid #d7e0cf;
  background: white;
  font-size: 30px;
  font-weight: 600;
  box-shadow: 0 5px 10px #20372d08;
  transform: rotate(-17deg);
}
.mini-deck > span:nth-child(2) {
  background: var(--accent);
  color: white;
  margin-left: -12px;
  transform: translateY(-10px) rotate(-2deg);
  border-color: var(--accent);
  z-index: 1;
}
.mini-deck > span:nth-child(3) {
  background: var(--lime);
  margin-left: -9px;
  transform: rotate(14deg);
}
.mini-deck small {
  font-size: 13px;
  font-weight: 400;
}
.room-workspace {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
}
.my-rooms,
.room-form-panel {
  padding: 28px 32px 32px;
  min-width: 0;
}
.room-form-panel {
  border-left: 1px solid var(--line);
}
h2 {
  font-size: 20px;
  font-weight: 600;
}
.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  min-height: 32px;
  margin-bottom: 18px;
}
.section-heading h2 {
  display: flex;
  align-items: center;
  gap: 10px;
}
.room-count {
  display: grid;
  place-items: center;
  min-width: 26px;
  height: 26px;
  padding: 0 6px;
  border-radius: 8px;
  background: #edf2e6;
  color: #71875b;
  font-size: 13px;
  font-weight: 500;
}
.refresh {
  display: grid;
  place-items: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--line);
  border-radius: 9px;
  background: white;
  color: var(--muted);
  font-size: 22px;
}
.refresh:hover:not(:disabled) {
  background: #f0f5e8;
  color: var(--accent);
}
.rooms-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: 300px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #c9d5bd transparent;
}
.room-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: 14px;
  background: #fafbf8;
}
.room-icon {
  display: grid;
  place-items: center;
  width: 32px;
  height: 40px;
  flex-shrink: 0;
  border: 1px solid #e3e9da;
  border-radius: 7px;
  background: #f0f5e8;
  color: #8ea47a;
  font-size: 23px;
}
.room-info {
  min-width: 0;
}
.room-info h3 {
  font-size: 15px;
  font-weight: 600;
  overflow-wrap: anywhere;
}
.room-info p {
  margin-top: 6px;
  color: var(--muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
.room-enter {
  display: grid;
  place-items: center;
  margin-left: auto;
  flex-shrink: 0;
  width: 36px;
  height: 36px;
  border: 1px solid #dde6d3;
  border-radius: 10px;
  background: white;
  color: var(--accent);
  font-size: 22px;
}
.room-enter:hover:not(:disabled) {
  background: var(--lime);
}
.empty-rooms {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 190px;
  color: var(--muted);
  font-size: 14px;
  border: 1px dashed var(--line);
  border-radius: 14px;
}
.empty-rooms > span {
  color: #a5b495;
  font-size: 38px;
}
.list-state {
  padding: 24px 0;
  color: var(--muted);
  font-size: 14px;
}
.segmented {
  margin: 20px 0;
}
.room-form {
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.field {
  font-size: 14px;
}
.room-form > .button {
  margin-top: 3px;
  width: 100%;
  font-size: 14px;
  min-height: 46px;
}
@media (max-width: 760px) {
  .room-workspace {
    grid-template-columns: minmax(0, 1fr);
  }
  .room-form-panel {
    border-left: 0;
    border-top: 1px solid var(--line);
  }
  .my-rooms,
  .room-form-panel {
    padding: 22px;
  }
  .rooms-list {
    max-height: 250px;
  }
  .empty-rooms {
    min-height: 90px;
    flex-direction: row;
  }
}
@media (max-width: 480px) {
  .lobby-panel {
    border-radius: 18px;
  }
  .lobby-heading {
    min-height: 105px;
    padding: 12px 22px;
    gap: 16px;
  }
  h1 {
    font-size: 27px;
  }
  .mini-deck {
    height: 80px;
    padding: 10px 6px 0;
  }
  .mini-deck > span {
    width: 48px;
    height: 67px;
    font-size: 25px;
    border-radius: 7px;
  }
  .mini-deck small {
    font-size: 11px;
  }
  .room-icon {
    display: none;
  }
}
</style>
