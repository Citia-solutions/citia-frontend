<script setup lang="ts">
// "Citas por semana": las últimas 6 semanas lunes–domingo (la actual incluida),
// con agendadas y canceladas apiladas. Un solo pedido de 42 días
// (`useHistorialCitas` → `GET /citas?desde&hasta`). Gráfico en CSS puro, sin
// librerías: barras apiladas desde la base, cifra de agendadas sobre cada
// barra, detalle al pasar el mouse y una tabla oculta para lectores de pantalla.
import { computed } from 'vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import { fechaLocalISO } from '@/shared/lib/fecha'
import { citasPorSemana, plural, SEMANAS_HISTORIAL } from '../model/resumen'
import { useHistorialCitas } from '../model/useRangosCitas'

/** Alto del área de barras, en px. */
const ALTO_BARRAS = 120
/** Alto mínimo de un segmento con datos, para que un 1 no desaparezca. */
const ALTO_MINIMO = 4

const store = useHistorialCitas()

const semanas = computed(() =>
  store.desde ? citasPorSemana(store.appointments, store.desde, fechaLocalISO(new Date())) : [],
)

const maximo = computed(() => Math.max(1, ...semanas.value.map((s) => s.agendadas + s.canceladas)))
const sinCitas = computed(() => semanas.value.every((s) => s.agendadas + s.canceladas === 0))

/** Alto de un segmento. Se descuentan los 2 px de separación entre segmentos apilados. */
function alto(n: number): number {
  if (n === 0) return 0
  return Math.max(ALTO_MINIMO, Math.floor((n / maximo.value) * (ALTO_BARRAS - 2)))
}

function detalle(agendadas: number, canceladas: number): string {
  return `${plural(agendadas, 'agendada')} · ${plural(canceladas, 'cancelada')}`
}

const firstLoad = computed(() => store.loading && !store.loaded)
const refreshing = computed(() => store.loading && store.loaded)
</script>

<template>
  <BaseCard>
    <template #header>
      <div class="semanas__head">
        <div>
          <h2 class="semanas__title">
            Citas por semana
            <span v-if="refreshing" class="semanas__refreshing" role="status">
              <span class="semanas__spinner" aria-hidden="true" />
              Actualizando…
            </span>
          </h2>
          <p class="semanas__subtitle">Últimas {{ SEMANAS_HISTORIAL }} semanas</p>
        </div>
        <ul v-if="store.loaded && !sinCitas" class="semanas__legend" aria-hidden="true">
          <li><span class="semanas__swatch semanas__swatch--agendadas" />Agendadas</li>
          <li><span class="semanas__swatch semanas__swatch--canceladas" />Canceladas</li>
        </ul>
      </div>
    </template>

    <!-- Primera carga -->
    <div v-if="firstLoad" class="semanas__chart" aria-busy="true" aria-label="Cargando citas por semana">
      <div v-for="n in SEMANAS_HISTORIAL" :key="n" class="semanas__col">
        <div class="semanas__track" :style="{ height: `${ALTO_BARRAS}px` }">
          <span class="semanas__skel" :style="{ height: `${30 + ((n * 37) % 60)}px` }" />
        </div>
        <span class="semanas__label">&nbsp;</span>
      </div>
    </div>

    <!-- Error sin datos -->
    <div v-else-if="store.error && !store.loaded" class="semanas__state" role="alert">
      <p class="semanas__state-text">{{ store.error }}</p>
      <button type="button" class="semanas__state-action" @click="store.reload()">Reintentar</button>
    </div>

    <template v-else>
      <div v-if="store.error" class="semanas__warning" role="alert">
        <span>{{ store.error }}</span>
        <button type="button" class="semanas__warning-action" :disabled="store.loading" @click="store.reload()">
          Reintentar
        </button>
      </div>

      <p v-if="sinCitas" class="semanas__state-text semanas__empty">
        No hubo citas en las últimas {{ SEMANAS_HISTORIAL }} semanas.
      </p>

      <template v-else>
        <div class="semanas__chart" aria-hidden="true">
          <div
            v-for="s in semanas"
            :key="s.lunes"
            class="semanas__col"
            :class="{ 'semanas__col--actual': s.esActual }"
          >
            <span class="semanas__tooltip">
              <strong>{{ s.titulo }}</strong>
              {{ detalle(s.agendadas, s.canceladas) }}
            </span>
            <span class="semanas__value">{{ s.agendadas }}</span>
            <div class="semanas__track" :style="{ height: `${ALTO_BARRAS}px` }">
              <span
                v-if="s.canceladas > 0"
                class="semanas__seg semanas__seg--canceladas semanas__seg--top"
                :style="{ height: `${alto(s.canceladas)}px` }"
              />
              <span
                v-if="s.agendadas > 0"
                class="semanas__seg semanas__seg--agendadas"
                :class="{ 'semanas__seg--top': s.canceladas === 0 }"
                :style="{ height: `${alto(s.agendadas)}px` }"
              />
            </div>
            <span class="semanas__label">{{ s.etiqueta }}</span>
          </div>
        </div>

        <table class="semanas__sr">
          <caption>Citas por semana, últimas {{ SEMANAS_HISTORIAL }} semanas</caption>
          <thead>
            <tr>
              <th scope="col">Semana</th>
              <th scope="col">Agendadas</th>
              <th scope="col">Canceladas</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in semanas" :key="`t-${s.lunes}`">
              <th scope="row">{{ s.titulo }}</th>
              <td>{{ s.agendadas }}</td>
              <td>{{ s.canceladas }}</td>
            </tr>
          </tbody>
        </table>
      </template>
    </template>
  </BaseCard>
</template>

<style scoped>
.semanas__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  flex-wrap: wrap;
}
.semanas__title {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}
.semanas__subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}
.semanas__legend {
  display: flex;
  gap: 0.75rem;
  margin: 0;
  padding: 0;
  list-style: none;
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.semanas__legend li {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
}
.semanas__swatch {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}
.semanas__swatch--agendadas,
.semanas__seg--agendadas {
  background: var(--color-primary);
}
.semanas__swatch--canceladas,
.semanas__seg--canceladas {
  background: #94a3b8;
}
.semanas__chart {
  display: flex;
  align-items: flex-end;
  gap: 0.6rem;
  padding-top: 1.25rem;
}
.semanas__col {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  flex: 1;
  min-width: 0;
}
.semanas__value {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-text);
}
.semanas__track {
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  /* 2px de superficie entre segmentos apilados. */
  gap: 2px;
  width: 100%;
  max-width: 34px;
  border-bottom: 1px solid var(--color-border);
}
.semanas__seg {
  display: block;
  width: 100%;
  flex-shrink: 0;
}
/* Extremo de datos redondeado; la base queda recta, anclada al eje. */
.semanas__seg--top {
  border-radius: 4px 4px 0 0;
}
/* Alto fijo de dos líneas: "Esta semana" puede partirse sin levantar su barra. */
.semanas__label {
  max-width: 100%;
  min-height: 2.4em;
  font-size: 0.72rem;
  font-weight: 500;
  line-height: 1.2;
  text-align: center;
  color: var(--color-text-muted);
}
.semanas__col--actual .semanas__label {
  color: var(--color-primary);
  font-weight: 700;
}
.semanas__tooltip {
  position: absolute;
  bottom: calc(100% + 0.25rem);
  left: 50%;
  z-index: 2;
  display: none;
  flex-direction: column;
  gap: 0.1rem;
  min-width: max-content;
  padding: 0.4rem 0.6rem;
  transform: translateX(-50%);
  font-size: 0.75rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.12);
  pointer-events: none;
}
.semanas__col:hover .semanas__tooltip {
  display: flex;
}
.semanas__col:first-child .semanas__tooltip {
  left: 0;
  transform: none;
}
.semanas__col:last-child .semanas__tooltip {
  left: auto;
  right: 0;
  transform: none;
}
.semanas__col:hover .semanas__track {
  filter: brightness(0.92);
}
.semanas__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.semanas__skel {
  display: block;
  width: 100%;
  border-radius: 4px 4px 0 0;
  background: var(--color-surface-muted);
  animation: semanas-pulse 1.2s ease-in-out infinite;
}
.semanas__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  text-align: center;
}
.semanas__state-text {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-text-muted);
}
.semanas__empty {
  padding: 1.5rem 0.5rem;
  text-align: center;
}
.semanas__state-action {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.semanas__state-action:hover {
  background: var(--color-surface-muted);
}
.semanas__warning {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
  padding: 0.5rem 0.7rem;
  font-size: 0.8rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
}
.semanas__warning-action {
  flex-shrink: 0;
  border: none;
  background: transparent;
  color: var(--color-danger);
  font-size: 0.8rem;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
}
.semanas__warning-action:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.semanas__refreshing {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
.semanas__spinner {
  width: 12px;
  height: 12px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: semanas-spin 0.6s linear infinite;
}
@keyframes semanas-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
@keyframes semanas-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
