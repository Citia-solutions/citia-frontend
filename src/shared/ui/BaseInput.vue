<script setup lang="ts">
import { computed, ref } from 'vue'

const props = withDefaults(
  defineProps<{
    label?: string
    type?: string
    placeholder?: string
    autocomplete?: string
    error?: string
  }>(),
  { type: 'text' },
)

const model = defineModel<string>({ default: '' })

// Para inputs de tipo password agregamos el toggle del ojito.
const isPassword = computed(() => props.type === 'password')
const revealed = ref(false)
const currentType = computed(() =>
  isPassword.value ? (revealed.value ? 'text' : 'password') : props.type,
)
</script>

<template>
  <div class="field">
    <label v-if="label" class="field__label">{{ label }}</label>
    <div class="field__control" :class="{ 'field__control--error': error }">
      <span v-if="$slots.icon" class="field__icon">
        <slot name="icon" />
      </span>
      <input
        v-model="model"
        :type="currentType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        class="field__input"
      />
      <button
        v-if="isPassword"
        type="button"
        class="field__toggle"
        :aria-label="revealed ? 'Ocultar contraseña' : 'Mostrar contraseña'"
        @click="revealed = !revealed"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path v-if="revealed" d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
          <circle v-if="revealed" cx="12" cy="12" r="3" />
          <path v-else d="M3 3l18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.2A9.3 9.3 0 0 1 12 5c6.5 0 10 7 10 7a17 17 0 0 1-3.2 4M6.6 6.6A17 17 0 0 0 2 12s3.5 7 10 7a9.3 9.3 0 0 0 2.6-.4" />
        </svg>
      </button>
    </div>
    <p v-if="error" class="field__error">{{ error }}</p>
  </div>
</template>

<style scoped>
.field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.field__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}
.field__control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0 0.85rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.field__control:focus-within {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.field__control--error {
  border-color: var(--color-danger);
}
.field__icon {
  display: flex;
  color: var(--color-text-muted);
}
.field__input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  padding: 0.7rem 0;
  font-size: 0.95rem;
  color: var(--color-text);
}
.field__toggle {
  display: flex;
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  padding: 0;
}
.field__error {
  font-size: 0.8rem;
  color: var(--color-danger);
}
</style>
