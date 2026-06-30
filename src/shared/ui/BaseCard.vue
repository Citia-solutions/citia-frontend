<script setup lang="ts">
// Contenedor genérico de panel blanco. Sin lógica de negocio.
// El slot `header` es opcional; el contenido principal va en el slot default.
</script>

<template>
  <section class="card">
    <header v-if="$slots.header" class="card__header">
      <slot name="header" />
    </header>
    <slot />
  </section>
</template>

<style scoped>
.card {
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: 1.25rem;
}
.card__header {
  margin-bottom: 1rem;
}
</style>
