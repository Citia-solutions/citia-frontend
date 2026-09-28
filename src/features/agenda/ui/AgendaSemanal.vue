<script setup lang="ts">
// Grilla semanal: 7 columnas (lunes a domingo) y una fila por hora. Cada cita
// es un bloque posicionado por su `hora` y su duración; las que se cruzan se
// ponen lado a lado (ADR-11 las permite). Clic en un bloque → `select`.
//
// Sin librería de calendario: una grilla CSS y posiciones calculadas en
// `model/agenda.ts`. Las citas se asignan al día por su `fecha` del backend.
import { computed } from 'vue'
import {
  isPastAppointment,
  isTerminalStatus,
  STATUS_BADGE_VARIANT,
  STATUS_LABEL,
  type AgendaAppointment,
} from '@/entities/appointment'
import {
  agruparPorFecha,
  distribuirEnCarriles,
  encabezadoDia,
  rangoDeHoras,
  type BloqueAgenda,
} from '../model/agenda'

const props = defineProps<{
  /** Los 7 días 'YYYY-MM-DD' de la semana. */
  dias: string[]
  appointments: AgendaAppointment[]
  /** 'YYYY-MM-DD' de hoy, para resaltar la columna. */
  hoy: string
  /** Referencia para "cita pasada" (momento de la última carga). */
  loadedAt: Date
}>()

const emit = defineEmits<{ select: [appointment: AgendaAppointment] }>()

/** Alto de una hora en px. Coincide con `--agenda-hora` del CSS. */
const PX_POR_HORA = 56
/** Alto mínimo de un bloque para que se lea la hora y el nombre. */
const ALTO_MINIMO = 22

const columnas = computed(() => {
  const grupos = agruparPorFecha(props.appointments)
  return props.dias.map((fecha) => ({
    fecha,
    ...encabezadoDia(fecha),
    esHoy: fecha === props.hoy,
    bloques: distribuirEnCarriles(grupos.get(fecha) ?? []),
  }))
})

const horas = computed(() => rangoDeHoras(columnas.value.flatMap((c) => c.bloques)))

const etiquetasHora = computed(() => {
  const lista: string[] = []
  for (let h = horas.value.desde; h < horas.value.hasta; h += 1) {
    lista.push(`${String(h).padStart(2, '0')}:00`)
  }
  return lista
})

const altoGrilla = computed(() => (horas.value.hasta - horas.value.desde) * PX_POR_HORA)

function estiloBloque(b: BloqueAgenda): Record<string, string> {
  const top = ((b.inicioMin - horas.value.desde * 60) / 60) * PX_POR_HORA
  const alto = Math.max(((b.finMin - b.inicioMin) / 60) * PX_POR_HORA, ALTO_MINIMO)
  const ancho = 100 / b.carriles
  return {
    top: `${top}px`,
    height: `${alto - 2}px`,
    left: `calc(${ancho * b.carril}% + 2px)`,
    width: `calc(${ancho}% - 4px)`,
  }
}

function clasesBloque(b: BloqueAgenda): Record<string, boolean> {
  const cancelada = b.cita.status === 'cancelada'
  return {
    [`agenda-sem__block--${STATUS_BADGE_VARIANT[b.cita.status]}`]: true,
    'agenda-sem__block--cancelled': cancelada,
    'agenda-sem__block--muted':
      !cancelada && (isTerminalStatus(b.cita.status) || isPastAppointment(b.cita, props.loadedAt)),
    'agenda-sem__block--compact': (b.finMin - b.inicioMin) / 60 * PX_POR_HORA < 40,
  }
}

function etiquetaBloque(b: BloqueAgenda): string {
  const c = b.cita
  return `Ver cita de ${c.patientName}, ${c.time}, ${c.type}, ${c.durationMin} min, ${STATUS_LABEL[c.status]}`
}

const totalSemana = computed(() => columnas.value.reduce((n, c) => n + c.bloques.length, 0))
</script>

<template>
  <div class="agenda-sem">
    <div class="agenda-sem__scroll">
      <div class="agenda-sem__grid">
        <!-- Encabezados -->
        <div class="agenda-sem__corner" aria-hidden="true" />
        <div
          v-for="col in columnas"
          :key="`h-${col.fecha}`"
          class="agenda-sem__day-head"
          :class="{ 'agenda-sem__day-head--today': col.esHoy }"
        >
          <span class="agenda-sem__day-name">{{ col.nombre }}</span>
          <span class="agenda-sem__day-num">{{ col.numero }}</span>
        </div>

        <!-- Columna de horas -->
        <div class="agenda-sem__hours" :style="{ height: `${altoGrilla}px` }" aria-hidden="true">
          <span v-for="(h, i) in etiquetasHora" :key="h" class="agenda-sem__hour" :style="{ top: `${i * PX_POR_HORA}px` }">
            {{ h }}
          </span>
        </div>

        <!-- Días -->
        <div
          v-for="col in columnas"
          :key="`d-${col.fecha}`"
          class="agenda-sem__day"
          :class="{ 'agenda-sem__day--today': col.esHoy }"
          :style="{ height: `${altoGrilla}px` }"
        >
          <span
            v-for="(h, i) in etiquetasHora"
            :key="h"
            class="agenda-sem__line"
            :style="{ top: `${i * PX_POR_HORA}px` }"
            aria-hidden="true"
          />
          <button
            v-for="b in col.bloques"
            :key="b.cita.id"
            type="button"
            class="agenda-sem__block"
            :class="clasesBloque(b)"
            :style="estiloBloque(b)"
            :title="`${b.cita.time} · ${b.cita.patientName} · ${b.cita.type} (${b.cita.durationMin} min)`"
            :aria-label="etiquetaBloque(b)"
            @click="emit('select', b.cita)"
          >
            <span class="agenda-sem__block-time">{{ b.cita.time }}</span>
            <span class="agenda-sem__block-name">{{ b.cita.patientName }}</span>
            <span class="agenda-sem__block-type">{{ b.cita.type }}</span>
          </button>
        </div>
      </div>
    </div>

    <p v-if="totalSemana === 0" class="agenda-sem__empty">No hay citas en esta semana.</p>
  </div>
</template>

<style scoped>
.agenda-sem {
  position: relative;
}
.agenda-sem__scroll {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}
.agenda-sem__grid {
  display: grid;
  grid-template-columns: 52px repeat(7, minmax(104px, 1fr));
  min-width: 780px;
}
.agenda-sem__corner {
  border-bottom: 1px solid var(--color-border);
}
.agenda-sem__day-head {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.1rem;
  padding: 0.35rem 0 0.5rem;
  border-bottom: 1px solid var(--color-border);
  color: var(--color-text-muted);
}
.agenda-sem__day-name {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: capitalize;
}
.agenda-sem__day-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: var(--radius-full);
  font-size: 0.95rem;
  font-weight: 700;
  color: var(--color-text);
}
.agenda-sem__day-head--today .agenda-sem__day-name {
  color: var(--color-primary);
}
.agenda-sem__day-head--today .agenda-sem__day-num {
  background: var(--color-primary);
  color: #fff;
}
.agenda-sem__hours {
  position: relative;
}
.agenda-sem__hour {
  position: absolute;
  right: 0.5rem;
  transform: translateY(-50%);
  font-size: 0.7rem;
  color: var(--color-text-muted);
  white-space: nowrap;
}
.agenda-sem__hour:first-child {
  transform: none;
}
.agenda-sem__day {
  position: relative;
  border-left: 1px solid var(--color-border);
}
.agenda-sem__day--today {
  background: var(--color-info-soft);
}
.agenda-sem__line {
  position: absolute;
  left: 0;
  right: 0;
  border-top: 1px solid var(--color-surface-muted);
}
.agenda-sem__block {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.05rem;
  padding: 0.2rem 0.35rem;
  overflow: hidden;
  border: none;
  border-left: 3px solid var(--block-accent);
  border-radius: var(--radius-sm);
  background: var(--block-bg);
  color: var(--color-text);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transition: filter 0.15s, box-shadow 0.15s;
  z-index: 1;
}
.agenda-sem__block:hover {
  filter: brightness(0.96);
  box-shadow: 0 2px 6px rgba(15, 23, 42, 0.12);
  z-index: 2;
}
.agenda-sem__block:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
  z-index: 3;
}
.agenda-sem__block--success {
  --block-accent: var(--color-success);
  --block-bg: #e8f6ed;
}
.agenda-sem__block--warning {
  --block-accent: var(--color-warning);
  --block-bg: #fdf1e2;
}
.agenda-sem__block--info {
  --block-accent: var(--color-info);
  --block-bg: #e6eefd;
}
.agenda-sem__block--danger {
  --block-accent: var(--color-danger);
  --block-bg: #fce9e9;
}
.agenda-sem__block--neutral {
  --block-accent: var(--color-text-muted);
  --block-bg: var(--color-surface-muted);
}
.agenda-sem__block--muted {
  opacity: 0.6;
}
.agenda-sem__block--cancelled {
  opacity: 0.55;
}
.agenda-sem__block--cancelled .agenda-sem__block-time,
.agenda-sem__block--cancelled .agenda-sem__block-name {
  text-decoration: line-through;
}
.agenda-sem__block-time {
  font-size: 0.7rem;
  font-weight: 700;
}
.agenda-sem__block-name {
  max-width: 100%;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.agenda-sem__block-type {
  max-width: 100%;
  font-size: 0.7rem;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
/* Bloque corto: hora y nombre en una línea, sin tipo. */
.agenda-sem__block--compact {
  flex-direction: row;
  align-items: center;
  gap: 0.3rem;
  padding-top: 0;
  padding-bottom: 0;
}
.agenda-sem__block--compact .agenda-sem__block-type {
  display: none;
}
.agenda-sem__empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  margin: 0;
  padding: 0.6rem 1rem;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-card);
  pointer-events: none;
}
</style>
