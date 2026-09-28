<script setup lang="ts">
// Página "Solicitudes": la bandeja de las peticiones de hora que llegan por el
// enlace público, y el enlace mismo para compartirlo (con su advertencia de
// DT-18). La bandeja es autocontenida (lista + aceptar + rechazar); la página
// solo compone y resuelve la navegación a la agenda.
import { useRouter } from 'vue-router'
import { BandejaSolicitudes } from '@/features/bandeja-solicitudes'
import { CopiarEnlaceAgenda } from '@/features/compartir-enlace-agenda'

const router = useRouter()
</script>

<template>
  <main class="page">
    <header class="page__head">
      <h1 class="page__title">Solicitudes</h1>
      <p class="page__subtitle">
        Peticiones de hora que dejan los pacientes en tu enlace de agenda. Aceptar una la convierte
        en cita; la bandeja es de toda tu organización.
      </p>
    </header>

    <CopiarEnlaceAgenda />

    <BandejaSolicitudes @ver-agenda="router.push({ name: 'agenda' })" />
  </main>
</template>

<style scoped>
.page {
  flex: 1;
  min-width: 0;
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.page__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}
.page__subtitle {
  margin: 0.2rem 0 0;
  max-width: 60ch;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
@media (max-width: 560px) {
  .page {
    padding: 1.25rem 1rem;
  }
}
</style>
