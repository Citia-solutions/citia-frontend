<script setup lang="ts">
// Interruptor on/off (rol ARIA `switch`). Puramente presentacional: el texto
// visible va en `label` y, si hace falta, una explicación en `description`.
withDefaults(
  defineProps<{
    label: string
    description?: string
    disabled?: boolean
  }>(),
  { description: undefined, disabled: false },
)

const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="switch" :class="{ 'switch--disabled': disabled }">
    <span class="switch__text">
      <span class="switch__label">{{ label }}</span>
      <span v-if="description" class="switch__description">{{ description }}</span>
    </span>
    <input
      v-model="model"
      type="checkbox"
      role="switch"
      class="switch__input"
      :aria-checked="model"
      :disabled="disabled"
    />
    <span class="switch__track" aria-hidden="true">
      <span class="switch__thumb" />
    </span>
  </label>
</template>

<style scoped>
.switch {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  cursor: pointer;
  user-select: none;
}
.switch--disabled {
  cursor: not-allowed;
  opacity: 0.6;
}
.switch__text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}
.switch__label {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}
.switch__description {
  font-size: 0.82rem;
  color: var(--color-text-muted);
}
.switch__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.switch__track {
  position: relative;
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  border-radius: var(--radius-full);
  background: var(--color-border);
  transition: background 0.15s;
}
.switch__thumb {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.25);
  transition: transform 0.15s;
}
.switch__input:checked + .switch__track {
  background: var(--color-primary);
}
.switch__input:checked + .switch__track .switch__thumb {
  transform: translateX(20px);
}
.switch__input:focus-visible + .switch__track {
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
</style>
