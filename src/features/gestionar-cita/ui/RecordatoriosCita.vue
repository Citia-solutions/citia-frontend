<script setup lang="ts">
// Sección "Recordatorios" del voucher (US-03): estado de cada correo
// automático de la cita, con el motivo en lenguaje humano cuando no salió.
//
// Presentacional: el estado (lista, carga, reintentos) lo maneja el voucher con
// `useRecordatoriosCita`. Aquí solo se decide qué decir en cada caso, sobre
// todo con la lista vacía, que justo después de crear o reagendar es normal
// por unos segundos (el backend los programa de forma asíncrona).
import { computed, ref } from 'vue'
import {
  RecordatorioEstadoBadge,
  describirAntelacion,
  lineaDeTiempo,
  textoMotivo,
  type MotivoRecordatorio,
  type Recordatorio,
} from '@/entities/recordatorio'

const props = defineProps<{
  recordatorios: Recordatorio[]
  loading: boolean
  loaded: boolean
  error: string | null
  /** Reintentos en curso: el backend todavía está programando o reprogramando. */
  esperando: boolean
  /** La cita debería tener recordatorios (vigente y con más de 30 min por delante). */
  esperables: boolean
  /** Se puede abrir la edición de contacto (el detalle del paciente ya llegó). */
  puedeEditarContacto: boolean
  /** El paciente HOY no tiene correo (según el detalle). */
  pacienteSinCorreo: boolean
}>()

const emit = defineEmits<{
  actualizar: []
  editarContacto: []
}>()

/** Los reemplazados al reagendar o al cambiar la configuración: se pliegan para no ensuciar la lista. */
function esReemplazado(r: Recordatorio): boolean {
  return r.estado === 'cancelado' && r.motivo === 'reprogramado'
}

const principales = computed(() => props.recordatorios.filter((r) => !esReemplazado(r)))
const reemplazados = computed(() => props.recordatorios.filter(esReemplazado))
const verReemplazados = ref(false)

/** Motivos que suelen arreglarse corrigiendo un correo mal escrito. */
const MOTIVOS_CORREO_MALO: ReadonlySet<MotivoRecordatorio> = new Set([
  'correo_invalido',
  'rebote',
  'correo_suprimido',
])

/**
 * Qué arreglo sugerir, o null. Un recordatorio `omitido`/`fallido` es final:
 * no se reenvía al corregir el correo, pero los que aún no salen sí lo usan.
 *
 * - `agregar`: el paciente no tiene correo y eso afecta (ya omitió alguno o hay
 *   pendientes que se van a omitir). Desaparece en cuanto se agrega.
 * - `revisar`: alguno falló por un correo inválido o que rebota.
 */
const arreglo = computed<'agregar' | 'revisar' | null>(() => {
  if (!props.puedeEditarContacto) return null
  if (props.pacienteSinCorreo) {
    const afecta = principales.value.some(
      (r) => r.motivo === 'sin_correo' || r.estado === 'programado',
    )
    return afecta ? 'agregar' : null
  }
  const correoMalo = principales.value.some(
    (r) => r.motivo !== null && MOTIVOS_CORREO_MALO.has(r.motivo),
  )
  return correoMalo ? 'revisar' : null
})

function momento(r: Recordatorio): string {
  return `${describirAntelacion(r.antelacionMin)} antes`
}
</script>

<template>
  <section class="recs" aria-labelledby="voucher-recordatorios">
    <div class="recs__head">
      <h3 id="voucher-recordatorios" class="recs__title">Recordatorios por correo</h3>
      <span v-if="esperando" class="recs__status" role="status">
        <span class="recs__spinner" aria-hidden="true" />
        {{ recordatorios.length > 0 ? 'Actualizando…' : 'Programando…' }}
      </span>
      <button
        v-else-if="loaded"
        type="button"
        class="recs__link"
        :disabled="loading"
        @click="emit('actualizar')"
      >
        Actualizar
      </button>
    </div>

    <!-- Primera carga -->
    <div v-if="!loaded && loading" class="recs__skeleton" aria-busy="true" aria-label="Cargando recordatorios">
      <span class="recs__skel recs__skel--wide" />
      <span class="recs__skel" />
    </div>

    <p v-else-if="error && !loaded" class="recs__muted" role="alert">
      {{ error }}
      <button type="button" class="recs__link" @click="emit('actualizar')">Reintentar</button>
    </p>

    <template v-else-if="loaded">
      <p v-if="error" class="recs__warning" role="alert">
        {{ error }} Mostramos la última versión cargada.
        <button type="button" class="recs__link" :disabled="loading" @click="emit('actualizar')">
          Reintentar
        </button>
      </p>

      <!-- Lista vacía: normal unos segundos después de crear o mover la cita -->
      <template v-if="recordatorios.length === 0">
        <p v-if="esperando" class="recs__muted">
          Estamos programando los recordatorios de esta cita; aparecen en unos segundos.
        </p>
        <p v-else-if="esperables" class="recs__muted">
          Esta cita aún no tiene recordatorios. Si la acabas de crear o mover, pulsa
          «Actualizar» en unos segundos; si no, revisa que estén activados en
          <RouterLink :to="{ name: 'recordatorios' }" class="recs__inline-link">Recordatorios</RouterLink>.
        </p>
        <p v-else class="recs__muted">Esta cita no tiene recordatorios.</p>
      </template>

      <template v-else>
        <ul v-if="principales.length > 0" class="recs__list">
          <li v-for="r in principales" :key="r.id" class="rec">
            <span class="rec__momento">{{ momento(r) }}</span>
            <RecordatorioEstadoBadge :estado="r.estado" />
            <span class="rec__tiempo">{{ lineaDeTiempo(r) }}</span>
            <span v-if="r.motivo" class="rec__motivo">{{ textoMotivo(r.motivo) }}</span>
          </li>
        </ul>
        <p v-else-if="!esperando" class="recs__muted">
          Los recordatorios anteriores se reemplazaron y la hora actual de la cita no tiene
          recordatorios.
        </p>

        <div v-if="arreglo" class="recs__fix">
          <span>
            {{
              arreglo === 'agregar'
                ? 'El paciente no tiene correo: agrégalo para que reciba los próximos recordatorios.'
                : 'Hubo un problema con el correo del paciente. Revisa que esté bien escrito.'
            }}
          </span>
          <button type="button" class="recs__link" @click="emit('editarContacto')">
            {{ arreglo === 'agregar' ? 'Agregar correo' : 'Revisar correo' }}
          </button>
        </div>

        <button
          v-if="reemplazados.length > 0"
          type="button"
          class="recs__toggle"
          :aria-expanded="verReemplazados"
          aria-controls="recs-reemplazados"
          @click="verReemplazados = !verReemplazados"
        >
          {{ verReemplazados ? 'Ocultar' : 'Ver' }} reemplazados ({{ reemplazados.length }})
        </button>
        <ul v-if="verReemplazados" id="recs-reemplazados" class="recs__list recs__list--old">
          <li v-for="r in reemplazados" :key="r.id" class="rec">
            <span class="rec__momento">{{ momento(r) }}</span>
            <RecordatorioEstadoBadge :estado="r.estado" />
            <span class="rec__tiempo">{{ lineaDeTiempo(r) }}</span>
            <span class="rec__motivo">{{ textoMotivo(r.motivo) }}</span>
          </li>
        </ul>
      </template>
    </template>
  </section>
</template>

<style scoped>
.recs {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.recs__head {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
}
.recs__title {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.recs__status {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
.recs__spinner {
  width: 11px;
  height: 11px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: recs-spin 0.6s linear infinite;
}
.recs__link {
  border: none;
  background: transparent;
  padding: 0;
  color: var(--color-primary);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  flex-shrink: 0;
}
.recs__link:hover:not(:disabled) {
  text-decoration: underline;
}
.recs__link:disabled {
  opacity: 0.6;
  cursor: default;
}
.recs__inline-link {
  color: var(--color-primary);
  font-weight: 600;
}
.recs__muted {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}
.recs__warning {
  margin: 0;
  padding: 0.5rem 0.7rem;
  font-size: 0.82rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
}
.recs__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.recs__list--old {
  opacity: 0.8;
}
.rec {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 0.2rem 0.75rem;
  padding: 0.55rem 0.75rem;
}
.rec + .rec {
  border-top: 1px solid var(--color-border);
}
.rec__momento {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--color-text);
}
.rec__tiempo,
.rec__motivo {
  grid-column: 1 / -1;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.rec__motivo {
  color: var(--color-text);
}
.recs__fix {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.55rem 0.75rem;
  font-size: 0.82rem;
  color: var(--color-text);
  background: var(--color-warning-soft);
  border-radius: var(--radius-md);
}
.recs__toggle {
  align-self: flex-start;
  border: none;
  background: transparent;
  padding: 0;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
}
.recs__toggle:hover {
  color: var(--color-text);
  text-decoration: underline;
}
.recs__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.recs__skel {
  display: block;
  width: 40%;
  height: 0.85rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  animation: recs-pulse 1.2s ease-in-out infinite;
}
.recs__skel--wide {
  width: 65%;
}
@keyframes recs-spin {
  to {
    transform: rotate(360deg);
  }
}
@keyframes recs-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
</style>
