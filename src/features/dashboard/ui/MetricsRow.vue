<script setup lang="ts">
// Fila de 4 métricas. Carga sus datos del API mock al montar.
import { onMounted, ref } from 'vue'
import MetricCard from './MetricCard.vue'
import { getMetrics } from '../api/dashboardApi'
import type { Metric } from '../model/types'

const metrics = ref<Metric[]>([])

onMounted(async () => {
  metrics.value = await getMetrics()
})
</script>

<template>
  <div class="metrics-row">
    <MetricCard v-for="metric in metrics" :key="metric.id" :metric="metric" />
  </div>
</template>

<style scoped>
.metrics-row {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}
@media (max-width: 1024px) {
  .metrics-row {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 560px) {
  .metrics-row {
    grid-template-columns: 1fr;
  }
}
</style>
