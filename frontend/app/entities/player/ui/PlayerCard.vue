<template>
  <article
    class="player"
    :class="{ self: isSelf, compact }"
    :data-player-id="player.user_id"
  >
    <div class="player-heading">
      <span class="player-name" :title="player.name">
        {{ player.name }}
        <small v-if="isSelf">вы</small>
      </span>
      <button
        class="remove-player"
        :disabled="!connected"
        :aria-label="`Удалить ${player.name} из комнаты`"
        :title="isSelf ? 'Выйти из комнаты' : 'Удалить из комнаты'"
        @click="emit('remove', player)"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.6"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M3 6h18M9 6V4h6v2M5 6l1 14h12l1-14M10 10v6M14 10v6" />
        </svg>
      </button>
    </div>
    <button
      class="card-target"
      :disabled="!connected"
      :aria-label="`Отправить реакцию участнику ${player.name}`"
      @pointerenter="hoverReactions"
      @pointerleave="leaveReactions"
      @pointerdown="lastPointerType = $event.pointerType"
      @click="openReactions"
    >
      <span class="card-flip" :class="{ open: isOpen }">
        <span class="card-face card-back">
          <span class="back-pattern"><span>♠</span></span>
        </span>
        <span class="card-face card-front">
          <span class="corner" aria-hidden="true">♠</span>
          <span class="vote-number">{{ player.vote ?? '—' }}</span>
          <span class="corner bottom" aria-hidden="true">♠</span>
        </span>
      </span>
    </button>
    <p class="player-status" :class="{ voted: player.vote !== null }">
      <span class="status-dot" />
      {{
        player.vote !== null ? 'Готово' : revealed ? 'Без оценки' : 'Думает…'
      }}
    </p>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player } from '@/api/rooms'
const props = defineProps<{
  player: Player
  revealed: boolean
  isSelf: boolean
  connected: boolean
  compact: boolean
}>()
const emit = defineEmits<{
  remove: [player: Player]
  target: [player: Player, anchor: HTMLButtonElement, hover: boolean]
  leave: []
}>()
let lastPointerType = 'mouse'
function openReactions(event: MouseEvent) {
  if (event.detail !== 0 && lastPointerType === 'mouse') return
  emit('target', props.player, event.currentTarget as HTMLButtonElement, false)
}
function hoverReactions(event: PointerEvent) {
  if (event.pointerType !== 'mouse' || !props.connected) return
  emit('target', props.player, event.currentTarget as HTMLButtonElement, true)
}
function leaveReactions(event: PointerEvent) {
  if (event.pointerType === 'mouse') emit('leave')
}
const isOpen = computed(
  () => props.revealed || (props.isSelf && props.player.vote !== null),
)
</script>

<style scoped>
.player {
  --player-card-width: 104px;
  width: 140px;
  text-align: center;
}
.player-heading {
  display: flex;
  align-items: center;
  gap: 6px;
  width: var(--player-card-width);
  margin: 0 auto 8px;
}

.player-name {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  font-weight: 600;
  text-align: left;
}
.player-name small {
  margin-left: 5px;
  font-size: 12px;
  font-weight: 400;
  color: var(--muted);
}
.remove-player {
  display: grid;
  place-items: center;
  margin-left: auto;
  flex-shrink: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: #85947e;
  width: 25px;
  height: 25px;
  padding: 0;
  font-size: 20px;
  line-height: 1;
}
.remove-player:hover {
  background: #f4ded5;
  color: var(--danger);
}
.card-target {
  display: block;
  width: var(--player-card-width);
  height: 144px;
  margin: 0 auto;
  padding: 0;
  border: 0;
  border-radius: 12px;
  background: transparent;
  perspective: 800px;
}
.card-target:disabled {
  opacity: 1;
  cursor: default;
}
.card-flip {
  display: block;
  width: 100%;
  height: 100%;
  position: relative;
  transform-style: preserve-3d;
  transition: transform 0.65s cubic-bezier(0.2, 0.7, 0.25, 1);
}
.card-flip.open {
  transform: rotateY(180deg);
}
.card-face {
  display: grid;
  place-items: center;
  position: absolute;
  inset: 0;
  border-radius: 12px;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  box-shadow:
    0 5px 0 #20372d08,
    0 8px 16px #20372d08;
}
.card-back {
  background: #dee7d4;
  border: 1px solid #cedbc3;
  padding: 7px;
}
.back-pattern {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  border: 1px solid #a8bc9a;
  border-radius: 7px;
  background: repeating-linear-gradient(
    45deg,
    transparent 0 5px,
    #a8bc9a30 5px 6px
  );
}
.back-pattern span {
  display: grid;
  place-items: center;
  width: 40px;
  height: 48px;
  background: #dee7d4;
  color: #90a67f;
  font-size: 37px;
}
.card-front {
  background: white;
  border: 1px solid #d0ddc6;
  transform: rotateY(180deg);
}
.self .card-front {
  background: var(--accent);
  color: #f2f8e9;
  border-color: var(--accent);
}
.vote-number {
  max-width: 100%;
  padding: 6px;
  overflow-wrap: anywhere;
  font-size: 36px;
  font-weight: 650;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}
.corner {
  position: absolute;
  top: 7px;
  left: 9px;
  font-size: 13px;
  color: #91a282;
}
.bottom {
  top: auto;
  left: auto;
  bottom: 7px;
  right: 9px;
  transform: rotate(180deg);
}
.self .corner {
  color: var(--lime);
}
.player-status {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
  color: #566b58;
}
.status-dot {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: #a8b1a3;
}
.voted {
  color: var(--accent);
}
.voted .status-dot {
  background: #79a253;
}
.card-target:hover:not(:disabled) {
  transform: translateY(-3px);
}
.card-target:focus-visible {
  outline: 3px solid #9fba7c;
}
.player.compact {
  --player-card-width: 88px;
  width: 128px;
}
.compact .card-target {
  height: 120px;
}
.compact .player-heading {
  margin-bottom: 6px;
}
.compact .player-status {
  margin-top: 6px;
}
@media (max-height: 800px) {
  .player.compact {
    --player-card-width: 76px;
  }
  .compact .card-target {
    height: 104px;
  }
  .compact .vote-number {
    font-size: 30px;
  }
}
@media (max-height: 740px) and (min-width: 701px) {
  .player.compact {
    --player-card-width: 68px;
  }
  .compact .card-target {
    height: 92px;
  }
  .compact .player-heading {
    margin-bottom: 4px;
  }
  .compact .player-status {
    margin-top: 4px;
  }

  .compact .remove-player {
    width: 22px;
    height: 22px;
  }
}
@media (max-width: 600px) {
  .player,
  .player.compact {
    --player-card-width: 76px;
    width: 120px;
  }
  .card-target,
  .compact .card-target {
    height: 104px;
  }
  .vote-number {
    font-size: 30px;
  }
}
@media (max-width: 480px) {
  .player,
  .player.compact {
    width: 96px;
  }
  .player-heading {
    gap: 4px;
    margin-bottom: 6px;
  }

  .player-name {
    font-size: 12px;
  }
  .remove-player {
    width: 22px;
    height: 22px;
  }
  .player-status {
    margin-top: 6px;
    font-size: 12px;
  }
}
</style>
