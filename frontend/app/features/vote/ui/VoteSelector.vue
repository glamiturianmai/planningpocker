<template>
  <section class="vote-panel" aria-label="Выбор оценки">
    <div class="vote-controls">
      <div class="votes" role="group" aria-label="Оценка задачи">
        <button
          v-for="value in values"
          :key="value"
          class="vote-card"
          :disabled="disabled"
          :aria-pressed="selectedVote === value"
          :aria-label="`${value} story points`"
          @click="emit('select', value)"
        >
          <span class="card-corner" aria-hidden="true">{{ value }}</span>
          <span>{{ value }}</span>
          <span class="card-suit" aria-hidden="true">♠</span>
        </button>
      </div>
      <form class="custom-vote" @submit.prevent="submitCustomVote">
        <label for="custom-vote">Своя оценка</label>
        <div class="custom-input">
          <input
            id="custom-vote"
            v-model="customVote"
            type="number"
            min="0"
            :max="MAX_VOTE"
            step="1"
            required
            :disabled="disabled"
            :aria-invalid="!!error"
            aria-describedby="custom-vote-error"
            @input="error = ''"
          />
          <button type="submit" :disabled="disabled" aria-label="Отправить свою оценку">↗</button>
        </div>
        <p v-if="error" id="custom-vote-error" class="error" role="alert">{{ error }}</p>
      </form>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { MAX_VOTE } from '@/api/rooms'
const props = defineProps<{
  revealed: boolean
  hasPlayer: boolean
  selectedVote?: number
  connected: boolean
}>()
const emit = defineEmits<{ select: [value: number] }>()
const values = [1, 2, 3, 5, 8, 13]
const disabled = computed(() => props.revealed || !props.hasPlayer || !props.connected)
const customVote = ref<string | number>('')
const error = ref('')
function submitCustomVote() {
  const value = Number(customVote.value)
  if (
    !String(customVote.value).trim() ||
    !Number.isInteger(value) ||
    value < 0 ||
    value > MAX_VOTE
  ) {
    error.value = `Введите целое число от 0 до ${MAX_VOTE}`
    return
  }
  if (!disabled.value) emit('select', value)
}
</script>

<style scoped>
.vote-panel {
  display: grid;
  grid-template-columns: minmax(0, 1fr);
  align-items: center;
  gap: 24px;
  padding: 16px 20px;
  border: 1px solid var(--line);
  background: white;
  border-radius: 18px;
}
.vote-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 18px;
  min-width: 0;
}
.votes {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
}
.vote-card {
  position: relative;
  display: grid;
  place-items: center;
  width: 64px;
  height: 88px;
  border: 1.5px solid #d7e0d0;
  border-radius: 9px;
  background: #fafbf7;
  color: var(--ink);
  font-size: 30px;
  font-weight: 650;
}
.card-corner {
  position: absolute;
  left: 7px;
  top: 5px;
  font-size: 11px;
}
.card-suit {
  position: absolute;
  bottom: 5px;
  right: 7px;
  font-size: 10px;
  color: #9aab8e;
}
.vote-card:hover:not(:disabled) {
  transform: translateY(-4px) rotate(-3deg);
  border-color: var(--accent);
  background: #f0f5e8;
}
.vote-card[aria-pressed='true'] {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
  transform: translateY(-4px);
  box-shadow: 0 5px 12px #28594322;
}
.vote-card[aria-pressed='true'] .card-suit {
  color: var(--lime);
}
.custom-vote {
  flex: 1;
  max-width: 200px;
  min-width: 140px;
}
.custom-vote label {
  display: block;
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 6px;
}
.custom-input {
  display: flex;
  border: 1px solid var(--line);
  border-radius: 9px;
  overflow: hidden;
  background: #fafbf7;
}
.custom-input input {
  width: 100%;
  min-width: 0;
  border: 0;
  padding: 10px;
  background: transparent;
  font-size: 14px;
  color: var(--ink);
}
.custom-input button {
  width: 36px;
  flex-shrink: 0;
  border: 0;
  background: var(--lime);
  color: var(--accent);
  font-size: 21px;
}
@media (max-width: 760px) {
  .vote-panel {
    padding: 12px;
    border-radius: 16px;
    gap: 12px;
  }
  .vote-controls {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
  }
  .votes {
    gap: 7px;
  }
  .vote-card {
    width: 100%;
    height: 76px;
    font-size: 26px;
  }
  .custom-vote {
    display: grid;
    grid-template-columns: 85px minmax(0, 1fr);
    gap: 4px 8px;
    align-items: center;
    max-width: none;
    min-width: 0;
  }
  .custom-vote label {
    margin: 0;
  }
  .custom-vote .error {
    grid-column: 2;
    margin: 0;
  }
}
</style>
