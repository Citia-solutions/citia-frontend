<script setup lang="ts">
// Pestaña "Seguridad" de Mi Perfil (US-10): cambiar la contraseña. Al
// cambiarla, el backend cierra las demás sesiones abiertas con la cuenta; esta
// sigue con el token nuevo.
//
// El campo `username` oculto (el correo de la sesión) es para el gestor de
// contraseñas del navegador: así sabe de qué cuenta es la contraseña nueva.
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import { CONTRASENA_MIN_CARACTERES } from '../model/contrasenaSchema'
import { useCambiarContrasena } from '../model/useCambiarContrasena'

const { form, usuario, errores, isSubmitting, submitError, ok, marcarTocado, alEditar, cambiar } =
  useCambiarContrasena()
</script>

<template>
  <BaseCard>
    <template #header>
      <h2 class="contrasena__title">Cambiar contraseña</h2>
      <p class="contrasena__subtitle">
        Al cambiarla cerramos las demás sesiones abiertas con tu cuenta, en otros navegadores o
        equipos. Esta sesión sigue abierta.
      </p>
    </template>

    <form class="contrasena" novalidate @submit.prevent="cambiar">
      <input
        class="contrasena__usuario"
        type="email"
        name="username"
        autocomplete="username"
        :value="usuario"
        readonly
        tabindex="-1"
        aria-hidden="true"
      />

      <BaseInput
        v-model="form.actual"
        type="password"
        label="Contraseña actual"
        name="contrasenaActual"
        autocomplete="current-password"
        :error="errores.actual"
        :disabled="isSubmitting"
        aria-required="true"
        @input="alEditar('actual')"
        @blur="marcarTocado('actual')"
      />
      <BaseInput
        v-model="form.nueva"
        type="password"
        label="Nueva contraseña"
        name="contrasenaNueva"
        autocomplete="new-password"
        :hint="`Al menos ${CONTRASENA_MIN_CARACTERES} caracteres.`"
        :error="errores.nueva"
        :disabled="isSubmitting"
        aria-required="true"
        @input="alEditar('nueva')"
        @blur="marcarTocado('nueva')"
      />
      <BaseInput
        v-model="form.confirmacion"
        type="password"
        label="Repite la nueva contraseña"
        name="confirmacion"
        autocomplete="new-password"
        :error="errores.confirmacion"
        :disabled="isSubmitting"
        aria-required="true"
        @input="alEditar('confirmacion')"
        @blur="marcarTocado('confirmacion')"
      />

      <p v-if="ok" class="contrasena__alert contrasena__alert--success" role="status">{{ ok }}</p>
      <p v-if="submitError" class="contrasena__alert contrasena__alert--error" role="alert">
        {{ submitError }}
      </p>

      <div class="contrasena__actions">
        <BaseButton type="submit" :block="false" :loading="isSubmitting">
          Cambiar contraseña
        </BaseButton>
      </div>
    </form>
  </BaseCard>
</template>

<style scoped>
.contrasena__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}
.contrasena__subtitle {
  margin: 0.25rem 0 0;
  max-width: 64ch;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
.contrasena {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 420px;
}
/* Fuera de la vista pero presente en el formulario (no `display: none`): los
   gestores de contraseñas lo leen. */
.contrasena__usuario {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  border: 0;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
}
.contrasena__alert {
  margin: 0;
  padding: 0.6rem 0.8rem;
  font-size: 0.86rem;
  border-radius: var(--radius-md);
}
.contrasena__alert--success {
  color: var(--color-success);
  background: var(--color-success-soft);
}
.contrasena__alert--error {
  color: var(--color-danger);
  background: var(--color-danger-soft);
}
.contrasena__actions {
  display: flex;
  justify-content: flex-start;
}
@media (max-width: 560px) {
  .contrasena {
    max-width: none;
  }
  .contrasena__actions :deep(.btn) {
    flex: 1;
  }
}
</style>
