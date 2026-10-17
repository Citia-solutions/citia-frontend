<script setup lang="ts">
// Resumen de la hora del paciente y sus acciones. Presentacional: los botones
// salen de `accionesPermitidas` (los decide el backend) y solo emiten; el envío
// y los errores los maneja `useRespuestaCita`.
//
// Muestra lo mínimo (decisión S2): fecha, hora, duración, estado, profesional y
// organización. Nunca el nombre del paciente ni el tipo de consulta.
import { computed } from 'vue'
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { ESTADO_PACIENTE, fechaDeLaHora, rangoDeLaHora, sinPuntoFinal } from '../model/presentacion'
import type { AvisoRespuesta } from '../model/useRespuestaCita'
import type { AccionPaciente, VistaCitaPacienteDto } from '../model/types'

const props = defineProps<{
  cita: VistaCitaPacienteDto
  aviso: AvisoRespuesta | null
  enviando: AccionPaciente | null
  errorAccion: string | null
}>()

const emit = defineEmits<{
  confirmar: []
  cancelar: []
  otraHora: []
}>()

const estado = computed(() => ESTADO_PACIENTE[props.cita.estado])
const fecha = computed(() => fechaDeLaHora(props.cita.inicio))
const horario = computed(() => rangoDeLaHora(props.cita.inicio, props.cita.duracionMin))

function puede(accion: AccionPaciente): boolean {
  return props.cita.accionesPermitidas.includes(accion)
}

const hayAcciones = computed(() => props.cita.accionesPermitidas.length > 0)

/** La hora sigue en pie (`pendiente` / `confirmada`). */
const vigente = computed(() => props.cita.estado === 'pendiente' || props.cita.estado === 'confirmada')

/**
 * Lo que el paciente pidió, si tiene una solicitud de otra hora abierta. Solo
 * con la hora vigente: tras cancelar, la respuesta puede traer todavía la
 * solicitud (el backend la descarta aparte) y decir "te contactará" sería falso.
 */
const preferenciaPedida = computed(() => {
  const solicitud = props.cita.solicitudOtraHora
  return solicitud && vigente.value ? sinPuntoFinal(solicitud.preferencia) : null
})

/** Una línea que orienta según lo que se puede hacer. Solo presentación. */
const guia = computed<string | null>(() => {
  if (preferenciaPedida.value) return null // ya lo explica el bloque de otra hora
  if (puede('confirmar')) return '¿Vienes a tu hora? Confírmala para que tu profesional lo sepa.'
  if (props.cita.estado === 'confirmada' && hayAcciones.value) {
    return 'Si ya no puedes venir, cancela tu hora o pide otra.'
  }
  return null
})
</script>

<template>
  <div class="resumen">
    <div class="resumen__cabecera">
      <p class="resumen__kicker">Tu hora</p>
      <BaseBadge :variant="estado.variante">{{ estado.texto }}</BaseBadge>
    </div>

    <h1 class="resumen__titulo respuesta-foco" tabindex="-1">{{ fecha }}</h1>
    <p class="resumen__horario">
      {{ horario }} · {{ cita.duracionMin }} min
      <span class="resumen__zona">(hora de Chile)</span>
    </p>

    <ul class="resumen__datos">
      <li class="resumen__dato">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="12" cy="8" r="4" />
          <path d="M4 21a8 8 0 0 1 16 0" />
        </svg>
        <span><span class="sr-only">Profesional: </span>{{ cita.profesional }}</span>
      </li>
      <li class="resumen__dato">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M3 21h18M5 21V7l7-4 7 4v14" />
          <path d="M10 21v-5h4v5M12 8v4M10 10h4" />
        </svg>
        <span><span class="sr-only">Organización: </span>{{ cita.organizacion }}</span>
      </li>
    </ul>

    <div
      v-if="aviso"
      class="resumen__aviso"
      :class="aviso.tipo === 'exito' ? 'resumen__aviso--exito' : 'resumen__aviso--info'"
      role="status"
    >
      <p v-for="texto in aviso.textos" :key="texto" class="resumen__aviso-texto">{{ texto }}</p>
    </div>

    <div v-if="preferenciaPedida" class="resumen__otra-hora">
      <p class="resumen__otra-hora-texto">
        <strong>Pediste otra hora:</strong> {{ preferenciaPedida }}. El profesional se pondrá en
        contacto contigo.
      </p>
      <p class="resumen__otra-hora-nota">Mientras tanto, tu hora actual se mantiene.</p>
    </div>

    <p v-if="guia" class="resumen__guia">{{ guia }}</p>

    <p v-if="errorAccion" class="resumen__error" role="alert">{{ errorAccion }}</p>

    <div v-if="hayAcciones" class="resumen__acciones">
      <BaseButton
        v-if="puede('confirmar')"
        :loading="enviando === 'confirmar'"
        :disabled="enviando !== null"
        @click="emit('confirmar')"
      >
        Confirmar mi hora
      </BaseButton>
      <BaseButton
        v-if="puede('pedirOtraHora')"
        variant="outline"
        :disabled="enviando !== null"
        @click="emit('otraHora')"
      >
        Pedir otra hora
      </BaseButton>
      <BaseButton
        v-if="puede('cancelar')"
        variant="outline"
        class="resumen__peligro"
        :disabled="enviando !== null"
        @click="emit('cancelar')"
      >
        Cancelar mi hora
      </BaseButton>
    </div>
  </div>
</template>

<style scoped>
.resumen {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.resumen__cabecera {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.resumen__kicker {
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-primary);
}
.resumen__titulo {
  margin: -0.5rem 0 0;
  font-size: 1.45rem;
  font-weight: 700;
  line-height: 1.2;
  color: var(--color-text);
}
.resumen__titulo:focus {
  outline: none;
}
.resumen__horario {
  margin: -0.6rem 0 0;
  font-size: 1.05rem;
  font-weight: 600;
  color: var(--color-text);
}
.resumen__zona {
  font-size: 0.85rem;
  font-weight: 400;
  color: var(--color-text-muted);
}
.resumen__datos {
  list-style: none;
  margin: 0;
  padding: 0.85rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid var(--color-border);
}
.resumen__dato {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-size: 0.95rem;
  color: var(--color-text);
  overflow-wrap: anywhere;
}
.resumen__dato svg {
  flex-shrink: 0;
  margin-top: 0.1rem;
  color: var(--color-text-muted);
}
.resumen__aviso {
  padding: 0.7rem 0.85rem;
  font-size: 0.92rem;
  border-radius: var(--radius-md);
}
.resumen__aviso--exito {
  color: var(--color-success);
  background: var(--color-success-soft);
}
.resumen__aviso--info {
  color: var(--color-warning);
  background: var(--color-warning-soft);
}
.resumen__aviso-texto {
  margin: 0;
}
.resumen__aviso-texto + .resumen__aviso-texto {
  margin-top: 0.3rem;
  color: var(--color-text);
}
.resumen__otra-hora {
  padding: 0.7rem 0.85rem;
  font-size: 0.92rem;
  color: var(--color-text);
  background: var(--color-info-soft);
  border-left: 3px solid var(--color-info);
  border-radius: var(--radius-md);
}
.resumen__otra-hora-texto {
  margin: 0;
  overflow-wrap: anywhere;
}
.resumen__otra-hora-nota {
  margin: 0.3rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
.resumen__guia {
  margin: 0;
  font-size: 0.92rem;
  color: var(--color-text-muted);
}
.resumen__error {
  margin: 0;
  padding: 0.6rem 0.8rem;
  font-size: 0.9rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
}
.resumen__acciones {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
/* Tono destructivo sobre BaseButton outline (más especificidad que .btn--outline). */
.resumen .resumen__peligro {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.resumen .resumen__peligro:not(:disabled):hover {
  background: var(--color-danger-soft);
}
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}
@media (min-width: 640px) {
  .resumen__titulo {
    font-size: 1.65rem;
  }
}
</style>
