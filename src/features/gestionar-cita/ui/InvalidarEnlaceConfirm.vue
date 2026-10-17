<script setup lang="ts">
// Vista "Invalidar enlace del paciente" del voucher (Fase 3, decisión S1).
// Mismo patrón que `CancelarCitaConfirm`: foco inicial en "Volver", el voucher
// no se cierra mientras se envía y el resultado se le pasa al voucher.
//
// El enlace es el que va en los recordatorios por correo (`/cita#<token>`):
// con él el paciente confirma, cancela o pide otra hora sin cuenta. Hay uno
// activo por cita, el mismo en todos sus recordatorios. Invalidarlo sirve si el
// correo llegó a otra persona o el enlace se reenvió.
import { onMounted, ref, watch } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import type { Appointment } from '@/entities/appointment'
import { useInvalidarEnlace } from '../model/useInvalidarEnlace'
import type { ResultadoInvalidarEnlace } from '../model/types'

const props = defineProps<{ appointment: Appointment }>()

const emit = defineEmits<{
  back: []
  submitting: [value: boolean]
  result: [resultado: ResultadoInvalidarEnlace]
}>()

const { isSubmitting, submitError, submit } = useInvalidarEnlace(props.appointment.id)

// `sync`: la vista se desmonta apenas llega el resultado (igual que cancelar).
watch(isSubmitting, (v) => emit('submitting', v), { flush: 'sync' })

// BaseButton no reenvía refs: se enfoca el botón dentro de su contenedor.
const volverWrap = ref<HTMLElement | null>(null)
onMounted(() => volverWrap.value?.querySelector('button')?.focus())

async function handleSubmit(): Promise<void> {
  const resultado = await submit()
  // 401 / red / 5xx se quedan en la vista para reintentar; el éxito y el 404 los atiende el voucher.
  if (resultado.ok || resultado.status === 404) emit('result', resultado)
}
</script>

<template>
  <form class="accion" novalidate @submit.prevent="handleSubmit">
    <h3 class="accion__title">¿Invalidar el enlace de {{ appointment.patientName }}?</h3>
    <p class="accion__ref">
      Los recordatorios por correo llevan un enlace para que el paciente confirme, cancele o pida
      otra hora. Si lo invalidas, <strong>el enlace de los correos ya enviados dejará de
      funcionar</strong>: quien lo abra verá que no es válido.
    </p>
    <p class="accion__ref">
      Úsalo si el correo llegó a otra persona o si el enlace se reenvió. La cita no cambia, y si
      quedan recordatorios por enviar, llevarán un enlace nuevo.
    </p>

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
      >
        Sí, invalidar enlace
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
  line-height: 1.45;
  color: var(--color-text-muted);
}
.accion__ref strong {
  color: var(--color-text);
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
  flex-wrap: wrap;
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
