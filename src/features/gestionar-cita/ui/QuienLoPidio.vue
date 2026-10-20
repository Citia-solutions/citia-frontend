<script setup lang="ts">
// Pregunta "¿Quién lo pidió?" de las vistas Cancelar y Reagendar del voucher
// (US-07.01, decisión H3). Dos opciones: el paciente (p. ej. llamó para pedir
// el cambio) o el profesional. La respuesta queda en la bitácora de la cita
// (`pedidoPor`) para la calificación de asistencia: lo que decide el
// profesional no cuenta en contra del paciente.
//
// Es obligatoria y NINGUNA opción viene marcada al abrir: un valor por defecto
// terminaría guardado sin que nadie lo eligiera. La validación vive en el caso
// de uso (`useCancelarCita` / `useReagendarCita`); aquí solo se muestra el aviso.
//
// Radios nativos con el aspecto de los chips de la pantalla Recordatorios.
import { useId } from 'vue'
import type { PedidoPor } from '../model/types'

const modelo = defineModel<PedidoPor | null>({ required: true })

defineProps<{
  disabled?: boolean
  /** Aviso mientras no hay respuesta (p. ej. "Indica quién pidió el cambio."), o null. */
  aviso?: string | null
}>()

const OPCIONES: readonly { valor: PedidoPor; etiqueta: string }[] = [
  { valor: 'paciente', etiqueta: 'El paciente' },
  { valor: 'profesional', etiqueta: 'Decisión mía' },
]

// Un nombre de grupo por instancia: los radios de otra vista no se mezclan.
const id = useId()
</script>

<template>
  <fieldset class="pedido" :aria-describedby="aviso ? `${id}-aviso` : undefined">
    <legend class="pedido__legend">¿Quién lo pidió?</legend>
    <div class="pedido__opciones">
      <label
        v-for="opcion in OPCIONES"
        :key="opcion.valor"
        class="chip"
        :class="{ 'chip--on': modelo === opcion.valor, 'chip--disabled': disabled }"
      >
        <input
          v-model="modelo"
          type="radio"
          class="chip__input"
          :name="id"
          :value="opcion.valor"
          :disabled="disabled"
        />
        <span class="chip__dot" aria-hidden="true" />
        <span>{{ opcion.etiqueta }}</span>
      </label>
    </div>
    <p v-if="aviso" :id="`${id}-aviso`" class="pedido__aviso">{{ aviso }}</p>
  </fieldset>
</template>

<style scoped>
.pedido {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  margin: 0;
  padding: 0;
  border: none;
  min-width: 0;
}
.pedido__legend {
  padding: 0;
  margin-bottom: 0.4rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}
.pedido__opciones {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
.pedido__aviso {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-warning);
}
/* Mismo aspecto que los chips de `ConfiguracionRecordatorios.vue`, con un punto de radio. */
.chip {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-full);
  background: var(--color-surface);
  color: var(--color-text);
  font-size: 0.88rem;
  font-weight: 600;
  cursor: pointer;
  user-select: none;
  transition: background 0.15s, border-color 0.15s, color 0.15s;
}
.chip:hover {
  border-color: var(--color-primary);
}
.chip--on {
  background: var(--color-primary-soft);
  border-color: var(--color-primary);
  color: var(--color-primary-strong);
}
.chip--disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.chip--disabled:hover {
  border-color: var(--color-border);
}
.chip--on.chip--disabled:hover {
  border-color: var(--color-primary);
}
.chip__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.chip__dot {
  position: relative;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  border-radius: 50%;
  background: var(--color-surface);
}
.chip--on .chip__dot {
  border-color: var(--color-primary);
}
.chip--on .chip__dot::after {
  content: '';
  position: absolute;
  inset: 3px;
  border-radius: 50%;
  background: var(--color-primary);
}
.chip__input:focus-visible + .chip__dot {
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
</style>
