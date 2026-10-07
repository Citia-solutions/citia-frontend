<script setup lang="ts">
// Aviso de solapamiento (ADR-11, "avisar y permitir"). NO bloquea nada: cuando
// se muestra, la operación (crear, reagendar, aceptar una solicitud) ya se
// hizo. Solo dice con qué citas vigentes del mismo profesional se cruza, para
// que el profesional decida si fue intencional (sobrecupo) o un error.
//
// Lo usan el dashboard, la agenda, el voucher y la bandeja: vive en la entidad
// para que se vea igual en todos lados. Si la lista viene vacía no pinta nada.
import { computed } from 'vue'
import { capitalizar, fechaCalendario, formatearFechaLarga } from '@/shared/lib/fecha'
import type { AgendaAppointment } from '../model/types'
import AppointmentStatusBadge from './AppointmentStatusBadge.vue'

const props = withDefaults(
  defineProps<{
    solapamientos: AgendaAppointment[]
    /** Muestra una "x" para descartar el aviso (emite `dismiss`). */
    dismissible?: boolean
  }>(),
  { dismissible: false },
)

const emit = defineEmits<{ dismiss: [] }>()

const titulo = computed(() => {
  const n = props.solapamientos.length
  return n === 1
    ? 'Esta cita se cruza con otra cita vigente del mismo profesional:'
    : `Esta cita se cruza con ${n} citas vigentes del mismo profesional:`
})

/** 'Lunes 22 de septiembre' a partir de la `fecha` del backend (sin convertir zonas). */
function dia(cita: AgendaAppointment): string {
  return capitalizar(formatearFechaLarga(fechaCalendario(cita.date)))
}
</script>

<template>
  <div v-if="solapamientos.length > 0" class="solape" role="status">
    <div class="solape__head">
      <svg
        class="solape__icon"
        viewBox="0 0 24 24"
        width="18"
        height="18"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        aria-hidden="true"
      >
        <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" />
        <path d="M12 9v4M12 17h.01" />
      </svg>
      <p class="solape__title">{{ titulo }}</p>
      <button
        v-if="dismissible"
        type="button"
        class="solape__close"
        aria-label="Descartar aviso"
        @click="emit('dismiss')"
      >
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 6 12 12M18 6 6 18" />
        </svg>
      </button>
    </div>

    <ul class="solape__list">
      <li v-for="cita in solapamientos" :key="cita.id" class="solape__item">
        <span class="solape__when">{{ dia(cita) }} · {{ cita.time }}</span>
        <span class="solape__who">
          {{ cita.patientName }} — {{ cita.type }} ({{ cita.durationMin }} min)
        </span>
        <AppointmentStatusBadge :status="cita.status" />
      </li>
    </ul>

    <p class="solape__foot">
      El cambio ya quedó guardado: Citia no impide los cruces, solo avisa. Si no fue
      intencional, reagenda una de las dos.
    </p>
  </div>
</template>

<style scoped>
.solape {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.7rem 0.85rem;
  background: var(--color-warning-soft);
  border: 1px solid var(--color-warning);
  border-radius: var(--radius-md);
  font-size: 0.85rem;
  color: var(--color-text);
}
.solape__head {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
}
.solape__icon {
  flex-shrink: 0;
  color: var(--color-warning);
  margin-top: 0.05rem;
}
.solape__title {
  flex: 1;
  margin: 0;
  font-weight: 600;
}
.solape__close {
  display: flex;
  flex-shrink: 0;
  padding: 0.1rem;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
}
.solape__close:hover {
  color: var(--color-text);
  background: rgba(15, 23, 42, 0.06);
}
.solape__list {
  list-style: none;
  margin: 0;
  padding: 0 0 0 1.6rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.solape__item {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.6rem;
}
.solape__when {
  font-weight: 600;
}
.solape__who {
  color: var(--color-text-muted);
}
.solape__foot {
  margin: 0;
  padding-left: 1.6rem;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
</style>
