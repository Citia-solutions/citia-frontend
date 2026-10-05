<script setup lang="ts">
// Tarjeta "Recordatorios" del dashboard: si los recordatorios por correo están
// activos o apagados y en qué momentos salen, con enlace a `/recordatorios`.
// Solo lectura (`GET /recordatorios/configuracion`); se edita en esa pantalla.
import { computed, onMounted } from 'vue'
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import { describirAntelaciones } from '@/entities/recordatorio'
import { useResumenRecordatorios } from '../model/useResumenRecordatorios'

const { configuracion, loading, error, cargar } = useResumenRecordatorios()

const momentos = computed(() => describirAntelaciones(configuracion.value?.antelacionesMin ?? []))

onMounted(cargar)
</script>

<template>
  <BaseCard>
    <template #header>
      <div class="recs__head">
        <h2 class="recs__title">Recordatorios</h2>
        <BaseBadge v-if="configuracion" :variant="configuracion.activo ? 'success' : 'neutral'">
          {{ configuracion.activo ? 'Activos' : 'Apagados' }}
        </BaseBadge>
      </div>
    </template>

    <!-- Carga (primera vez) -->
    <div v-if="loading && !configuracion" class="recs__skeleton" aria-busy="true" aria-label="Cargando recordatorios">
      <span class="recs__skel recs__skel--wide" />
      <span class="recs__skel" />
    </div>

    <!-- Error sin datos -->
    <div v-else-if="error && !configuracion" class="recs__state" role="alert">
      <p class="recs__error">{{ error }}</p>
      <button type="button" class="recs__retry" @click="cargar">Reintentar</button>
    </div>

    <div v-else-if="configuracion" class="recs__body">
      <template v-if="configuracion.activo">
        <p class="recs__text">
          <template v-if="momentos">
            Se envían por correo <strong>{{ momentos }}</strong> de cada cita.
          </template>
          <template v-else>Activos, pero sin momentos de envío elegidos.</template>
        </p>
      </template>
      <p v-else class="recs__text">Tus pacientes no reciben recordatorios por correo.</p>
      <p v-if="configuracion.predeterminada" class="recs__note">
        Usas la configuración predeterminada: aún no la has guardado.
      </p>
      <RouterLink :to="{ name: 'recordatorios' }" class="recs__link">
        {{ configuracion.activo ? 'Configurar' : 'Activar recordatorios' }}
      </RouterLink>
    </div>
  </BaseCard>
</template>

<style scoped>
.recs__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
}
.recs__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}
.recs__body {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.6rem;
}
.recs__text {
  margin: 0;
  font-size: 0.88rem;
  line-height: 1.4;
  color: var(--color-text);
}
.recs__note {
  margin: 0;
  font-size: 0.8rem;
  color: var(--color-text-muted);
}
.recs__link {
  color: var(--color-primary);
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
}
.recs__link:hover {
  text-decoration: underline;
}
.recs__link:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
.recs__state {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.4rem;
}
.recs__error {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-danger);
}
.recs__retry {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-danger);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}
.recs__retry:hover {
  text-decoration: underline;
}
.recs__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.recs__skel {
  display: block;
  width: 40%;
  height: 0.85rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  animation: recs-pulse 1.2s ease-in-out infinite;
}
.recs__skel--wide {
  width: 85%;
}
@keyframes recs-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
</style>
