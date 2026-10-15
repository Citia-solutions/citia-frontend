<script setup lang="ts">
// Formulario "Pedir otra hora". El paciente PIDE, no reserva (ADR-09, B1): lo
// que escribe llega como solicitud a la bandeja del profesional, y su hora
// actual se mantiene hasta que el profesional la mueva (decisión R1). Por eso
// el copy nunca promete una hora nueva.
//
// La preferencia es texto libre (1..300), no un calendario: el sistema no
// conoce la disponibilidad del profesional y no puede ofrecerla.
import { computed, ref } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { errorMotivo, errorPreferencia, LIMITE_TEXTO } from '../model/formularios'
import { fechaEnFrase, horaDeInicio } from '../model/presentacion'
import type { VistaCitaPacienteDto } from '../model/types'

const props = defineProps<{
  cita: VistaCitaPacienteDto
  enviando: boolean
  error: string | null
}>()

const emit = defineEmits<{
  volver: []
  enviar: [datos: { preferencia: string; motivo: string }]
}>()

const preferencia = ref('')
const motivo = ref('')
/** La preferencia avisa su error al salir del campo o al intentar enviar, no mientras se escribe. */
const preferenciaTocada = ref(false)

const errorDePreferencia = computed(() => errorPreferencia(preferencia.value))
const errorDeMotivo = computed(() => errorMotivo(motivo.value))
const errorVisiblePreferencia = computed(() =>
  preferenciaTocada.value ? errorDePreferencia.value : null,
)

const cuando = computed(
  () => `${fechaEnFrase(props.cita.inicio)} a las ${horaDeInicio(props.cita.inicio)}`,
)

function enviar(): void {
  preferenciaTocada.value = true
  if (props.enviando || errorDePreferencia.value || errorDeMotivo.value) return
  emit('enviar', { preferencia: preferencia.value, motivo: motivo.value })
}
</script>

<template>
  <form class="paso" novalidate @submit.prevent="enviar">
    <h1 class="paso__titulo respuesta-foco" tabindex="-1">Pedir otra hora</h1>
    <p class="paso__texto">
      Tu hora actual es el <strong>{{ cuando }}</strong> y se mantiene hasta que el profesional se
      ponga en contacto contigo. Cuéntanos qué días y horarios te acomodan.
    </p>

    <div class="paso__campo">
      <label class="paso__label" for="otra-hora-preferencia">¿Qué días y horarios te acomodan?</label>
      <textarea
        id="otra-hora-preferencia"
        v-model="preferencia"
        class="paso__input"
        :class="{ 'paso__input--error': errorVisiblePreferencia }"
        rows="3"
        :maxlength="LIMITE_TEXTO"
        placeholder="Por ejemplo: martes o jueves después de las 17:00"
        required
        :aria-invalid="errorVisiblePreferencia ? 'true' : 'false'"
        aria-describedby="otra-hora-preferencia-contador"
        :disabled="enviando"
        @blur="preferenciaTocada = true"
      />
      <div class="paso__pie-campo">
        <span v-if="errorVisiblePreferencia" class="paso__error-campo" role="alert">
          {{ errorVisiblePreferencia }}
        </span>
        <span v-else />
        <span id="otra-hora-preferencia-contador" class="paso__contador">
          {{ preferencia.length }}/{{ LIMITE_TEXTO }}
        </span>
      </div>
    </div>

    <div class="paso__campo">
      <label class="paso__label" for="otra-hora-motivo">
        ¿Algo más que quieras contarle? <span class="paso__opcional">(opcional)</span>
      </label>
      <textarea
        id="otra-hora-motivo"
        v-model="motivo"
        class="paso__input"
        rows="2"
        :maxlength="LIMITE_TEXTO"
        :disabled="enviando"
      />
      <div class="paso__pie-campo">
        <span v-if="errorDeMotivo" class="paso__error-campo">{{ errorDeMotivo }}</span>
        <span v-else />
        <span class="paso__contador">{{ motivo.length }}/{{ LIMITE_TEXTO }}</span>
      </div>
    </div>

    <p class="paso__privacidad">
      Por tu privacidad, <strong>no escribas información médica</strong> (síntomas, diagnósticos ni
      medicamentos): basta con los días y horarios que te acomodan.
    </p>

    <p v-if="error" class="paso__error" role="alert">{{ error }}</p>

    <div class="paso__acciones">
      <BaseButton type="submit" :loading="enviando">Enviar pedido</BaseButton>
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
  min-height: 72px;
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
.paso__input--error {
  border-color: var(--color-danger);
}
.paso__pie-campo {
  display: flex;
  justify-content: space-between;
  gap: 0.75rem;
}
.paso__contador {
  flex-shrink: 0;
  font-size: 0.78rem;
  color: var(--color-text-muted);
}
.paso__error-campo {
  font-size: 0.82rem;
  color: var(--color-danger);
}
.paso__privacidad {
  margin: 0;
  padding: 0.65rem 0.85rem;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--color-text);
  background: var(--color-warning-soft);
  border-radius: var(--radius-md);
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
</style>
