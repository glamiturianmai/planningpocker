<template><div ref="overlay" class="reaction-overlay" aria-hidden="true" /></template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import type { ReactionEvent } from '@/api/rooms'
import { createReactionAnimator } from '../model/animate-reaction'
const overlay = ref<HTMLDivElement>()
let animator: ReturnType<typeof createReactionAnimator> | undefined
onMounted(() => {
  if (overlay.value) animator = createReactionAnimator(overlay.value)
})
onBeforeUnmount(() => animator?.dispose())
function play(event: ReactionEvent) {
  animator?.play(event)
}
defineExpose({ play })
</script>

<style>
.reaction-overlay {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 100;
  overflow: hidden;
}
.reaction-overlay .reaction-particle {
  position: absolute;
  line-height: 1;
  transform: translate(-50%, -50%);
  will-change: transform, opacity;
  filter: drop-shadow(0 3px 2px #20372d15);
}
.reaction-overlay .reaction-particle {
  display: grid;
  place-items: center;
  width: 46px;
  height: 46px;
  font-size: 40px;
}
.reaction-overlay .reaction-particle img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}
</style>
