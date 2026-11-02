<script setup lang="ts">
// Modal "Contactar soporte" (US-10). Lo abren Mi Perfil y la entrada del
// sidebar (F2), desde cualquier pantalla del panel: vive una sola vez aquí y
// cada uno lo monta con su `isOpen`. La visibilidad la decide el padre; este
// componente avisa cuando quiere cerrarse (emit close).
//
// - Categoría obligatoria, sin ninguna marcada al abrir (F3).
// - Aviso fijo sobre datos de pacientes y **sin** prometer respuesta por
//   correo (F8): todavía no hay casilla de soporte.
// - Mientras se envía no se cierra: ni la X, ni "Cancelar", ni un clic fuera,
//   ni `Esc`. `Tab` no sale del diálogo y el foco vuelve a donde estaba al
//   cerrar (mismo patrón que el modal "Nueva cita").
import { nextTick, onBeforeUnmount, ref, useId, watch } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import {
  AVISO_DATOS_PACIENTES,
  CATEGORIAS,
  MENSAJE_MAX,
  MENSAJE_RECIBIDO,
} from '../model/soporteSchema'
import { useContactarSoporte } from '../model/useContactarSoporte'

const props = withDefaults(defineProps<{ isOpen: boolean }>(), { isOpen: false })

const emit = defineEmits<{
  close: []
}>()

const {
  form,
  errores,
  isSubmitting,
  submitError,
  enviado,
  reset,
  marcarMensajeTocado,
  alEditar,
  enviar,
} = useContactarSoporte()

// Ids únicos por instancia: el modal se monta en el sidebar y en Mi Perfil.
const id = useId()
const tituloId = `${id}-titulo`
const textoId = `${id}-texto`
const contadorId = `${id}-contador`
const errorTextoId = `${id}-error-texto`
const errorCategoriaId = `${id}-error-categoria`
const avisoId = `${id}-aviso`

const dialog = ref<HTMLElement | null>(null)
const cerrarWrap = ref<HTMLElement | null>(null)
let focoPrevio: HTMLElement | null = null

/** Pide cerrar el modal, salvo mientras se envía. */
function cerrar(): void {
  if (isSubmitting.value) return
  emit('close')
}

const FOCUSABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** `Esc` cierra (salvo enviando) y `Tab` no sale del diálogo. */
function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    cerrar()
    return
  }
  if (e.key !== 'Tab' || !dialog.value) return

  const focusables = Array.from(dialog.value.querySelectorAll<HTMLElement>(FOCUSABLES))
  const primero = focusables[0]
  const ultimo = focusables[focusables.length - 1]
  if (!primero || !ultimo) {
    e.preventDefault()
    return
  }
  const activo = document.activeElement
  const dentro = activo instanceof Node && dialog.value.contains(activo)
  if (!dentro) {
    e.preventDefault()
    primero.focus()
  } else if (e.shiftKey && activo === primero) {
    e.preventDefault()
    ultimo.focus()
  } else if (!e.shiftKey && activo === ultimo) {
    e.preventDefault()
    primero.focus()
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
      // Foco inicial: la primera categoría (enfocarla no la marca).
      dialog.value?.querySelector<HTMLElement>('input[type="radio"]')?.focus()
    } else {
      document.removeEventListener('keydown', onKeydown)
      // Devuelve el foco al botón desde el que se abrió.
      focoPrevio?.focus()
      focoPrevio = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

async function handleSubmit(): Promise<void> {
  if (await enviar()) {
    await nextTick()
    // BaseButton no reenvía refs: se enfoca el botón dentro de su contenedor.
    cerrarWrap.value?.querySelector('button')?.focus()
  }
}
</script>

<template>
  <div v-if="isOpen" class="modal" @mousedown.self="cerrar">
    <div
      ref="dialog"
      class="modal__dialog"
      role="dialog"
      aria-modal="true"
      :aria-labelledby="tituloId"
      :aria-busy="isSubmitting"
    >
      <header class="modal-header">
        <div class="modal-header__text">
          <h2 :id="tituloId" class="modal-header__title">Contactar soporte</h2>
          <p class="modal-header__subtitle">Cuéntanos qué pasó o qué necesitas.</p>
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

      <!-- Enviado -->
      <div v-if="enviado" class="soporte__enviado">
        <span class="soporte__enviado-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <p class="soporte__enviado-texto" role="status">{{ MENSAJE_RECIBIDO }}</p>
        <span ref="cerrarWrap">
          <BaseButton type="button" :block="false" @click="cerrar">Cerrar</BaseButton>
        </span>
      </div>

      <!-- Formulario -->
      <form v-else class="soporte" novalidate @submit.prevent="handleSubmit">
        <fieldset
          class="soporte__categorias"
          :aria-describedby="errores.categoria ? errorCategoriaId : undefined"
        >
          <legend class="soporte__label">Categoría</legend>
          <div class="soporte__opciones">
            <label
              v-for="opcion in CATEGORIAS"
              :key="opcion.valor"
              class="chip"
              :class="{ 'chip--on': form.categoria === opcion.valor, 'chip--disabled': isSubmitting }"
            >
              <input
                v-model="form.categoria"
                type="radio"
                class="chip__input"
                :name="`${id}-categoria`"
                :value="opcion.valor"
                :disabled="isSubmitting"
                @change="alEditar('categoria')"
              />
              <span class="chip__dot" aria-hidden="true" />
              <span>{{ opcion.etiqueta }}</span>
            </label>
          </div>
          <p v-if="errores.categoria" :id="errorCategoriaId" class="soporte__error">
            {{ errores.categoria }}
          </p>
        </fieldset>

        <div class="soporte__field">
          <label class="soporte__label" :for="textoId">Mensaje</label>
          <textarea
            :id="textoId"
            v-model="form.mensaje"
            class="soporte__textarea"
            :class="{ 'soporte__textarea--error': errores.mensaje }"
            rows="6"
            :maxlength="MENSAJE_MAX"
            placeholder="Describe el problema, la consulta o la sugerencia…"
            aria-required="true"
            :aria-invalid="errores.mensaje ? 'true' : 'false'"
            :aria-describedby="`${errores.mensaje ? errorTextoId + ' ' : ''}${contadorId} ${avisoId}`"
            :disabled="isSubmitting"
            @input="alEditar('mensaje')"
            @blur="marcarMensajeTocado"
          />
          <div class="soporte__under">
            <span v-if="errores.mensaje" :id="errorTextoId" class="soporte__error">
              {{ errores.mensaje }}
            </span>
            <span :id="contadorId" class="soporte__counter">
              {{ form.mensaje.length }}/{{ MENSAJE_MAX }}
            </span>
          </div>
        </div>

        <p :id="avisoId" class="soporte__aviso" role="note">{{ AVISO_DATOS_PACIENTES }}</p>

        <p v-if="submitError" class="soporte__submit-error" role="alert">{{ submitError }}</p>

        <div class="soporte__actions">
          <BaseButton
            type="button"
            variant="outline"
            :block="false"
            :disabled="isSubmitting"
            @click="cerrar"
          >
            Cancelar
          </BaseButton>
          <BaseButton type="submit" :block="false" :loading="isSubmitting">Enviar mensaje</BaseButton>
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
.modal-header__close:focus-visible {
  outline: 2px solid #fff;
  outline-offset: 1px;
}
.modal-header__close:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.soporte {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}
.soporte__categorias {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  border: none;
  min-width: 0;
}
.soporte__label {
  padding: 0;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}
.soporte__categorias .soporte__label {
  margin-bottom: 0.4rem;
}
.soporte__opciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.soporte__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.soporte__textarea {
  padding: 0.7rem 0.85rem;
  font-family: inherit;
  font-size: 0.95rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  resize: vertical;
  min-height: 120px;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.soporte__textarea:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.soporte__textarea--error {
  border-color: var(--color-danger);
}
.soporte__textarea:disabled {
  background: var(--color-surface-muted);
  color: var(--color-text-muted);
}
.soporte__under {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
}
.soporte__counter {
  margin-left: auto;
  flex-shrink: 0;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.soporte__error {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-danger);
}
.soporte__aviso {
  margin: 0;
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  line-height: 1.45;
  color: var(--color-text);
  background: var(--color-warning-soft);
  border-radius: var(--radius-md);
}
.soporte__submit-error {
  margin: 0;
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
}
.soporte__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  padding-top: 0.25rem;
}
.soporte__enviado {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.9rem;
  padding: 2rem 1.5rem;
  text-align: center;
}
.soporte__enviado-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border-radius: var(--radius-full);
  background: var(--color-success-soft);
  color: var(--color-success);
}
.soporte__enviado-texto {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-text);
}
/* Chips de radio: mismo aspecto que "¿Quién lo pidió?" (`QuienLoPidio.vue`). */
.chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.chip:hover {
  border-color: var(--color-primary);
}
.chip--on {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary-strong);
}
.chip--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.chip--disabled:hover {
  border-color: var(--color-border);
}
.chip--on.chip--disabled:hover {
  border-color: var(--color-primary);
}
.chip__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.chip__dot {
  position: relative;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
}
.chip--on .chip__dot {
  border-color: var(--color-primary);
}
.chip--on .chip__dot::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--color-primary);
}
.chip__input:focus-visible + .chip__dot {
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
@media (max-width: 480px) {
  .modal-header {
    padding: 20px 20px;
  }
  .soporte {
    padding: 1.25rem;
  }
  .soporte__actions :deep(.btn) {
    flex: 1;
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
