<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'outline'
    type?: 'button' | 'submit'
    loading?: boolean
    disabled?: boolean
    block?: boolean
  }>(),
  { variant: 'primary', type: 'button', loading: false, disabled: false, block: true },
)
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="btn"
    :class="[`btn--${variant}`, { 'btn--block': block }]"
  >
    <span v-if="loading" class="btn__spinner" aria-hidden="true" />
    <slot />
  </button>
</template>

<style scoped>
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.6rem;
  padding: 0.8rem 1.2rem;
  font-size: 0.95rem;
  font-weight: 600;
  border-radius: var(--radius-md);
  border: 1px solid transparent;
  cursor: pointer;
  transition: background 0.15s, border-color 0.15s, opacity 0.15s;
}
.btn--block {
  width: 100%;
}
.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.btn--primary {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 6px 16px var(--color-primary-soft);
}
.btn--primary:not(:disabled):hover {
  background: var(--color-primary-strong);
}
.btn--outline {
  background: var(--color-surface);
  color: var(--color-text);
  border-color: var(--color-border);
}
.btn--outline:not(:disabled):hover {
  background: var(--color-surface-muted);
}
.btn__spinner {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: btn-spin 0.6s linear infinite;
}
@keyframes btn-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
