<script setup lang="ts">
// Barra superior del contenido. Título + búsqueda + acciones.
// El subtítulo sale del store de citas del día (fecha real y conteos); el
// botón "+ Nueva cita" solo avisa: el modal lo compone la página, que es quien
// sabe recargar la lista cuando se guarda una cita.
import { computed, ref } from 'vue'
import BaseInput from '@/shared/ui/BaseInput.vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { capitalizar, formatearFechaLarga } from '@/shared/lib/fecha'
import { useTodayAppointments } from '@/entities/appointment'

const emit = defineEmits<{
  /** El profesional pidió agendar una cita nueva. */
  nuevaCita: []
}>()

const search = ref('')
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
      <div class="topbar__search">
        <BaseInput v-model="search" placeholder="Buscar paciente…">
          <template #icon>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </template>
        </BaseInput>
      </div>

      <button type="button" class="topbar__icon-btn" aria-label="Notificaciones">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
      </button>

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
.topbar__search {
  width: 240px;
}
.topbar__icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text-muted);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.topbar__icon-btn:hover {
  background: var(--color-surface-muted);
  color: var(--color-text);
}
@media (max-width: 560px) {
  .topbar__search {
    width: 100%;
    order: 3;
  }
  .topbar__actions {
    flex-wrap: wrap;
  }
}
</style>
