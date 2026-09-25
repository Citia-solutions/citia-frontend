<script setup lang="ts">
// Voucher de una cita: ficha con su información y las acciones Reagendar y
// Cancelar. Mismo contrato que `ModalNuevaCita`: la visibilidad la decide el
// padre (prop isOpen) y este componente avisa cuando quiere cerrarse (close).
//
// Se pinta al instante con los datos de la fila y en paralelo pide
// `GET /citas/:id` (contacto, estado fresco y `accionesPermitidas`). Si el
// detalle trae otro estado, gana el detalle. Los botones se habilitan SOLO
// según `accionesPermitidas`: el front no copia el grafo de estados.
//
// Tras un cambio el voucher se queda abierto mostrando el resultado (si se
// cerrara y la cita se hubiera movido a otro día, la fila desaparecería sin
// explicación) y emite `changed` para que la página recargue la lista.
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import BaseAvatar from '@/shared/ui/BaseAvatar.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import {
  capitalizar,
  esMismoDia,
  formatearFechaLarga,
  horaLocal,
  sumarMinutos,
} from '@/shared/lib/fecha'
import {
  AppointmentStatusBadge,
  isTerminalStatus,
  type Appointment,
  type AppointmentAction,
  type AppointmentStatus,
} from '@/entities/appointment'
import { invalidaVoucher } from '../model/mensajeDeError'
import { useDetalleCita } from '../model/useDetalleCita'
import type { CitaActualizada, ResultadoAccion } from '../model/types'
import ReagendarCitaForm from './ReagendarCitaForm.vue'
import CancelarCitaConfirm from './CancelarCitaConfirm.vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    /** La fila desde la que se abrió. Se usa hasta que llega el detalle. */
    appointment: Appointment | null
  }>(),
  { isOpen: false, appointment: null },
)

const emit = defineEmits<{
  close: []
  /** La cita cambió (o se descubrió que cambió): la lista debe recargarse. */
  changed: []
}>()

type Vista = 'detalle' | 'reagendar' | 'cancelar'
interface Aviso {
  tipo: 'exito' | 'error'
  textos: string[]
}

const vista = ref<Vista>('detalle')
const enviando = ref(false)
const aviso = ref<Aviso | null>(null)

const {
  detail,
  loading: cargandoDetalle,
  notFound,
  failed: detalleFallo,
  reset: resetDetalle,
  load: loadDetalle,
} = useDetalleCita()

/** Lo que se muestra: el detalle si ya llegó; si no, la fila. */
const cita = computed<Appointment | null>(() => detail.value ?? props.appointment)

const NOTA_TERMINAL: Partial<Record<AppointmentStatus, string>> = {
  cancelada: 'Esta cita fue cancelada.',
  asistio: 'El paciente asistió a esta cita.',
  no_asistio: 'El paciente no asistió.',
  ghosting: 'El paciente no confirmó esta cita.',
}

const esTerminal = computed(() => (cita.value ? isTerminalStatus(cita.value.status) : false))
const notaTerminal = computed(() => (cita.value ? NOTA_TERMINAL[cita.value.status] ?? '' : ''))

const fechaLarga = computed(() =>
  cita.value ? capitalizar(formatearFechaLarga(new Date(cita.value.startsAt))) : '',
)

// Inicio: `hora` tal como la manda el backend (zona de la clínica).
// Término: inicio + duración, calculado aquí solo para mostrarlo.
const rangoHorario = computed(() => {
  if (!cita.value) return ''
  const fin = sumarMinutos(new Date(cita.value.startsAt), cita.value.durationMin)
  return `${cita.value.time} – ${horaLocal(fin)}`
})

function permitida(accion: AppointmentAction): boolean {
  return detail.value?.allowedActions.includes(accion) ?? false
}

function motivoDeshabilitado(accion: AppointmentAction): string | undefined {
  if (!detail.value) return undefined
  return permitida(accion) ? undefined : 'No disponible en el estado actual de la cita'
}

/** `tel:` sin espacios ni guiones. */
function hrefTelefono(telefono: string): string {
  return `tel:${telefono.replace(/[^\d+]/g, '')}`
}

// ---------------------------------------------------------------------------
// Detalle
// ---------------------------------------------------------------------------

async function cargarDetalle(): Promise<void> {
  const id = props.appointment?.id
  if (id) await loadDetalle(id)
}

/** Primera carga al abrir: si la fila quedó vieja, se pide recargar la lista. */
async function cargarDetalleInicial(): Promise<void> {
  const fila = props.appointment
  if (!fila) return
  const nuevo = await loadDetalle(fila.id)
  if (notFound.value || (nuevo && nuevo.status !== fila.status)) emit('changed')
}

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------

function irA(destino: Vista): void {
  if (enviando.value) return
  aviso.value = null
  vista.value = destino
  if (destino === 'detalle') void nextTick(() => closeBtn.value?.focus())
}

function textosReagendada(actualizada: CitaActualizada): string[] {
  const inicio = new Date(actualizada.inicio)
  const textos = [
    `Cita movida al ${formatearFechaLarga(inicio)} a las ${horaLocal(inicio)}. Quedó pendiente de confirmación.`,
  ]
  if (!esMismoDia(inicio, new Date())) textos.push('Ya no aparece en tu lista de hoy.')
  return textos
}

async function alResultado(resultado: ResultadoAccion, accion: 'reagendar' | 'cancelar'): Promise<void> {
  // Si llegó un resultado, ya no se está enviando (la vista puede desmontarse).
  enviando.value = false
  if (resultado.ok) {
    irA('detalle')
    aviso.value = {
      tipo: 'exito',
      textos: accion === 'cancelar' ? ['Cita cancelada.'] : textosReagendada(resultado.cita),
    }
    emit('changed')
    // Las respuestas de PATCH no traen `accionesPermitidas`: se vuelve a pedir el detalle.
    await cargarDetalle()
    return
  }

  // 409 / 404: lo que muestra el voucher ya no es verdad. Se vuelve a la vista
  // principal con el mensaje y se recarga el detalle (y la lista).
  if (invalidaVoucher(resultado.status)) {
    irA('detalle')
    aviso.value = { tipo: 'error', textos: [resultado.mensaje] }
    emit('changed')
    await cargarDetalle()
  }
  // Los demás fallos (400, 401, red) los muestra la propia vista, que conserva
  // lo escrito para reintentar.
}

// ---------------------------------------------------------------------------
// Apertura, cierre y foco
// ---------------------------------------------------------------------------

const dialog = ref<HTMLElement | null>(null)
const closeBtn = ref<HTMLButtonElement | null>(null)
let focoPrevio: HTMLElement | null = null

function cerrar(): void {
  // Mientras se envía no se puede cerrar (igual que ModalNuevaCita).
  if (enviando.value) return
  emit('close')
}

const FOCUSABLES =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/** `Esc` cierra y `Tab` no sale del diálogo. */
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
      vista.value = 'detalle'
      aviso.value = null
      enviando.value = false
      resetDetalle()
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      closeBtn.value?.focus()
      await cargarDetalleInicial()
    } else {
      document.removeEventListener('keydown', onKeydown)
      // Devuelve el foco a la fila desde la que se abrió.
      focoPrevio?.focus()
      focoPrevio = null
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => document.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div v-if="isOpen && cita" class="modal" @mousedown.self="cerrar">
    <div
      ref="dialog"
      class="modal__dialog"
      role="dialog"
      aria-modal="true"
      aria-labelledby="voucher-titulo"
    >
      <header class="modal-header">
        <div class="modal-header__text">
          <h2 id="voucher-titulo" class="modal-header__title">Cita</h2>
          <p class="modal-header__subtitle">{{ fechaLarga }}</p>
        </div>
        <button
          ref="closeBtn"
          type="button"
          class="modal-header__close"
          aria-label="Cerrar"
          :disabled="enviando"
          @click="cerrar"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </button>
      </header>

      <div class="voucher">
        <p v-if="notFound" class="voucher__alert voucher__alert--error" role="alert">
          Esta cita ya no está disponible.
        </p>
        <div
          v-else-if="aviso"
          class="voucher__alert"
          :class="aviso.tipo === 'exito' ? 'voucher__alert--success' : 'voucher__alert--error'"
          :role="aviso.tipo === 'exito' ? 'status' : 'alert'"
        >
          <p v-for="texto in aviso.textos" :key="texto" class="voucher__alert-text">{{ texto }}</p>
        </div>

        <!-- Vista principal -->
        <template v-if="vista === 'detalle'">
          <div class="voucher__patient">
            <BaseAvatar :name="cita.patientName" :size="44" />
            <span class="voucher__patient-name">{{ cita.patientName }}</span>
            <AppointmentStatusBadge :status="cita.status" />
          </div>

          <ul class="voucher__facts">
            <li class="voucher__fact">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" />
              </svg>
              <span>{{ fechaLarga }}</span>
            </li>
            <li class="voucher__fact">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
              </svg>
              <span>{{ rangoHorario }} · {{ cita.durationMin }} min</span>
            </li>
            <li class="voucher__fact">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <path d="M9 3h6M12 3v4M5 11a7 7 0 0 0 14 0V7H5z" />
              </svg>
              <span>{{ cita.type }}</span>
            </li>
          </ul>

          <div class="voucher__cut" aria-hidden="true" />

          <section class="voucher__contact" aria-labelledby="voucher-contacto">
            <h3 id="voucher-contacto" class="voucher__section-title">Contacto</h3>

            <div v-if="detail" class="voucher__contact-body">
              <a class="voucher__link" :href="hrefTelefono(detail.patient.phone)">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z" />
                </svg>
                {{ detail.patient.phone }}
              </a>
              <a v-if="detail.patient.email" class="voucher__link" :href="`mailto:${detail.patient.email}`">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="m22 7-10 6L2 7" />
                </svg>
                {{ detail.patient.email }}
              </a>
              <span v-if="detail.patient.rut" class="voucher__muted">RUT {{ detail.patient.rut }}</span>
            </div>
            <div v-else-if="cargandoDetalle" class="voucher__skeleton" aria-busy="true" aria-label="Cargando contacto">
              <span class="voucher__skel voucher__skel--wide" />
              <span class="voucher__skel" />
            </div>
            <p v-else-if="detalleFallo" class="voucher__muted">
              No pudimos cargar los datos de contacto ni las acciones disponibles.
              <button type="button" class="voucher__retry" @click="cargarDetalle">Reintentar</button>
            </p>
          </section>

          <p v-if="esTerminal" class="voucher__terminal">{{ notaTerminal }} Ya no admite cambios.</p>

          <footer v-else-if="!notFound" class="voucher__actions">
            <BaseButton
              variant="outline"
              class="voucher__danger"
              :block="false"
              :disabled="!permitida('cancelar')"
              :title="motivoDeshabilitado('cancelar')"
              @click="irA('cancelar')"
            >
              Cancelar cita
            </BaseButton>
            <BaseButton
              :block="false"
              :disabled="!permitida('reagendar')"
              :title="motivoDeshabilitado('reagendar')"
              @click="irA('reagendar')"
            >
              Reagendar
            </BaseButton>
          </footer>
        </template>

        <ReagendarCitaForm
          v-else-if="vista === 'reagendar'"
          :appointment="cita"
          @back="irA('detalle')"
          @submitting="enviando = $event"
          @result="alResultado($event, 'reagendar')"
        />

        <CancelarCitaConfirm
          v-else
          :appointment="cita"
          @back="irA('detalle')"
          @submitting="enviando = $event"
          @result="alResultado($event, 'cancelar')"
        />
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

.voucher {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1.5rem;
}
.voucher__alert {
  margin: 0;
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  border-radius: var(--radius-md);
}
.voucher__alert--success {
  color: var(--color-success);
  background: var(--color-success-soft);
}
.voucher__alert--error {
  color: var(--color-danger);
  background: var(--color-danger-soft);
}
.voucher__alert-text {
  margin: 0;
}
.voucher__alert-text + .voucher__alert-text {
  margin-top: 0.25rem;
}
.voucher__patient {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.voucher__patient-name {
  flex: 1;
  min-width: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}
.voucher__facts {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.voucher__fact {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.92rem;
  color: var(--color-text);
}
.voucher__fact svg {
  flex-shrink: 0;
  color: var(--color-text-muted);
}
/* Línea de corte tipo voucher. */
.voucher__cut {
  border-top: 2px dashed var(--color-border);
  margin: 0.25rem -1.5rem;
}
.voucher__section-title {
  margin: 0 0 0.5rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.voucher__contact-body {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 1.25rem;
  font-size: 0.9rem;
}
.voucher__link {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  color: var(--color-primary);
  text-decoration: none;
  font-weight: 600;
}
.voucher__link:hover {
  text-decoration: underline;
}
.voucher__muted {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text-muted);
}
.voucher__retry {
  border: none;
  background: transparent;
  padding: 0;
  color: var(--color-primary);
  font: inherit;
  font-weight: 600;
  cursor: pointer;
}
.voucher__retry:hover {
  text-decoration: underline;
}
.voucher__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.voucher__skel {
  display: block;
  width: 40%;
  height: 0.85rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  animation: voucher-pulse 1.2s ease-in-out infinite;
}
.voucher__skel--wide {
  width: 65%;
}
.voucher__terminal {
  margin: 0;
  padding: 0.6rem 0.8rem;
  font-size: 0.88rem;
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
}
.voucher__actions {
  display: flex;
  justify-content: space-between;
  gap: 0.7rem;
  padding-top: 0.5rem;
  border-top: 1px solid var(--color-border);
}
/* Tono destructivo sobre BaseButton outline (más especificidad que .btn--outline). */
.voucher .voucher__danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.voucher .voucher__danger:not(:disabled):hover {
  background: var(--color-danger-soft);
}

/* Móvil: pantalla completa. */
@media (max-width: 560px) {
  .modal {
    padding: 0;
  }
  .modal__dialog {
    max-width: none;
    height: 100%;
    max-height: none;
    border-radius: 0;
  }
  .modal-header {
    padding: 20px 1rem;
  }
  .voucher {
    padding: 1.25rem 1rem;
  }
  .voucher__cut {
    margin: 0.25rem -1rem;
  }
}
@keyframes voucher-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
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
