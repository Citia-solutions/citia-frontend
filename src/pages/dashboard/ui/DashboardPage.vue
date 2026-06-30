<script setup lang="ts">
// Página raíz del dashboard "Resumen": sidebar fijo + contenido principal scrolleable.
import DashboardSidebar from './DashboardSidebar.vue'
import DashboardTopbar from './DashboardTopbar.vue'
import {
  MetricsRow,
  TodayAppointments,
  WeeklyAbsenteeism,
  EngineActivity,
} from '@/features/dashboard'
</script>

<template>
  <div class="dashboard">
    <DashboardSidebar />

    <main class="dashboard__main">
      <DashboardTopbar />

      <MetricsRow />

      <div class="dashboard__grid">
        <div class="dashboard__col-main">
          <TodayAppointments />
        </div>
        <div class="dashboard__col-side">
          <WeeklyAbsenteeism />
          <EngineActivity />
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.dashboard {
  display: flex;
  align-items: flex-start;
  min-height: 100vh;
  background: var(--color-bg);
}
.dashboard__main {
  flex: 1;
  min-width: 0;
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.dashboard__grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  align-items: start;
}
.dashboard__col-side {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
@media (max-width: 1024px) {
  .dashboard__grid {
    grid-template-columns: 1fr;
  }
}
@media (max-width: 560px) {
  .dashboard__main {
    padding: 1.25rem 1rem;
  }
}
</style>
