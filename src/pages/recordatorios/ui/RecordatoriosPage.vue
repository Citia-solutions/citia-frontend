<script setup lang="ts">
// Página "Recordatorios" (US-03): la configuración de los correos automáticos
// que reciben los pacientes antes de cada cita. Solo compone el feature; el
// estado de los recordatorios de cada cita se ve en su voucher.
import { ConfiguracionRecordatorios } from '@/features/configurar-recordatorios'
</script>

<template>
  <main class="page">
    <header class="page__head">
      <h1 class="page__title">Recordatorios</h1>
      <p class="page__subtitle">
        Correos automáticos que reciben tus pacientes antes de cada una de tus citas. Para ver qué
        se envió en una cita concreta, ábrela desde la agenda.
      </p>
    </header>

    <ConfiguracionRecordatorios />
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
  max-width: 64ch;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
@media (max-width: 560px) {
  .page {
    padding: 1.25rem 1rem;
  }
}
</style>
