<script setup lang="ts">
// Sección 3: Horario. Calendario por meses + franjas horarias.
//
// El calendario abre en el mes en curso y deja avanzar hasta
// `MESES_HACIA_ADELANTE` meses; hacia atrás no pasa del mes actual. Los días y
// las horas de hoy que ya pasaron no se pueden elegir. "Hoy" es el de la zona
// de la clínica (Chile), no el del navegador del paciente.
//
// IMPORTANTE: esto NO reserva la hora. El paciente expresa su PREFERENCIA
// —elegir día y hora es la forma más clara de decir cuándo le acomoda— y el
// profesional fija la hora real al aceptar la solicitud (ADR-09 decisión 2).
// Por eso las franjas son fijas y no consultan disponibilidad: no hay nada que
// consultar todavía, y el copy tiene que dejar claro que se confirma después.
//
// Si algún día el paciente reserva de verdad, hará falta el modelo de
// disponibilidad y este paso pasa a consultarlo.
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { BLOQUES_HORARIOS } from '@/shared/config/bloquesHorarios'
import { esInicioPasado, fechaEnClinicaISO } from '@/shared/lib/fecha'
import { useErroresVisibles } from '../../model/useErroresVisibles'
import { celdasDelMes, MESES_HACIA_ADELANTE, mesDe, sumarMeses } from '../../model/calendarioMes'
import type { FlujoCitaErrors, FlujoCitaForm } from '../../model/flujoCitaModel'

const props = withDefaults(
  defineProps<{
    form: FlujoCitaForm
    errors: FlujoCitaErrors
    /** true cuando este paso es el visible del flujo. */
    activo?: boolean
  }>(),
  { activo: false },
)

// Los errores de fecha/hora se muestran apenas se entra al paso Horario
// (no tienen blur como los inputs de texto).
const { marcarPasoTocado, errorDe } = useErroresVisibles('horario', props.form)
const errorFecha = errorDe('fecha')
const errorHora = errorDe('hora')

watch(
  () => props.activo,
  (activo) => {
    if (activo) marcarPasoTocado(['fecha', 'hora'])
  },
  { immediate: true },
)

// Modal de horas: solo se usa en móvil (<1024px). Abre al tocar el botón y
// lista las franjas en un diálogo centrado, scrolleable si no caben. `Esc` lo
// cierra.
const modalAbierto = ref(false)

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    modalAbierto.value = false
  }
}

watch(modalAbierto, (abierto) => {
  if (abierto) document.addEventListener('keydown', onKeydown)
  else document.removeEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))

const HORAS = BLOQUES_HORARIOS

/** Hoy en la zona de la clínica, al montar el paso. */
const hoy = fechaEnClinicaISO(new Date())
const mesActual = mesDe(hoy)

/** Meses que se avanzó desde el actual: 0 … `MESES_HACIA_ADELANTE`. */
const desplazamiento = ref(0)
const mesVisible = computed(() => sumarMeses(mesActual, desplazamiento.value))
const puedeRetroceder = computed(() => desplazamiento.value > 0)
const puedeAvanzar = computed(() => desplazamiento.value < MESES_HACIA_ADELANTE)

function cambiarMes(paso: -1 | 1): void {
  const destino = desplazamiento.value + paso
  if (destino < 0 || destino > MESES_HACIA_ADELANTE) return
  desplazamiento.value = destino
}

const MESES = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
]
const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']

const tituloMes = computed(() => `${MESES[mesVisible.value.mes - 1] ?? ''} ${mesVisible.value.anio}`)

/** Días del mes visible con su fecha ISO 'YYYY-MM-DD' (null = hueco antes del día 1). */
const dias = computed(() => celdasDelMes(mesVisible.value))

// Compara días 'YYYY-MM-DD' contra el hoy de la clínica: `toISOString()` daría
// la fecha UTC, que en Chile de noche ya es "mañana".
function esPasado(iso: string): boolean {
  return iso < hoy
}

/** Horas de hoy que ya pasaron (vacío si el día elegido no es hoy). */
const horasPasadas = computed<ReadonlySet<string>>(() => {
  if (props.form.fecha !== hoy) return new Set()
  return new Set(HORAS.filter((hora) => esInicioPasado(hoy, hora)))
})

function seleccionarDia(iso: string): void {
  if (esPasado(iso)) return
  props.form.fecha = iso
  props.form.hora = ''
}

function seleccionarHora(hora: string): void {
  if (horasPasadas.value.has(hora)) return
  props.form.hora = hora
  modalAbierto.value = false
}
</script>

<template>
  <div class="step">
    <div class="step__field">
      <label class="step__label" for="flujo-fecha">
        ¿Qué día te acomoda?<span class="step__required" aria-hidden="true">*</span>
      </label>
      <div class="step__calendar">
        <header class="step__calendar-head">
          <button
            type="button"
            class="step__nav"
            aria-label="Mes anterior"
            :disabled="!puedeRetroceder"
            @click="cambiarMes(-1)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <span class="step__calendar-title" aria-live="polite">{{ tituloMes }}</span>
          <button
            type="button"
            class="step__nav"
            aria-label="Mes siguiente"
            :disabled="!puedeAvanzar"
            @click="cambiarMes(1)"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        </header>

      <div class="step__weekdays">
        <span v-for="d in DIAS_SEMANA" :key="d" class="step__weekday">{{ d }}</span>
      </div>

      <div class="step__grid">
        <template v-for="(dia, i) in dias" :key="i">
          <span v-if="!dia" class="step__cell" />
          <button
            v-else
            type="button"
            class="step__cell step__cell--day"
            :class="{
              'step__cell--selected': form.fecha === dia.iso,
              'step__cell--disabled': esPasado(dia.iso),
            }"
            :disabled="esPasado(dia.iso)"
            @click="seleccionarDia(dia.iso)"
          >
            {{ dia.numero }}
          </button>
        </template>
      </div>
      <span v-if="errorFecha" class="step__error" role="alert">{{ errorFecha }}</span>
      <span v-else-if="errors.fecha" class="step__error">{{ errors.fecha }}</span>
    </div>
    </div>

    <div class="step__field">
      <label class="step__label" for="flujo-hora">
        ¿A qué hora?<span class="step__required" aria-hidden="true">*</span>
      </label>
      <div class="step__horas">
        <button
          v-for="hora in HORAS"
          :key="hora"
          type="button"
          class="step__hora"
          :class="{
            'step__hora--selected': form.hora === hora,
            'step__hora--pasada': horasPasadas.has(hora),
          }"
          :disabled="!form.fecha || horasPasadas.has(hora)"
          @click="seleccionarHora(hora)"
        >
          {{ hora }}
        </button>
      </div>
      <button
        type="button"
        class="step__hora-btn"
        :disabled="!form.fecha"
        @click="modalAbierto = true"
      >
        <span>{{ form.hora || 'Seleccionar hora' }}</span>
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      <span v-if="errorHora" class="step__error" role="alert">{{ errorHora }}</span>
      <span v-else-if="errors.hora" class="step__error">{{ errors.hora }}</span>
      <p class="step__nota">
        Es tu horario preferido, no una reserva: revisaremos tu solicitud y te
        contactaremos para confirmar la hora definitiva.
      </p>
    </div>

    <Teleport to="body">
      <div v-if="modalAbierto" class="hora-modal" @mousedown.self="modalAbierto = false">
        <div
          class="hora-modal__dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="hora-modal-titulo"
        >
          <header class="hora-modal__header">
            <h2 id="hora-modal-titulo" class="hora-modal__title">Selecciona una hora</h2>
            <button
              type="button"
              class="hora-modal__close"
              aria-label="Cerrar"
              @click="modalAbierto = false"
            >
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                <path d="m6 6 12 12M18 6 6 18" />
              </svg>
            </button>
          </header>

          <div class="hora-modal__list">
            <button
              v-for="hora in HORAS"
              :key="hora"
              type="button"
              class="hora-modal__option"
              :class="{ 'hora-modal__option--selected': form.hora === hora }"
              :disabled="horasPasadas.has(hora)"
              @click="seleccionarHora(hora)"
            >
              {{ hora }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.step__nota {
  margin: 0.6rem 0 0;
  font-size: 0.82rem;
  line-height: 1.4;
  opacity: 0.85;
}
.step {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.step__calendar {
  background: #fff;
  border-radius: var(--radius-md);
  padding: 1rem;
}
.step__calendar-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  font-weight: 700;
  color: var(--color-text);
  margin-bottom: 0.7rem;
}
.step__calendar-title {
  flex: 1;
  text-align: center;
}
.step__nav {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.step__nav:hover:not(:disabled) {
  background: var(--color-primary-soft);
}
.step__nav:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
.step__nav:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}
.step__weekdays,
.step__grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.2rem;
}
.step__weekday {
  text-align: center;
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-text-muted);
  padding: 0.2rem 0;
}
.step__cell {
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: var(--radius-sm);
  font-size: 0.85rem;
}
.step__cell--day {
  border: none;
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.step__cell--day:hover:not(:disabled) {
  background: var(--color-primary-soft);
}
.step__cell--selected {
  background: var(--color-primary) !important;
  color: #fff !important;
  font-weight: 700;
}
.step__cell--disabled {
  color: var(--color-border);
  cursor: not-allowed;
}
.step__field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.step__label {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
}
.step__required {
  margin-left: 0.2rem;
  color: #fecaca;
  font-weight: 700;
}
.step__horas {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;
}
.step__hora {
  padding: 0.55rem 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
  background: #fff;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s, color 0.15s, opacity 0.15s;
}
.step__hora--selected,
.step__hora:hover:not(:disabled) {
  background: #fff;
  color: var(--color-text);
  opacity: 0.5 !important;
}
.step__hora:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
/* Hora de hoy que ya pasó: distinta de la elegida, que también va al 50 %. */
.step__hora--pasada {
  opacity: 0.25 !important;
  text-decoration: line-through;
}
.step__hora-btn {
  display: none;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.8rem 0.95rem;
  font-size: 0.95rem;
  font-family: inherit;
  color: var(--color-text);
  background: #fff;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
}
.step__hora-btn:focus-visible {
  outline: none;
  border-color: var(--color-primary-strong);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.35);
}
.step__hora-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.step__error {
  font-size: 0.8rem;
  color: #fecaca;
}
.hora-modal {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: rgba(15, 23, 42, 0.55);
  animation: hora-modal-fade 0.2s ease;
}
.hora-modal__dialog {
  width: 100%;
  max-width: 360px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.25);
  animation: hora-modal-pop 0.2s ease;
}
.hora-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.1rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
}
.hora-modal__title {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
}
.hora-modal__close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.hora-modal__close:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}
.hora-modal__list {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  padding: 1rem;
  overflow-y: auto;
}
.hora-modal__option {
  padding: 0.7rem 0.85rem;
  font-size: 0.95rem;
  font-weight: 500;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s;
}
.hora-modal__option:hover:not(:disabled) {
  background: var(--color-surface-muted);
}
.hora-modal__option:disabled {
  opacity: 0.4;
  text-decoration: line-through;
  cursor: not-allowed;
}
.hora-modal__option--selected {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
  color: var(--color-primary);
  font-weight: 700;
}
@media (max-width: 1024px) {
  .step__horas {
    display: none;
  }
  .step__hora-btn {
    display: flex;
  }
}
@keyframes hora-modal-fade {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes hora-modal-pop {
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
