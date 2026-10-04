<script setup lang="ts">
// Vista "Contacto" del voucher: completar o corregir el teléfono y el correo
// del paciente (`PATCH /pacientes/:id`). Mismo patrón que Reagendar/Cancelar:
// reemplaza el cuerpo del voucher, no abre otro modal.
//
// Existe sobre todo para los pacientes antiguos sin correo: sus recordatorios
// terminan `omitido` (`sin_correo`) y este es el único lugar donde arreglarlo.
import { onMounted, ref, watch } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import type { AppointmentPatient } from '@/entities/appointment'
import { CORREO_MAX, useEditarContacto } from '../model/useEditarContacto'
import type { ResultadoContacto } from '../model/types'

const props = defineProps<{ patient: AppointmentPatient }>()

const emit = defineEmits<{
  back: []
  /** Mientras se envía, el voucher no se puede cerrar. */
  submitting: [value: boolean]
  result: [resultado: ResultadoContacto]
}>()

const {
  form,
  errores,
  hayCambios,
  puedeGuardar,
  isSubmitting,
  submitError,
  limpiarErrorServidor,
  submit,
} = useEditarContacto(props.patient)

// `sync`: la vista se desmonta apenas llega el resultado (ver ReagendarCitaForm).
watch(isSubmitting, (v) => emit('submitting', v), { flush: 'sync' })

const correoInput = ref<HTMLInputElement | null>(null)
const telefonoInput = ref<HTMLInputElement | null>(null)
// Sin correo, lo primero que hay que llenar es el correo.
onMounted(() => (props.patient.email ? telefonoInput.value : correoInput.value)?.focus())

async function handleSubmit(): Promise<void> {
  const resultado = await submit()
  // Éxito o 404 (el paciente ya no está): los atiende el voucher. Los demás
  // fallos (400, 401, red) se muestran aquí, conservando lo escrito.
  if (resultado && (resultado.ok || resultado.status === 404)) emit('result', resultado)
}
</script>

<template>
  <form class="accion" novalidate @submit.prevent="handleSubmit">
    <h3 class="accion__title">Contacto de {{ patient.name }}</h3>
    <p class="accion__ref">Se actualiza en la ficha del paciente: vale para todas sus citas.</p>

    <div class="accion__field">
      <label class="accion__label" for="contacto-correo">Correo electrónico</label>
      <input
        id="contacto-correo"
        ref="correoInput"
        v-model="form.correo"
        class="accion__input"
        :class="{ 'accion__input--error': errores.correo }"
        type="email"
        inputmode="email"
        autocomplete="off"
        :maxlength="CORREO_MAX"
        placeholder="paciente@correo.cl"
        :disabled="isSubmitting"
        :aria-invalid="errores.correo ? 'true' : 'false'"
        aria-describedby="contacto-correo-ayuda"
        @input="limpiarErrorServidor('correo')"
      />
      <span v-if="errores.correo" id="contacto-correo-ayuda" class="accion__field-error">
        {{ errores.correo }}
      </span>
      <span v-else id="contacto-correo-ayuda" class="accion__hint">
        Ahí le llegan los recordatorios de sus citas.
      </span>
    </div>

    <div class="accion__field">
      <label class="accion__label" for="contacto-telefono">Teléfono</label>
      <input
        id="contacto-telefono"
        ref="telefonoInput"
        v-model="form.telefono"
        class="accion__input"
        :class="{ 'accion__input--error': errores.telefono }"
        type="tel"
        autocomplete="off"
        placeholder="+56 9 1234 5678"
        :disabled="isSubmitting"
        :aria-invalid="errores.telefono ? 'true' : 'false'"
        @input="limpiarErrorServidor('telefono')"
      />
      <span v-if="errores.telefono" class="accion__field-error">{{ errores.telefono }}</span>
    </div>

    <div class="accion__notice" role="note">
      <p class="accion__notice-text">
        Los recordatorios pendientes saldrán al correo nuevo. Los que ya se enviaron o no se
        enviaron por falta de correo no se reenvían.
      </p>
    </div>

    <p v-if="submitError" class="accion__error" role="alert">{{ submitError }}</p>

    <div class="accion__actions">
      <BaseButton type="button" variant="outline" :block="false" :disabled="isSubmitting" @click="emit('back')">
        Volver
      </BaseButton>
      <BaseButton
        type="submit"
        :block="false"
        :loading="isSubmitting"
        :disabled="!puedeGuardar"
        :title="hayCambios ? undefined : 'No hay cambios que guardar'"
      >
        Guardar contacto
      </BaseButton>
    </div>
  </form>
</template>

<style scoped>
.accion {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.accion__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}
.accion__ref {
  margin: -0.6rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
.accion__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.accion__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}
.accion__input {
  padding: 0.7rem 0.85rem;
  font-size: 0.95rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.accion__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.accion__input--error {
  border-color: var(--color-danger);
}
.accion__hint {
  font-size: 0.75rem;
  color: var(--color-text-muted);
}
.accion__field-error {
  font-size: 0.8rem;
  color: var(--color-danger);
}
.accion__notice {
  padding: 0.6rem 0.8rem;
  background: var(--color-info-soft);
  border-radius: var(--radius-md);
}
.accion__notice-text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text);
}
.accion__error {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.8rem;
}
.accion__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
}
</style>
