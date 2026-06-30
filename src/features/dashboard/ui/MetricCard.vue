<script setup lang="ts">
// Tarjeta de métrica individual del dashboard.
import BaseCard from '@/shared/ui/BaseCard.vue'
import type { Metric } from '../model/types'

defineProps<{ metric: Metric }>()
</script>

<template>
  <BaseCard>
    <div class="metric">
      <div class="metric__top">
        <span class="metric__label">{{ metric.label }}</span>
        <span class="metric__icon" :class="`metric__icon--${metric.trendTone ?? 'neutral'}`">
          <!-- Flecha de tendencia o ícono de advertencia -->
          <svg
            v-if="metric.trend"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <template v-if="metric.trend === 'up'">
              <path d="M5 12l7-7 7 7" />
              <path d="M12 5v14" />
            </template>
            <template v-else>
              <path d="M19 12l-7 7-7-7" />
              <path d="M12 19V5" />
            </template>
          </svg>
          <svg
            v-else-if="metric.trendTone === 'warning'"
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z" />
            <path d="M12 9v4M12 17h0" />
          </svg>
        </span>
      </div>
      <p class="metric__value">{{ metric.value }}</p>
      <p class="metric__caption" :class="`metric__caption--${metric.trendTone ?? 'neutral'}`">
        <svg
          v-if="metric.trend"
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          aria-hidden="true"
        >
          <template v-if="metric.trend === 'up'">
            <path d="M5 12l7-7 7 7" />
            <path d="M12 5v14" />
          </template>
          <template v-else>
            <path d="M19 12l-7 7-7-7" />
            <path d="M12 19V5" />
          </template>
        </svg>
        {{ metric.caption }}
      </p>
    </div>
  </BaseCard>
</template>

<style scoped>
.metric {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.metric__top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.5rem;
}
.metric__label {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
.metric__icon {
  display: flex;
  color: var(--color-text-muted);
}
.metric__icon--positive {
  color: var(--color-success);
}
.metric__icon--warning {
  color: var(--color-warning);
}
.metric__value {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-text);
}
.metric__caption {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
.metric__caption--positive {
  color: var(--color-success);
}
.metric__caption--warning {
  color: var(--color-warning);
}
</style>
