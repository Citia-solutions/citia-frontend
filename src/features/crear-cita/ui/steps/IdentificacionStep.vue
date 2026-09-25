<script setup lang="ts">
// Sección 1: Identifícate. RUT, nombre y apellidos obligatorios.
// El error de cada campo aparece al salir del campo (blur) y se recalcula en
// vivo mientras se escribe.
import { useErroresVisibles } from '../../model/useErroresVisibles'
import { LIMITES, type FlujoCitaErrors, type FlujoCitaForm } from '../../model/flujoCitaModel'

const props = defineProps<{
  form: FlujoCitaForm
  errors: FlujoCitaErrors
}>()

const { marcarTocado, errorDe } = useErroresVisibles('identificacion', props.form)

const errorRut = errorDe('rut')
const errorNombre = errorDe('nombre')
const errorApellidos = errorDe('apellidos')
</script>

<template>
  <div class="step">
    <div class="step__field">
      <label class="step__label" for="flujo-rut">
        Ingrese su RUT:<span class="step__required" aria-hidden="true">*</span>
      </label>
      <input
        id="flujo-rut"
        v-model="form.rut"
        class="step__input"
        :class="{ 'step__input--error': errorRut }"
        type="text"
        inputmode="numeric"
        placeholder="Ej: 12.345.678-9"
        :aria-invalid="errorRut ? 'true' : 'false'"
        @blur="marcarTocado('rut')"
      />
      <span v-if="errorRut" class="step__error" role="alert">{{ errorRut }}</span>
      <span v-else-if="errors.rut" class="step__error">{{ errors.rut }}</span>
    </div>

    <div class="step__field">
      <label class="step__label" for="flujo-nombre">
        Ingrese su nombre y apellidos:<span class="step__required" aria-hidden="true">*</span>
      </label>
      <input
        id="flujo-nombre"
        v-model="form.nombre"
        class="step__input"
        :class="{ 'step__input--error': errorNombre }"
        type="text"
        autocomplete="given-name"
        :maxlength="LIMITES.nombreParte"
        placeholder="Nombre"
        :aria-invalid="errorNombre ? 'true' : 'false'"
        @blur="marcarTocado('nombre')"
      />
      <span v-if="errorNombre" class="step__error" role="alert">{{ errorNombre }}</span>
      <span v-else-if="errors.nombre" class="step__error">{{ errors.nombre }}</span>
      <input
        v-model="form.apellidos"
        class="step__input"
        :class="{ 'step__input--error': errorApellidos }"
        type="text"
        autocomplete="family-name"
        :maxlength="LIMITES.nombreParte"
        placeholder="Apellidos"
        :aria-invalid="errorApellidos ? 'true' : 'false'"
        @blur="marcarTocado('apellidos')"
      />
      <span v-if="errorApellidos" class="step__error" role="alert">{{ errorApellidos }}</span>
      <span v-else-if="errors.apellidos" class="step__error">{{ errors.apellidos }}</span>
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
