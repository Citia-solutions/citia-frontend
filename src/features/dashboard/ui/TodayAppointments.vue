<script setup lang="ts">
// Lista de citas del día con estado y acción contextual.
import { onMounted, ref } from 'vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import BaseAvatar from '@/shared/ui/BaseAvatar.vue'
import { getTodayAppointments } from '../api/dashboardApi'
import type { Appointment, AppointmentStatus } from '@/entities/appointment'

const appointments = ref<Appointment[]>([])

onMounted(async () => {
  appointments.value = await getTodayAppointments()
})

// Mapeo estado → variante de badge.
const BADGE_VARIANT: Record<AppointmentStatus, 'success' | 'warning' | 'info' | 'danger'> = {
  confirmada: 'success',
  pendiente: 'warning',
  recuperada: 'info',
  riesgo_alto: 'danger',
}

// Mapeo estado → etiqueta legible.
const STATUS_LABEL: Record<AppointmentStatus, string> = {
  confirmada: 'Confirmada',
  pendiente: 'Pendiente',
  recuperada: 'Recuperada',
  riesgo_alto: 'Riesgo alto',
}

// Confirmadas/recuperadas → "Ver ficha"; pendientes/riesgo alto → "Enviar confirmación".
function actionLabel(status: AppointmentStatus): string {
  return status === 'confirmada' || status === 'recuperada' ? 'Ver ficha' : 'Enviar confirmación'
}
</script>

<template>
  <BaseCard>
    <template #header>
      <div class="appts__head">
        <div>
          <h2 class="appts__title">Citas de hoy</h2>
          <p class="appts__subtitle">7 agendadas · 5 confirmadas · 2 pendientes</p>
        </div>
        <button type="button" class="appts__head-action">Ver calendario</button>
      </div>
    </template>

    <ul class="appts__list">
      <li v-for="appt in appointments" :key="appt.id" class="appts__row">
        <span class="appts__time">{{ appt.time }}</span>
        <BaseAvatar :name="appt.patientName" :size="40" />
        <div class="appts__info">
          <span class="appts__name">{{ appt.patientName }}</span>
          <span class="appts__meta">{{ appt.type }} · {{ appt.durationMin }} min</span>
        </div>
        <div class="appts__actions">
          <BaseBadge :variant="BADGE_VARIANT[appt.status]">{{ STATUS_LABEL[appt.status] }}</BaseBadge>
          <button type="button" class="appts__row-action">{{ actionLabel(appt.status) }}</button>
        </div>
      </li>
    </ul>
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
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
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
.appts__row {
  display: flex;
  align-items: center;
  gap: 0.85rem;
  padding: 0.85rem 0;
  border-bottom: 1px solid var(--color-border);
}
.appts__row:last-child {
  border-bottom: none;
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
  border: none;
  background: transparent;
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  padding: 0;
  white-space: nowrap;
}
.appts__row-action:hover {
  text-decoration: underline;
}
@media (max-width: 560px) {
  .appts__actions {
    flex-direction: column;
    align-items: flex-end;
    gap: 0.35rem;
  }
}
</style>
