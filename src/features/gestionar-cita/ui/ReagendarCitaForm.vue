<script setup lang="ts">
// Vista "Reagendar" del voucher: reemplaza el cuerpo, no abre otro modal.
// Es a la vez el formulario y la confirmación: muestra la hora actual, la
// nueva, y los avisos de lo que implica mover la cita antes del botón.
import { computed, onMounted, ref, watch } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { capitalizar, formatearFechaLarga, horaLocal } from '@/shared/lib/fecha'
import type { Appointment } from '@/entities/appointment'
import { MOTIVO_MAX } from '../model/mensajeDeError'
import { useReagendarCita } from '../model/useReagendarCita'
import type { ResultadoAccion } from '../model/types'

const props = defineProps<{ appointment: Appointment }>()

const emit = defineEmits<{
  back: []
  /** Mientras se envía, el voucher no se puede cerrar. */
  submitting: [value: boolean]
  /** El servidor respondió (con éxito o con un fallo que el voucher debe atender). */
  result: [resultado: ResultadoAccion]
}>()

const {
  form,
  hoyISO,
  opcionesHora,
  nuevoInicio,
  errorValidacion,
  saleDeHoy,
  isSubmitting,
  submitError,
  submit,
} = useReagendarCita(props.appointment)

// `sync`: la vista se desmonta apenas llega el resultado; con el flush por
// defecto el aviso de "terminó de enviar" podría no llegar nunca al voucher.
watch(isSubmitting, (v) => emit('submitting', v), { flush: 'sync' })

const fechaInput = ref<HTMLInputElement | null>(null)
onMounted(() => fechaInput.value?.focus())

const horaActual = computed(() => {
  const inicio = new Date(props.appointment.startsAt)
  return `${formatearFechaLarga(inicio)}, ${props.appointment.time}`
})

const nuevaHora = computed(() => {
  const nuevo = nuevoInicio.value
  if (!nuevo || errorValidacion.value) return null
  return `${formatearFechaLarga(nuevo)}, ${horaLocal(nuevo)}`
})

const eraConfirmada = computed(() => props.appointment.status === 'confirmada')

async function handleSubmit(): Promise<void> {
  const resultado = await submit()
  if (resultado) emit('result', resultado)
}
</script>

<template>
  <form class="accion" novalidate @submit.prevent="handleSubmit">
    <h3 class="accion__title">Mover la cita de {{ appointment.patientName }}</h3>
    <p class="accion__ref">Hora actual: {{ capitalizar(horaActual) }}</p>

    <div class="accion__row">
      <div class="accion__field">
        <label class="accion__label" for="reagendar-fecha">Nuevo día</label>
        <input
          id="reagendar-fecha"
          ref="fechaInput"
          v-model="form.fecha"
          class="accion__input"
          type="date"
          :min="hoyISO"
          :disabled="isSubmitting"
        />
      </div>
      <div class="accion__field">
        <label class="accion__label" for="reagendar-hora">Nueva hora</label>
        <select id="reagendar-hora" v-model="form.hora" class="accion__input" :disabled="isSubmitting">
          <option value="" disabled>Selecciona una hora</option>
          <option v-for="bloque in opcionesHora" :key="bloque" :value="bloque">{{ bloque }}</option>
        </select>
      </div>
    </div>

    <div class="accion__field">
      <label class="accion__label" for="reagendar-motivo">Motivo</label>
      <textarea
        id="reagendar-motivo"
        v-model="form.motivo"
        class="accion__input accion__input--textarea"
        rows="2"
        :maxlength="MOTIVO_MAX"
        placeholder="Opcional — queda en el historial de la cita"
        :disabled="isSubmitting"
      />
      <span class="accion__counter">{{ form.motivo.length }}/{{ MOTIVO_MAX }}</span>
    </div>

    <p v-if="errorValidacion" class="accion__validation" aria-live="polite">{{ errorValidacion }}</p>
    <p v-else-if="nuevaHora" class="accion__new">Nueva hora: {{ capitalizar(nuevaHora) }}</p>

    <div class="accion__notice" role="note">
      <p v-if="eraConfirmada" class="accion__notice-text">
        La cita volverá a quedar <strong>pendiente</strong>: el paciente tendrá que confirmar la
        nueva hora.
      </p>
      <p v-else class="accion__notice-text">La cita seguirá pendiente de confirmación.</p>
      <p v-if="saleDeHoy" class="accion__notice-text">
        Al moverla a otro día, dejará de aparecer en tu lista de hoy.
      </p>
    </div>

    <p v-if="submitError" class="accion__error" role="alert">{{ submitError }}</p>

    <div class="accion__actions">
      <BaseButton type="button" variant="outline" :block="false" :disabled="isSubmitting" @click="emit('back')">
        Volver
      </BaseButton>
      <BaseButton type="submit" :block="false" :loading="isSubmitting" :disabled="errorValidacion !== null">
        Mover cita
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
.accion__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.accion__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.accion__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}
.accion__input {
  padding: 0.7rem 0.85rem;
  font-size: 0.95rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.accion__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.accion__input--textarea {
  resize: vertical;
  min-height: 64px;
  font-family: inherit;
}
.accion__counter {
  align-self: flex-end;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.accion__validation {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-warning);
}
.accion__new {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}
.accion__notice {
  padding: 0.6rem 0.8rem;
  background: var(--color-warning-soft);
  border-radius: var(--radius-md);
}
.accion__notice-text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text);
}
.accion__notice-text + .accion__notice-text {
  margin-top: 0.35rem;
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
@media (max-width: 480px) {
  .accion__row {
    grid-template-columns: 1fr;
  }
}
</style>
