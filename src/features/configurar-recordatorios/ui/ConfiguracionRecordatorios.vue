<script setup lang="ts">
// Configuración de recordatorios del profesional (US-03): activar/desactivar,
// de 1 a 3 momentos de envío, y un teléfono y un correo de contacto opcionales
// que aparecen en el correo al paciente. Guarda con un PUT (reemplazo completo).
//
// Es la configuración del USUARIO logueado y se aplica a SUS citas (las del
// dueño de cada cita), también a las ya agendadas: el backend las reprograma
// en segundo plano tras guardar.
import { computed, onMounted } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import BaseSwitch from '@/shared/ui/BaseSwitch.vue'
import { describirAntelacion } from '@/entities/recordatorio'
import { HORAS_SIN_ENVIO, LIMITES_CONFIGURACION } from '../model/configuracionSchema'
import { useConfiguracionRecordatorios } from '../model/useConfiguracionRecordatorios'

const {
  form,
  guardada,
  predeterminada,
  loading,
  loadError,
  isSaving,
  saveError,
  saveOk,
  hayCambios,
  cambiaActivo,
  errores,
  opciones,
  lleno,
  seleccionada,
  alternarAntelacion,
  marcarTocado,
  alEditar,
  cargar,
  descartar,
  guardar,
} = useConfiguracionRecordatorios()

const { maxAntelaciones, telefonoMax, correoMax } = LIMITES_CONFIGURACION

const descripcionInterruptor = computed(() =>
  form.activo
    ? 'Tus pacientes reciben un correo antes de cada cita.'
    : 'Tus pacientes no reciben recordatorios de sus citas.',
)

const ayudaCorreo = computed(() =>
  form.correoRespuesta.trim()
    ? 'Si el paciente responde el recordatorio, su respuesta te llega a este correo.'
    : 'Si lo dejas vacío, el recordatorio dirá que ese correo no recibe respuestas.',
)

/** Resumen legible de lo elegido: '24 h y 2 h antes'. */
const resumenMomentos = computed(() => {
  const textos = form.antelacionesMin.map(describirAntelacion)
  if (textos.length === 0) return ''
  if (textos.length === 1) return `${textos[0]} antes`
  return `${textos.slice(0, -1).join(', ')} y ${textos[textos.length - 1]} antes`
})

// Salir con cambios sin guardar los perdería: se pregunta antes.
onBeforeRouteLeave(() => {
  if (!hayCambios.value || isSaving.value) return true
  return window.confirm('Tienes cambios sin guardar en tus recordatorios. ¿Salir sin guardarlos?')
})

onMounted(() => void cargar())
</script>

<template>
  <!-- Primera carga (también antes de montar: así no parpadea un formulario vacío) -->
  <BaseCard v-if="!guardada && !loadError" aria-busy="true" aria-label="Cargando configuración">
    <div class="config__skeleton">
      <span class="config__skel config__skel--wide" />
      <span class="config__skel" />
      <span class="config__skel config__skel--wide" />
    </div>
  </BaseCard>

  <BaseCard v-else-if="!guardada">
    <div class="config__state" role="alert">
      <p class="config__state-text">{{ loadError }}</p>
      <button type="button" class="config__state-action" :disabled="loading" @click="cargar()">
        Reintentar
      </button>
    </div>
  </BaseCard>

  <form v-else class="config" novalidate @submit.prevent="guardar">
    <p v-if="predeterminada" class="config__default" role="note">
      <strong>Estás usando la configuración predeterminada:</strong> recordatorios activos, 24 h y
      2 h antes de cada cita. Cámbiala y guarda para personalizarla.
    </p>

    <!-- Activar / desactivar -->
    <BaseCard>
      <BaseSwitch
        v-model="form.activo"
        label="Enviar recordatorios por correo"
        :description="descripcionInterruptor"
        @update:model-value="alEditar('activo')"
      />
      <p v-if="cambiaActivo" class="config__note" role="note">
        {{
          form.activo
            ? 'Al guardar, se programan los recordatorios de tus citas futuras.'
            : 'Al guardar, se anulan los recordatorios pendientes de tus próximas citas. Puedes volver a activarlos cuando quieras.'
        }}
      </p>
    </BaseCard>

    <!-- Momentos -->
    <BaseCard>
      <template #header>
        <h2 class="config__title">¿Cuándo se envían?</h2>
        <p class="config__subtitle">
          Elige de 1 a {{ maxAntelaciones }} momentos antes de la cita. Cada uno es un correo.
        </p>
      </template>

      <fieldset class="config__fieldset" aria-describedby="config-momentos-ayuda">
        <legend class="config__sr">Momentos de envío</legend>
        <div class="config__chips">
          <label
            v-for="min in opciones"
            :key="min"
            class="chip"
            :class="{
              'chip--on': seleccionada(min),
              'chip--off': !seleccionada(min) && lleno,
            }"
          >
            <input
              type="checkbox"
              class="chip__input"
              :checked="seleccionada(min)"
              :disabled="!seleccionada(min) && lleno"
              @change="alternarAntelacion(min)"
            />
            <span class="chip__check" aria-hidden="true" />
            <span class="chip__text">{{ describirAntelacion(min) }} antes</span>
          </label>
        </div>
      </fieldset>

      <p v-if="errores.antelacionesMin" id="config-momentos-ayuda" class="config__error-text" role="alert">
        {{ errores.antelacionesMin }}
      </p>
      <p v-else id="config-momentos-ayuda" class="config__hint">
        {{ form.antelacionesMin.length }} de {{ maxAntelaciones }} elegidos: {{ resumenMomentos }}.
        <template v-if="lleno">Para elegir otro, quita uno.</template>
      </p>

      <div class="config__quiet" role="note">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
        </svg>
        <p>
          <strong>No se envían correos entre las {{ HORAS_SIN_ENVIO.desde }} y las
          {{ HORAS_SIN_ENVIO.hasta }}</strong> (hora de la clínica). Si un recordatorio cae en ese
          horario, se adelanta para que salga antes de las {{ HORAS_SIN_ENVIO.desde }}: nunca llega
          más cerca de la cita de lo que elegiste.
        </p>
      </div>
    </BaseCard>

    <!-- Contacto -->
    <BaseCard>
      <template #header>
        <h2 class="config__title">Tu contacto en el correo</h2>
        <p class="config__subtitle">
          Opcional. Aparece en el recordatorio para que el paciente sepa cómo avisarte si no puede
          asistir.
        </p>
      </template>

      <div class="config__fields">
        <div class="config__field">
          <label class="config__label" for="config-telefono">Teléfono de contacto</label>
          <input
            id="config-telefono"
            v-model="form.telefonoContacto"
            class="config__input"
            :class="{ 'config__input--error': errores.telefonoContacto }"
            type="tel"
            autocomplete="tel"
            :maxlength="telefonoMax"
            placeholder="+56 9 1234 5678"
            :aria-invalid="errores.telefonoContacto ? 'true' : 'false'"
            aria-describedby="config-telefono-ayuda"
            @input="alEditar('telefonoContacto')"
            @blur="marcarTocado('telefonoContacto')"
          />
          <span v-if="errores.telefonoContacto" id="config-telefono-ayuda" class="config__error-text">
            {{ errores.telefonoContacto }}
          </span>
          <span v-else id="config-telefono-ayuda" class="config__hint">
            El paciente lo verá en el correo para llamarte si necesita cambiar su hora.
          </span>
        </div>

        <div class="config__field">
          <label class="config__label" for="config-correo">Correo para respuestas</label>
          <input
            id="config-correo"
            v-model="form.correoRespuesta"
            class="config__input"
            :class="{ 'config__input--error': errores.correoRespuesta }"
            type="email"
            inputmode="email"
            autocomplete="email"
            :maxlength="correoMax"
            placeholder="consulta@tuclinica.cl"
            :aria-invalid="errores.correoRespuesta ? 'true' : 'false'"
            aria-describedby="config-correo-ayuda"
            @input="alEditar('correoRespuesta')"
            @blur="marcarTocado('correoRespuesta')"
          />
          <span v-if="errores.correoRespuesta" id="config-correo-ayuda" class="config__error-text">
            {{ errores.correoRespuesta }}
          </span>
          <span v-else id="config-correo-ayuda" class="config__hint">{{ ayudaCorreo }}</span>
        </div>
      </div>

      <p class="config__privacy">
        El correo sale a nombre de Citia, con tu nombre y el de tu organización. No incluye el tipo
        de consulta ni datos del paciente.
      </p>
    </BaseCard>

    <!-- Guardar -->
    <div class="config__footer">
      <p v-if="saveOk" class="config__alert config__alert--success" role="status">{{ saveOk }}</p>
      <p v-if="saveError" class="config__alert config__alert--error" role="alert">{{ saveError }}</p>

      <div class="config__actions">
        <span v-if="hayCambios" class="config__dirty">Tienes cambios sin guardar.</span>
        <span v-else-if="!saveOk" class="config__dirty">
          Los cambios se aplican también a las citas que ya tienes agendadas.
        </span>
        <BaseButton
          type="button"
          variant="outline"
          :block="false"
          :disabled="!hayCambios || isSaving"
          @click="descartar"
        >
          Descartar cambios
        </BaseButton>
        <BaseButton type="submit" :block="false" :loading="isSaving" :disabled="!hayCambios">
          Guardar cambios
        </BaseButton>
      </div>
    </div>
  </form>
</template>

<style scoped>
.config {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 760px;
}
.config__default {
  margin: 0;
  padding: 0.7rem 0.9rem;
  font-size: 0.88rem;
  line-height: 1.45;
  color: var(--color-text);
  background: var(--color-info-soft);
  border: 1px solid var(--color-info-soft);
  border-radius: var(--radius-md);
}
.config__note {
  margin: 0.85rem 0 0;
  padding: 0.55rem 0.75rem;
  font-size: 0.84rem;
  color: var(--color-text);
  background: var(--color-warning-soft);
  border-radius: var(--radius-md);
}
.config__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}
.config__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
.config__fieldset {
  margin: 0;
  padding: 0;
  border: none;
  min-width: 0;
}
.config__sr {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.config__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}
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
.chip--off {
  opacity: 0.5;
  cursor: not-allowed;
}
.chip--off:hover {
  border-color: var(--color-border);
}
.chip__input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}
.chip__check {
  position: relative;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border: 1px solid var(--color-border);
  border-radius: 4px;
  background: var(--color-surface);
}
.chip--on .chip__check {
  background: var(--color-primary);
  border-color: var(--color-primary);
}
.chip--on .chip__check::after {
  content: '';
  position: absolute;
  left: 4px;
  top: 1px;
  width: 5px;
  height: 9px;
  border: solid #fff;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}
.chip__input:focus-visible + .chip__check {
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.config__hint {
  margin: 0.6rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.config__field .config__hint,
.config__field .config__error-text {
  margin: 0;
}
.config__error-text {
  margin: 0.6rem 0 0;
  font-size: 0.8rem;
  color: var(--color-danger);
}
.config__quiet {
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  margin-top: 1rem;
  padding: 0.65rem 0.8rem;
  font-size: 0.84rem;
  line-height: 1.45;
  color: var(--color-text);
  background: var(--color-surface-muted);
  border-radius: var(--radius-md);
}
.config__quiet svg {
  flex-shrink: 0;
  margin-top: 0.1rem;
  color: var(--color-text-muted);
}
.config__quiet p {
  margin: 0;
}
.config__fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.config__field {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.config__label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}
.config__input {
  padding: 0.7rem 0.85rem;
  font-size: 0.95rem;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  transition: border-color 0.15s, box-shadow 0.15s;
}
.config__input:focus {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-soft);
}
.config__input--error {
  border-color: var(--color-danger);
}
.config__privacy {
  margin: 1rem 0 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.config__footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.config__alert {
  margin: 0;
  padding: 0.6rem 0.8rem;
  font-size: 0.86rem;
  border-radius: var(--radius-md);
}
.config__alert--success {
  color: var(--color-success);
  background: var(--color-success-soft);
}
.config__alert--error {
  color: var(--color-danger);
  background: var(--color-danger-soft);
}
.config__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.7rem;
  flex-wrap: wrap;
}
.config__dirty {
  margin-right: auto;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}
.config__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  text-align: center;
}
.config__state-text {
  margin: 0;
  font-size: 0.92rem;
  color: var(--color-text-muted);
}
.config__state-action {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.config__state-action:hover {
  background: var(--color-surface-muted);
}
.config__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.config__skel {
  display: block;
  width: 40%;
  height: 0.95rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  animation: config-pulse 1.2s ease-in-out infinite;
}
.config__skel--wide {
  width: 70%;
}
@keyframes config-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
@media (max-width: 640px) {
  .config__fields {
    grid-template-columns: 1fr;
  }
  .config__actions :deep(.btn) {
    flex: 1;
  }
  .config__dirty {
    flex-basis: 100%;
  }
}
</style>
