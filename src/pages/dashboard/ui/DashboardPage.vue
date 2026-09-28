<script setup lang="ts">
// Página raíz del dashboard "Resumen". El sidebar lo pone `PanelLayout` (app);
// aquí va el contenido principal scrolleable.
//
// La página COMPONE: escucha los eventos que ya emiten los features (cita
// creada, cita cambiada desde el voucher) y le pide al store de citas del día
// que recargue. Los features siguen sin saber que el dashboard existe.
//
// Si la cita recién creada se cruza con otras (ADR-11), el modal ya se cerró:
// el aviso se muestra aquí, sobre el contenido, hasta que se descarte.
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import DashboardTopbar from './DashboardTopbar.vue'
import {
  MetricsRow,
  TodayAppointments,
  WeeklyAbsenteeism,
  EngineActivity,
} from '@/features/dashboard'
import { ModalNuevaCita, type CitaCreada } from '@/features/crear-cita'
import { VoucherCita } from '@/features/gestionar-cita'
import {
  AvisoSolapamiento,
  solapamientosDe,
  useTodayAppointments,
  type AgendaAppointment,
  type Appointment,
} from '@/entities/appointment'

/** Mínimo entre refetches automáticos al volver el foco a la pestaña. */
const REFETCH_MIN_MS = 30_000

const todayAppointments = useTodayAppointments()
const router = useRouter()

// Modal "Nueva cita" (lo abren el topbar y el estado vacío de la lista).
const nuevaCitaAbierta = ref(false)

// Voucher: se guarda una copia de la fila, así recargar la lista (o que la
// cita desaparezca de ella al moverla a otro día) no afecta al voucher abierto.
const voucherAbierto = ref(false)
const citaSeleccionada = ref<Appointment | null>(null)

// Aviso de solapamiento de la última cita creada (vacío = no se muestra).
const solapamientosCreada = ref<AgendaAppointment[]>([])

function alCrearCita(cita: CitaCreada): void {
  solapamientosCreada.value = solapamientosDe(cita.avisos)
  void todayAppointments.reload()
}

function abrirVoucher(appointment: Appointment): void {
  citaSeleccionada.value = { ...appointment }
  voucherAbierto.value = true
}

// Cambios que no pasan por esta pestaña (otra pestaña, otra persona, el
// paciente cuando exista US-02.07, o cruzar la medianoche): se recarga al
// volver a la pestaña, con un mínimo entre pedidos.
function alCambiarVisibilidad(): void {
  if (document.visibilityState === 'visible') {
    void todayAppointments.reloadIfStale(REFETCH_MIN_MS)
  }
}

onMounted(() => {
  void todayAppointments.reload()
  document.addEventListener('visibilitychange', alCambiarVisibilidad)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', alCambiarVisibilidad)
})
</script>

<template>
  <main class="dashboard__main">
    <DashboardTopbar @nueva-cita="nuevaCitaAbierta = true" />

    <AvisoSolapamiento
      :solapamientos="solapamientosCreada"
      dismissible
      @dismiss="solapamientosCreada = []"
    />

    <MetricsRow />

    <div class="dashboard__grid">
      <div class="dashboard__col-main">
        <TodayAppointments
          @select="abrirVoucher"
          @schedule="nuevaCitaAbierta = true"
          @calendar="router.push({ name: 'agenda' })"
        />
      </div>
      <div class="dashboard__col-side">
        <WeeklyAbsenteeism />
        <EngineActivity />
      </div>
    </div>
  </main>

  <ModalNuevaCita
    :is-open="nuevaCitaAbierta"
    @close="nuevaCitaAbierta = false"
    @created="alCrearCita"
  />

  <VoucherCita
    :is-open="voucherAbierto"
    :appointment="citaSeleccionada"
    @close="voucherAbierto = false"
    @changed="todayAppointments.reload()"
  />
</template>

<style scoped>
.dashboard__main {
  flex: 1;
  min-width: 0;
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.dashboard__grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  align-items: start;
}
.dashboard__col-side {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
@media (max-width: 1024px) {
  .dashboard__grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .dashboard__main {
    padding: 1.25rem 1rem;
  }
}
</style>
