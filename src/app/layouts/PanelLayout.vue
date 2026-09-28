<script setup lang="ts">
// Layout del panel del profesional: sidebar fijo + la vista activa (Resumen,
// Agenda, Solicitudes). Lo monta el router como ruta padre de las vistas
// autenticadas, así el sidebar no se re-crea al navegar entre ellas.
//
// Vive en `app` porque compone varias páginas; cada página sigue componiendo
// sus propios features (modales, voucher) y decide cuándo recargar.
import { onBeforeUnmount, onMounted } from 'vue'
import { useSolicitudesRecibidas } from '@/entities/solicitud'
import PanelSidebar from './PanelSidebar.vue'

/** Mínimo entre refetches automáticos del contador al volver el foco. */
const REFETCH_MIN_MS = 30_000

const recibidas = useSolicitudesRecibidas()

// Solicitudes nuevas llegan por el enlace público sin que nadie en esta pestaña
// haga nada: se recuenta al entrar y al volver a la pestaña (sin polling).
function alCambiarVisibilidad(): void {
  if (document.visibilityState === 'visible') void recibidas.refreshIfStale(REFETCH_MIN_MS)
}

onMounted(() => {
  void recibidas.refresh()
  document.addEventListener('visibilitychange', alCambiarVisibilidad)
})

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', alCambiarVisibilidad)
})
</script>

<template>
  <div class="panel">
    <PanelSidebar />
    <RouterView />
  </div>
</template>

<style scoped>
.panel {
  display: flex;
  align-items: flex-start;
  min-height: 100vh;
  background: var(--color-bg);
}
</style>
