<template>
  <div class="room-page">
    <div class="room-header">
      <div class="room-heading">
        <h1 :title="room?.name">{{ room?.name ?? 'Подключаемся…' }}</h1>
      </div>
      <div v-if="room" class="room-actions">
        <span class="room-code">
          Код комнаты
          <b :title="room.code">{{ room.code }}</b>
        </span>
        <NuxtLink to="/" class="button button-secondary">Все комнаты</NuxtLink>
      </div>
    </div>
    <p v-if="error" class="notice error" role="alert">{{ error }}</p>
    <div v-if="loading" class="loading-state" role="status">
      Готовим стол и раздаём карты…
    </div>
    <template v-else-if="room">
      <div class="room-grid">
        <section class="table" aria-label="Участники комнаты">
          <div class="table-heading">
            <div class="table-status">
              <span class="phase" :class="{ revealed: room.revealed }">
                <span />
                {{ room.revealed ? 'Карты открыты' : 'Голосование идёт' }}
              </span>
              <span class="player-count"
                >{{ votedCount }} / {{ room.players.length }} оценили</span
              >
            </div>
          </div>
          <TransitionGroup
            name="players"
            tag="div"
            class="players"
            :class="{
              'many-players': room.players.length > LARGE_CARD_PLAYER_LIMIT,
            }"
          >
            <PlayerCard
              v-for="player in room.players"
              :key="player.id"
              :player="player"
              :revealed="room.revealed"
              :is-self="player.user_id === auth.user?.id"
              :connected="connected"
              :compact="room.players.length > LARGE_CARD_PLAYER_LIMIT"
              @remove="removePlayer"
              @target="openReactionPicker"
              @leave="scheduleReactionClose"
            />
          </TransitionGroup>
          <div class="table-bottom">
            <div class="connection-info">
              <span v-if="!connected" class="connection" role="status"
                ><span />Нет соединения</span
              >
              <p
                v-if="averageVote !== null"
                class="round-average"
                role="status"
                aria-live="polite"
              >
                <span>Средняя оценка</span>
                <strong>{{ averageVote }} SP</strong>
              </p>
            </div>
            <button
              class="button round-button"
              :class="[
                room.revealed ? 'button-secondary' : 'button-primary',
                { 'all-voted': allVoted && !room.revealed },
              ]"
              :disabled="!connected || !currentPlayer"
              @click="room.revealed ? resetCards() : revealCards()"
            >
              {{ room.revealed ? '↻ Новый раунд' : 'Открыть карты ↗' }}
            </button>
          </div>
        </section>
        <VoteSelector
          class="vote-selector"
          :revealed="room.revealed"
          :has-player="!!currentPlayer"
          :selected-vote="currentPlayer?.vote ?? undefined"
          :connected="connected"
          @select="setVote"
        />
      </div>
    </template>
    <div v-else-if="!loading" class="loading-state">
      <p>Не удалось открыть комнату.</p>
      <NuxtLink to="/" class="button button-secondary"
        >Вернуться к комнатам</NuxtLink
      >
    </div>
    <ReactionPicker
      v-if="reactionTarget && reactionAnchor"
      :key="reactionTarget.id"
      :player="reactionTarget"
      :anchor="reactionAnchor"
      :hover="reactionHover"
      @enter="keepReactionOpen"
      @leave="scheduleReactionClose"
      @select="sendPlayerReaction"
      @close="closeReactionPicker"
    />
    <ReactionEffects ref="reactionEffects" />
  </div>
</template>

<script setup lang="ts">
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  shallowRef,
} from 'vue'
import { useAuthStore } from '@/entities/auth/model/use-auth-store'
import { useRoomStore } from '@/entities/room/model/use-room-store'
import { useRoomsApi } from '@/api/rooms'
import type { Player, ReactionEvent, Room } from '@/api/rooms'
import PlayerCard from '@/entities/player/ui/PlayerCard.vue'
import VoteSelector from '@/features/vote/ui/VoteSelector.vue'
import ReactionEffects from '@/features/reactions/ui/ReactionEffects.vue'
import ReactionPicker from '@/features/reactions/ui/ReactionPicker.vue'

const LARGE_CARD_PLAYER_LIMIT = 6
const REACTION_CLOSE_DELAY_MS = 350
const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const roomStore = useRoomStore()
const api = useRoomsApi()
const roomId = route.params.roomId as string
const loading = ref(true)
const connected = ref(false)
const leaving = ref(false)
const error = ref('')
const reactionHover = ref(false)
let reactionCloseTimer: ReturnType<typeof setTimeout> | undefined
const reactionTarget = ref<Player | null>(null)
const reactionAnchor = shallowRef<HTMLButtonElement | null>(null)
const reactionEffects = ref<InstanceType<typeof ReactionEffects>>()
let ws: WebSocket | null = null
let disposed = false
const room = computed(() => roomStore.rooms.find((r) => r.id === roomId))
const currentPlayer = computed(() =>
  room.value?.players.find((p) => p.user_id === auth.user?.id),
)
const votedCount = computed(
  () => room.value?.players.filter((p) => p.vote !== null).length ?? 0,
)
const allVoted = computed(
  () =>
    !!room.value?.players.length &&
    votedCount.value === room.value.players.length,
)

const averageVote = computed(() => {
  if (!room.value?.revealed) return null
  const votes = room.value.players
    .map((player) => player.vote)
    .filter((vote): vote is number => vote !== null)
  if (!votes.length) return null
  const average = votes.reduce((sum, vote) => sum + vote, 0) / votes.length
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(
    average,
  )
})

function receiveRoom(updatedRoom: Room) {
  roomStore.updateRoom(updatedRoom)
  if (
    reactionTarget.value &&
    !updatedRoom.players.some((p) => p.id === reactionTarget.value?.id)
  )
    closeReactionPicker()
  if (!updatedRoom.players.some((p) => p.user_id === auth.user?.id)) {
    roomStore.currentRoomId = null
    ws?.close()
    router.replace(leaving.value ? '/' : '/?removed=1')
  }
}
function receiveReaction(event: ReactionEvent) {
  reactionEffects.value?.play(event)
}
function setVote(value: number) {
  if (
    ws &&
    auth.user &&
    connected.value &&
    currentPlayer.value &&
    !room.value?.revealed
  )
    api.sendVoteApi(ws, auth.user.id, value)
}
function revealCards() {
  if (ws) api.sendRevealApi(ws)
}
function resetCards() {
  if (ws) api.sendResetApi(ws)
}
function removePlayer(player: Player) {
  if (!ws || !player.user_id || !connected.value) return
  const isSelf = player.user_id === auth.user?.id
  if (isSelf) leaving.value = true
  if (!api.sendLeaveApi(ws, player.user_id) && isSelf) leaving.value = false
}
function openReactionPicker(
  player: Player,
  anchor: HTMLButtonElement,
  hover = false,
) {
  if (!connected.value || !currentPlayer.value) return
  keepReactionOpen()
  reactionHover.value = hover
  reactionTarget.value = player
  reactionAnchor.value = anchor
}
function keepReactionOpen() {
  clearTimeout(reactionCloseTimer)
}
function scheduleReactionClose() {
  if (!reactionHover.value) return
  keepReactionOpen()
  reactionCloseTimer = setTimeout(
    () => closeReactionPicker(false),
    REACTION_CLOSE_DELAY_MS,
  )
}
function closeReactionPicker(restoreFocus = true) {
  keepReactionOpen()
  const anchor = reactionAnchor.value
  reactionTarget.value = null
  reactionAnchor.value = null
  nextTick(() => {
    if (restoreFocus && anchor?.isConnected)
      anchor.focus({ preventScroll: true })
  })
}
function sendPlayerReaction(emoji: string) {
  if (!ws || !auth.user || !reactionTarget.value?.user_id) return
  api.sendReactionApi(ws, auth.user.id, emoji, reactionTarget.value.user_id)
}
onMounted(async () => {
  try {
    const snapshot = await roomStore.loadRoom(roomId)
    if (disposed) return
    if (!snapshot.players.some((p) => p.user_id === auth.user?.id)) {
      roomStore.currentRoomId = null
      await router.replace('/?removed=1')
      return
    }
    ws = api.connectRoomWSApi(
      roomId,
      receiveRoom,
      () => {
        connected.value = true
        error.value = ''
      },
      () => {
        connected.value = false
        closeReactionPicker()
        if (!disposed && !leaving.value)
          error.value =
            'Соединение закрыто. Обновите страницу, чтобы подключиться снова.'
      },
      receiveReaction,
      (message) => {
        error.value = message
      },
    )
  } catch {
    if (!disposed)
      error.value =
        'Комната недоступна. Проверьте соединение или вернитесь на главную.'
  } finally {
    loading.value = false
  }
})
onBeforeUnmount(() => {
  disposed = true
  keepReactionOpen()
  ws?.close()
})
</script>

<style scoped>
.room-page {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-height: 0;
  gap: 12px;
}
.room-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
  gap: 20px;
}
.room-heading {
  min-width: 0;
}
h1 {
  font-size: clamp(22px, 2.3vw, 28px);
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.room-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
}
.room-actions .button {
  font-size: 14px;
  min-height: 38px;
  padding: 9px 14px;
}
.room-code {
  display: flex;
  align-items: baseline;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
}
.room-code b {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  color: var(--ink);
  font-weight: 600;
}
.room-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  grid-template-rows: minmax(0, 1fr) auto;
  gap: 12px;
  flex: 1;
  min-height: 0;
}
.table {
  display: flex;
  flex-direction: column;
  min-height: 0;
  padding: 14px 20px;
  border: 1px solid var(--line);
  border-radius: 20px;
  background: #fff;
}
.table-heading,
.table-bottom {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.players.many-players {
  gap: 12px;
  padding-block: 7px;
}
.table-status {
  display: flex;
  align-items: center;
  gap: 18px;
}
.phase {
  display: flex;
  align-items: center;
  gap: 7px;
  font-size: 14px;
  color: var(--accent);
  font-weight: 600;
  white-space: nowrap;
}
.phase > span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #83a35a;
}
.phase.revealed > span {
  background: #d49453;
}
.player-count {
  font-size: 14px;
  color: #566b58;
  white-space: nowrap;
}
.players {
  display: flex;
  flex: 1;
  min-height: 0;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  align-content: safe center;
  gap: 16px 12px;
  padding: 10px 8px;
  overflow-y: auto;
  position: relative;
  scrollbar-width: thin;
  scrollbar-color: #b8c9a7 transparent;
}
.table-bottom {
  padding-top: 10px;
  border-top: 1px solid var(--line);
}
.connection-info {
  display: flex;
  align-items: center;
  gap: 16px;
  min-width: 0;
}
.connection {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #87977a;
  font-size: 13px;
  white-space: nowrap;
}
.connection > span {
  width: 5px;
  height: 5px;
  background: #b58373;
  border-radius: 50%;
}
.round-button {
  min-height: 38px;
  padding: 9px 18px;
  font-size: 14px;
  flex-shrink: 0;
}
.round-button.all-voted {
  box-shadow: 0 0 0 3px #c9dda9;
}
.round-average {
  display: flex;
  align-items: baseline;
  gap: 8px;
  min-width: 0;
  font-size: 14px;
  color: var(--muted);
}
.round-average strong {
  font-size: 18px;
  line-height: 1.2;
  color: var(--ink);
  overflow-wrap: anywhere;
}
.loading-state {
  margin: auto;
  padding: 20px;
  text-align: center;
  color: var(--muted);
}
.loading-state .button {
  margin-top: 20px;
}
.players-enter-active,
.players-leave-active,
.players-move {
  transition:
    opacity 0.3s,
    transform 0.3s;
}
.players-enter-from {
  opacity: 0;
  transform: translateY(24px) rotate(-5deg);
}
.players-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.85);
}
.players-leave-active {
  position: absolute;
}
@media (max-height: 740px) and (min-width: 701px) {
  .players.many-players {
    padding-block: 4px;
    row-gap: 8px;
  }
}
@media (max-width: 700px) {
  .round-average {
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
  }
  .room-header,
  .room-actions {
    gap: 12px;
  }
  .room-actions .button {
    font-size: 14px;
    padding: 8px 10px;
  }
  .room-code b {
    max-width: 90px;
  }
  .table {
    padding: 12px;
    border-radius: 16px;
  }
  .table-status {
    align-items: flex-start;
    flex-direction: column;
    gap: 5px;
  }
  .players {
    gap: 12px 8px;
    padding: 8px 2px;
    row-gap: 8px;
  }
  .connection-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
  }
}
@media (max-width: 480px) {
  .table-heading {
    flex-wrap: wrap;
    gap: 8px;
  }
  .table-status {
    width: 100%;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
  .room-header {
    flex-wrap: wrap;
    gap: 8px;
  }
  .room-heading {
    width: 100%;
  }
  h1 {
    font-size: 22px;
  }
  .room-actions {
    width: 100%;
    justify-content: space-between;
  }
  .room-code b {
    max-width: 130px;
  }
  .room-actions .button {
    min-height: 30px;
    padding: 5px 10px;
  }
  .phase,
  .player-count {
    font-size: 13px;
  }
  .round-button {
    min-height: 34px;
    padding: 8px 12px;
    font-size: 14px;
  }
  .connection {
    font-size: 12px;
  }
}
</style>
