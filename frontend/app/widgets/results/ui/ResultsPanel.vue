<template>
  <div v-if="revealed" class="results">
    Средняя оценка: <b>{{ average }}</b>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  players: { id: string; name: string; vote: number | null }[];
  revealed: boolean;
}>();

function formatVote(vote: number): string {
  return Number.isInteger(vote) ? vote.toString() : vote.toFixed(1);
}

const average = computed(() => {
  if (!props.revealed) return '-';

  const votes = props.players
    .map(p => p.vote)
    .filter((v): v is number => v !== null);

  if (!votes.length) return '-';

  const avg = votes.reduce((sum, val) => sum + val, 0) / votes.length;
  return formatVote(avg);
});
</script>

<style scoped>
.results {
  margin-top: 20px;
  font-size: 20px;
  text-align: center;
}
</style>
