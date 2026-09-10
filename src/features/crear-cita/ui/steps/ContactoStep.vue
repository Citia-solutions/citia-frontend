<script setup lang="ts">
// Sección 2: Contacto. Correo y teléfono obligatorios para confirmar y avisar.
// El error de cada campo aparece al salir del campo (blur) y se recalcula en
// vivo mientras se escribe.
import { useErroresVisibles } from '../../model/useErroresVisibles'
import type { FlujoCitaErrors, FlujoCitaForm } from '../../model/flujoCitaModel'

const props = defineProps<{
  form: FlujoCitaForm
  errors: FlujoCitaErrors
}>()

const { marcarTocado, errorDe } = useErroresVisibles('contacto', props.form)

const errorCorreo = errorDe('correo')
const errorTelefono = errorDe('telefono')
</script>

<template>
  <div class="step">
    <div class="step__field">
      <label class="step__label" for="flujo-correo">
        Correo electrónico:<span class="step__required" aria-hidden="true">*</span>
      </label>
      <input
        id="flujo-correo"
        v-model="form.correo"
        class="step__input"
        :class="{ 'step__input--error': errorCorreo }"
        type="email"
        autocomplete="email"
        placeholder="correo@ejemplo.cl"
        :aria-invalid="errorCorreo ? 'true' : 'false'"
        @blur="marcarTocado('correo')"
      />
      <span v-if="errorCorreo" class="step__error" role="alert">{{ errorCorreo }}</span>
      <span v-else-if="errors.correo" class="step__error">{{ errors.correo }}</span>
    </div>

    <div class="step__field">
      <label class="step__label" for="flujo-telefono">
        Teléfono:<span class="step__required" aria-hidden="true">*</span>
      </label>
      <input
        id="flujo-telefono"
        v-model="form.telefono"
        class="step__input"
        :class="{ 'step__input--error': errorTelefono }"
        type="tel"
        autocomplete="tel"
        placeholder="+56 9 1234 5678"
        :aria-invalid="errorTelefono ? 'true' : 'false'"
        @blur="marcarTocado('telefono')"
      />
      <span v-if="errorTelefono" class="step__error" role="alert">{{ errorTelefono }}</span>
      <span v-else-if="errors.telefono" class="step__error">{{ errors.telefono }}</span>
    </div>
  </div>
</template>

<style scoped>
.step {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.step__field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.step__label {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
}
.step__required {
  margin-left: 0.2rem;
  color: #fecaca;
  font-weight: 700;
}
.step__input {
  padding: 0.8rem 0.95rem;
  font-size: 0.95rem;
  color: var(--color-text);
  background: #fff;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  transition: box-shadow 0.15s, border-color 0.15s;
}
.step__input::placeholder {
  color: #94a3b8;
}
.step__input:focus {
  outline: none;
  border-color: var(--color-primary-strong);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.35);
}
.step__input--error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
}
.step__error {
  font-size: 0.8rem;
  color: #fecaca;
}
</style>
