<script setup lang="ts">
// Página "No encontrada": la muestra la ruta comodín del router para cualquier
// URL que no exista (antes quedaba una página en blanco). Es pública y sin
// layout, como el login: ofrece volver al Resumen si hay sesión o ir a iniciar
// sesión si no. La sesión ya la restauró el guard antes de llegar aquí.
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useSessionStore } from '@/entities/session'

const route = useRoute()
const session = useSessionStore()

const destino = computed(() =>
  session.isAuthenticated
    ? { to: { name: 'home' }, texto: 'Volver al inicio' }
    : { to: { name: 'login' }, texto: 'Ir a iniciar sesión' },
)
</script>

<template>
  <main class="no-encontrada">
    <div class="no-encontrada__card">
      <p class="no-encontrada__codigo" aria-hidden="true">404</p>
      <h1 class="no-encontrada__titulo">Página no encontrada</h1>
      <p class="no-encontrada__texto">
        La dirección <code class="no-encontrada__ruta">{{ route.path }}</code> no existe en Citia.
        Revisa que esté bien escrita o vuelve a empezar.
      </p>
      <RouterLink :to="destino.to" class="no-encontrada__accion">{{ destino.texto }}</RouterLink>
    </div>
  </main>
</template>

<style scoped>
.no-encontrada {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem 1rem;
  background: var(--color-bg);
}
.no-encontrada__card {
  width: 100%;
  max-width: 440px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 2rem;
  background: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
}
.no-encontrada__codigo {
  margin: 0;
  font-size: 0.85rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-primary);
}
.no-encontrada__titulo {
  margin: 0;
  font-size: 1.6rem;
  font-weight: 700;
  color: var(--color-text);
}
.no-encontrada__texto {
  margin: 0;
  line-height: 1.5;
  color: var(--color-text-muted);
}
.no-encontrada__ruta {
  padding: 0.05rem 0.35rem;
  font-size: 0.85em;
  color: var(--color-text);
  background: var(--color-surface-muted);
  border-radius: var(--radius-sm);
  word-break: break-all;
}
.no-encontrada__accion {
  margin-top: 0.5rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.8rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  color: #fff;
  text-decoration: none;
  background: var(--color-primary);
  border-radius: var(--radius-md);
  box-shadow: 0 6px 16px var(--color-primary-soft);
  transition: background 0.15s;
}
.no-encontrada__accion:hover {
  background: var(--color-primary-strong);
}
.no-encontrada__accion:focus-visible {
  outline: 2px solid var(--color-primary-strong);
  outline-offset: 2px;
}
</style>
