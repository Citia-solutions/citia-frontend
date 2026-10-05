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
//
// Al reagendar, si la respuesta trae `avisos.solapamientos` (ADR-11), se
// muestra con qué citas choca la nueva hora. No bloquea: el cambio ya se hizo.
//
// Fase 2 (US-03): sección "Recordatorios" con el estado de cada correo
// automático (`GET /citas/:id/recordatorios`), y vista "Contacto" para
// completar o corregir el correo del paciente (`PATCH /pacientes/:id`). Los
// recordatorios se programan de forma asíncrona: tras abrir, reagendar o
// cancelar se reintenta unos segundos hasta que la lista refleje el cambio.
//
// Lote 2 de la limpieza previa al release (2026-10-05): sección
// "Confirmación" / "Asistencia" con Confirmar (pendiente → confirmada) y
// Asistió / No asistió (confirmada → asistio / no_asistio). Igual que
// reagendar y cancelar, cada botón aparece SOLO si viene en
// `accionesPermitidas`: una cita pendiente que ya pasó solo ofrece Confirmar
// (se explica que para registrar la asistencia primero hay que confirmarla).
//
// Asistió / No asistió además esperan la hora de inicio (decisión del usuario,
// 2026-10-05; el backend no lo exige): antes solo se explica desde qué hora se
// podrá, y los botones aparecen solos al llegar esa hora (`useYaEmpezo`).
import { computed, nextTick, onBeforeUnmount, ref, toRef, watch } from 'vue'
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
  AvisoSolapamiento,
  isTerminalStatus,
  solapamientosDe,
  type AgendaAppointment,
  type Appointment,
  type AppointmentAction,
  type AppointmentStatus,
} from '@/entities/appointment'
import { invalidaVoucher } from '../model/mensajeDeError'
import { useDetalleCita } from '../model/useDetalleCita'
import { useYaEmpezo } from '../model/useYaEmpezo'
import {
  deberiaTenerRecordatorios,
  hayAlguno,
  ningunoProgramado,
  reprogramados,
  useRecordatoriosCita,
  type CondicionRecordatorios,
} from '../model/useRecordatoriosCita'
import type {
  CitaActualizada,
  ResultadoAccion,
  ResultadoContacto,
  TransicionEstado,
} from '../model/types'
import ReagendarCitaForm from './ReagendarCitaForm.vue'
import CancelarCitaConfirm from './CancelarCitaConfirm.vue'
import CambiarEstadoConfirm from './CambiarEstadoConfirm.vue'
import EditarContactoForm from './EditarContactoForm.vue'
import RecordatoriosCita from './RecordatoriosCita.vue'

const props = withDefaults(
  defineProps<{
    isOpen: boolean
    /** La fila desde la que se abrió. Se usa hasta que llega el detalle. */
    appointment: Appointment | null
    /**
     * true si se abrió desde "Citas de hoy": avisa cuando reagendar saca la
     * cita del día. Desde la agenda por rango ese aviso no aplica.
     */
    listaDelDia?: boolean
  }>(),
  { isOpen: false, appointment: null, listaDelDia: true },
)

const emit = defineEmits<{
  close: []
  /** La cita cambió (o se descubrió que cambió): la lista debe recargarse. */
  changed: []
}>()

type Vista = 'detalle' | 'reagendar' | 'cancelar' | 'contacto' | 'estado'
interface Aviso {
  tipo: 'exito' | 'error'
  textos: string[]
}

const vista = ref<Vista>('detalle')
/** Transición que se está confirmando en la vista 'estado'. */
const transicion = ref<TransicionEstado>('confirmar')
const enviando = ref(false)
const aviso = ref<Aviso | null>(null)
/** Citas con las que choca la nueva hora tras reagendar (vacío si no hay). */
const solapamientos = ref<AgendaAppointment[]>([])

const {
  detail,
  loading: cargandoDetalle,
  notFound,
  failed: detalleFallo,
  reset: resetDetalle,
  load: loadDetalle,
} = useDetalleCita()

const {
  recordatorios,
  loading: cargandoRecordatorios,
  loaded: recordatoriosCargados,
  error: errorRecordatorios,
  esperando: esperandoRecordatorios,
  reset: resetRecordatorios,
  cargar: cargarRecordatorios,
} = useRecordatoriosCita()

/** Lo que se muestra: el detalle si ya llegó; si no, la fila. */
const cita = computed<Appointment | null>(() => detail.value ?? props.appointment)

/** Vigente y con más de 30 min por delante: una lista vacía es "todavía no", no "no hay". */
const esperables = computed(() => (cita.value ? deberiaTenerRecordatorios(cita.value) : false))

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

// ---------------------------------------------------------------------------
// Confirmación y asistencia: solo lo que declara `accionesPermitidas`
// ---------------------------------------------------------------------------

/**
 * "Ya empezó" con reloj propio: se renueva al abrir, tras cada carga del
 * detalle y, mientras el voucher está abierto, justo a la hora de inicio.
 */
const { yaEmpezo, refrescar: refrescarAhora } = useYaEmpezo(cita, toRef(props, 'isOpen'))

const TRANSICIONES: readonly TransicionEstado[] = ['confirmar', 'asistencia', 'inasistencia']

/** Transiciones de estado que el backend ofrece para esta cita (vacío hasta que llega el detalle). */
const transicionesPermitidas = computed(() => TRANSICIONES.filter((t) => permitida(t)))

/**
 * Lo que se puede hacer AHORA: lo que declara el backend, salvo Asistió / No
 * asistió antes de la hora de inicio. Ese bloqueo es solo del front (decisión
 * del usuario, 2026-10-05): el backend sí lo acepta. Confirmar no espera.
 */
function disponible(t: TransicionEstado): boolean {
  return permitida(t) && (t === 'confirmar' || yaEmpezo.value)
}

/** false en una confirmada que aún no empieza: la sección queda solo con el texto. */
const hayBotonesEstado = computed(() => TRANSICIONES.some((t) => disponible(t)))

/** Título de la sección: "Confirmación" si se puede confirmar; si no, "Asistencia". */
const tituloEstado = computed(() => (permitida('confirmar') ? 'Confirmación' : 'Asistencia'))

/**
 * Texto de la sección. Es presentación: qué botones hay lo decide el backend
 * (más el bloqueo por hora de `disponible`).
 * Una pendiente que ya empezó solo admite Confirmar (ADR-04): se explica por
 * qué no hay Asistió / No asistió, sin ofrecer un atajo que ensuciaría el dato.
 * Una confirmada que aún no empieza no muestra botones: solo desde qué hora.
 */
const textoEstado = computed(() => {
  if (permitida('confirmar')) {
    return yaEmpezo.value
      ? 'Esta cita ya empezó y sigue pendiente. Para registrar si el paciente asistió, primero confírmala.'
      : '¿El paciente confirmó que vendrá? Márcala como confirmada.'
  }
  return yaEmpezo.value
    ? '¿El paciente vino a la cita?'
    : `Podrás registrar la asistencia cuando llegue la hora de la cita (${cita.value?.time ?? ''}).`
})

function abrirTransicion(t: TransicionEstado): void {
  if (enviando.value || !disponible(t)) return
  transicion.value = t
  irA('estado')
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
  refrescarAhora()
  if (id) await loadDetalle(id)
}

/** Primera carga al abrir: si la fila quedó vieja, se pide recargar la lista. */
async function cargarDetalleInicial(): Promise<void> {
  const fila = props.appointment
  if (!fila) return
  refrescarAhora()
  const nuevo = await loadDetalle(fila.id)
  if (notFound.value || (nuevo && nuevo.status !== fila.status)) emit('changed')
}

// ---------------------------------------------------------------------------
// Recordatorios
// ---------------------------------------------------------------------------

/** Pide los recordatorios de la cita abierta; con `hasta`, reintenta mientras no se cumpla. */
function refrescarRecordatorios(hasta: CondicionRecordatorios | null = null): void {
  const id = props.appointment?.id
  if (id) void cargarRecordatorios(id, hasta)
}

/**
 * Al abrir: si la cita debería tener recordatorios y no llegó ninguno, se
 * reintenta unos segundos (recién creada o reagendada, el backend aún no los
 * programó).
 */
function cargarRecordatoriosIniciales(): void {
  const fila = props.appointment
  if (fila) refrescarRecordatorios(deberiaTenerRecordatorios(fila) ? hayAlguno : null)
}

/** "Actualizar" a mano: si la lista sigue vacía y no debería, vuelve a esperar. */
function actualizarRecordatorios(): void {
  refrescarRecordatorios(esperables.value && recordatorios.value.length === 0 ? hayAlguno : null)
}

// ---------------------------------------------------------------------------
// Acciones
// ---------------------------------------------------------------------------

function irA(destino: Vista): void {
  if (enviando.value) return
  aviso.value = null
  solapamientos.value = []
  vista.value = destino
  if (destino === 'detalle') void nextTick(() => closeBtn.value?.focus())
}

function textosReagendada(actualizada: CitaActualizada): string[] {
  const inicio = new Date(actualizada.inicio)
  const textos = [
    `Cita movida al ${formatearFechaLarga(inicio)} a las ${horaLocal(inicio)}. Quedó pendiente de confirmación.`,
  ]
  if (props.listaDelDia && !esMismoDia(inicio, new Date())) {
    textos.push('Ya no aparece en tu lista de hoy.')
  }
  return textos
}

const EXITO_TRANSICION: Record<TransicionEstado, string> = {
  confirmar: 'Cita confirmada.',
  asistencia: 'Asistencia registrada: el paciente asistió.',
  inasistencia: 'Inasistencia registrada: el paciente no asistió.',
}

/** Resultado de Confirmar / Asistió / No asistió. Mismo tratamiento que cancelar. */
async function alResultadoTransicion(resultado: ResultadoAccion, t: TransicionEstado): Promise<void> {
  enviando.value = false
  if (resultado.ok) {
    irA('detalle')
    aviso.value = { tipo: 'exito', textos: [EXITO_TRANSICION[t]] }
    emit('changed')
    // Asistió / No asistió cierran la cita: el backend anula los recordatorios
    // programados (asíncrono). Confirmar no los toca.
    if (t !== 'confirmar') refrescarRecordatorios(ningunoProgramado)
    await cargarDetalle()
    return
  }
  // 409 / 404: la cita cambió. Se vuelve al detalle con el mensaje y se recarga todo.
  if (invalidaVoucher(resultado.status)) {
    irA('detalle')
    aviso.value = { tipo: 'error', textos: [resultado.mensaje] }
    emit('changed')
    refrescarRecordatorios()
    await cargarDetalle()
  }
  // Los demás fallos (401, red) los muestra la propia vista, que permite reintentar.
}

async function alResultado(resultado: ResultadoAccion, accion: 'reagendar' | 'cancelar'): Promise<void> {
  // Si llegó un resultado, ya no se está enviando (la vista puede desmontarse).
  enviando.value = false
  if (resultado.ok) {
    // Foto de los recordatorios ANTES del cambio: sirve para saber cuándo el
    // backend terminó de reprogramarlos (asíncrono, ~5 s).
    const antes = recordatorios.value
    irA('detalle')
    aviso.value = {
      tipo: 'exito',
      textos: accion === 'cancelar' ? ['Cita cancelada.'] : textosReagendada(resultado.cita),
    }
    // Cancelar no trae `avisos` (no mueve la ventana): la lista queda vacía.
    solapamientos.value = solapamientosDe(resultado.cita.avisos)
    emit('changed')
    refrescarRecordatorios(
      accion === 'cancelar'
        ? ningunoProgramado
        : reprogramados(
            antes,
            deberiaTenerRecordatorios({
              status: resultado.cita.estado,
              startsAt: resultado.cita.inicio,
            }),
          ),
    )
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
    refrescarRecordatorios()
    await cargarDetalle()
  }
  // Los demás fallos (400, 401, red) los muestra la propia vista, que conserva
  // lo escrito para reintentar.
}

/** Resultado de la vista "Contacto" (éxito o 404; el resto lo muestra la vista). */
async function alGuardarContacto(resultado: ResultadoContacto): Promise<void> {
  enviando.value = false
  irA('detalle')
  if (resultado.ok) {
    const textos = ['Contacto del paciente actualizado.']
    if (resultado.correoCambio) {
      textos.push('Los recordatorios que aún no salen irán a ese correo.')
    }
    aviso.value = { tipo: 'exito', textos }
  } else {
    aviso.value = { tipo: 'error', textos: [resultado.mensaje] }
  }
  refrescarRecordatorios()
  await cargarDetalle()
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
      solapamientos.value = []
      enviando.value = false
      resetDetalle()
      resetRecordatorios()
      document.addEventListener('keydown', onKeydown)
      await nextTick()
      closeBtn.value?.focus()
      // En paralelo con el detalle: no dependen uno del otro.
      cargarRecordatoriosIniciales()
      await cargarDetalleInicial()
    } else {
      document.removeEventListener('keydown', onKeydown)
      // Cerrado no se sigue preguntando por los recordatorios.
      resetRecordatorios()
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
          <AvisoSolapamiento :solapamientos="solapamientos" />

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
            <div class="voucher__section-head">
              <h3 id="voucher-contacto" class="voucher__section-title">Contacto</h3>
              <button
                v-if="detail && !notFound"
                type="button"
                class="voucher__edit"
                aria-label="Editar contacto del paciente"
                @click="irA('contacto')"
              >
                Editar
              </button>
            </div>

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
              <span v-else class="voucher__missing">Sin correo: no recibe recordatorios</span>
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

          <RecordatoriosCita
            v-if="!notFound"
            :recordatorios="recordatorios"
            :loading="cargandoRecordatorios"
            :loaded="recordatoriosCargados"
            :error="errorRecordatorios"
            :esperando="esperandoRecordatorios"
            :esperables="esperables"
            :puede-editar-contacto="detail !== null"
            :paciente-sin-correo="detail !== null && !detail.patient.email"
            @actualizar="actualizarRecordatorios"
            @editar-contacto="irA('contacto')"
          />

          <p v-if="esTerminal" class="voucher__terminal">{{ notaTerminal }} Ya no admite cambios.</p>

          <section
            v-if="!esTerminal && !notFound && transicionesPermitidas.length > 0"
            class="voucher__estado"
            aria-labelledby="voucher-estado"
          >
            <h3 id="voucher-estado" class="voucher__section-title">{{ tituloEstado }}</h3>
            <p class="voucher__estado-text">{{ textoEstado }}</p>
            <div v-if="hayBotonesEstado" class="voucher__estado-actions">
              <BaseButton
                v-if="disponible('confirmar')"
                variant="outline"
                class="voucher__ok"
                :block="false"
                @click="abrirTransicion('confirmar')"
              >
                Confirmar cita
              </BaseButton>
              <BaseButton
                v-if="disponible('asistencia')"
                variant="outline"
                class="voucher__ok"
                :block="false"
                @click="abrirTransicion('asistencia')"
              >
                Asistió
              </BaseButton>
              <BaseButton
                v-if="disponible('inasistencia')"
                variant="outline"
                class="voucher__danger"
                :block="false"
                @click="abrirTransicion('inasistencia')"
              >
                No asistió
              </BaseButton>
            </div>
          </section>

          <footer v-if="!esTerminal && !notFound" class="voucher__actions">
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
          :lista-del-dia="listaDelDia"
          @back="irA('detalle')"
          @submitting="enviando = $event"
          @result="alResultado($event, 'reagendar')"
        />

        <CancelarCitaConfirm
          v-else-if="vista === 'cancelar'"
          :appointment="cita"
          @back="irA('detalle')"
          @submitting="enviando = $event"
          @result="alResultado($event, 'cancelar')"
        />

        <CambiarEstadoConfirm
          v-else-if="vista === 'estado'"
          :appointment="cita"
          :transicion="transicion"
          @back="irA('detalle')"
          @submitting="enviando = $event"
          @result="alResultadoTransicion($event, transicion)"
        />

        <EditarContactoForm
          v-else-if="vista === 'contacto' && detail"
          :patient="detail.patient"
          @back="irA('detalle')"
          @submitting="enviando = $event"
          @result="alGuardarContacto"
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
.voucher__section-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}
.voucher__edit {
  border: none;
  background: transparent;
  padding: 0;
  color: var(--color-primary);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
}
.voucher__edit:hover {
  text-decoration: underline;
}
.voucher__missing {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-warning);
}
.voucher__section-title {
  margin: 0;
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
.voucher__estado {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px solid var(--color-border);
}
.voucher__estado-text {
  margin: 0;
  font-size: 0.88rem;
  color: var(--color-text);
}
.voucher__estado-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6rem;
}
/* Tono positivo (confirmar, asistió) sobre BaseButton outline. */
.voucher .voucher__ok {
  color: var(--color-success);
  border-color: var(--color-success);
}
.voucher .voucher__ok:not(:disabled):hover {
  background: var(--color-success-soft);
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
