<script setup lang="ts">
defineProps<{ label?: string }>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="check">
    <input v-model="model" type="checkbox" class="check__input" />
    <span class="check__box" aria-hidden="true" />
    <span v-if="label" class="check__label">{{ label }}</span>
  </label>
</template>

<style scoped>
.check {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  cursor: pointer;
  user-select: none;
}
.check__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.check__box {
  width: 18px;
  height: 18px;
  border: 1px solid var(--color-border);
  border-radius: 5px;
  background: var(--color-surface);
  transition: background 0.15s, border-color 0.15s;
  position: relative;
}
.check__input:checked + .check__box {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.check__input:checked + .check__box::after {
  content: '';
  position: absolute;
  left: 5px;
  top: 2px;
  width: 5px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.check__input:focus-visible + .check__box {
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.check__label {
  font-size: 0.9rem;
  color: var(--color-text);
}
</style>
