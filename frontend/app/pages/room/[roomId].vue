<template>
  <div v-if="room" class="room-page">
    <div class="room-header">
      <h1 class="room-title">Комната: {{ room.name }}</h1>
      <button class="leave-btn" @click="leaveRoom">Выйти из комнаты</button>
    </div>

    <div class="players">
      <div
        v-for="p in room.players"
        :key="p.id"
        class="player-card"
        :class="[
          { current: p.user_id === auth.user?.id },
          { voted: p.vote !== null },
          { notVoted: room.revealed && p.vote === null }
        ]"
      >
        <p class="player-name">{{ p.name }}</p>
        <p class="player-vote">
          {{ (room.revealed || p.user_id === auth.user?.id)
            ? formatVote(p.vote)
            : '?' }}
        </p>
      </div>
    </div>

    <VoteSelector
      :revealed="room.revealed"
      :hasPlayer="!!currentPlayer"
      :selectedVote="currentPlayer?.vote ?? undefined"
      @select="setVote"
    />

    <ResultsPanel
      :players="room.players"
      :revealed="room.revealed"
    />

    <button
      class="control"
      @click="room.revealed ? resetCards() : revealCards()"
      :class="{ ready: allVoted && !room.revealed }"
    >
      {{ room.revealed ? 'Сбросить карты' : 'Открыть карты' }}
    </button>
  </div>

  <div v-else class="room-not-found">
    <p>Комната не найдена. Вернитесь на <NuxtLink to="/">главную</NuxtLink></p>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRoomStore } from '@/entities/room/model/use-room-store'
import { useAuthStore } from '@/entities/auth/model/use-auth-store'
import { useRoomsApi } from '@/api/rooms'

import VoteSelector from '@/features/vote/ui/VoteSelector.vue'
import ResultsPanel from '@/widgets/results/ui/ResultsPanel.vue'

const route = useRoute()
const router = useRouter()

const roomStore = useRoomStore()
const auth = useAuthStore()

const {
  connectRoomWSApi,
  sendVoteApi,
  sendRevealApi,
  sendResetApi,
} = useRoomsApi()

const roomId = route.params.roomId as string

let ws: WebSocket | null = null

const room = computed(() => roomStore.currentRoom)

const currentPlayer = computed(() => {
  if (!room.value || !auth.user) return null
  return room.value.players.find(p => p.user_id === auth.user!.id) || null
})

const allVoted = computed(() =>
  room.value?.players.every(p => p.vote !== null) ?? false
)

function connectWS() {
  ws = connectRoomWSApi(roomId, (room) => {
    roomStore.updateRoom(room)
  })
}

function setVote(value: number) {
  if (!ws || !auth.user || room.value?.revealed) return
  sendVoteApi(ws, auth.user.id, value)
}

function revealCards() {
  if (!ws) return
  sendRevealApi(ws)
}

function resetCards() {
  if (!ws) return
  sendResetApi(ws)
}

function leaveRoom() {
  if (!ws || !auth.user) return

  ws.send(JSON.stringify({
    leave: true,
    user_id: auth.user.id
  }))

  ws.close()
  roomStore.currentRoomId = null
  router.push('/')
}

function formatVote(vote: number | null) {
  if (vote === null) return '-'
  return Number.isInteger(vote) ? String(vote) : vote.toFixed(1)
}

onMounted(async () => {
  await roomStore.loadRoom(roomId)
  connectWS()
})

onBeforeUnmount(() => {
  ws?.close()
})
</script>


<style scoped>
.room-page {
  padding: 28px;
  max-width: 1000px;
  margin: 60px auto;
  text-align: center;
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 20px 40px rgba(30, 20, 80, 0.08);
}

.room-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.room-title {
  font-size: 30px;
  font-weight: 700;
  background: #4a00e0;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.leave-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 12px;
  background:  linear-gradient(135deg, #ede9fe, #f5f3ff);
  color: #4a00e0;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.players {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  justify-content: center;
  margin: 30px 0;
}

.player-card {
  width: 110px;
  height: 150px;
  background: #f4f5fb;
  border-radius: 18px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-weight: 600;
  border: 2px solid transparent;
  transition: all 0.25s ease;
}
.player-card.current { background: linear-gradient(135deg, #ede9fe, #f5f3ff); transform: translateY(-4px); }
.player-card.voted { box-shadow: 0 0 0 2px rgb(19, 215, 39,0.35), 0 12px 28px rgba(19, 215, 39,0.2); }
.player-card.notVoted { box-shadow: 0 0 0 2px rgba(239,68,68,0.35), 0 12px 28px rgba(239,68,68,0.2); }

.player-name { font-size: 14px; margin-bottom: 12px; color: #2c2c3a; text-align: center; opacity: 0.85; }
.player-vote { font-size: 26px; font-weight: 700; color: #2c2c3a; }

.control {
  margin-top: 36px;
  padding: 14px 36px;
  font-size: 16px;
  border: none;
  border-radius: 16px;
  cursor: pointer;
  background: #4a00e0;
  color: white;
  font-weight: 600;
  transition: all 0.25s ease;
}
.control:hover { transform: translateY(-2px); }

.room-not-found { text-align: center; margin-top: 120px; font-size: 18px; color: #6b6b85; }
</style>
