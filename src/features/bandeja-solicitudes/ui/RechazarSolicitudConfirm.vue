<script setup lang="ts">
// Confirmación de "Rechazar solicitud". Sin motivo: no se retiene más dato
// sensible sobre una petición que no llegó a nada (DT-26). El foco inicial va
// a "Volver", no al botón destructivo (mismo criterio que cancelar una cita).
//
// No se promete ningún aviso al paciente: no hay canal (RF-06).
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import type { Solicitud } from '@/entities/solicitud'
import { useRechazarSolicitud } from '../model/useRechazarSolicitud'
import type { ResultadoResolucion } from '../model/types'

const props = withDefaults(
  defineProps<{ isOpen: boolean; solicitud: Solicitud | null }>(),
  { isOpen: false, solicitud: null },
)

const emit = defineEmits<{
  close: []
  result: [resultado: ResultadoResolucion<Solicitud>]
}>()

const { isSubmitting, submitError, reset, submit } = useRechazarSolicitud()

const volverWrap = ref<HTMLElement | null>(null)
let focoPrevio: HTMLElement | null = null

function cerrar(): void {
  if (isSubmitting.value) return
  emit('close')
}

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    cerrar()
  }
}

watch(
  () => props.isOpen,
  async (open) => {
    if (open) {
      focoPrevio = document.activeElement instanceof HTMLElement ? document.activeElement : null
      reset()
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      // BaseButton no reenvía refs: se enfoca el botón dentro de su contenedor.
      volverWrap.value?.querySelector('button')?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      focoPrevio?.focus()
      focoPrevio = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

async function confirmar(): Promise<void> {
  if (!props.solicitud) return
  const resultado = await submit(props.solicitud.id)
  if (resultado.ok || resultado.status === 404 || resultado.status === 409) {
    emit('result', resultado)
  }
}
</script>

<template>
  <div v-if="isOpen && solicitud" class="modal" @mousedown.self="cerrar">
    <div
      class="modal__dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="rechazar-titulo"
      aria-describedby="rechazar-texto"
    >
      <h2 id="rechazar-titulo" class="confirm__title">
        ¿Rechazar la solicitud de {{ solicitud.nombrePaciente }}?
      </h2>
      <p id="rechazar-texto" class="confirm__text">
        No se creará ninguna cita y la solicitud pasará a <strong>Rechazadas</strong>. El paciente
        no recibe ningún aviso desde Citia: si corresponde, contáctalo tú.
      </p>

      <p v-if="submitError" class="confirm__error" role="alert">{{ submitError }}</p>

      <div class="confirm__actions">
        <span ref="volverWrap">
          <BaseButton type="button" variant="outline" :block="false" :disabled="isSubmitting" @click="cerrar">
            Volver
          </BaseButton>
        </span>
        <BaseButton
          type="button"
          variant="outline"
          class="confirm__danger"
          :block="false"
          :loading="isSubmitting"
          @click="confirmar"
        >
          Rechazar solicitud
        </BaseButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.55);
  animation: modal-fade 0.2s ease;
}
.modal__dialog {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  padding: 1.5rem;
  background: var(--color-surface);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
  animation: modal-pop 0.2s ease;
}
.confirm__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}
.confirm__text {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}
.confirm__error {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.8rem;
}
.confirm__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  padding-top: 0.25rem;
}
/* Tono destructivo sobre BaseButton outline (más especificidad que .btn--outline). */
.confirm__actions .confirm__danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.confirm__actions .confirm__danger:not(:disabled):hover {
  background: var(--color-danger-soft);
}
@keyframes modal-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes modal-pop {
  from {
    transform: translateY(10px) scale(0.98);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}
</style>
