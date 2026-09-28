<script setup lang="ts">
// Bandeja de solicitudes: pestañas por estado (recibidas por defecto), la lista
// de la pestaña activa y las acciones Aceptar / Rechazar con sus diálogos.
//
// La bandeja es de la ORGANIZACIÓN (ADR-09 §11.a): otra persona del equipo
// puede resolver la misma solicitud mientras esta pestaña está abierta. Por eso
// tras cualquier acción —o ante un 404/409— se vuelve a pedir la lista en vez
// de quitar la fila a mano.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import { capitalizar, formatearFechaLarga, horaLocal } from '@/shared/lib/fecha'
import {
  AvisoSolapamiento,
  solapamientosDe,
  type AgendaAppointment,
} from '@/entities/appointment'
import type { EstadoSolicitud, Solicitud } from '@/entities/solicitud'
import { invalidaBandeja } from '../model/mensajeDeError'
import { useBandeja } from '../model/useBandeja'
import type { ResultadoResolucion, SolicitudAceptada } from '../model/types'
import AceptarSolicitudModal from './AceptarSolicitudModal.vue'
import RechazarSolicitudConfirm from './RechazarSolicitudConfirm.vue'

const emit = defineEmits<{
  /** El profesional quiere ver la cita recién creada en su agenda. */
  verAgenda: []
}>()

/** Mínimo entre refetches automáticos al volver el foco a la pestaña. */
const REFETCH_MIN_MS = 30_000

const PESTANAS: { estado: EstadoSolicitud; etiqueta: string }[] = [
  { estado: 'recibida', etiqueta: 'Recibidas' },
  { estado: 'aceptada', etiqueta: 'Aceptadas' },
  { estado: 'rechazada', etiqueta: 'Rechazadas' },
]

const VACIO: Record<EstadoSolicitud, string> = {
  recibida: 'No hay solicitudes esperando respuesta.',
  aceptada: 'Todavía no se ha aceptado ninguna solicitud.',
  rechazada: 'No hay solicitudes rechazadas.',
}

const { estado, solicitudes, loading, loaded, error, reload, cambiarEstado, reloadIfStale } =
  useBandeja()

interface AvisoBandeja {
  tipo: 'exito' | 'error'
  texto: string
  solapamientos: AgendaAppointment[]
  /** Ofrece "Ver en la agenda" (solo tras aceptar). */
  verAgenda: boolean
}
const aviso = ref<AvisoBandeja | null>(null)

const aceptarAbierto = ref(false)
const rechazarAbierto = ref(false)
const seleccionada = ref<Solicitud | null>(null)

const firstLoad = computed(() => loading.value && !loaded.value)
const refreshing = computed(() => loading.value && loaded.value)

function cambiarPestana(nuevo: EstadoSolicitud): void {
  aviso.value = null
  void cambiarEstado(nuevo)
}

/** Flechas izquierda/derecha entre pestañas (patrón ARIA de tabs). */
function onTabKeydown(e: KeyboardEvent, indice: number): void {
  if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return
  e.preventDefault()
  const delta = e.key === 'ArrowRight' ? 1 : -1
  const siguiente = PESTANAS[(indice + delta + PESTANAS.length) % PESTANAS.length]
  if (!siguiente) return
  cambiarPestana(siguiente.estado)
  document.getElementById(`bandeja-tab-${siguiente.estado}`)?.focus()
}

function abrirAceptar(s: Solicitud): void {
  seleccionada.value = { ...s }
  aceptarAbierto.value = true
}

function abrirRechazar(s: Solicitud): void {
  seleccionada.value = { ...s }
  rechazarAbierto.value = true
}

/** 'Miércoles 17 de septiembre, 11:02' (zona del navegador, DTF-07). */
function momento(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return `${capitalizar(formatearFechaLarga(d))}, ${horaLocal(d)}`
}

function hrefTelefono(telefono: string): string {
  return `tel:${telefono.replace(/[^\d+]/g, '')}`
}

function alAceptar(resultado: ResultadoResolucion<SolicitudAceptada>): void {
  aceptarAbierto.value = false
  if (resultado.ok) {
    const { solicitud, cita } = resultado.valor
    const inicio = new Date(cita.inicio)
    aviso.value = {
      tipo: 'exito',
      texto:
        `Solicitud de ${solicitud.nombrePaciente} aceptada: cita agendada para el ` +
        `${formatearFechaLarga(inicio)} a las ${horaLocal(inicio)}, pendiente de confirmación.`,
      solapamientos: solapamientosDe(cita.avisos),
      verAgenda: true,
    }
  } else if (invalidaBandeja(resultado.status)) {
    aviso.value = { tipo: 'error', texto: resultado.mensaje, solapamientos: [], verAgenda: false }
  }
  void reload()
}

function alRechazar(resultado: ResultadoResolucion<Solicitud>): void {
  rechazarAbierto.value = false
  if (resultado.ok) {
    aviso.value = {
      tipo: 'exito',
      texto: `Solicitud de ${resultado.valor.nombrePaciente} rechazada.`,
      solapamientos: [],
      verAgenda: false,
    }
  } else if (invalidaBandeja(resultado.status)) {
    aviso.value = { tipo: 'error', texto: resultado.mensaje, solapamientos: [], verAgenda: false }
  }
  void reload()
}

// Cambios de otra persona del equipo o de nuevos pacientes: se recarga al
// volver a la pestaña, con un mínimo entre pedidos (mismo patrón que el dashboard).
function alCambiarVisibilidad(): void {
  if (document.visibilityState === 'visible') void reloadIfStale(REFETCH_MIN_MS)
}

onMounted(() => {
  void reload()
  document.addEventListener('visibilitychange', alCambiarVisibilidad)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', alCambiarVisibilidad)
})

</script>

<template>
  <BaseCard>
    <template #header>
      <div class="bandeja__head">
        <div class="bandeja__tabs" role="tablist" aria-label="Estado de las solicitudes">
          <button
            v-for="(tab, i) in PESTANAS"
            :id="`bandeja-tab-${tab.estado}`"
            :key="tab.estado"
            type="button"
            role="tab"
            class="bandeja__tab"
            :class="{ 'bandeja__tab--active': estado === tab.estado }"
            :aria-selected="estado === tab.estado"
            :tabindex="estado === tab.estado ? 0 : -1"
            aria-controls="bandeja-panel"
            @click="cambiarPestana(tab.estado)"
            @keydown="onTabKeydown($event, i)"
          >
            {{ tab.etiqueta }}
          </button>
        </div>
        <span v-if="refreshing" class="bandeja__refreshing" role="status">
          <span class="bandeja__spinner" aria-hidden="true" />
          Actualizando…
        </span>
      </div>
    </template>

    <div id="bandeja-panel" role="tabpanel" :aria-labelledby="`bandeja-tab-${estado}`" class="bandeja__panel">
      <!-- Resultado de la última acción -->
      <div
        v-if="aviso"
        class="bandeja__aviso"
        :class="aviso.tipo === 'exito' ? 'bandeja__aviso--success' : 'bandeja__aviso--error'"
        :role="aviso.tipo === 'exito' ? 'status' : 'alert'"
      >
        <p class="bandeja__aviso-text">{{ aviso.texto }}</p>
        <div class="bandeja__aviso-actions">
          <button v-if="aviso.verAgenda" type="button" class="bandeja__link" @click="emit('verAgenda')">
            Ver en la agenda
          </button>
          <button type="button" class="bandeja__link" @click="aviso = null">Descartar</button>
        </div>
      </div>
      <AvisoSolapamiento v-if="aviso" :solapamientos="aviso.solapamientos" />

      <!-- Primera carga -->
      <ul v-if="firstLoad" class="bandeja__list" aria-busy="true" aria-label="Cargando solicitudes">
        <li v-for="n in 3" :key="n" class="bandeja__skeleton">
          <span class="bandeja__skel bandeja__skel--name" />
          <span class="bandeja__skel bandeja__skel--line" />
          <span class="bandeja__skel bandeja__skel--short" />
        </li>
      </ul>

      <div v-else-if="error && !loaded" class="bandeja__state" role="alert">
        <p class="bandeja__state-text">{{ error }}</p>
        <button type="button" class="bandeja__state-action" @click="reload()">Reintentar</button>
      </div>

      <template v-else>
        <div v-if="error" class="bandeja__warning" role="alert">
          <span>{{ error }} Mostramos la última versión cargada.</span>
          <button type="button" class="bandeja__warning-action" :disabled="loading" @click="reload()">
            Reintentar
          </button>
        </div>

        <div v-if="solicitudes.length === 0" class="bandeja__state">
          <p class="bandeja__state-text">{{ VACIO[estado] }}</p>
        </div>

        <ul v-else class="bandeja__list">
          <li v-for="s in solicitudes" :key="s.id" class="bandeja__item">
            <div class="bandeja__item-head">
              <div class="bandeja__who">
                <span class="bandeja__name">{{ s.nombrePaciente }}</span>
                <span class="bandeja__rut">RUT {{ s.rut }}</span>
              </div>
              <span class="bandeja__received">Recibida: {{ momento(s.recibidaEn) }}</span>
            </div>

            <p class="bandeja__motivo">“{{ s.motivo }}”</p>

            <dl class="bandeja__facts">
              <div class="bandeja__fact">
                <dt>Prefiere</dt>
                <dd>{{ s.preferenciaHoraria }}</dd>
              </div>
              <div class="bandeja__fact">
                <dt>Contacto</dt>
                <dd class="bandeja__contact">
                  <a class="bandeja__contact-link" :href="hrefTelefono(s.telefono)">{{ s.telefono }}</a>
                  <a v-if="s.correo" class="bandeja__contact-link" :href="`mailto:${s.correo}`">{{ s.correo }}</a>
                  <span v-if="s.consentimiento" class="bandeja__muted">· acepta recordatorios</span>
                </dd>
              </div>
            </dl>

            <div v-if="s.estado === 'recibida'" class="bandeja__actions">
              <BaseButton variant="outline" class="bandeja__danger" :block="false" @click="abrirRechazar(s)">
                Rechazar
              </BaseButton>
              <BaseButton :block="false" @click="abrirAceptar(s)">Aceptar</BaseButton>
            </div>
            <p v-else-if="s.resueltaEn" class="bandeja__resolved">
              {{ s.estado === 'aceptada' ? 'Aceptada' : 'Rechazada' }}: {{ momento(s.resueltaEn) }}
            </p>
          </li>
        </ul>
      </template>
    </div>
  </BaseCard>

  <AceptarSolicitudModal
    :is-open="aceptarAbierto"
    :solicitud="seleccionada"
    @close="aceptarAbierto = false"
    @result="alAceptar"
  />

  <RechazarSolicitudConfirm
    :is-open="rechazarAbierto"
    :solicitud="seleccionada"
    @close="rechazarAbierto = false"
    @result="alRechazar"
  />
</template>

<style scoped>
.bandeja__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.bandeja__tabs {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
}
.bandeja__tab {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.45rem 0.9rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.bandeja__tab:hover {
  color: var(--color-text);
}
.bandeja__tab--active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-card);
}
.bandeja__tab:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
.bandeja__refreshing {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
.bandeja__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: bandeja-spin 0.6s linear infinite;
}
.bandeja__panel {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.bandeja__aviso {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  border-radius: var(--radius-md);
}
.bandeja__aviso--success {
  color: var(--color-success);
  background: var(--color-success-soft);
}
.bandeja__aviso--error {
  color: var(--color-danger);
  background: var(--color-danger-soft);
}
.bandeja__aviso-text {
  margin: 0;
}
.bandeja__aviso-actions {
  display: flex;
  gap: 0.75rem;
  flex-shrink: 0;
}
.bandeja__link {
  border: none;
  background: transparent;
  padding: 0;
  color: inherit;
  font: inherit;
  font-weight: 700;
  cursor: pointer;
}
.bandeja__link:hover {
  text-decoration: underline;
}
.bandeja__list {
  list-style: none;
  margin: 0;
  padding: 0;
}
.bandeja__item {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  padding: 1rem 0.25rem;
  border-bottom: 1px solid var(--color-border);
}
.bandeja__item:last-child {
  border-bottom: none;
}
.bandeja__item-head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.5rem 1rem;
  flex-wrap: wrap;
}
.bandeja__who {
  display: flex;
  align-items: baseline;
  gap: 0.6rem;
  flex-wrap: wrap;
}
.bandeja__name {
  font-weight: 700;
  font-size: 0.98rem;
  color: var(--color-text);
}
.bandeja__rut,
.bandeja__received,
.bandeja__muted {
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.bandeja__motivo {
  margin: 0;
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  color: var(--color-text);
  background: var(--color-surface-muted);
  border-left: 3px solid var(--color-border);
  border-radius: var(--radius-sm);
  overflow-wrap: anywhere;
}
.bandeja__facts {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem 2rem;
  margin: 0;
  font-size: 0.85rem;
}
.bandeja__fact {
  display: flex;
  gap: 0.5rem;
  min-width: 0;
}
.bandeja__fact dt {
  font-weight: 600;
  color: var(--color-text-muted);
}
.bandeja__fact dd {
  margin: 0;
  color: var(--color-text);
  min-width: 0;
  overflow-wrap: anywhere;
}
.bandeja__contact {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem 0.75rem;
}
.bandeja__contact-link {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}
.bandeja__contact-link:hover {
  text-decoration: underline;
}
.bandeja__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.6rem;
}
.bandeja__actions .bandeja__danger {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.bandeja__actions .bandeja__danger:not(:disabled):hover {
  background: var(--color-danger-soft);
}
.bandeja__resolved {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}
.bandeja__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 2rem 1rem;
  text-align: center;
}
.bandeja__state-text {
  margin: 0;
  font-size: 0.92rem;
  color: var(--color-text-muted);
}
.bandeja__state-action {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.bandeja__state-action:hover {
  background: var(--color-surface-muted);
}
.bandeja__warning {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
}
.bandeja__warning-action {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-danger);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.bandeja__warning-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.bandeja__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 0.25rem;
  border-bottom: 1px solid var(--color-border);
}
.bandeja__skeleton:last-child {
  border-bottom: none;
}
.bandeja__skel {
  display: block;
  height: 0.85rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  animation: bandeja-pulse 1.2s ease-in-out infinite;
}
.bandeja__skel--name {
  width: 35%;
  height: 1rem;
}
.bandeja__skel--line {
  width: 80%;
}
.bandeja__skel--short {
  width: 50%;
}
@keyframes bandeja-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
@keyframes bandeja-spin {
  to {
    transform: rotate(360deg);
  }
}
@media (max-width: 560px) {
  .bandeja__tabs {
    width: 100%;
  }
  .bandeja__tab {
    flex: 1;
    padding: 0.45rem 0.4rem;
  }
  .bandeja__aviso {
    flex-direction: column;
  }
}
</style>
