<script setup lang="ts">
// Vista lista de la agenda: las citas del rango agrupadas por `fecha` (la del
// backend, en zona de la clínica) y en el orden en que vienen. Misma fila que
// "Citas de hoy" (tachado = cancelada, atenuado = pasada o terminal).
import { computed } from 'vue'
import BaseAvatar from '@/shared/ui/BaseAvatar.vue'
import { capitalizar, fechaCalendario, formatearFechaLarga } from '@/shared/lib/fecha'
import {
  AppointmentStatusBadge,
  isPastAppointment,
  isTerminalStatus,
  type AgendaAppointment,
} from '@/entities/appointment'
import { agruparPorFecha } from '../model/agenda'

const props = defineProps<{
  appointments: AgendaAppointment[]
  hoy: string
  loadedAt: Date
}>()

const emit = defineEmits<{ select: [appointment: AgendaAppointment] }>()

// Los días se ordenan por su `fecha` ('YYYY-MM-DD' ordena como texto); dentro
// de cada día se respeta el orden del backend (`inicio ASC`, desempate estable).
const grupos = computed(() =>
  Array.from(agruparPorFecha(props.appointments), ([fecha, citas]) => ({
    fecha,
    titulo: capitalizar(formatearFechaLarga(fechaCalendario(fecha))),
    esHoy: fecha === props.hoy,
    citas,
  })).sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0)),
)

function rowClasses(appt: AgendaAppointment): Record<string, boolean> {
  const cancelada = appt.status === 'cancelada'
  return {
    'agenda-list__row--cancelled': cancelada,
    'agenda-list__row--muted':
      !cancelada && (isTerminalStatus(appt.status) || isPastAppointment(appt, props.loadedAt)),
  }
}

function plural(n: number, singular: string): string {
  return `${n} ${n === 1 ? singular : `${singular}s`}`
}
</script>

<template>
  <div class="agenda-list">
    <p v-if="grupos.length === 0" class="agenda-list__empty">No hay citas en este rango.</p>

    <section v-for="g in grupos" :key="g.fecha" class="agenda-list__group" :aria-labelledby="`dia-${g.fecha}`">
      <h3 :id="`dia-${g.fecha}`" class="agenda-list__day">
        {{ g.titulo }}
        <span v-if="g.esHoy" class="agenda-list__today">Hoy</span>
        <span class="agenda-list__count">{{ plural(g.citas.length, 'cita') }}</span>
      </h3>
      <ul class="agenda-list__list">
        <li v-for="appt in g.citas" :key="appt.id">
          <button
            type="button"
            class="agenda-list__row"
            :class="rowClasses(appt)"
            :aria-label="`Ver cita de ${appt.patientName}, ${g.titulo} a las ${appt.time}`"
            @click="emit('select', appt)"
          >
            <span class="agenda-list__time">{{ appt.time }}</span>
            <BaseAvatar :name="appt.patientName" :size="36" />
            <span class="agenda-list__info">
              <span class="agenda-list__name">{{ appt.patientName }}</span>
              <span class="agenda-list__meta">{{ appt.type }} · {{ appt.durationMin }} min</span>
            </span>
            <span class="agenda-list__actions">
              <AppointmentStatusBadge :status="appt.status" />
              <span class="agenda-list__row-action" aria-hidden="true">Ver cita</span>
            </span>
          </button>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.agenda-list {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.agenda-list__empty {
  margin: 0;
  padding: 2rem 1rem;
  text-align: center;
  font-size: 0.92rem;
  color: var(--color-text-muted);
}
.agenda-list__day {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0 0 0.25rem;
  padding-bottom: 0.4rem;
  font-size: 0.9rem;
  font-weight: 700;
  color: var(--color-text);
  border-bottom: 2px solid var(--color-border);
}
.agenda-list__today {
  padding: 0.1rem 0.5rem;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-size: 0.7rem;
  font-weight: 700;
}
.agenda-list__count {
  margin-left: auto;
  font-size: 0.78rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
.agenda-list__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.agenda-list__list > li {
  border-bottom: 1px solid var(--color-border);
}
.agenda-list__list > li:last-child {
  border-bottom: none;
}
.agenda-list__row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 0.7rem 0.5rem;
  margin: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.agenda-list__row:hover {
  background: var(--color-surface-muted);
}
.agenda-list__row:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
.agenda-list__row--muted {
  opacity: 0.6;
}
.agenda-list__row--cancelled {
  opacity: 0.55;
}
.agenda-list__row--cancelled .agenda-list__time,
.agenda-list__row--cancelled .agenda-list__name {
  text-decoration: line-through;
}
.agenda-list__time {
  width: 3rem;
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text);
}
.agenda-list__info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}
.agenda-list__name {
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--color-text);
}
.agenda-list__meta {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.agenda-list__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}
.agenda-list__row-action {
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}
.agenda-list__row:hover .agenda-list__row-action {
  text-decoration: underline;
}
@media (max-width: 560px) {
  .agenda-list__row {
    gap: 0.6rem;
    padding: 0.7rem 0.25rem;
  }
  .agenda-list__actions {
    flex-direction: column;
    align-items: flex-end;
    gap: 0.35rem;
  }
}
</style>
