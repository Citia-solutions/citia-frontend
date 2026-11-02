<script setup lang="ts">
// Pestaña "Información personal" de Mi Perfil (US-10): avatar, nombre y
// especialidad, más el correo, el rol y la organización en lectura. Solo se
// editan el nombre y la especialidad (`PATCH /usuarios/me`).
//
// Al montarse pide el perfil (`GET /usuarios/me`) y refresca la sesión (F5):
// el nombre del sidebar cambia sin recargar. El enlace de agenda de esta
// pestaña lo pone la página (`compartir-enlace-agenda`): un feature no importa
// de otro.
import { computed, onMounted } from 'vue'
import BaseAvatar from '@/shared/ui/BaseAvatar.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import { roleLabel, useSessionStore } from '@/entities/session'
import { ESPECIALIDAD_MAX, NOMBRE_MAX } from '../model/perfilSchema'
import { useEditarPerfil } from '../model/useEditarPerfil'

const session = useSessionStore()

const {
  perfil,
  form,
  loading,
  loadError,
  isSaving,
  saveError,
  saveOk,
  hayCambios,
  errores,
  marcarTocado,
  alEditar,
  cargar,
  descartar,
  guardar,
} = useEditarPerfil()

/** El rol sale de la sesión (traducido en el login), no del perfil. */
const rol = computed(() => (session.currentUser ? roleLabel(session.currentUser.role) : ''))

onMounted(() => void cargar())
</script>

<template>
  <BaseCard v-if="!perfil && !loadError" aria-busy="true" aria-label="Cargando tu perfil">
    <div class="perfil__skeleton">
      <span class="perfil__skel perfil__skel--avatar" />
      <span class="perfil__skel perfil__skel--wide" />
      <span class="perfil__skel" />
    </div>
  </BaseCard>

  <BaseCard v-else-if="!perfil">
    <div class="perfil__state" role="alert">
      <p class="perfil__state-text">{{ loadError }}</p>
      <button type="button" class="perfil__state-action" :disabled="loading" @click="cargar()">
        Reintentar
      </button>
    </div>
  </BaseCard>

  <form v-else class="perfil" novalidate @submit.prevent="guardar">
    <BaseCard>
      <div class="perfil__identidad">
        <BaseAvatar :name="perfil.nombreCompleto" :size="56" />
        <div class="perfil__identidad-text">
          <p class="perfil__nombre">{{ perfil.nombreCompleto }}</p>
          <p v-if="perfil.especialidad" class="perfil__especialidad">{{ perfil.especialidad }}</p>
        </div>
      </div>

      <dl class="perfil__datos">
        <div class="perfil__dato">
          <dt class="perfil__dato-label">Correo</dt>
          <dd class="perfil__dato-valor">
            <span class="perfil__correo">{{ perfil.email }}</span>
            <span class="perfil__dato-nota">
              Es tu usuario para iniciar sesión; por ahora no se puede cambiar.
            </span>
          </dd>
        </div>
        <div class="perfil__dato">
          <dt class="perfil__dato-label">Rol</dt>
          <dd class="perfil__dato-valor">{{ rol }}</dd>
        </div>
        <div class="perfil__dato">
          <dt class="perfil__dato-label">Organización</dt>
          <dd class="perfil__dato-valor">{{ perfil.tenantNombre }}</dd>
        </div>
      </dl>
    </BaseCard>

    <BaseCard>
      <template #header>
        <h2 class="perfil__title">Tus datos</h2>
        <p class="perfil__subtitle">Puedes cambiar tu nombre y tu especialidad.</p>
      </template>

      <div class="perfil__fields">
        <BaseInput
          v-model="form.nombreCompleto"
          label="Nombre"
          name="nombreCompleto"
          autocomplete="name"
          :maxlength="NOMBRE_MAX"
          :error="errores.nombreCompleto"
          :disabled="isSaving"
          aria-required="true"
          @input="alEditar('nombreCompleto')"
          @blur="marcarTocado('nombreCompleto')"
        />
        <BaseInput
          v-model="form.especialidad"
          label="Especialidad (opcional)"
          name="especialidad"
          autocomplete="off"
          placeholder="Ej: Kinesiología"
          hint="Solo se ve en tu perfil."
          :maxlength="ESPECIALIDAD_MAX"
          :error="errores.especialidad"
          :disabled="isSaving"
          @input="alEditar('especialidad')"
          @blur="marcarTocado('especialidad')"
        />
      </div>
    </BaseCard>

    <div class="perfil__footer">
      <p v-if="saveOk" class="perfil__alert perfil__alert--success" role="status">{{ saveOk }}</p>
      <p v-if="saveError" class="perfil__alert perfil__alert--error" role="alert">{{ saveError }}</p>

      <div class="perfil__actions">
        <span v-if="hayCambios" class="perfil__dirty">Tienes cambios sin guardar.</span>
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
.perfil {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.perfil__identidad {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  min-width: 0;
}
.perfil__identidad-text {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.perfil__nombre {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 700;
  color: var(--color-text);
  overflow-wrap: anywhere;
}
.perfil__especialidad {
  margin: 0.1rem 0 0;
  font-size: 0.88rem;
  color: var(--color-text-muted);
  overflow-wrap: anywhere;
}
.perfil__datos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
  margin: 1.25rem 0 0;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}
.perfil__dato {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.perfil__dato-label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.perfil__dato-valor {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin: 0;
  font-size: 0.92rem;
  font-weight: 600;
  color: var(--color-text);
  overflow-wrap: anywhere;
}
.perfil__dato-nota {
  font-size: 0.78rem;
  font-weight: 400;
  color: var(--color-text-muted);
}
.perfil__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}
.perfil__subtitle {
  margin: 0.25rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
.perfil__fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.perfil__footer {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.perfil__alert {
  margin: 0;
  padding: 0.6rem 0.8rem;
  font-size: 0.86rem;
  border-radius: var(--radius-md);
}
.perfil__alert--success {
  color: var(--color-success);
  background: var(--color-success-soft);
}
.perfil__alert--error {
  color: var(--color-danger);
  background: var(--color-danger-soft);
}
.perfil__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 0.7rem;
  flex-wrap: wrap;
}
.perfil__dirty {
  margin-right: auto;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}
.perfil__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1.5rem 1rem;
  text-align: center;
}
.perfil__state-text {
  margin: 0;
  font-size: 0.92rem;
  color: var(--color-text-muted);
}
.perfil__state-action {
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
.perfil__state-action:hover {
  background: var(--color-surface-muted);
}
.perfil__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.perfil__skel {
  display: block;
  width: 40%;
  height: 0.95rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  animation: perfil-pulse 1.2s ease-in-out infinite;
}
.perfil__skel--wide {
  width: 70%;
}
.perfil__skel--avatar {
  width: 56px;
  height: 56px;
  border-radius: var(--radius-full);
}
@keyframes perfil-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
@media (max-width: 720px) {
  .perfil__datos,
  .perfil__fields {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 640px) {
  .perfil__actions :deep(.btn) {
    flex: 1;
  }
  .perfil__dirty {
    flex-basis: 100%;
  }
}
</style>
