<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    name: string
    size?: number
  }>(),
  { size: 40 },
)

// Paleta de fondos suaves para el avatar.
const PALETTE = ['#2563eb', '#16a34a', '#d97706', '#9333ea', '#0891b2']

// Iniciales: primera letra de las dos primeras palabras, en mayúscula.
// Ej. "María González" → "MG"; "Juan" → "J".
const initials = computed(() => {
  const words = props.name.trim().split(/\s+/).filter(Boolean)
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
})

// Color determinístico: hash simple del nombre → índice en la paleta.
const background = computed(() => {
  let hash = 0
  for (let i = 0; i < props.name.length; i++) {
    hash = (hash * 31 + props.name.charCodeAt(i)) | 0
  }
  return PALETTE[Math.abs(hash) % PALETTE.length]
})

const dimension = computed(() => `${props.size}px`)
const fontSize = computed(() => `${Math.round(props.size * 0.4)}px`)
</script>

<template>
  <span
    class="avatar"
    :style="{
      width: dimension,
      height: dimension,
      fontSize,
      background,
    }"
    :title="name"
    aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>

<style scoped>
.avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-full);
  color: #fff;
  font-weight: 600;
  line-height: 1;
  flex-shrink: 0;
  user-select: none;
}
</style>
