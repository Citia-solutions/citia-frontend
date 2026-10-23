<script setup lang="ts">
// Confirmación de "Cerrar sesión" (lo usa el botón del sidebar). Antes de
// limpiar la sesión, pregunta para no cerrarla por un clic accidental. El
// foco inicial va a "Volver", no al botón destructivo (mismo criterio que
// cancelar una cita o rechazar una solicitud).
import { nextTick, onBeforeUnmount, ref, watch } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'

const props = defineProps<{ isOpen: boolean }>()

const emit = defineEmits<{
  close: []
  confirm: []
}>()

const volverWrap = ref<HTMLElement | null>(null)
let focoPrevio: HTMLElement | null = null

function cerrar(): void {
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
</script>

<template>
  <div v-if="isOpen" class="modal" @mousedown.self="cerrar">
    <div
      class="modal__dialog"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="cerrar-sesion-titulo"
      aria-describedby="cerrar-sesion-texto"
    >
      <h2 id="cerrar-sesion-titulo" class="confirm__title">¿Deseas cerrar sesión?</h2>
      <p id="cerrar-sesion-texto" class="confirm__text">
        Tendrás que iniciar sesión de nuevo para volver a entrar.
      </p>

      <div class="confirm__actions">
        <span ref="volverWrap">
          <BaseButton type="button" variant="outline" @click="cerrar">
            Volver
          </BaseButton>
        </span>
        <BaseButton
          type="button"
          variant="outline"
          class="confirm__danger"
          @click="emit('confirm')"
        >
          Cerrar sesión
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
  padding: 1.5rem;
  background: var(--color-surface);
  border-radius: 16px;
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
  animation: modal-pop 0.2s ease;
}
.confirm__title {
  margin: 0 0 0.4rem;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}
.confirm__text {
  margin: 0 0 0.9rem;
  font-size: 0.9rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}
.confirm__actions {
  display: flex;
  gap: 0.7rem;
  padding-top: 0.25rem;
}
.confirm__actions > * {
  flex: 1 1 50%;
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
