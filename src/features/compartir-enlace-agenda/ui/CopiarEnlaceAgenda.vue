<script setup lang="ts">
// "Copiar enlace de agenda": la URL pública donde los pacientes piden hora
// (`/agendar-cita/:tenantSlug`). El front conoce su origen; el slug llega en el
// login (`usuario.tenantSlug`, contrato de cierre de Fase 1 §d).
//
// Si la sesión no tiene slug (se inició contra un backend anterior), no se
// muestra nada: aparece en el siguiente login.
import { computed, onBeforeUnmount, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import { copiarAlPortapapeles, ENLACE_PUBLICO_LISTO } from '../model/enlaceAgenda'

const session = useSessionStore()
const router = useRouter()

const tenantSlug = computed(() => session.currentUser?.tenantSlug ?? null)

// Se arma con el router (ruta `agendarCita`) en vez de escribir el path a mano:
// si la ruta pública cambia, el enlace cambia con ella. `href` ya incluye el
// `base` de la app.
const enlace = computed(() => {
  if (!tenantSlug.value) return null
  const { href } = router.resolve({ name: 'agendarCita', params: { tenantSlug: tenantSlug.value } })
  return `${window.location.origin}${href}`
})

type Estado = 'idle' | 'copiado' | 'manual'
const estado = ref<Estado>('idle')
const manualInput = ref<HTMLInputElement | null>(null)
let timer: ReturnType<typeof setTimeout> | undefined

async function copiar(): Promise<void> {
  if (!enlace.value) return
  clearTimeout(timer)
  if (await copiarAlPortapapeles(enlace.value)) {
    estado.value = 'copiado'
    timer = setTimeout(() => (estado.value = 'idle'), 2500)
  } else {
    // Sin portapapeles: se muestra el enlace seleccionado para Ctrl+C.
    estado.value = 'manual'
    requestAnimationFrame(() => manualInput.value?.select())
  }
}

onBeforeUnmount(() => clearTimeout(timer))
</script>

<template>
  <div v-if="enlace" class="enlace">
    <div class="enlace__main">
      <span class="enlace__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7" />
          <path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7" />
        </svg>
      </span>
      <div class="enlace__text">
        <span class="enlace__label">Tu enlace de agenda</span>
        <span class="enlace__url">{{ enlace }}</span>
      </div>
      <button type="button" class="enlace__btn" @click="copiar">
        {{ estado === 'copiado' ? 'Enlace copiado' : 'Copiar enlace de agenda' }}
      </button>
    </div>

    <span class="enlace__sr" role="status">{{ estado === 'copiado' ? 'Enlace copiado al portapapeles.' : '' }}</span>

    <div v-if="estado === 'manual'" class="enlace__manual">
      <label class="enlace__manual-label" for="enlace-manual">
        No pudimos copiarlo automáticamente. Cópialo desde aquí:
      </label>
      <input
        id="enlace-manual"
        ref="manualInput"
        class="enlace__manual-input"
        type="text"
        readonly
        :value="enlace"
        @focus="($event.target as HTMLInputElement).select()"
      />
    </div>

    <p v-if="!ENLACE_PUBLICO_LISTO" class="enlace__warning">
      <strong>Todavía no lo publiques en redes ni lo difundas masivamente.</strong> La página de
      solicitudes aún no limita cuántos envíos acepta; úsalo con pacientes puntuales mientras se
      resuelve.
    </p>
  </div>
</template>

<style scoped>
.enlace {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 0.85rem 1rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
.enlace__main {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.enlace__icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--color-info-soft);
  color: var(--color-primary);
}
.enlace__text {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}
.enlace__label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.enlace__url {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  overflow-wrap: anywhere;
}
.enlace__btn {
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s;
}
.enlace__btn:hover {
  background: var(--color-surface-muted);
}
.enlace__btn:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
.enlace__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.enlace__manual {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.enlace__manual-label {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.enlace__manual-input {
  padding: 0.55rem 0.75rem;
  font-size: 0.88rem;
  color: var(--color-text);
  background: var(--color-surface-muted);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.enlace__warning {
  margin: 0;
  padding: 0.55rem 0.75rem;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-text);
  background: var(--color-warning-soft);
  border-radius: var(--radius-md);
}
@media (max-width: 560px) {
  .enlace__btn {
    width: 100%;
  }
}
</style>
