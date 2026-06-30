<script setup lang="ts">
// Gráfico de barras CSS puro del ausentismo de las últimas 8 semanas.
import { onMounted, ref } from 'vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import { getWeeklyAbsenteeism } from '../api/dashboardApi'
import type { WeeklyBar } from '../model/types'

const bars = ref<WeeklyBar[]>([])

onMounted(async () => {
  bars.value = await getWeeklyAbsenteeism()
})
</script>

<template>
  <BaseCard>
    <template #header>
      <div class="weekly__head">
        <h2 class="weekly__title">Ausentismo por semana</h2>
        <p class="weekly__subtitle">Últimas 8 semanas</p>
      </div>
    </template>

    <div class="weekly__chart">
      <div v-for="bar in bars" :key="bar.label" class="weekly__col">
        <div class="weekly__track">
          <div
            class="weekly__bar"
            :class="{ 'weekly__bar--highlight': bar.highlight }"
            :style="{ height: `${bar.value}%` }"
          />
        </div>
        <span class="weekly__label">{{ bar.label }}</span>
      </div>
    </div>
  </BaseCard>
</template>

<style scoped>
.weekly__head {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.weekly__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}
.weekly__subtitle {
  margin: 0;
  font-size: 0.82rem;
  color: var(--color-text-muted);
}
.weekly__chart {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 0.5rem;
  height: 160px;
}
.weekly__col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
  height: 100%;
}
.weekly__track {
  display: flex;
  align-items: flex-end;
  width: 100%;
  height: 100%;
}
.weekly__bar {
  width: 100%;
  min-height: 4px;
  background: var(--color-primary-soft);
  border-radius: var(--radius-sm);
  transition: height 0.3s ease;
}
.weekly__bar--highlight {
  background: var(--color-primary);
}
.weekly__label {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
</style>
