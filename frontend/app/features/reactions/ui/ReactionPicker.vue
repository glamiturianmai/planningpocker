<template>
  <Teleport to="body">
    <div v-if="!hover" class="picker-backdrop" @click="emit('close')" />
    <div
      ref="menu"
      class="reaction-picker"
      :style="position"
      role="dialog"
      :aria-modal="hover || catalogOpen ? undefined : true"
      @pointerenter="emit('enter')"
      @pointerleave="leaveMenu"
      @focusin="emit('enter')"
      :aria-label="`Реакция для ${player.name}`"
      @keydown="handleKeys"
    >
      <button
        v-for="(emoji, index) in choices"
        :key="emoji"
        class="reaction-choice"
        :data-reaction="emoji"
        :class="{ selected: selected === emoji }"
        :style="buttonPositions[index]"
        :aria-label="
          emoji === MORE_EMOJI
            ? 'Все эмодзи'
            : `Отправить ${REACTION_LABELS[emoji]} участнику ${player.name}`
        "
        :title="
          emoji === MORE_EMOJI
            ? 'Все эмодзи'
            : `${REACTION_LABELS[emoji]} · удерживайте для серии бросков`
        "
        @pointerdown="startThrow(emoji, $event)"
        @pointerup="finishThrow"
        @pointercancel="finishThrow"
        @lostpointercapture="finishThrow"
        @contextmenu.prevent
        @click="keyboardThrow(emoji, $event)"
      >
        <svg
          v-if="emoji === MORE_EMOJI"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M8 14c1 4 7 4 8 0" />
          <circle cx="8.5" cy="9" r=".7" />
          <circle cx="15.5" cy="9" r=".7" />
        </svg>
        <img
          v-else-if="REACTION_ASSETS[emoji]"
          :src="REACTION_ASSETS[emoji]"
          alt=""
          draggable="false"
        />
        <span v-else aria-hidden="true">{{ emoji }}</span>
      </button>
    </div>
    <EmojiCatalog
      v-if="catalogOpen"
      :anchor="anchor"
      :player-name="player.name"
      @enter="emit('enter')"
      @select="send"
      @close="closeCatalog"
    />
  </Teleport>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import EmojiCatalog from './EmojiCatalog.vue'
import { REACTIONS } from '@/api/rooms'
import type { Player } from '@/api/rooms'
import { REACTION_ASSETS, REACTION_LABELS } from '../model/reactions'
const props = defineProps<{
  player: Player
  anchor: HTMLElement
  hover: boolean
}>()
const emit = defineEmits<{
  select: [emoji: string]
  close: []
  enter: []
  leave: []
}>()
const menu = ref<HTMLDivElement>()
const selected = ref('✈️')
const MORE_EMOJI = 'more'
const choices = [...REACTIONS, MORE_EMOJI]
const catalogOpen = ref(false)
const holding = ref(false)
const position = ref({ left: '0px', top: '0px', width: '0px', height: '0px' })
const buttonPositions = ref<
  { left: string; top: string; animationDelay: string }[]
>([])
const BUTTON_SIZE = 52
const MENU_RADIUS = 104
const EDGE_GAP = 10
const HOLD_DELAY_MS = 350
const REPEAT_INTERVAL_MS = 160
let holdTimer: ReturnType<typeof setTimeout> | undefined
let repeatTimer: ReturnType<typeof setInterval> | undefined

function stopThrow() {
  holding.value = false
  clearTimeout(holdTimer)
  clearInterval(repeatTimer)
}
function leaveMenu() {
  if (props.hover && !holding.value && !catalogOpen.value) emit('leave')
}
function finishThrow() {
  stopThrow()
  if (
    props.hover &&
    !catalogOpen.value &&
    menu.value &&
    !menu.value.matches(':hover')
  )
    emit('leave')
}
function globalEscape(event: KeyboardEvent) {
  if ((!props.hover && !catalogOpen.value) || event.key !== 'Escape') return
  event.preventDefault()
  close()
}
function close() {
  stopThrow()
  emit('close')
}
function closeCatalog() {
  catalogOpen.value = false
  if (props.hover) emit('leave')
}
function send(emoji: string) {
  if (emoji === MORE_EMOJI) {
    stopThrow()
    catalogOpen.value = true
    emit('enter')
    return
  }
  selected.value = emoji
  emit('select', emoji)
}
function startThrow(emoji: string, event: PointerEvent) {
  if (event.button !== 0) return
  stopThrow()
  if (emoji === MORE_EMOJI) {
    send(emoji)
    return
  }
  holding.value = true
  emit('enter')
  const button = event.currentTarget as HTMLButtonElement
  button.setPointerCapture(event.pointerId)
  send(emoji)
  holdTimer = setTimeout(() => {
    repeatTimer = setInterval(() => send(emoji), REPEAT_INTERVAL_MS)
  }, HOLD_DELAY_MS)
}
function keyboardThrow(emoji: string, event: MouseEvent) {
  if (event.detail === 0) send(emoji)
}
function handleKeys(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    event.stopPropagation()
    close()
    return
  }
  if (catalogOpen.value || (event.key === 'Tab' && props.hover)) return
  if (event.key !== 'Tab' && !event.key.startsWith('Arrow')) return
  const buttons = [
    ...(menu.value?.querySelectorAll<HTMLButtonElement>('button') ?? []),
  ]
  const current = buttons.indexOf(document.activeElement as HTMLButtonElement)
  const backward =
    event.shiftKey || event.key === 'ArrowLeft' || event.key === 'ArrowUp'
  event.preventDefault()
  buttons[
    (current + (backward ? -1 : 1) + buttons.length) % buttons.length
  ]?.focus({
    preventScroll: true,
  })
}
function placeMenu() {
  const anchor = props.anchor.getBoundingClientRect()
  const centers = [
    { x: anchor.x + anchor.width / 2, y: anchor.top + 18, start: -180 },
    {
      x: anchor.x + anchor.width / 2,
      y: anchor.y + anchor.height / 2,
      start: -90,
    },
    {
      x: anchor.x + anchor.width / 2,
      y: anchor.y + anchor.height / 2,
      start: 90,
    },
    { x: anchor.x + anchor.width / 2, y: anchor.bottom - 18, start: 0 },
  ]
  const candidates = centers.map((center) =>
    choices.map((_, index) => {
      const angle =
        ((center.start + index * (180 / (choices.length - 1))) * Math.PI) / 180
      return {
        x: center.x + Math.cos(angle) * MENU_RADIUS,
        y: center.y + Math.sin(angle) * MENU_RADIUS,
      }
    }),
  )
  const margin = BUTTON_SIZE / 2 + EDGE_GAP
  const points =
    candidates.find((items) =>
      items.every(
        (p) =>
          p.x >= margin &&
          p.x <= window.innerWidth - margin &&
          p.y >= margin &&
          p.y <= window.innerHeight - margin,
      ),
    ) ?? candidates[0]!
  const minX = Math.min(...points.map((p) => p.x)) - BUTTON_SIZE / 2
  const minY = Math.min(...points.map((p) => p.y)) - BUTTON_SIZE / 2
  const width = Math.max(...points.map((p) => p.x)) - minX + BUTTON_SIZE / 2
  const height = Math.max(...points.map((p) => p.y)) - minY + BUTTON_SIZE / 2
  const left = Math.max(
    EDGE_GAP,
    Math.min(minX, window.innerWidth - width - EDGE_GAP),
  )
  const top = Math.max(
    EDGE_GAP,
    Math.min(minY, window.innerHeight - height - EDGE_GAP),
  )
  position.value = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
  }
  buttonPositions.value = points.map((p, index) => ({
    left: `${p.x - minX - BUTTON_SIZE / 2}px`,
    top: `${p.y - minY - BUTTON_SIZE / 2}px`,
    animationDelay: `${index * 25}ms`,
  }))
}
onMounted(() => {
  placeMenu()
  if (!props.hover)
    menu.value
      ?.querySelector<HTMLButtonElement>('[data-reaction="✈️"]')
      ?.focus({ preventScroll: true })
  window.addEventListener('resize', close)
  window.addEventListener('scroll', close, true)
  window.addEventListener('blur', stopThrow)
  window.addEventListener('keydown', globalEscape)
})
onBeforeUnmount(() => {
  stopThrow()
  window.removeEventListener('resize', close)
  window.removeEventListener('scroll', close, true)
  window.removeEventListener('blur', stopThrow)
  window.removeEventListener('keydown', globalEscape)
})
</script>

<style scoped>
.picker-backdrop {
  position: fixed;
  inset: 0;
  z-index: 80;
}
.reaction-picker {
  position: fixed;
  z-index: 81;
  pointer-events: none;
}
.reaction-choice {
  position: absolute;
  display: grid;
  place-items: center;
  width: 52px;
  height: 52px;
  padding: 10px;
  border: 2px solid transparent;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 5px 15px #20372d24;
  color: var(--ink);
  font-size: 29px;
  pointer-events: auto;
  user-select: none;
  touch-action: none;
  animation: reaction-choice-in 0.18s both;
}
.reaction-choice img,
.reaction-choice svg {
  width: 100%;
  height: 100%;
  object-fit: contain;
  pointer-events: none;
}
.reaction-choice:hover,
.reaction-choice.selected {
  border-color: #5396ec;
  box-shadow:
    0 0 0 3px #fff,
    0 6px 18px #20372d24;
  transform: scale(1.08);
}
.reaction-choice:active {
  transform: scale(0.94);
}
@keyframes reaction-choice-in {
  from {
    opacity: 0;
    scale: 0.65;
  }
  to {
    opacity: 1;
    scale: 1;
  }
}
</style>
