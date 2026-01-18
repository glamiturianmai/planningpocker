<template>
  <div
    :class="['card', { open: isOpen, self: isSelf, voted: hasVoted && !isOpen }]"
  >
    <p>{{ player.name }}</p>
    <p v-if="isOpen">{{ player.vote ?? '?' }}</p>
    <p v-else-if="hasVoted">✔️</p>
    <p v-else>❓</p>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

const props = defineProps<{
  player: { id: string; name: string; vote: number | null };
  revealed: boolean;
  currentPlayerId: string | null;
}>();

const isSelf = computed(() => props.player.id === props.currentPlayerId);

const isOpen = computed(() => props.revealed || isSelf.value);

const hasVoted = computed(() => props.player.vote !== null);
</script>

<style scoped>
.card {
  border: 1px solid #ccc;
  padding: 10px 20px;
  border-radius: 6px;
  width: 80px;
  text-align: center;
  background-color: #eee;
  transition: background-color 0.3s, transform 0.3s;
}

.card.open {
  background-color: #fff;
  border-color: #4caf50;
}

.card.self {
  box-shadow: 0 0 5px 2px #4caf50;
}

.card.voted {
  background-color: #d9f0d9;
}
</style>
