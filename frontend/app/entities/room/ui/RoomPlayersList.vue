<template>
  <div class="players-list">
    <div
      v-for="p in players"
      :key="p.id"
      :class="{ me: p.id === currentPlayerId }"
      class="player"
    >
      {{ p.name }}
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  players: any[];
  currentPlayerId: string | null;
}>();
</script>

<style scoped>
.players-list {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}
.player {
  padding: 8px 12px;
  background: #eee;
  border-radius: 6px;
}
.player.me {
  background: #4caf50;
  color: white;
  font-weight: bold;
}
</style>
