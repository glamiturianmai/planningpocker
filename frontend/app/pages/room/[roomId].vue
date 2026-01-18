<template>
  <div v-if="room" class="room-page">
    <h1 class="room-title">Комната: {{ room.name }}</h1>

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
        {{ (room.revealed || p.user_id === auth.user?.id) ? formatVote(p.vote) : '-' }}
      </p>
      </div>
    </div>

    <VoteSelector
      :revealed="room.revealed"
      :hasPlayer="!!currentPlayer"
      :selectedVote="currentPlayer?.vote ?? undefined"
      @select="setVote"
    />

    <ResultsPanel :players="room.players" :revealed="room.revealed" />

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
import { computed, onMounted, onBeforeUnmount, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useRoomStore } from '@/entities/room/model/use-room-store';
import { useAuthStore } from '@/entities/auth/model/use-auth-store';
import VoteSelector from '@/features/vote/ui/VoteSelector.vue';
import ResultsPanel from '@/widgets/results/ui/ResultsPanel.vue';

const route = useRoute();
const roomStore = useRoomStore();
const auth = useAuthStore();

const roomId = route.params.roomId as string;
const room = ref(roomStore.rooms.find(r => r.id === roomId) || null);

let ws: WebSocket | null = null;

function connectWS() {
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${protocol}://${location.hostname}:8000/rooms/ws/${roomId}`);

  ws.onopen = () => console.log('Connected to room WS');

  ws.onmessage = event => {
    try {
      const data = JSON.parse(event.data);
      room.value = data;
      roomStore.updateRoom(data);
    } catch (e) {
      console.error('Invalid WS message', e);
    }
  };

  ws.onclose = () => console.log('Disconnected from WS');
  ws.onerror = e => console.error('WS error', e);
}

function sendWS(payload: object) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  } else {
    console.warn('WS not ready', payload);
  }
}

const currentPlayer = computed(() => {
  if (!room.value || !auth.user) return null;
  return room.value.players.find(p => p.user_id === auth.user?.id) || null;
});

const votedCount = computed(() => room.value?.players.filter(p => p.vote !== null).length ?? 0);
const allVoted = computed(() => room.value?.players.every(p => p.vote !== null) ?? false);

function setVote(value: number) {
  if (!currentPlayer.value || room.value?.revealed) return;
  sendWS({ vote: value, user_id: auth.user!.id });
}

function revealCards() {
  if (!room.value) return;
  sendWS({ reveal: true });
}

function resetCards() {
  if (!room.value) return;
  sendWS({ reset: true });
}

function formatVote(vote: number | null) {
  if (vote === null) return '-';
  return Number.isInteger(vote) ? String(vote) : vote.toFixed(1);
}

onMounted(() => connectWS());
onBeforeUnmount(() => ws?.close());
</script>

<style scoped>
.room-page { padding: 20px; max-width: 900px; margin: 0 auto; text-align: center; background: #fafafa; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.room-title { font-size: 28px; font-weight: bold; margin-bottom: 10px; color: #111827; }

.players { display: flex; gap: 16px; flex-wrap: wrap; justify-content: center; margin: 20px 0; }
.player-card { width: 100px; height: 140px; background: #f3f4f6; border-radius: 12px; display: flex; flex-direction: column; justify-content: center; align-items: center; font-weight: bold; box-shadow: 0 2px 6px rgba(0,0,0,0.05); border: 2px solid transparent; transition: transform 0.2s, box-shadow 0.2s, border 0.2s; }
.player-card.current { background-color: #e8eefe; }
.player-card.voted { box-shadow: 0 0 8px 2px rgba(16,185,129,0.6); }
.player-card.notVoted { box-shadow: 0 0 8px 2px rgba(239,68,68,0.6); }
.player-card .player-name { font-size: 14px; margin-bottom: 10px; color: #111827; text-align: center; }
.player-card .player-vote { font-size: 24px; color: #111827; }

.control { margin-top: 25px; padding: 12px 28px; font-size: 16px; border: none; border-radius: 8px; cursor: pointer; background-color: #3b82f6; color: white; transition: background 0.2s; }
.control:hover { background-color: #2563eb; }
.control.ready { background-color: #10b981; }

.room-not-found { text-align: center; margin-top: 100px; font-size: 18px; color: #6b7280; }
</style>
