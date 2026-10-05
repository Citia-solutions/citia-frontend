<script setup lang="ts">
import { useRouter } from 'vue-router'
import { LoginForm } from '@/features/auth'
import AuthAside from './AuthAside.vue'

const router = useRouter()

/**
 * A dónde volver tras iniciar sesión: `?redirect=` lo ponen el guard (ruta
 * protegida sin sesión) y el cierre por 401 (token vencido). Solo se aceptan
 * rutas internas de la app; cualquier otra cosa (`//otro-sitio`, una URL
 * absoluta, el propio login) cae al Resumen.
 */
function destinoTrasLogin(): string | { name: 'home' } {
  const redirect = router.currentRoute.value.query.redirect
  if (typeof redirect !== 'string' || !/^\/(?![/\\])/.test(redirect)) return { name: 'home' }

  const destino = router.resolve(redirect)
  if (destino.matched.length === 0 || destino.name === 'login') return { name: 'home' }
  return destino.fullPath
}

function handleSuccess(): void {
  router.push(destinoTrasLogin())
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

@media (max-width: 860px) {
  .login {
    grid-template-columns: 1fr;
  }
  /* En escritorio el aside conserva su propio `display: flex` (no se pisa aquí). */
  .login__aside {
    display: none;
  }
}
</style>
