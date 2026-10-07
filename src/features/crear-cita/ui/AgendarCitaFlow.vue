<script setup lang="ts">
// Flujo público "Solicita una nueva cita": logo fijo + pantallas por paso.
// En desktop las pantallas se deslizan en vertical (scroll de sección); en
// móvil, en horizontal. Vive en `features/crear-cita` porque reusa su modelo.
import { computed, markRaw, onUnmounted, ref, watch, type Component } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { useAgendarCita } from '../model/useAgendarCita'
import { PASOS, validarPaso, type FlujoCitaPaso } from '../model/flujoCitaModel'
import IdentificacionStep from './steps/IdentificacionStep.vue'
import ContactoStep from './steps/ContactoStep.vue'
import HorarioStep from './steps/HorarioStep.vue'
import MotivoStep from './steps/MotivoStep.vue'

const props = defineProps<{
  /** Organización del enlace público, desde la URL. */
  tenantSlug: string
}>()

const emit = defineEmits<{
  /** El paso activo cambió (lo usa la página para el stepper derecho). */
  'cambio-paso': [paso: (typeof PASOS)[number]['id']]
}>()

const {
  form,
  errors,
  pasoActual,
  pasoIndex,
  isSubmitting,
  finalizado,
  submitError,
  reset,
  continuar,
  retroceder,
  irA,
  confirmar,
} = useAgendarCita(() => props.tenantSlug)

// La página lo usa para que los íconos del stepper naveguen entre secciones.
defineExpose({ irA })

watch(pasoActual, (paso) => emit('cambio-paso', paso))

// Viewport: en móvil el track se desliza en horizontal; en desktop, vertical.
const esMovil = ref(window.matchMedia('(max-width: 1024px)').matches)
const mediaQuery = window.matchMedia('(max-width: 1024px)')
function handleMediaChange(e: MediaQueryListEvent): void {
  esMovil.value = e.matches
}
mediaQuery.addEventListener('change', handleMediaChange)
onUnmounted(() => mediaQuery.removeEventListener('change', handleMediaChange))

// Traslación del track: una pantalla por paso (100% del propio track).
const estiloTrack = computed(() => {
  const desplazamiento = pasoIndex.value * 100
  return esMovil.value
    ? { transform: `translateX(-${desplazamiento}%)` }
    : { transform: `translateY(-${desplazamiento}%)` }
})

// Mapa paso → componente (markRaw evita que Vue haga reactivo al .vue).
const COMPONENTES: Record<FlujoCitaPaso, Component> = {
  identificacion: markRaw(IdentificacionStep),
  contacto: markRaw(ContactoStep),
  horario: markRaw(HorarioStep),
  motivo: markRaw(MotivoStep),
}

// El botón "Continuar" nace deshabilitado (como en el diseño) y se habilita
// cuando la sección actual valida.
const pasoValido = computed(
  () => Object.keys(validarPaso(form, pasoActual.value)).length === 0,
)

const esUltimoPaso = computed(() => pasoIndex.value === PASOS.length - 1)

function handleAvanzar(): void {
  if (esUltimoPaso.value) void confirmar()
  else continuar()
}

function handleRetroceder(): void {
  retroceder()
}

function handleReiniciar(): void {
  reset()
}
</script>

<template>
  <div class="flow">
    <header class="flow__brand">
      <span class="flow__logo" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.2">
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M16 3v4M8 3v4M3 11h18" />
          <path d="m9 15 2 2 4-4" />
        </svg>
      </span>
      <span class="flow__brand-name">Citia</span>
    </header>

    <main class="flow__body">
      <!-- Track de pantallas: una por paso. En desktop se desplaza en vertical
           (scroll de sección completa); en móvil, en horizontal. -->
      <div v-if="!finalizado" class="flow__viewport">
        <div
          class="flow__track"
          :class="esMovil ? 'flow__track--horizontal' : 'flow__track--vertical'"
          :style="estiloTrack"
        >
          <section
            v-for="(paso, i) in PASOS"
            :key="paso.id"
            class="flow__screen"
            :aria-hidden="i !== pasoIndex ? 'true' : undefined"
            :inert="i !== pasoIndex ? true : undefined"
          >
            <div class="flow__block">
              <header class="flow__heading">
                <p v-if="paso.kicker" class="flow__kicker">{{ paso.kicker }}</p>
                <h1 class="flow__title">{{ paso.titulo }}</h1>
                <p class="flow__subtitle">{{ paso.subtitulo }}</p>
              </header>

              <component
                :is="COMPONENTES[paso.id]"
                :form="form"
                :errors="errors"
                :activo="paso.id === 'horario' ? i === pasoIndex : undefined"
              />

              <p
                v-if="submitError && i === pasoIndex"
                class="flow__submit-error"
                role="alert"
              >
                {{ submitError }}
              </p>

              <footer class="flow__actions">
                <BaseButton
                  v-if="i > 0"
                  type="button"
                  variant="outline"
                  :block="false"
                  :disabled="i !== pasoIndex || isSubmitting"
                  class="flow__btn flow__btn--back"
                  @click="handleRetroceder"
                >
                  Volver
                </BaseButton>
                <BaseButton
                  type="button"
                  :block="true"
                  :loading="i === pasoIndex && isSubmitting"
                  :disabled="i !== pasoIndex || !pasoValido || isSubmitting"
                  class="flow__btn flow__btn--next"
                  @click="handleAvanzar"
                >
                  {{ i === PASOS.length - 1 ? 'Confirmar' : 'Continuar' }}
                </BaseButton>
              </footer>
            </div>
          </section>
        </div>
      </div>

      <div v-else class="flow__success">
        <span class="flow__success-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M22 11.1V12a10 10 0 1 1-5.93-9.14" />
            <path d="m9 11 3 3L22 4" />
          </svg>
        </span>
        <h2 class="flow__success-title">¡Solicitud enviada!</h2>
        <p class="flow__success-text">
          Hemos recibido tu solicitud. Te contactaremos para confirmar tu cita.
        </p>
        <BaseButton type="button" :block="true" class="flow__btn flow__btn--next" @click="handleReiniciar">
          Agendar otra cita
        </BaseButton>
      </div>
    </main>
  </div>
</template>

<style scoped>
.flow {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 2rem 3rem 2.5rem;
  background: var(--color-primary);
  color: #fff;
}
.flow__submit-error {
  margin: 0.75rem 0 0;
  padding: 0.65rem 0.85rem;
  font-size: 0.9rem;
  color: #fff;
  background: rgba(220, 38, 38, 0.85);
  border-radius: var(--radius-md);
}
.flow__brand {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}
.flow__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.16);
}
.flow__brand-name {
  font-size: 1.25rem;
  font-weight: 800;
  letter-spacing: -0.01em;
}
.flow__body {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative;
}
.flow__heading {
  margin-bottom: 1.5rem;
}
.flow__kicker {
  margin: 0 0 0.35rem;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.7);
}
.flow__title {
  margin: 0;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1.15;
}
.flow__subtitle {
  margin: 0.4rem 0 0;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.85);
}
.flow__actions {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.8rem;
  margin-top: 1.6rem;
}
.flow__btn {
  margin-top: 0;
}
.flow__btn--back {
  border-color: rgba(255, 255, 255, 0.5);
  color: #fff;
  background: transparent;
}
.flow__btn--back:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.14);
}
.flow__btn--next {
  /* Estado "inactivo": azul atenuado, legible  y sin opacity extra. */
  background: #113a99;
  color: #fff;
  opacity: 1;
  box-shadow: none;
}
.flow__btn--next:not(:disabled) {
  background: #113a99;
  color: #fff;
  box-shadow: 0 6px 16px rgba(17, 58, 153, 0.35);
}
.flow__btn--next:not(:disabled):hover {
  background: #0d2f80;
}
.flow__success {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  max-width: 420px;
}
.flow__success-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border-radius: var(--radius-full);
  background: rgba(255, 255, 255, 0.16);
  color: #fff;
}
.flow__success-title {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
}
.flow__success-text {
  margin: 0;
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.85);
}

/* Móvil (<1025px): el viewport recorta en horizontal y las pantallas se
   deslizan de costado; cada una ocupa el ancho del viewport y scrollea en
   vertical si su contenido no cabe. */
.flow__viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.flow__track {
  height: 100%;
  display: flex;
  will-change: transform;
  transition: transform 0.55s cubic-bezier(0.25, 0.8, 0.25, 1);
}
.flow__track--horizontal {
  flex-direction: row;
}
.flow__screen {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow-y: auto;
  flex-shrink: 0;
}
.flow__block {
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 520px;
  padding: 1.5rem 1.25rem 6rem;
}

/* Desktop (≥1025px): el track apila las pantallas en vertical y cada una mide
   el alto del viewport: un scroll de sección completa al avanzar. */
@media (min-width: 1025px) {
  .flow {
    height: 100vh;
    overflow: hidden;
  }
  .flow__track--vertical {
    flex-direction: column;
  }
  .flow__screen {
    overflow: hidden;
    justify-content: center;
  }
  .flow__block {
    padding: 0;
  }
}

@media (max-width: 860px) {
  .flow {
    padding: 1.5rem 1.25rem;
  }
}
</style>
