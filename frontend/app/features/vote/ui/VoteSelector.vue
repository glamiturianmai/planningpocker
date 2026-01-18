<template>
  <div class="votes">
    <button
      v-for="v in values"
      :key="v"
      :disabled="revealed || !hasPlayer"
      :class="{ selected: v === selectedVote }"
      @click="$emit('select', v)"
    >
      {{ v }}
    </button>
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  revealed: boolean;
  hasPlayer: boolean;
  selectedVote?: number;
}>();

const values: number[] = [];
let a = 1, b = 2;
while (a <= 59) {
  values.push(a);
  const next = a + b;
  a = b;
  b = next;
}
</script>

<style scoped>
.votes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-top: 20px;
}

button {
  width: 44px;
  height: 44px;
  padding: 0;
  border-radius: 8px;
  border: 1px solid #cbd5e1;
  background: #ffffff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

button:hover:not(:disabled) {
  background: #f3f4f6;
}

button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

button.selected {
  border: 2px solid #3b82f6;
  box-shadow: 0 0 6px rgba(59, 130, 246, 0.4);
}
</style>
