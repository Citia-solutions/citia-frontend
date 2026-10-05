<script setup lang="ts">
// Barra superior del contenido. Título + acción "+ Nueva cita".
// El subtítulo sale del store de citas del día (fecha real y conteos); el
// botón "+ Nueva cita" solo avisa: el modal lo compone la página, que es quien
// sabe recargar la lista cuando se guarda una cita.
// Sin buscador ni campana: no hay `GET /pacientes` ni notificaciones que mostrar.
import { computed } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { capitalizar, formatearFechaLarga } from '@/shared/lib/fecha'
import { useTodayAppointments } from '@/entities/appointment'

const emit = defineEmits<{
  /** El profesional pidió agendar una cita nueva. */
  nuevaCita: []
}>()

const store = useTodayAppointments()

// "Miércoles 23 de septiembre · 7 citas hoy · 2 pendientes de confirmar".
// La fecha se toma del momento de la última carga, así cambia junto con la
// lista al cruzar la medianoche con la pestaña abierta.
const subtitle = computed(() => {
  const fecha = capitalizar(formatearFechaLarga(store.loadedAt))
  if (!store.loaded) return fecha

  const citas = store.scheduledCount
  const pendientes = store.pendingCount
  const partes = [fecha, `${citas} ${citas === 1 ? 'cita' : 'citas'} hoy`]
  if (pendientes > 0) {
    partes.push(`${pendientes} ${pendientes === 1 ? 'pendiente' : 'pendientes'} de confirmar`)
  }
  return partes.join(' · ')
})
</script>

<template>
  <header class="topbar">
    <div class="topbar__heading">
      <h1 class="topbar__title">Resumen</h1>
      <p class="topbar__subtitle">{{ subtitle }}</p>
    </div>

    <div class="topbar__actions">
      <div class="topbar__cta">
        <BaseButton :block="false" @click="emit('nuevaCita')">+ Nueva cita</BaseButton>
      </div>
    </div>
  </header>
</template>

<style scoped>
.topbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.topbar__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}
.topbar__subtitle {
  margin: 0.2rem 0 0;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
.topbar__actions {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
</style>
