<template>
  <div
    ref="panel"
    class="emoji-catalog"
    role="dialog"
    :aria-label="`Выбор эмодзи для ${playerName}`"
    :style="position"
    @pointerenter="emit('enter')"
  >
    <div class="catalog-heading">
      <span>Эмодзи для {{ playerName }}</span>
      <button aria-label="Закрыть выбор эмодзи" @click="emit('close')">
        ×
      </button>
    </div>
    <div ref="pickerContainer" class="catalog-content" />
    <p v-if="loadError" role="alert">
      Не удалось загрузить эмодзи.
      <button @click="loadPicker">Повторить</button>
    </p>
  </div>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type Picker from 'emoji-picker-element/picker'
const props = defineProps<{ anchor: HTMLElement; playerName: string }>()
const emit = defineEmits<{ select: [emoji: string]; close: []; enter: [] }>()
const pickerContainer = ref<HTMLDivElement>()
const panel = ref<HTMLDivElement>()
const position = ref({ left: '0px', top: '0px' })
const loadError = ref(false)
const EDGE_GAP = 12
const CARD_GAP = 16
let picker: Picker | undefined
let disposed = false

function placePanel() {
  if (!panel.value) return
  const anchor = props.anchor.getBoundingClientRect()
  const rect = panel.value.getBoundingClientRect()
  const right = anchor.right + CARD_GAP
  const left = anchor.left - CARD_GAP - rect.width
  const side =
    right + rect.width <= innerWidth - EDGE_GAP
      ? right
      : left >= EDGE_GAP
        ? left
        : null
  const preferredLeft = side ?? anchor.x + anchor.width / 2 - rect.width / 2
  const preferredTop =
    side === null
      ? anchor.y - rect.height - CARD_GAP
      : anchor.y + (anchor.height - rect.height) / 2
  position.value = {
    left: `${Math.max(EDGE_GAP, Math.min(preferredLeft, innerWidth - rect.width - EDGE_GAP))}px`,
    top: `${Math.max(EDGE_GAP, Math.min(preferredTop, innerHeight - rect.height - EDGE_GAP))}px`,
  }
}
async function loadPicker() {
  loadError.value = false
  try {
    const [{ default: Picker }, { default: i18n }] = await Promise.all([
      import('emoji-picker-element/picker'),
      import('emoji-picker-element/i18n/ru_RU'),
    ])
    if (disposed || !pickerContainer.value) return
    picker = new Picker({
      locale: 'ru',
      i18n,
      dataSource: '/reactions/emoji-ru.json',
    })
    picker.classList.add('light')
    picker.addEventListener('emoji-click', (event) => {
      if (event.detail.unicode) emit('select', event.detail.unicode)
    })
    pickerContainer.value.replaceChildren(picker)
    picker.shadowRoot
      ?.querySelector<HTMLInputElement>('input')
      ?.focus({ preventScroll: true })
  } catch {
    if (!disposed) loadError.value = true
  }
}
function outsideClick(event: PointerEvent) {
  if (panel.value && !event.composedPath().includes(panel.value)) emit('close')
}
onMounted(() => {
  placePanel()
  loadPicker()
  document.addEventListener('pointerdown', outsideClick, true)
})
onBeforeUnmount(() => {
  disposed = true
  document.removeEventListener('pointerdown', outsideClick, true)
  picker?.remove()
})
</script>

<style scoped>
.emoji-catalog {
  position: fixed;
  z-index: 83;
  width: min(352px, calc(100vw - 24px));
  border: 1px solid #dce5d3;
  border-radius: 20px;
  background: white;
  box-shadow: 0 12px 40px #20372d26;
  overflow: hidden;
  pointer-events: auto;
}
.catalog-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 10px 14px;
  font-size: 14px;
  font-weight: 600;
}
.catalog-heading span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.catalog-heading button {
  border: 0;
  background: #edf3e7;
  color: var(--ink);
  border-radius: 50%;
  width: 30px;
  height: 30px;
  flex-shrink: 0;
  font-size: 22px;
}
.catalog-content {
  height: min(360px, calc(100dvh - 120px));
}
.catalog-content :deep(emoji-picker) {
  width: 100%;
  height: 100%;
  --background: #fff;
  --border-size: 0px;
  --button-hover-background: #edf3e7;
  --button-active-background: #dbe9ca;
  --indicator-color: #285846;
  --input-border-color: #dce5d3;
  --input-font-size: 16px;
  --emoji-size: 28px;
  --emoji-padding: 6px;
  --category-emoji-size: 22px;
  --category-emoji-padding: 5px;
  --num-columns: 8;
}
@media (max-width: 380px) {
  .catalog-content :deep(emoji-picker) {
    --num-columns: 7;
  }
}
p {
  padding: 12px;
  font-size: 14px;
}
</style>
