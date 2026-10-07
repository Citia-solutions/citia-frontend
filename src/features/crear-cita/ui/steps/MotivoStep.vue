<script setup lang="ts">
// Sección 4: Motivo. Descripción de la consulta + consentimiento de contacto.
// El motivo avisa al salir del campo (blur); el consentimiento al marcarse.
import BaseCheckbox from '@/shared/ui/BaseCheckbox.vue'
import { computed } from 'vue'
import { useErroresVisibles } from '../../model/useErroresVisibles'
import { LIMITES, type FlujoCitaErrors, type FlujoCitaForm } from '../../model/flujoCitaModel'

const props = defineProps<{
  form: FlujoCitaForm
  errors: FlujoCitaErrors
}>()

const { marcarTocado, errorDe } = useErroresVisibles('motivo', props.form)

const errorMotivo = errorDe('motivo')
const errorConsentimiento = errorDe('consentimiento')

// El límite es intencional (ADR-09 §10): una caja grande invita a escribir una
// historia clínica completa. El contador lo hace visible antes de chocar con él.
const caracteresMotivo = computed(() => props.form.motivo.length)
</script>

<template>
  <div class="step">
    <div class="step__field">
      <label class="step__label" for="flujo-motivo">
        Motivo de la consulta:<span class="step__required" aria-hidden="true">*</span>
      </label>
      <textarea
        id="flujo-motivo"
        v-model="form.motivo"
        class="step__input step__input--textarea"
        :class="{ 'step__input--error': errorMotivo }"
        placeholder="Describe brevemente el motivo…"
        rows="4"
        :maxlength="LIMITES.motivo"
        aria-describedby="flujo-motivo-contador"
        :aria-invalid="errorMotivo ? 'true' : 'false'"
        @blur="marcarTocado('motivo')"
      />
      <span id="flujo-motivo-contador" class="step__counter">
        {{ caracteresMotivo }}/{{ LIMITES.motivo }}
      </span>
      <span v-if="errorMotivo" class="step__error" role="alert">{{ errorMotivo }}</span>
      <span v-else-if="errors.motivo" class="step__error">{{ errors.motivo }}</span>
    </div>

    <div class="step__consent">
      <BaseCheckbox
        v-model="form.consentimiento"
        label="Autorizo que me contacten para confirmar y recordar mi cita."
        @change="marcarTocado('consentimiento')"
      />
      <span v-if="errorConsentimiento" class="step__error" role="alert">{{ errorConsentimiento }}</span>
      <span v-else-if="errors.consentimiento" class="step__error">{{ errors.consentimiento }}</span>
    </div>
  </div>
</template>

<style scoped>
.step {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.step__field {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.step__label {
  font-size: 0.9rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.95);
}
.step__required {
  margin-left: 0.2rem;
  color: #fecaca;
  font-weight: 700;
}
.step__input {
  padding: 0.8rem 0.95rem;
  font-size: 0.95rem;
  color: var(--color-text);
  background: #fff;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  transition: box-shadow 0.15s, border-color 0.15s;
  font-family: inherit;
}
.step__input::placeholder {
  color: #94a3b8;
}
.step__input:focus {
  outline: none;
  border-color: var(--color-primary-strong);
  box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.35);
}
.step__input--error {
  border-color: var(--color-danger);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.25);
}
.step__input--textarea {
  resize: vertical;
  min-height: 96px;
}
.step__counter {
  align-self: flex-end;
  font-size: 0.75rem;
  color: rgba(255, 255, 255, 0.75);
}
.step__consent {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
  align-items: flex-start;
}
.step__consent :deep(.check__label) {
  color: #fff;
}
.step__consent :deep(.check__box) {
  background: #fff;
}
.step__error {
  font-size: 0.8rem;
  color: #fecaca;
}
</style>
