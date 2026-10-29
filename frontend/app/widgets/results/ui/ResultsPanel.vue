<template>
  <section v-if="revealed" class="results" aria-live="polite">
    <div class="result-heading">
      <p class="eyebrow">Итоги раунда</p>
      <span class="result-icon" aria-hidden="true">{{ consensus ? '✦' : '↗' }}</span>
    </div>
    <p class="average">
      {{ average }}
      <span>SP</span>
    </p>
    <p class="result-description">
      {{ consensus ? 'Единогласно. Красиво!' : 'Средняя оценка команды' }}
    </p>
    <div class="distribution">
      <div v-for="item in distribution" :key="item.vote" class="distribution-row">
        <span>{{ item.vote }}</span>
        <span class="bar-track">
          <span class="bar" :style="{ width: `${(item.count / votes.length) * 100}%` }" />
        </span>
        <span>{{ item.count }}</span>
      </div>
    </div>
    <p class="result-note">Оценили {{ votes.length }} из {{ players.length }} участников</p>
  </section>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Player } from '@/api/rooms'
const props = defineProps<{ players: Player[]; revealed: boolean }>()
const votes = computed(() =>
  props.players.map((p) => p.vote).filter((v): v is number => v !== null),
)
const average = computed(() => {
  if (!votes.value.length) return '—'
  return new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(
    votes.value.reduce((a, b) => a + b, 0) / votes.value.length,
  )
})
const consensus = computed(
  () =>
    votes.value.length > 1 &&
    votes.value.length === props.players.length &&
    new Set(votes.value).size === 1,
)
const distribution = computed(() => {
  if (!props.revealed) return []
  const counts = new Map<number, number>()
  for (const vote of votes.value) counts.set(vote, (counts.get(vote) ?? 0) + 1)
  return [...counts].sort(([a], [b]) => a - b).map(([vote, count]) => ({ vote, count }))
})
</script>

<style scoped>
.results {
  height: 100%;
  padding: 27px;
  background: white;
  border: 1px solid var(--line);
  border-radius: 20px;
}
.result-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.result-icon {
  font-size: 25px;
  color: #88a45c;
}
.average {
  font-size: 56px;
  font-weight: 650;
  letter-spacing: -0.06em;
  margin: 25px 0 8px;
  overflow-wrap: anywhere;
  line-height: 1.1;
}
.average span {
  margin-left: 10px;
  font-size: 14px;
  font-weight: 450;
  letter-spacing: 0;
  color: var(--muted);
}
.result-description {
  font-size: 13px;
  color: var(--muted);
}
.distribution {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-top: 27px;
}
.distribution-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}
.distribution-row > span:first-child {
  min-width: 22px;
}
.bar-track {
  flex: 1;
  height: 7px;
  background: #f0f3ea;
  border-radius: 5px;
  overflow: hidden;
}
.bar {
  display: block;
  height: 100%;
  background: #a6c17e;
  border-radius: 5px;
  transition: width 0.4s;
}
.result-note {
  margin-top: 27px;
  color: var(--muted);
  font-size: 11px;
}
</style>
