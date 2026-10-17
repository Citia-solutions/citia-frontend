<script setup lang="ts">
// Paso de confirmación de "Cancelar mi hora", con motivo opcional. Cancelar es
// terminal: tras el éxito el enlace ya no sirve (un GET posterior es 404), así
// que se avisa antes. No se promete ningún aviso al profesional: lo verá en su
// agenda ("Cancelada por el paciente").
import { computed, ref } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { errorMotivo, LIMITE_TEXTO } from '../model/formularios'
import { fechaEnFrase, horaDeInicio } from '../model/presentacion'
import type { VistaCitaPacienteDto } from '../model/types'

const props = defineProps<{
  cita: VistaCitaPacienteDto
  enviando: boolean
  error: string | null
}>()

const emit = defineEmits<{
  volver: []
  enviar: [motivo: string]
}>()

const motivo = ref('')
const errorValidacion = computed(() => errorMotivo(motivo.value))

const cuando = computed(
  () => `${fechaEnFrase(props.cita.inicio)} a las ${horaDeInicio(props.cita.inicio)}`,
)

function enviar(): void {
  if (props.enviando || errorValidacion.value) return
  emit('enviar', motivo.value)
}
</script>

<template>
  <form class="paso" novalidate @submit.prevent="enviar">
    <h1 class="paso__titulo respuesta-foco" tabindex="-1">¿Cancelar tu hora?</h1>
    <p class="paso__texto">
      Tu hora del <strong>{{ cuando }}</strong> con {{ cita.profesional }}.
    </p>
    <p class="paso__texto">
      Tu hora quedará libre y este enlace ya no servirá para hacer cambios. Esta acción no se puede
      deshacer.
    </p>

    <div class="paso__campo">
      <label class="paso__label" for="cancelar-hora-motivo">
        ¿Quieres contarnos por qué? <span class="paso__opcional">(opcional)</span>
      </label>
      <textarea
        id="cancelar-hora-motivo"
        v-model="motivo"
        class="paso__input"
        rows="3"
        :maxlength="LIMITE_TEXTO"
        aria-describedby="cancelar-hora-ayuda"
        :disabled="enviando"
      />
      <div class="paso__pie-campo">
        <span id="cancelar-hora-ayuda" class="paso__ayuda">No escribas información médica.</span>
        <span class="paso__contador">{{ motivo.length }}/{{ LIMITE_TEXTO }}</span>
      </div>
      <span v-if="errorValidacion" class="paso__error-campo">{{ errorValidacion }}</span>
    </div>

    <p v-if="error" class="paso__error" role="alert">{{ error }}</p>

    <div class="paso__acciones">
      <BaseButton
        type="submit"
        variant="outline"
        class="paso__peligro"
        :loading="enviando"
        :disabled="errorValidacion !== null"
      >
        Sí, cancelar mi hora
      </BaseButton>
      <BaseButton type="button" variant="outline" :disabled="enviando" @click="emit('volver')">
        Volver
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
.paso {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.paso__titulo {
  margin: 0;
  font-size: 1.35rem;
  font-weight: 700;
  color: var(--color-text);
}
.paso__titulo:focus {
  outline: none;
}
.paso__texto {
  margin: -0.4rem 0 0;
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--color-text-muted);
}
.paso__texto strong {
  color: var(--color-text);
}
.paso__campo {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.paso__label {
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text);
}
.paso__opcional {
  font-weight: 400;
  color: var(--color-text-muted);
}
.paso__input {
  width: 100%;
  min-height: 84px;
  padding: 0.75rem 0.85rem;
  /* 16px: con menos, Safari de iOS hace zoom al enfocar. */
  font-size: 1rem;
  font-family: inherit;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  resize: vertical;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.paso__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.paso__pie-campo {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}
.paso__ayuda,
.paso__contador {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}
.paso__contador {
  flex-shrink: 0;
}
.paso__error-campo {
  font-size: 0.82rem;
  color: var(--color-danger);
}
.paso__error {
  margin: 0;
  padding: 0.6rem 0.8rem;
  font-size: 0.9rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
}
.paso__acciones {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
/* Tono destructivo sobre BaseButton outline (más especificidad que .btn--outline). */
.paso .paso__peligro {
  color: var(--color-danger);
  border-color: var(--color-danger);
}
.paso .paso__peligro:not(:disabled):hover {
  background: var(--color-danger-soft);
}
</style>
