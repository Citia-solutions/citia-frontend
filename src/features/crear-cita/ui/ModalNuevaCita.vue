<script setup lang="ts">
// Modal de "Nueva cita". La visibilidad la decide el padre (prop isOpen);
// este componente avisa cuando quiere cerrarse (emit close) y cuando el
// servidor confirmó la cita (emit created, con la cita ya guardada).
import { watch } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCheckbox from '@/shared/ui/BaseCheckbox.vue'
import { BLOQUES_HORARIOS } from '@/shared/config/bloquesHorarios'
import { useCrearCita } from '../model/useCrearCita'
import type { CitaCreada } from '../model/types'

const props = withDefaults(defineProps<{ isOpen: boolean }>(), { isOpen: false })

const emit = defineEmits<{
  close: []
  created: [cita: CitaCreada]
}>()

// Duraciones habituales de una consulta. Si más adelante se configuran por
// organización, este arreglo es el único punto a cambiar.
const DURACIONES = [15, 30, 45, 60, 90]

const { form, errors, submitError, isSubmitting, reset, submit } = useCrearCita((cita) => {
  emit('created', cita)
  emit('close')
})

watch(
  () => props.isOpen,
  (open) => {
    if (open) reset()
  },
)

function handleSubmit(): void {
  submit()
}
</script>

<template>
  <div v-if="isOpen" class="modal" @mousedown.self="emit('close')">
    <div
      class="modal__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nueva-cita-titulo"
    >
      <header class="modal-header">
        <div class="modal-header__text">
          <h2 id="nueva-cita-titulo" class="modal-header__title">Nueva cita</h2>
          <p class="modal-header__subtitle">Completa los datos para agendar la consulta.</p>
        </div>
        <button
          type="button"
          class="modal-header__close"
          aria-label="Cerrar"
          :disabled="isSubmitting"
          @click="emit('close')"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <form class="modal__form" novalidate @submit.prevent="handleSubmit">
        <div class="modal__row">
          <div class="modal__field">
            <label class="modal__label" for="paciente">Nombre del paciente</label>
            <input
              id="paciente"
              v-model="form.pacienteNombre"
              class="modal__input"
              type="text"
              placeholder="Ej: María González"
            />
            <span v-if="errors.pacienteNombre" class="modal__error">{{ errors.pacienteNombre }}</span>
          </div>

          <div class="modal__field">
            <label class="modal__label" for="rut">RUT</label>
            <input
              id="rut"
              v-model="form.rut"
              class="modal__input"
              type="text"
              inputmode="text"
              placeholder="12.345.678-5"
            />
            <span v-if="errors.rut" class="modal__error">{{ errors.rut }}</span>
            <span v-else class="modal__hint">
              Si el paciente ya existe, se reutiliza su ficha en vez de duplicarla.
            </span>
          </div>
        </div>

        <div class="modal__row">
          <div class="modal__field">
            <label class="modal__label" for="correo">Correo electrónico</label>
            <input
              id="correo"
              v-model="form.correo"
              class="modal__input"
              type="email"
              placeholder="correo@clinica.cl"
            />
            <span v-if="errors.correo" class="modal__error">{{ errors.correo }}</span>
          </div>

          <div class="modal__field">
            <label class="modal__label" for="telefono">Teléfono</label>
            <input
              id="telefono"
              v-model="form.telefono"
              class="modal__input"
              type="tel"
              placeholder="+56 9 1234 5678"
            />
            <span v-if="errors.telefono" class="modal__error">{{ errors.telefono }}</span>
          </div>
        </div>

        <div class="modal__row">
          <div class="modal__field">
            <label class="modal__label" for="fecha">Fecha de atención</label>
            <input id="fecha" v-model="form.fecha" class="modal__input" type="date" />
            <span v-if="errors.fecha" class="modal__error">{{ errors.fecha }}</span>
          </div>

          <div class="modal__field">
            <label class="modal__label" for="hora">Hora / Bloque</label>
            <select id="hora" v-model="form.hora" class="modal__input">
              <option value="" disabled>Selecciona una hora</option>
              <option v-for="bloque in BLOQUES_HORARIOS" :key="bloque" :value="bloque">
                {{ bloque }}
              </option>
            </select>
            <span v-if="errors.hora" class="modal__error">{{ errors.hora }}</span>
          </div>
        </div>

        <div class="modal__field">
          <label class="modal__label" for="duracion">Duración</label>
          <select id="duracion" v-model.number="form.duracionMin" class="modal__input">
            <option v-for="min in DURACIONES" :key="min" :value="min">{{ min }} minutos</option>
          </select>
          <span v-if="errors.duracionMin" class="modal__error">{{ errors.duracionMin }}</span>
        </div>

        <div class="modal__field">
          <label class="modal__label" for="motivo">Motivo de consulta</label>
          <textarea
            id="motivo"
            v-model="form.motivo"
            class="modal__input modal__input--textarea"
            placeholder="Describe brevemente el motivo…"
            rows="3"
          />
          <span v-if="errors.motivo" class="modal__error">{{ errors.motivo }}</span>
        </div>

        <div class="modal__field">
          <BaseCheckbox
            v-model="form.consentimiento"
            label="El paciente autoriza recibir recordatorios y avisos de sus citas."
          />
          <span v-if="errors.consentimiento" class="modal__error">
            {{ errors.consentimiento }}
          </span>
        </div>

        <p v-if="submitError" class="modal__submit-error" role="alert">{{ submitError }}</p>

        <div class="modal__actions">
          <BaseButton
            type="button"
            variant="outline"
            :block="false"
            :disabled="isSubmitting"
            @click="emit('close')"
          >
            Cancelar
          </BaseButton>
          <BaseButton type="submit" :loading="isSubmitting">Guardar cita</BaseButton>
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
  min-height: 72px;
  font-family: inherit;
}
.modal__error {
  font-size: 0.8rem;
  color: var(--color-danger);
}
.modal__hint {
  font-size: 0.75rem;
  color: var(--color-text-muted, #64748b);
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
