<script setup lang="ts">
import BaseInput from '@/shared/ui/BaseInput.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import BaseCheckbox from '@/shared/ui/BaseCheckbox.vue'
import { useLogin } from '../model/useLogin'

const emit = defineEmits<{ success: [] }>()

const { values, errors, submitError, isSubmitting, submit } = useLogin(() => emit('success'))
</script>

<template>
  <form class="login-form" novalidate @submit.prevent="submit">
    <BaseInput
      v-model="values.tenantSlug"
      label="Clínica"
      placeholder="mi-clinica"
      autocomplete="organization"
      :error="errors.tenantSlug"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 21h18" />
          <path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16" />
          <path d="M9 7h0M15 7h0M9 11h0M15 11h0M9 15h0M15 15h0" />
        </svg>
      </template>
    </BaseInput>

    <BaseInput
      v-model="values.email"
      label="Correo electrónico"
      type="email"
      placeholder="nombre@clinica.cl"
      autocomplete="email"
      :error="errors.email"
    >
      <template #icon>
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </svg>
      </template>
    </BaseInput>

    <div class="login-form__password">
      <div class="login-form__password-head">
        <span class="login-form__password-label">Contraseña</span>
        <a href="#" class="login-form__link">¿Olvidaste tu clave?</a>
      </div>
      <BaseInput
        v-model="values.password"
        type="password"
        placeholder="••••••••"
        autocomplete="current-password"
        :error="errors.password"
      >
        <template #icon>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="4" y="11" width="16" height="9" rx="2" />
            <path d="M8 11V8a4 4 0 0 1 8 0v3" />
          </svg>
        </template>
      </BaseInput>
    </div>

    <BaseCheckbox v-model="values.rememberMe" label="Mantener sesión iniciada" />

    <p v-if="submitError" class="login-form__error" role="alert">{{ submitError }}</p>

    <BaseButton type="submit" :loading="isSubmitting">Iniciar sesión</BaseButton>
  </form>
</template>

<style scoped>
.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}
.login-form__password {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.login-form__password-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.login-form__password-label {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-text);
}
.login-form__link {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-primary);
  text-decoration: none;
}
.login-form__link:hover {
  text-decoration: underline;
}
.login-form__error {
  font-size: 0.85rem;
  color: var(--color-danger);
  background: var(--color-danger-soft);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.8rem;
  margin: 0;
}
</style>
