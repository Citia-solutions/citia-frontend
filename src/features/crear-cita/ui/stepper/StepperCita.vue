<script setup lang="ts">
// Stepper vertical del panel derecho. Muestra las 4 secciones con su estado:
// la activa en azul, las ya completadas también en azul (ícono + etiqueta) y
// las pendientes en gris. Cada paso lleva una línea conectora que se pinta
// azul cuando el paso está completado y medio azul en el paso actual.
import { computed } from 'vue'
import { PASOS, type FlujoCitaPaso } from '../../model/flujoCitaModel'

const props = defineProps<{
  pasoActual: FlujoCitaPaso
}>()

const emit = defineEmits<{
  /** El usuario tocó un paso del stepper para navegar a esa sección. */
  navegar: [paso: FlujoCitaPaso]
}>()

// Índice del paso activo para pintar las líneas conectoras. Se recalcula al
// cambiar la prop para marcar como completados los pasos ya superados.
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
  <div class="stepper">
    <ol class="stepper__list">
      <li
        v-for="(paso, i) in PASOS"
        :key="paso.id"
        class="stepper__item"
        :class="{
          'stepper__item--active': paso.id === pasoActual,
          'stepper__item--done': i < indiceActivo,
        }"
      >
        <button type="button" class="stepper__btn" @click="emit('navegar', paso.id)">
          <span class="stepper__dot">
            <svg
              viewBox="0 0 24 24"
              width="28"
              height="28"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
            >
              <path :d="ICONOS[paso.id]" />
            </svg>
          </span>
          <span class="stepper__label">{{ paso.titulo }}</span>
        </button>

        <span
          v-if="i < PASOS.length - 1"
          class="stepper__line"
          :class="{
            'stepper__line--done': i < indiceActivo,
            'stepper__line--active': i === indiceActivo,
          }"
        />
      </li>
    </ol>
  </div>
</template>

<style scoped>
.stepper {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1.25rem;
}
.stepper__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}
.stepper__item {
  display: grid;
  grid-template-columns: 64px auto;
  grid-template-rows: auto 1fr;
  column-gap: 0.9rem;
  align-items: center;
  cursor: pointer;
}
/* display: contents para que el botón no rompa el grid del li (círculo a la
   izquierda, etiqueta al lado y línea conectora debajo del círculo). */
.stepper__btn {
  display: contents;
  font: inherit;
  color: inherit;
  background: none;
  border: none;
  padding: 0;
  text-align: left;
}
.stepper__btn:focus-visible .stepper__dot {
  outline: 2px solid var(--color-primary);
  outline-offset: 3px;
}
.stepper__item:hover .stepper__dot {
  filter: brightness(0.97);
}
.stepper__dot {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--radius-full);
  background: var(--color-surface-muted);
  color: #475569;
  transition: background 0.2s, color 0.2s, filter 0.15s;
}
.stepper__label {
  font-size: 1.15rem;
  font-weight: 600;
  color: #94a3b8;
}
.stepper__item--active .stepper__dot {
  background: var(--color-primary);
  color: #fff;
}
.stepper__item--active .stepper__label {
  color: var(--color-primary);
  font-weight: 700;
}
.stepper__item--done .stepper__dot {
  background: var(--color-primary);
  color: #fff;
}
.stepper__item--done .stepper__label {
  color: var(--color-primary);
  font-weight: 700;
}
.stepper__line {
  grid-column: 1;
  justify-self: center;
  width: 2px;
  height: 44px;
  background: var(--color-border);
  margin: 0.25rem 0;
}
.stepper__line--done {
  background: var(--color-primary);
}
/* La línea del paso activo se pinta mitad azul / mitad gris. */
.stepper__line--active {
  background: linear-gradient(var(--color-primary) 50%, var(--color-border) 50%);
}
</style>
