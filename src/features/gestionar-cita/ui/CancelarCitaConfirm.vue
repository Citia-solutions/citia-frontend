<script setup lang="ts">
// Vista "Cancelar" del voucher: confirmación con motivo opcional. El foco
// inicial va a "Volver", no al botón destructivo.
//
// No se promete ningún aviso al paciente: no hay canal (RF-06) ni alertas (RF-05).
import { computed, onMounted, ref, watch } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { capitalizar, formatearFechaLarga } from '@/shared/lib/fecha'
import type { Appointment } from '@/entities/appointment'
import { MOTIVO_MAX } from '../model/mensajeDeError'
import { useCancelarCita } from '../model/useCancelarCita'
import type { ResultadoAccion } from '../model/types'

const props = defineProps<{ appointment: Appointment }>()

const emit = defineEmits<{
  back: []
  submitting: [value: boolean]
  result: [resultado: ResultadoAccion]
}>()

const { motivo, errorValidacion, isSubmitting, submitError, submit } = useCancelarCita(
  props.appointment.id,
)

// `sync`: la vista se desmonta apenas llega el resultado; con el flush por
// defecto el aviso de "terminó de enviar" podría no llegar nunca al voucher.
watch(isSubmitting, (v) => emit('submitting', v), { flush: 'sync' })

// BaseButton no reenvía refs: se enfoca el botón dentro de su contenedor.
const volverWrap = ref<HTMLElement | null>(null)
onMounted(() => volverWrap.value?.querySelector('button')?.focus())

const cuando = computed(() => {
  const fecha = capitalizar(formatearFechaLarga(new Date(props.appointment.startsAt)))
  return `${fecha} a las ${props.appointment.time}`
})

async function handleSubmit(): Promise<void> {
  const resultado = await submit()
  if (resultado) emit('result', resultado)
}
</script>

<template>
  <form class="accion" novalidate @submit.prevent="handleSubmit">
    <h3 class="accion__title">¿Cancelar la cita de {{ appointment.patientName }}?</h3>
    <p class="accion__ref">{{ cuando }}. Esta acción no se puede deshacer.</p>

    <div class="accion__field">
      <label class="accion__label" for="cancelar-motivo">Motivo</label>
      <textarea
        id="cancelar-motivo"
        v-model="motivo"
        class="accion__input accion__input--textarea"
        rows="2"
        :maxlength="MOTIVO_MAX"
        placeholder="Opcional — queda en el historial de la cita"
        :disabled="isSubmitting"
      />
      <span class="accion__counter">{{ motivo.length }}/{{ MOTIVO_MAX }}</span>
    </div>

    <p v-if="errorValidacion" class="accion__validation">{{ errorValidacion }}</p>
    <p v-if="submitError" class="accion__error" role="alert">{{ submitError }}</p>

    <div class="accion__actions">
      <span ref="volverWrap">
        <BaseButton type="button" variant="outline" :block="false" :disabled="isSubmitting" @click="emit('back')">
          Volver
        </BaseButton>
      </span>
      <BaseButton
        type="submit"
        variant="outline"
        class="accion__danger"
        :block="false"
        :loading="isSubmitting"
        :disabled="errorValidacion !== null"
      >
        Sí, cancelar cita
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
/* Tono destructivo sobre BaseButton outline (más especificidad que .btn--outline). */
.accion .accion__danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.accion .accion__danger:not(:disabled):hover {
  background: var(--color-danger-soft);
}
</style>
