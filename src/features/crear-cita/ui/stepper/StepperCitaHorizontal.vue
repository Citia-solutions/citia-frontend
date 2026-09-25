<script setup lang="ts">
// Stepper horizontal para móvil: sin barra de fondo (transparente, flota sobre
// el azul del flujo). Íconos en blanco; el paso completado o el actual usan un
// círculo blanco relleno con el ícono/número en azul. Se usa solo en <1024px.
import { computed } from 'vue'
import { PASOS, type FlujoCitaPaso } from '../../model/flujoCitaModel'

const props = defineProps<{
  pasoActual: FlujoCitaPaso
}>()

const emit = defineEmits<{
  /** El usuario tocó un paso del stepper para navegar a esa sección. */
  navegar: [paso: FlujoCitaPaso]
}>()

const indiceActivo = computed(() => PASOS.findIndex((p) => p.id === props.pasoActual))

// Íconos por paso (usuario, teléfono, calendario, bocadillo de chat).
const ICONOS: Record<FlujoCitaPaso, string> = {
  identificacion: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  contacto: 'M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.13.96.36 1.9.7 2.8a2 2 0 0 1-.45 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.45c.9.34 1.84.57 2.8.7A2 2 0 0 1 22 16.9Z',
  horario: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
  motivo: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z',
}
</script>

<template>
  <div class="stepper-h">
    <ol class="stepper-h__list">
      <li
        v-for="(paso, i) in PASOS"
        :key="paso.id"
        class="stepper-h__item"
        :class="{
          'stepper-h__item--done': i < indiceActivo,
          'stepper-h__item--active': paso.id === pasoActual,
        }"
      >
        <span
          v-if="i > 0"
          class="stepper-h__line"
          :class="{ 'stepper-h__line--done': i <= indiceActivo }"
        />
        <button type="button" class="stepper-h__btn" @click="emit('navegar', paso.id)">
          <span class="stepper-h__dot">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path :d="ICONOS[paso.id]" />
            </svg>
          </span>
        </button>
      </li>
    </ol>

    <p class="stepper-h__label">
      Paso {{ indiceActivo + 1 }} de {{ PASOS.length }} · {{ PASOS[indiceActivo]?.titulo }}
    </p>
  </div>
</template>

<style scoped>
.stepper-h {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.9rem 1.25rem 1.1rem;
  background: transparent;
  box-shadow: none;
}
.stepper-h__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  align-items: center;
}
.stepper-h__item {
  display: flex;
  align-items: center;
}
.stepper-h__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: none;
  border-radius: var(--radius-full);
  background: none;
  cursor: pointer;
}
.stepper-h__btn:focus-visible .stepper-h__dot {
  outline: 2px solid rgba(255, 255, 255, 0.9);
  outline-offset: 3px;
}
.stepper-h__dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border-radius: var(--radius-full);
  color: #fff;
  background: transparent;
  transition: background 0.2s, color 0.2s;
}
.stepper-h__item--done .stepper-h__dot,
.stepper-h__item--active .stepper-h__dot {
  background: #fff;
  color: var(--color-primary);
}
.stepper-h__line {
  width: 44px;
  height: 2px;
  background: rgba(255, 255, 255, 0.35);
}
.stepper-h__line--done {
  background: rgba(255, 255, 255, 0.9);
}
.stepper-h__label {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: #fff;
}
</style>
