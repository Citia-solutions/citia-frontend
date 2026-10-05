<script setup lang="ts">
// Agenda del profesional: vista semanal (bloques por hora) y vista lista
// (rango libre de hasta 42 días), las dos sobre `GET /citas?desde&hasta` vía el
// store `useAgendaAppointments`. El filtro por estado es del cliente: el
// endpoint trae todos.
//
// Igual que "Citas de hoy", este widget no sabe que el voucher existe: emite
// `select` y la página compone. Quién y cuándo recarga lo decide la página.
import { computed, onMounted } from 'vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import { fechaLocalISO, sumarDias } from '@/shared/lib/fecha'
import { useAgendaAppointments, type AgendaAppointment } from '@/entities/appointment'
import {
  aplicarFiltro,
  diasDeSemana,
  etiquetaRango,
  inicioDeSemana,
  notaOcultas,
  OPCIONES_FILTRO,
  validarRango,
} from '../model/agenda'
import { useVistaAgenda, type VistaAgenda } from '../model/useVistaAgenda'
import AgendaSemanal from './AgendaSemanal.vue'
import AgendaLista from './AgendaLista.vue'

const emit = defineEmits<{ select: [appointment: AgendaAppointment] }>()

const store = useAgendaAppointments()

/** Hoy en la zona del navegador (DTF-07): solo resalta el día y "Hoy" / atajos. */
const hoy = fechaLocalISO(new Date())

// Modo, semana, rango y filtro sobreviven a salir y volver a la agenda.
const { vista, lunes, desdeLista, hastaLista, filtro } = useVistaAgenda()

const diasSemana = computed(() => diasDeSemana(lunes.value))
const etiquetaSemana = computed(() => etiquetaRango(lunes.value, sumarDias(lunes.value, 6)))
const errorRango = computed(() => validarRango(desdeLista.value, hastaLista.value))
const esSemanaActual = computed(() => lunes.value === inicioDeSemana(hoy))

const visibles = computed(() => aplicarFiltro(store.appointments, filtro.value))
/** "2 canceladas ocultas por el filtro." para el estado vacío; null si no hay ocultas. */
const ocultas = computed(() => notaOcultas(store.appointments, visibles.value, filtro.value))

const firstLoad = computed(() => store.loading && !store.loaded)
const refreshing = computed(() => store.loading && store.loaded)

/**
 * Pide el rango de la vista actual. `forzar` vuelve a pedirlo aunque sea el
 * mismo que ya está cargado (al montar: las citas pudieron cambiar mientras se
 * estaba en otra sección).
 */
function pedirRango(forzar = false): void {
  if (vista.value === 'semana') {
    void store.setRange(lunes.value, sumarDias(lunes.value, 6), { forzar })
  } else if (!errorRango.value) {
    void store.setRange(desdeLista.value, hastaLista.value, { forzar })
  }
}

function moverSemana(semanas: number): void {
  lunes.value = sumarDias(lunes.value, semanas * 7)
  pedirRango()
}

function irAHoy(): void {
  lunes.value = inicioDeSemana(hoy)
  pedirRango()
}

function cambiarVista(nueva: VistaAgenda): void {
  if (nueva === vista.value) return
  if (nueva === 'lista') {
    // Continuidad: la lista arranca en la semana que se estaba mirando.
    desdeLista.value = lunes.value
    hastaLista.value = sumarDias(lunes.value, 6)
  } else if (desdeLista.value) {
    lunes.value = inicioDeSemana(desdeLista.value)
  }
  vista.value = nueva
  pedirRango()
}

/** Atajos de la vista lista: desde hoy, N días (inclusivo). */
function proximosDias(n: number): void {
  desdeLista.value = hoy
  hastaLista.value = sumarDias(hoy, n - 1)
  pedirRango()
}

// Siempre recarga al entrar: con el rango ya cargado, `setRange` sin `forzar`
// no pediría nada y se verían citas viejas (creadas, canceladas o confirmadas
// desde el dashboard). Con datos previos se ve "Actualizando…", no el esqueleto.
onMounted(() => pedirRango(true))
</script>

<template>
  <BaseCard>
    <template #header>
      <div class="agenda__toolbar">
        <div class="agenda__segmented" role="group" aria-label="Vista de la agenda">
          <button
            type="button"
            class="agenda__seg"
            :class="{ 'agenda__seg--active': vista === 'semana' }"
            :aria-pressed="vista === 'semana'"
            @click="cambiarVista('semana')"
          >
            Semana
          </button>
          <button
            type="button"
            class="agenda__seg"
            :class="{ 'agenda__seg--active': vista === 'lista' }"
            :aria-pressed="vista === 'lista'"
            @click="cambiarVista('lista')"
          >
            Lista
          </button>
        </div>

        <!-- Navegación semanal -->
        <div v-if="vista === 'semana'" class="agenda__nav">
          <button type="button" class="agenda__icon-btn" aria-label="Semana anterior" @click="moverSemana(-1)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
          <button type="button" class="agenda__btn" :disabled="esSemanaActual" @click="irAHoy">Hoy</button>
          <button type="button" class="agenda__icon-btn" aria-label="Semana siguiente" @click="moverSemana(1)">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
          <h2 class="agenda__range" aria-live="polite">{{ etiquetaSemana }}</h2>
        </div>

        <!-- Rango de la lista -->
        <div v-else class="agenda__nav agenda__nav--wrap">
          <label class="agenda__field">
            <span class="agenda__field-label">Desde</span>
            <input v-model="desdeLista" class="agenda__input" type="date" @change="pedirRango()" />
          </label>
          <label class="agenda__field">
            <span class="agenda__field-label">Hasta</span>
            <input v-model="hastaLista" class="agenda__input" type="date" :min="desdeLista" @change="pedirRango()" />
          </label>
          <button type="button" class="agenda__btn" @click="proximosDias(7)">Próximos 7 días</button>
          <button type="button" class="agenda__btn" @click="proximosDias(30)">Próximos 30 días</button>
        </div>

        <div class="agenda__right">
          <span v-if="refreshing" class="agenda__refreshing" role="status">
            <span class="agenda__spinner" aria-hidden="true" />
            Actualizando…
          </span>
          <label class="agenda__field agenda__field--inline">
            <span class="agenda__sr">Filtrar por estado</span>
            <select v-model="filtro" class="agenda__input agenda__input--select">
              <option v-for="op in OPCIONES_FILTRO" :key="op.valor" :value="op.valor">{{ op.etiqueta }}</option>
            </select>
          </label>
        </div>
      </div>
      <p v-if="vista === 'lista' && errorRango" class="agenda__range-error" role="alert">
        {{ errorRango }} Se sigue mostrando el último rango válido.
      </p>
    </template>

    <!-- Primera carga -->
    <div v-if="firstLoad" class="agenda__state" aria-busy="true">
      <span class="agenda__spinner agenda__spinner--big" aria-hidden="true" />
      <p class="agenda__state-text">Cargando tu agenda…</p>
    </div>

    <!-- Error sin datos -->
    <div v-else-if="store.error && !store.loaded" class="agenda__state" role="alert">
      <p class="agenda__state-text">{{ store.error }}</p>
      <button type="button" class="agenda__btn" @click="store.reload()">Reintentar</button>
    </div>

    <template v-else>
      <div v-if="store.error" class="agenda__warning" role="alert">
        <span>{{ store.error }} Mostramos la última versión cargada.</span>
        <button type="button" class="agenda__warning-action" :disabled="store.loading" @click="store.reload()">
          Reintentar
        </button>
      </div>

      <AgendaSemanal
        v-if="vista === 'semana'"
        :dias="diasSemana"
        :appointments="visibles"
        :hoy="hoy"
        :loaded-at="store.loadedAt"
        :nota-ocultas="ocultas"
        @select="emit('select', $event)"
      />
      <AgendaLista
        v-else
        :appointments="visibles"
        :hoy="hoy"
        :loaded-at="store.loadedAt"
        :nota-ocultas="ocultas"
        @select="emit('select', $event)"
      />
    </template>
  </BaseCard>
</template>

<style scoped>
.agenda__toolbar {
  display: flex;
  align-items: center;
  gap: 0.75rem 1rem;
  flex-wrap: wrap;
}
.agenda__segmented {
  display: inline-flex;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
}
.agenda__seg {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.agenda__seg:hover {
  color: var(--color-text);
}
.agenda__seg--active {
  background: var(--color-surface);
  color: var(--color-text);
  box-shadow: var(--shadow-card);
}
.agenda__nav {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}
.agenda__nav--wrap {
  flex-wrap: wrap;
  gap: 0.5rem;
}
.agenda__range {
  margin: 0 0 0 0.4rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}
.agenda__icon-btn,
.agenda__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s;
}
.agenda__icon-btn {
  width: 34px;
  height: 34px;
}
.agenda__btn {
  padding: 0.45rem 0.8rem;
}
.agenda__icon-btn:hover,
.agenda__btn:not(:disabled):hover {
  background: var(--color-surface-muted);
}
.agenda__btn:disabled {
  opacity: 0.5;
  cursor: default;
}
.agenda__icon-btn:focus-visible,
.agenda__btn:focus-visible,
.agenda__seg:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
.agenda__right {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-left: auto;
}
.agenda__field {
  display: flex;
  align-items: center;
  gap: 0.35rem;
}
.agenda__field-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--color-text-muted);
}
.agenda__input {
  padding: 0.4rem 0.6rem;
  font: inherit;
  font-size: 0.85rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}
.agenda__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.agenda__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.agenda__range-error {
  margin: 0.6rem 0 0;
  font-size: 0.82rem;
  color: var(--color-warning);
}
.agenda__refreshing {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
.agenda__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: agenda-spin 0.6s linear infinite;
}
.agenda__spinner--big {
  width: 22px;
  height: 22px;
  color: var(--color-text-muted);
}
.agenda__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 3rem 1rem;
  text-align: center;
}
.agenda__state-text {
  margin: 0;
  font-size: 0.92rem;
  color: var(--color-text-muted);
}
.agenda__warning {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding: 0.6rem 0.8rem;
  font-size: 0.85rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
}
.agenda__warning-action {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-danger);
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.agenda__warning-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
@keyframes agenda-spin {
  to {
    transform: rotate(360deg);
  }
}
.agenda__input--select {
  max-width: 100%;
}
@media (max-width: 720px) {
  .agenda__right {
    margin-left: 0;
    width: 100%;
    justify-content: space-between;
  }
  .agenda__field--inline {
    flex: 1;
    min-width: 0;
  }
  .agenda__input--select {
    width: 100%;
  }
  .agenda__range {
    font-size: 0.9rem;
  }
}
</style>
