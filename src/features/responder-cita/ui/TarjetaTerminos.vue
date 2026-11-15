<script setup lang="ts">
// Tarjeta «Tus datos y Citia» de `/cita` (US-11, D4 de ADR-16). Presentacional:
// la muestra `ResumenHora` solo con `terminosPendientes === true`, sobre las
// acciones, y el envío lo hace `useRespuestaCita`.
//
// **No bloquea:** las acciones sobre la hora funcionan igual sin aceptar (el
// texto lo dice). «Acepto» se envía solo con un clic, nunca al cargar. No hay
// «No acepto»: el retiro es escribirle al profesional.
//
// El enlace a `/terminos` abre en OTRA pestaña: el token de esta página vive
// solo en memoria, y salir de ella en la misma pestaña la deja sin enlace.
import { computed } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { RUTA_TERMINOS } from '@/shared/config/terminosPaciente'

const props = defineProps<{
  /** Nombre del profesional, de la vista. */
  profesional: string
  /** Nombre de la organización, de la vista. */
  organizacion: string
  /** Se está enviando «Acepto». */
  aceptando: boolean
  /** Hay otro envío en curso (una acción sobre la hora): «Acepto» espera. */
  ocupado: boolean
  /** Fallo del último «Acepto» (429, red, 400, 5xx), o null. */
  error: string | null
}>()

const emit = defineEmits<{ aceptar: [] }>()

function normalizar(texto: string): string {
  return texto.trim().replace(/\s+/g, ' ').toLocaleLowerCase('es-CL')
}

/**
 * Quién usa Citia, con la puntuación del texto: «{profesional}, de
 * {organizacion},», o solo «{profesional}» si los dos nombres son el mismo (una
 * profesional independiente cuya organización lleva su nombre). Se comparan sin
 * mayúsculas ni espacios de más.
 */
const quien = computed(() =>
  normalizar(props.profesional) === normalizar(props.organizacion)
    ? props.profesional
    : `${props.profesional}, de ${props.organizacion},`,
)
</script>

<template>
  <section class="terminos" aria-labelledby="tarjeta-terminos-titulo">
    <h2 id="tarjeta-terminos-titulo" class="terminos__titulo">Tus datos y Citia</h2>
    <p class="terminos__texto">
      {{ quien }} usa Citia para agendar tus horas y enviarte recordatorios por correo. Lee los
      <a class="terminos__enlace" :href="RUTA_TERMINOS" target="_blank" rel="noopener noreferrer"
        >Términos de uso y el aviso de privacidad</a
      >. Al presionar «Acepto» autorizas a {{ profesional }}, y a Citia como su proveedor, a usar
      tus datos, incluido el motivo de tu consulta, para gestionar tus horas y enviarte
      recordatorios por correo.
    </p>
    <p class="terminos__texto terminos__texto--nota">
      Puedes confirmar, cancelar o pedir otra hora aunque no aceptes ahora. Si no estás de acuerdo,
      escríbele a tu profesional.
    </p>

    <p v-if="error" class="terminos__error" role="alert">{{ error }}</p>

    <BaseButton
      class="terminos__boton"
      :block="false"
      :loading="aceptando"
      :disabled="aceptando || ocupado"
      @click="emit('aceptar')"
    >
      Acepto
    </BaseButton>
  </section>
</template>

<style scoped>
.terminos {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
  padding: 0.9rem 1rem 1rem;
  color: var(--color-text);
  background: var(--color-info-soft);
  border-left: 3px solid var(--color-info);
  border-radius: var(--radius-md);
}
.terminos__titulo {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}
.terminos__texto {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
  overflow-wrap: anywhere;
}
.terminos__texto--nota {
  color: var(--color-text-muted);
}
.terminos__enlace {
  color: var(--color-primary);
  font-weight: 600;
}
.terminos__enlace:focus-visible {
  outline: 2px solid var(--color-primary-strong);
  outline-offset: 2px;
  border-radius: 2px;
}
.terminos__error {
  align-self: stretch;
  margin: 0;
  padding: 0.6rem 0.8rem;
  font-size: 0.9rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
}
.terminos__boton {
  margin-top: 0.15rem;
  min-width: 8rem;
}
</style>
