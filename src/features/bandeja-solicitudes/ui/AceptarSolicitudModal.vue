<script setup lang="ts">
// Modal "Aceptar solicitud". Mismo contrato que `ModalNuevaCita`: la
// visibilidad la decide el padre (prop isOpen), este componente avisa cuando
// quiere cerrarse (close) y cuando el servidor respondió (result).
//
// El profesional fija la hora REAL: la del paciente es una preferencia en
// texto libre y se muestra como referencia (y, si se puede leer, se precarga).
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import type { Solicitud } from '@/entities/solicitud'
import { DURACION_MAXIMA_MIN } from '../model/mensajeDeError'
import { useAceptarSolicitud } from '../model/useAceptarSolicitud'
import type { ResultadoResolucion, SolicitudAceptada } from '../model/types'

const props = withDefaults(
  defineProps<{ isOpen: boolean; solicitud: Solicitud | null }>(),
  { isOpen: false, solicitud: null },
)

const emit = defineEmits<{
  close: []
  /** El servidor respondió: éxito, o un 404/409 que la bandeja debe atender. */
  result: [resultado: ResultadoResolucion<SolicitudAceptada>]
}>()

const { form, errors, isSubmitting, submitError, sugerida, hoyISO, opcionesHora, reset, submit } =
  useAceptarSolicitud()

const fechaInput = ref<HTMLInputElement | null>(null)
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
    if (open && props.solicitud) {
      focoPrevio = document.activeElement instanceof HTMLElement ? document.activeElement : null
      reset(props.solicitud)
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      fechaInput.value?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      focoPrevio?.focus()
      focoPrevio = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

async function handleSubmit(): Promise<void> {
  const resultado = await submit()
  if (!resultado) return
  // 400 / 401 / red: se quedan en el modal, con lo escrito, para reintentar.
  if (resultado.ok || resultado.status === 404 || resultado.status === 409) {
    emit('result', resultado)
  }
}
</script>

<template>
  <div v-if="isOpen && solicitud" class="modal" @mousedown.self="cerrar">
    <div
      class="modal__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="aceptar-solicitud-titulo"
    >
      <header class="modal-header">
        <div class="modal-header__text">
          <h2 id="aceptar-solicitud-titulo" class="modal-header__title">Aceptar solicitud</h2>
          <p class="modal-header__subtitle">
            Se agendará una cita para {{ solicitud.nombrePaciente }}.
          </p>
        </div>
        <button
          type="button"
          class="modal-header__close"
          aria-label="Cerrar"
          :disabled="isSubmitting"
          @click="cerrar"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <form class="modal__form" novalidate @submit.prevent="handleSubmit">
        <div class="modal__ref">
          <span class="modal__ref-label">Preferencia del paciente</span>
          <span class="modal__ref-value">{{ solicitud.preferenciaHoraria }}</span>
          <span class="modal__hint">
            {{
              sugerida
                ? 'La precargamos abajo. Ajústala si necesitas otra hora: la preferencia no reserva nada.'
                : 'Es solo una preferencia: elige la hora real de la cita.'
            }}
          </span>
        </div>

        <div class="modal__row">
          <div class="modal__field">
            <label class="modal__label" for="aceptar-fecha">Fecha de atención</label>
            <input
              id="aceptar-fecha"
              ref="fechaInput"
              v-model="form.fecha"
              class="modal__input"
              type="date"
              :min="hoyISO"
              :disabled="isSubmitting"
            />
            <span v-if="errors.fecha" class="modal__error">{{ errors.fecha }}</span>
          </div>

          <div class="modal__field">
            <label class="modal__label" for="aceptar-hora">Hora / Bloque</label>
            <select id="aceptar-hora" v-model="form.hora" class="modal__input" :disabled="isSubmitting">
              <option value="" disabled>Selecciona una hora</option>
              <option v-for="bloque in opcionesHora" :key="bloque" :value="bloque">{{ bloque }}</option>
            </select>
            <span v-if="errors.hora" class="modal__error">{{ errors.hora }}</span>
          </div>
        </div>

        <div class="modal__field">
          <label class="modal__label" for="aceptar-duracion">Duración (minutos)</label>
          <input
            id="aceptar-duracion"
            v-model.number="form.duracionMin"
            class="modal__input"
            type="number"
            min="1"
            :max="DURACION_MAXIMA_MIN"
            step="5"
            inputmode="numeric"
            :disabled="isSubmitting"
          />
          <span v-if="errors.duracionMin" class="modal__error">{{ errors.duracionMin }}</span>
        </div>

        <div class="modal__field">
          <label class="modal__label" for="aceptar-tipo">Tipo de consulta</label>
          <textarea
            id="aceptar-tipo"
            v-model="form.tipoConsulta"
            class="modal__input modal__input--textarea"
            rows="2"
            :disabled="isSubmitting"
          />
          <span v-if="errors.tipoConsulta" class="modal__error">{{ errors.tipoConsulta }}</span>
          <span v-else class="modal__hint">Precargado con el motivo que escribió el paciente.</span>
        </div>

        <p class="modal__note">
          La cita quedará <strong>pendiente</strong> de confirmación. Si el RUT ya es paciente de tu
          organización, se reutiliza su ficha.
        </p>

        <p v-if="submitError" class="modal__submit-error" role="alert">{{ submitError }}</p>

        <div class="modal__actions">
          <BaseButton
            type="button"
            variant="outline"
            :block="false"
            :disabled="isSubmitting"
            @click="cerrar"
          >
            Volver
          </BaseButton>
          <BaseButton type="submit" :block="false" :loading="isSubmitting">Aceptar y agendar</BaseButton>
        </div>
      </form>
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
  position: relative;
  width: 100%;
  max-width: 520px;
  max-height: 90vh;
  overflow: hidden;
  overflow-y: auto;
  background: var(--color-surface);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
  animation: modal-pop 0.2s ease;
}
.modal-header {
  position: relative;
  z-index: 2;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 24px 32px;
  background: var(--color-primary-strong);
  color: #fff;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
}
.modal-header__text {
  flex: 1;
}
.modal-header__title {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #fff;
}
.modal-header__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.85);
}
.modal-header__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: rgba(255, 255, 255, 0.85);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.modal-header__close:hover {
  background: rgba(255, 255, 255, 0.15);
  color: #fff;
}
.modal-header__close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.modal__form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}
.modal__ref {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  padding: 0.7rem 0.85rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
}
.modal__ref-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.modal__ref-value {
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
}
.modal__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.modal__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.modal__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}
.modal__input {
  padding: 0.7rem 0.85rem;
  font-size: 0.95rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.modal__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.modal__input--textarea {
  resize: vertical;
  min-height: 64px;
  font-family: inherit;
}
.modal__error {
  font-size: 0.8rem;
  color: var(--color-danger);
}
.modal__hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.modal__note {
  margin: 0;
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  color: var(--color-text);
  background: var(--color-warning-soft);
  border-radius: var(--radius-md);
}
.modal__submit-error {
  font-size: 0.85rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.8rem;
  margin: 0;
}
.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  padding-top: 0.5rem;
}
@media (max-width: 480px) {
  .modal__row {
    grid-template-columns: 1fr;
  }
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
