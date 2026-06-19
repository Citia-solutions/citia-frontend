<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LoginForm, GoogleAuthButton } from '@/features/auth'
import AuthAside from './AuthAside.vue'

const router = useRouter()

function handleSuccess(): void {
  const redirect = router.currentRoute.value.query.redirect
  router.push(typeof redirect === 'string' ? redirect : { name: 'home' })
}
</script>

<template>
  <div class="login">
    <AuthAside class="login__aside" />

    <main class="login__panel">
      <div class="login__card">
        <header class="login__header">
          <h2 class="login__title">Inicia sesión</h2>
          <p class="login__subtitle">Accede al panel de tu centro clínico.</p>
        </header>

        <LoginForm @success="handleSuccess" />

        <div class="login__divider"><span>o continúa con</span></div>

        <GoogleAuthButton />

        <p class="login__demo">
          ¿Aún no tienes cuenta? <a href="#">Solicita una demo</a>
        </p>
      </div>
    </main>
  </div>
</template>

<style scoped>
.login {
  display: grid;
  grid-template-columns: 1fr 1fr;
  min-height: 100vh;
  background: var(--color-bg);
}
.login__aside {
  display: block;
}
.login__panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
.login__card {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.login__header {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}
.login__title {
  font-size: 1.9rem;
  font-weight: 700;
  margin: 0;
  color: var(--color-text);
}
.login__subtitle {
  margin: 0;
  color: var(--color-text-muted);
}
.login__divider {
  display: flex;
  align-items: center;
  gap: 1rem;
  color: var(--color-text-muted);
  font-size: 0.85rem;
}
.login__divider::before,
.login__divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--color-border);
}
.login__demo {
  text-align: center;
  font-size: 0.9rem;
  color: var(--color-text-muted);
  margin: 0;
}
.login__demo a {
  color: var(--color-primary);
  font-weight: 600;
  text-decoration: none;
}

@media (max-width: 860px) {
  .login {
    grid-template-columns: 1fr;
  }
  .login__aside {
    display: none;
  }
}
</style>
