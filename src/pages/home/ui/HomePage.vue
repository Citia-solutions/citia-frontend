<script setup lang="ts">
// Placeholder del panel tras iniciar sesión. Se reemplazará cuando definamos
// el alcance de la app (citas, agenda, etc.).
import { useRouter } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import BaseButton from '@/shared/ui/BaseButton.vue'

const session = useSessionStore()
const router = useRouter()

function logout(): void {
  session.clearSession()
  router.push({ name: 'login' })
}
</script>

<template>
  <main class="home">
    <h1 class="home__title">Sesión iniciada ✅</h1>
    <p class="home__text">
      Bienvenido{{ session.currentUser ? `, ${session.currentUser.name}` : '' }}. Aquí irá el
      panel del centro clínico.
    </p>
    <BaseButton variant="outline" :block="false" @click="logout">Cerrar sesión</BaseButton>
  </main>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 1rem;
  max-width: 540px;
  margin: 0 auto;
  padding: 4rem 2rem;
}
.home__title {
  margin: 0;
  font-size: 1.8rem;
  color: var(--color-text);
}
.home__text {
  margin: 0;
  color: var(--color-text-muted);
}
</style>
