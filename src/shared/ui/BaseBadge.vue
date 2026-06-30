<script setup lang="ts">
// Pill de estado genérico. El color se deriva de la variante via clases CSS.
withDefaults(
  defineProps<{
    variant?: 'success' | 'warning' | 'info' | 'danger' | 'neutral'
  }>(),
  { variant: 'neutral' },
)
</script>

<template>
  <span class="badge" :class="`badge--${variant}`">
    <slot />
  </span>
</template>

<style scoped>
.badge {
  display: inline-flex;
  align-items: center;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-full);
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.2;
  white-space: nowrap;
}
.badge--success {
  color: var(--color-success);
  background: var(--color-success-soft);
}
.badge--warning {
  color: var(--color-warning);
  background: var(--color-warning-soft);
}
.badge--info {
  color: var(--color-info);
  background: var(--color-info-soft);
}
.badge--danger {
  color: var(--color-danger);
  background: var(--color-danger-soft);
}
.badge--neutral {
  color: var(--color-text-muted);
  background: var(--color-surface-muted);
}
</style>
