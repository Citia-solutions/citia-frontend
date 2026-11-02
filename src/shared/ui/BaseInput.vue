<script setup lang="ts">
import { computed, ref, useAttrs, useId } from 'vue'

// Los atributos que no son props (`maxlength`, `readonly`, `inputmode`, `name`,
// `required`, `@blur`…) van al `<input>`, no al `<div>` raíz; `class` y `style`
// siguen en la raíz, para que quien lo usa pueda ubicarlo en su layout.
defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    label?: string
    type?: string
    placeholder?: string
    autocomplete?: string
    error?: string
    /** Texto de ayuda bajo el campo. Se oculta mientras hay un error (el error ya orienta). */
    hint?: string
    /** Deshabilita el campo y el botón de mostrar la contraseña; el control se ve atenuado. */
    disabled?: boolean
  }>(),
  { type: 'text', disabled: false },
)

const model = defineModel<string>({ default: '' })

// `useAttrs()` no es reactivo: se reparte en cada render (funciones, no computed).
const attrs = useAttrs()
const RAIZ = ['class', 'style']
function atributosDeRaiz(): Record<string, unknown> {
  return Object.fromEntries(Object.entries(attrs).filter(([clave]) => RAIZ.includes(clave)))
}
function atributosDelInput(): Record<string, unknown> {
  return Object.fromEntries(Object.entries(attrs).filter(([clave]) => !RAIZ.includes(clave)))
}

// Para inputs de tipo password agregamos el toggle del ojito.
const isPassword = computed(() => props.type === 'password')
const revealed = ref(false)
const currentType = computed(() =>
  isPassword.value ? (revealed.value ? 'text' : 'password') : props.type,
)

// Ids para asociar la etiqueta y el texto bajo el campo (ayuda o error) al input.
const inputId = useId()
const descriptionId = `${inputId}-desc`
const description = computed(() => props.error || props.hint || '')
</script>

<template>
  <div class="field" v-bind="atributosDeRaiz()">
    <label v-if="label" class="field__label" :for="inputId">{{ label }}</label>
    <div
      class="field__control"
      :class="{ 'field__control--error': error, 'field__control--disabled': disabled }"
    >
      <span v-if="$slots.icon" class="field__icon">
        <slot name="icon" />
      </span>
      <!-- `v-bind` primero: lo que sigue (id, type, aria-*) manda sobre un atributo igual -->
      <input
        v-bind="atributosDelInput()"
        :id="inputId"
        v-model="model"
        :type="currentType"
        :placeholder="placeholder"
        :autocomplete="autocomplete"
        :disabled="disabled"
        :aria-invalid="error ? 'true' : undefined"
        :aria-describedby="description ? descriptionId : undefined"
        class="field__input"
      />
      <button
        v-if="isPassword"
        type="button"
        class="field__toggle"
        :disabled="disabled"
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
    <p v-if="error" :id="descriptionId" class="field__error">{{ error }}</p>
    <p v-else-if="hint" :id="descriptionId" class="field__hint">{{ hint }}</p>
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
.field__control--disabled {
  background: var(--color-surface-muted);
}
.field__control--disabled .field__input {
  color: var(--color-text-muted);
  cursor: not-allowed;
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
.field__toggle:disabled {
  cursor: not-allowed;
}
.field__error {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-danger);
}
.field__hint {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
