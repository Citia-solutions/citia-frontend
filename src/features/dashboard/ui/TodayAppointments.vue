<script setup lang="ts">
// Lista de citas del día. Lee del store `useTodayAppointments` (entities); quién
// y cuándo se recarga lo decide la página. Cada fila es clicable y emite
// `select` para abrir el voucher de la cita: este widget no sabe que el voucher
// existe (la página compone).
import { computed } from 'vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import BaseAvatar from '@/shared/ui/BaseAvatar.vue'
import {
  AppointmentStatusBadge,
  isPastAppointment,
  isTerminalStatus,
  useTodayAppointments,
  type Appointment,
} from '@/entities/appointment'

const emit = defineEmits<{
  /** El profesional abrió una cita de la lista. */
  select: [appointment: Appointment]
  /** Pidió agendar una cita desde el estado vacío. */
  schedule: []
}>()

const store = useTodayAppointments()

/** Singular/plural: plural(1, 'pendiente') → '1 pendiente'. */
function plural(n: number, singular: string): string {
  return `${n} ${n === 1 ? singular : `${singular}s`}`
}

// "N agendadas · N confirmadas · N pendientes [· N canceladas]", calculado.
const subtitle = computed(() => {
  if (store.appointments.length === 0) return ''
  const partes = [
    plural(store.scheduledCount, 'agendada'),
    plural(store.confirmedCount, 'confirmada'),
    plural(store.pendingCount, 'pendiente'),
  ]
  if (store.cancelledCount > 0) partes.push(plural(store.cancelledCount, 'cancelada'))
  return partes.join(' · ')
})

/** Primera carga: todavía no hay nada que mostrar. */
const firstLoad = computed(() => store.loading && !store.loaded)
/** Recarga con datos a la vista: se mantienen, con un indicador discreto. */
const refreshing = computed(() => store.loading && store.loaded)

// Tachado = cancelada. Atenuada = ya pasó o está en un estado terminal.
// "Pasada" se evalúa contra el momento de la última carga (se recalcula al
// refrescar la lista), sin reloj por minuto.
function rowClasses(appt: Appointment): Record<string, boolean> {
  const cancelada = appt.status === 'cancelada'
  return {
    'appts__row--cancelled': cancelada,
    'appts__row--muted':
      !cancelada && (isTerminalStatus(appt.status) || isPastAppointment(appt, store.loadedAt)),
  }
}

function rowLabel(appt: Appointment): string {
  return `Ver cita de ${appt.patientName} a las ${appt.time}`
}
</script>

<template>
  <BaseCard>
    <template #header>
      <div class="appts__head">
        <div>
          <h2 class="appts__title">
            Citas de hoy
            <span v-if="refreshing" class="appts__refreshing" role="status">
              <span class="appts__spinner" aria-hidden="true" />
              Actualizando…
            </span>
          </h2>
          <p v-if="subtitle" class="appts__subtitle">{{ subtitle }}</p>
        </div>
        <button type="button" class="appts__head-action">Ver calendario</button>
      </div>
    </template>

    <!-- Primera carga: filas esqueleto de la misma altura que una real. -->
    <ul v-if="firstLoad" class="appts__list" aria-busy="true" aria-label="Cargando citas de hoy">
      <li v-for="n in 4" :key="n" class="appts__skeleton">
        <span class="appts__skel appts__skel--time" />
        <span class="appts__skel appts__skel--avatar" />
        <span class="appts__skel-info">
          <span class="appts__skel appts__skel--name" />
          <span class="appts__skel appts__skel--meta" />
        </span>
        <span class="appts__skel appts__skel--badge" />
      </li>
    </ul>

    <!-- Error sin datos que mostrar. -->
    <div v-else-if="store.error && !store.loaded" class="appts__state" role="alert">
      <p class="appts__state-text">{{ store.error }}</p>
      <button type="button" class="appts__state-action" @click="store.reload()">Reintentar</button>
    </div>

    <template v-else>
      <!-- Error con datos previos: se conservan y el error va como aviso. -->
      <div v-if="store.error" class="appts__warning" role="alert">
        <span>{{ store.error }} Mostramos la última versión cargada.</span>
        <button type="button" class="appts__warning-action" :disabled="store.loading" @click="store.reload()">
          Reintentar
        </button>
      </div>

      <div v-if="store.appointments.length === 0" class="appts__state">
        <p class="appts__state-text">No tienes citas para hoy.</p>
        <button type="button" class="appts__state-action" @click="emit('schedule')">
          Agendar una cita
        </button>
      </div>

      <ul v-else class="appts__list">
        <li v-for="appt in store.appointments" :key="appt.id">
          <button
            type="button"
            class="appts__row"
            :class="rowClasses(appt)"
            :aria-label="rowLabel(appt)"
            @click="emit('select', appt)"
          >
            <span class="appts__time">{{ appt.time }}</span>
            <BaseAvatar :name="appt.patientName" :size="40" />
            <span class="appts__info">
              <span class="appts__name">{{ appt.patientName }}</span>
              <span class="appts__meta">{{ appt.type }} · {{ appt.durationMin }} min</span>
            </span>
            <span class="appts__actions">
              <AppointmentStatusBadge :status="appt.status" />
              <span class="appts__row-action" aria-hidden="true">Ver cita</span>
            </span>
          </button>
        </li>
      </ul>
    </template>
  </BaseCard>
</template>

<style scoped>
.appts__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.appts__title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}
.appts__refreshing {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
.appts__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: appts-spin 0.6s linear infinite;
}
.appts__subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}
.appts__head-action {
  flex-shrink: 0;
  border: none;
  background: var(--color-surface-muted);
  color: var(--color-text);
  font-size: 0.82rem;
  font-weight: 600;
  padding: 0.45rem 0.8rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s;
}
.appts__head-action:hover {
  background: var(--color-border);
}
.appts__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.appts__list > li {
  border-bottom: 1px solid var(--color-border);
}
.appts__list > li:last-child {
  border-bottom: none;
}
.appts__row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  width: 100%;
  padding: 0.85rem 0.5rem;
  margin: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.appts__row:hover {
  background: var(--color-surface-muted);
}
.appts__row:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: -2px;
}
.appts__row--muted {
  opacity: 0.6;
}
.appts__row--cancelled {
  opacity: 0.55;
}
.appts__row--cancelled .appts__time,
.appts__row--cancelled .appts__name {
  text-decoration: line-through;
}
.appts__time {
  width: 3rem;
  flex-shrink: 0;
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--color-text);
}
.appts__info {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
  flex: 1;
}
.appts__name {
  font-weight: 600;
  font-size: 0.92rem;
  color: var(--color-text);
}
.appts__meta {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.appts__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-shrink: 0;
}
.appts__row-action {
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
}
.appts__row:hover .appts__row-action {
  text-decoration: underline;
}

/* Estados vacío / error */
.appts__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  text-align: center;
}
.appts__state-text {
  margin: 0;
  font-size: 0.92rem;
  color: var(--color-text-muted);
}
.appts__state-action {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s;
}
.appts__state-action:hover {
  background: var(--color-surface-muted);
}
.appts__warning {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
}
.appts__warning-action {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-danger);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.appts__warning-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Esqueleto */
.appts__skeleton {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 0.5rem;
  border-bottom: 1px solid var(--color-border);
}
.appts__skeleton:last-child {
  border-bottom: none;
}
.appts__skel {
  display: block;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  animation: appts-pulse 1.2s ease-in-out infinite;
}
.appts__skel--time {
  width: 3rem;
  height: 0.9rem;
}
.appts__skel--avatar {
  width: 40px;
  height: 40px;
  border-radius: var(--radius-full);
}
.appts__skel-info {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  flex: 1;
}
.appts__skel--name {
  width: 45%;
  height: 0.9rem;
}
.appts__skel--meta {
  width: 30%;
  height: 0.75rem;
}
.appts__skel--badge {
  width: 5rem;
  height: 1.3rem;
  border-radius: var(--radius-full);
}
@keyframes appts-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
@keyframes appts-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 560px) {
  .appts__row {
    gap: 0.6rem;
    padding: 0.85rem 0.25rem;
  }
  .appts__actions {
    flex-direction: column;
    align-items: flex-end;
    gap: 0.35rem;
  }
}
</style>
