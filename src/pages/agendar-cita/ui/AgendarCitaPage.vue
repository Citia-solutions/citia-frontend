<script setup lang="ts">
// Página pública "Solicita una nueva cita": split-screen con el flujo a la
// izquierda (fondo azul) y el stepper de progreso a la derecha. Es standalone,
// sin sidebar ni topbar del dashboard, y no requiere autenticación.
import { AgendarCitaFlow, StepperCita, StepperCitaHorizontal } from '@/features/crear-cita'
import { PASOS } from '@/features/crear-cita/model/flujoCitaModel'
import { ref } from 'vue'

// Estado del paso actual compartido con el stepper. El flujo lo cambia
// internamente; aquí solo lo observamos para reflejarlo en el panel derecho.
const pasoActual = ref<(typeof PASOS)[number]['id']>('identificacion')

// Ref al flujo para que el click en un ícono del stepper ordene la navegación.
const flowRef = ref<InstanceType<typeof AgendarCitaFlow> | null>(null)

function navegar(paso: (typeof PASOS)[number]['id']): void {
  flowRef.value?.irA(paso)
}
</script>

<template>
  <div class="agendar">
    <main class="agendar__panel">
      <AgendarCitaFlow ref="flowRef" @cambio-paso="pasoActual = $event" />
    </main>

    <aside class="agendar__aside">
      <StepperCita :paso-actual="pasoActual" @navegar="navegar" />
    </aside>

    <div class="agendar__mobile-stepper">
      <StepperCitaHorizontal :paso-actual="pasoActual" @navegar="navegar" />
    </div>
  </div>
</template>

<style scoped>
.agendar {
  display: grid;
  grid-template-columns: 78% 22%;
  min-height: 100vh;
}
.agendar__panel {
  background: var(--color-primary);
}
.agendar__aside {
  background: var(--color-surface);
}
.agendar__mobile-stepper {
  display: none;
}
@media (max-width: 1024px) {
  .agendar {
    grid-template-columns: 1fr;
  }
  .agendar__aside {
    display: none;
  }
  .agendar__panel {
    padding-bottom: 96px;
  }
  .agendar__mobile-stepper {
    display: flex;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 20;
    background: transparent;
    justify-content: center;
  }
}
</style>
