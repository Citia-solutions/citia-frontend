<script setup lang="ts">
// Página "Agenda": vista semanal y lista por rango de las citas del
// profesional. Mismo patrón que el dashboard: la página COMPONE (agenda, modal
// "Nueva cita", voucher) y, ante cada evento de los features, le pide al store
// de la agenda que recargue. Refrescar = volver a pedir el rango.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { AgendaProfesional } from '@/features/agenda'
import { ModalNuevaCita, type CitaCreada } from '@/features/crear-cita'
import { VoucherCita } from '@/features/gestionar-cita'
import {
  AvisoSolapamiento,
  solapamientosDe,
  useAgendaAppointments,
  type AgendaAppointment,
  type Appointment,
} from '@/entities/appointment'

/** Mínimo entre refetches automáticos al volver el foco a la pestaña. */
const REFETCH_MIN_MS = 30_000

const agenda = useAgendaAppointments()

const nuevaCitaAbierta = ref(false)
const solapamientosCreada = ref<AgendaAppointment[]>([])

// Copia de la cita: recargar la agenda (o que la cita salga del rango al
// reagendarla) no afecta al voucher abierto.
const voucherAbierto = ref(false)
const citaSeleccionada = ref<Appointment | null>(null)

function abrirVoucher(appointment: AgendaAppointment): void {
  citaSeleccionada.value = { ...appointment }
  voucherAbierto.value = true
}

function alCrearCita(cita: CitaCreada): void {
  solapamientosCreada.value = solapamientosDe(cita.avisos)
  void agenda.reload()
}

function alCambiarVisibilidad(): void {
  if (document.visibilityState === 'visible') void agenda.reloadIfStale(REFETCH_MIN_MS)
}

onMounted(() => document.addEventListener('visibilitychange', alCambiarVisibilidad))
onBeforeUnmount(() => document.removeEventListener('visibilitychange', alCambiarVisibilidad))
</script>

<template>
  <main class="page">
    <header class="page__head">
      <div>
        <h1 class="page__title">Agenda</h1>
        <p class="page__subtitle">Tus citas por semana o por rango de fechas.</p>
      </div>
      <div class="page__cta">
        <BaseButton :block="false" @click="nuevaCitaAbierta = true">+ Nueva cita</BaseButton>
      </div>
    </header>

    <AvisoSolapamiento
      :solapamientos="solapamientosCreada"
      dismissible
      @dismiss="solapamientosCreada = []"
    />

    <AgendaProfesional @select="abrirVoucher" />
  </main>

  <ModalNuevaCita
    :is-open="nuevaCitaAbierta"
    @close="nuevaCitaAbierta = false"
    @created="alCrearCita"
  />

  <VoucherCita
    :is-open="voucherAbierto"
    :appointment="citaSeleccionada"
    :lista-del-dia="false"
    @close="voucherAbierto = false"
    @changed="agenda.reload()"
  />
</template>

<style scoped>
.page {
  flex: 1;
  min-width: 0;
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.page__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.page__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}
.page__subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
@media (max-width: 560px) {
  .page {
    padding: 1.25rem 1rem;
  }
}
</style>
