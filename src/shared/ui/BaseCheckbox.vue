<script setup lang="ts">
// Casilla con su etiqueta. La etiqueta es la prop `label` (texto) o el slot por
// defecto, para una etiqueta con marcado (p. ej. un enlace a `/terminos`, US-11);
// si vienen los dos, gana el slot.
//
// Un clic en un enlace de la etiqueta NO marca la casilla: el enlace es contenido
// interactivo dentro del `<label>`, y el navegador ejecuta la acción del enlace
// en vez de la del `<label>` (activación del `label` en HTML). No hace falta
// código para eso; no envuelvas el enlace en algo que lo cambie.
defineProps<{ label?: string }>()
defineSlots<{ default?: () => unknown }>()
const emit = defineEmits<{
  /** Se emite cuando el usuario cambia el checkbox (on/off). */
  change: []
}>()
const model = defineModel<boolean>({ default: false })
</script>

<template>
  <label class="check" @change="emit('change')">
    <input v-model="model" type="checkbox" class="check__input" />
    <span class="check__box" aria-hidden="true" />
    <span v-if="$slots.default || label" class="check__label">
      <slot>{{ label }}</slot>
    </span>
  </label>
</template>

<style scoped>
/* La casilla va alineada con la primera línea: una etiqueta larga (la de los
   términos) ocupa varias líneas y la casilla no debe quedar a media altura. */
.check {
  display: inline-flex;
  align-items: flex-start;
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
  flex-shrink: 0;
  width: 18px;
  height: 18px;
  margin-top: 0.05rem;
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
  line-height: 1.35;
  color: var(--color-text);
}
</style>
