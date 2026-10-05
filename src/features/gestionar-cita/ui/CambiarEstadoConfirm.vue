<script setup lang="ts">
// Vista de confirmación del voucher para las transiciones sin formulario:
// Confirmar (pendiente → confirmada), Asistió y No asistió (confirmada →
// asistio / no_asistio, terminales). Mismo patrón que `CancelarCitaConfirm`:
// foco inicial en "Volver", el voucher no se cierra mientras se envía y el
// resultado se le pasa al voucher.
//
// Asistió / No asistió solo se llega aquí desde la hora de inicio: el voucher
// no los ofrece antes (2026-10-05), así que ya no hay aviso de "aún no empieza".
import { computed, onMounted, ref, watch } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { capitalizar, formatearFechaLarga } from '@/shared/lib/fecha'
import type { Appointment } from '@/entities/appointment'
import { useCambiarEstadoCita } from '../model/useCambiarEstadoCita'
import type { ResultadoAccion, TransicionEstado } from '../model/types'

const props = defineProps<{ appointment: Appointment; transicion: TransicionEstado }>()

const emit = defineEmits<{
  back: []
  submitting: [value: boolean]
  result: [resultado: ResultadoAccion]
}>()

const { isSubmitting, submitError, submit } = useCambiarEstadoCita(
  props.appointment.id,
  props.transicion,
)

// `sync`: la vista se desmonta apenas llega el resultado (igual que cancelar).
watch(isSubmitting, (v) => emit('submitting', v), { flush: 'sync' })

const volverWrap = ref<HTMLElement | null>(null)
onMounted(() => volverWrap.value?.querySelector('button')?.focus())

interface Textos {
  titulo: string
  detalle: string[]
  boton: string
}

const textos = computed<Textos>(() => {
  const nombre = props.appointment.patientName
  switch (props.transicion) {
    case 'confirmar':
      return {
        titulo: `¿Marcar como confirmada la cita de ${nombre}?`,
        detalle: [
          'Úsalo cuando el paciente te confirme que vendrá (por teléfono, en persona o por correo). Citia no le envía ningún aviso.',
          'Sus recordatorios siguen programados igual.',
        ],
        boton: 'Sí, confirmar',
      }
    case 'asistencia':
      return {
        titulo: `¿Registrar que ${nombre} asistió?`,
        detalle: [
          'La cita queda cerrada como «Asistió» y ya no admite cambios. Esta acción no se puede deshacer.',
          'Sus recordatorios pendientes se anulan.',
        ],
        boton: 'Sí, asistió',
      }
    case 'inasistencia':
      return {
        titulo: `¿Registrar que ${nombre} no asistió?`,
        detalle: [
          'La cita queda cerrada como «No asistió» y ya no admite cambios. Esta acción no se puede deshacer.',
          'Sus recordatorios pendientes se anulan.',
        ],
        boton: 'Sí, no asistió',
      }
  }
  return { titulo: '', detalle: [], boton: '' }
})

const cuando = computed(() => {
  const fecha = capitalizar(formatearFechaLarga(new Date(props.appointment.startsAt)))
  return `${fecha} a las ${props.appointment.time}.`
})

async function handleSubmit(): Promise<void> {
  emit('result', await submit())
}
</script>

<template>
  <form class="accion" novalidate @submit.prevent="handleSubmit">
    <h3 class="accion__title">{{ textos.titulo }}</h3>
    <p class="accion__ref">{{ cuando }}</p>
    <p v-for="linea in textos.detalle" :key="linea" class="accion__ref">{{ linea }}</p>

    <p v-if="submitError" class="accion__error" role="alert">{{ submitError }}</p>

    <div class="accion__actions">
      <span ref="volverWrap">
        <BaseButton type="button" variant="outline" :block="false" :disabled="isSubmitting" @click="emit('back')">
          Volver
        </BaseButton>
      </span>
      <BaseButton
        type="submit"
        :variant="transicion === 'inasistencia' ? 'outline' : 'primary'"
        :class="{ accion__danger: transicion === 'inasistencia' }"
        :block="false"
        :loading="isSubmitting"
      >
        {{ textos.boton }}
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
.accion {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.accion__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}
.accion__ref {
  margin: -0.6rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
.accion__error {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.8rem;
}
.accion__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
}
/* Tono de alerta sobre BaseButton outline (más especificidad que .btn--outline). */
.accion .accion__danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.accion .accion__danger:not(:disabled):hover {
  background: var(--color-danger-soft);
}
</style>
