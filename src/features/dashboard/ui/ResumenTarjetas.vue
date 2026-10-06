<script setup lang="ts">
// Fila de cuatro cifras reales del dashboard. Ninguna cifra está escrita a mano:
//
// 1. Citas hoy — `useTodayAppointments` (`GET /citas/hoy`, el mismo pedido de
//    "Citas de hoy" y del topbar: no se pide de nuevo).
// 2. Próxima cita — la misma lista: la primera vigente que empieza después de ahora.
// 3. Próximos 7 días — `useProximasCitas` (`GET /citas?desde=hoy&hasta=hoy+6`).
// 4. Solicitudes por responder — `useSolicitudesRecibidas`
//    (`GET /solicitudes?estado=recibida`, el mismo conteo que la píldora del sidebar).
//
// Quién recarga y cuándo lo decide la página. "Ver cita" emite `select` (la
// página abre el voucher): este widget no sabe que el voucher existe.
import { computed } from 'vue'
import { useTodayAppointments, type Appointment } from '@/entities/appointment'
import { TOPE_BANDEJA, useSolicitudesRecibidas } from '@/entities/solicitud'
import { formatearDuracion, plural, proximaCita, totalesDeCitas } from '../model/resumen'
import { useProximasCitas } from '../model/useRangosCitas'
import { useAhora } from '../model/useAhora'
import TarjetaResumen from './TarjetaResumen.vue'

const emit = defineEmits<{ select: [appointment: Appointment] }>()

const hoy = useTodayAppointments()
const proximas = useProximasCitas()
const recibidas = useSolicitudesRecibidas()
const ahora = useAhora()

// --- 1 y 2: citas de hoy -----------------------------------------------------

const hoyCargando = computed(() => hoy.loading && !hoy.loaded)
/** Solo sin datos: con datos previos, el aviso de error lo muestra "Citas de hoy". */
const hoyError = computed(() => (hoy.loaded ? null : hoy.error))

// Mismos computed que el topbar ("N citas hoy · N pendientes de confirmar").
const detalleHoy = computed(() => {
  if (hoy.scheduledCount === 0) return 'No tienes citas vigentes hoy'
  if (hoy.pendingCount === 0) return 'Ninguna pendiente de confirmar'
  return `${plural(hoy.pendingCount, 'pendiente')} de confirmar`
})

const proxima = computed(() => proximaCita(hoy.appointments, ahora.value))

// --- 3: próximos 7 días ----------------------------------------------------------

const totalesProximos = computed(() => totalesDeCitas(proximas.appointments))
const detalleProximos = computed(() =>
  totalesProximos.value.agendadas === 0
    ? 'Sin citas agendadas'
    : `Horas agendadas: ${formatearDuracion(totalesProximos.value.minutos)}`,
)

// --- 4: solicitudes --------------------------------------------------------------

const solicitudesCargando = computed(() => recibidas.loading && recibidas.total === null)
const solicitudesError = computed(() => (recibidas.total === null ? recibidas.error : null))
const valorSolicitudes = computed(() => {
  const n = recibidas.total ?? 0
  return n >= TOPE_BANDEJA ? `${TOPE_BANDEJA}+` : String(n)
})
</script>

<template>
  <div class="resumen">
    <TarjetaResumen
      etiqueta="Citas hoy"
      :valor="String(hoy.scheduledCount)"
      :detalle="detalleHoy"
      :cargando="hoyCargando"
      :error="hoyError"
      @reintentar="hoy.reload()"
    />

    <TarjetaResumen
      etiqueta="Próxima cita"
      :valor="proxima ? proxima.time : 'No quedan citas hoy'"
      :valor-texto="!proxima"
      :detalle="proxima ? `${proxima.patientName} · ${proxima.type}` : ''"
      :cargando="hoyCargando"
      :error="hoyError"
      @reintentar="hoy.reload()"
    >
      <template v-if="proxima" #accion>
        <button
          type="button"
          :aria-label="`Ver cita de ${proxima.patientName} a las ${proxima.time}`"
          @click="emit('select', proxima)"
        >
          Ver cita
        </button>
      </template>
    </TarjetaResumen>

    <TarjetaResumen
      etiqueta="Próximos 7 días"
      :valor="plural(totalesProximos.agendadas, 'cita')"
      :detalle="detalleProximos"
      :cargando="proximas.loading && !proximas.loaded"
      :error="proximas.loaded ? null : proximas.error"
      @reintentar="proximas.reload()"
    />

    <TarjetaResumen
      etiqueta="Solicitudes por responder"
      :valor="valorSolicitudes"
      :detalle="(recibidas.total ?? 0) > 0 ? 'Esperan tu respuesta' : 'Estás al día'"
      :cargando="solicitudesCargando"
      :error="solicitudesError"
      @reintentar="recibidas.refresh()"
    >
      <template #accion>
        <RouterLink :to="{ name: 'solicitudes' }">Ver solicitudes</RouterLink>
      </template>
    </TarjetaResumen>
  </div>
</template>

<style scoped>
.resumen {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 1rem;
}
@media (max-width: 1024px) {
  .resumen {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 560px) {
  .resumen {
    grid-template-columns: 1fr;
  }
}
</style>
