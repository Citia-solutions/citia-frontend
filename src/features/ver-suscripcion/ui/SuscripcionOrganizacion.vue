<script setup lang="ts">
// Pestaña "Suscripción" de Mi Perfil (US-10), solo para el administrador: el
// plan de la organización y desde cuándo. En la v1 no hay cobro: renovación y
// método de pago vienen en `null` y se muestran como "—".
//
// Las fechas, siempre en la zona de Chile (`shared/lib/fecha.ts`). Si en un
// entorno de pruebas sale un día corrido, es DT-46 del backend (`creado_en`
// sin zona), no el front.
import { onMounted } from 'vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import { formatearFecha } from '@/shared/lib/fecha'
import { useSuscripcion } from '../model/useSuscripcion'

const SIN_DATO = '—'

const { suscripcion, loading, error, reintentable, cargar } = useSuscripcion()

/** '1 de noviembre de 2026' (zona de la clínica), o "—". */
function fecha(valor: Date | null): string {
  return valor ? formatearFecha(valor, { day: 'numeric', month: 'long', year: 'numeric' }) : SIN_DATO
}

onMounted(() => void cargar())
</script>

<template>
  <BaseCard>
    <template #header>
      <h2 class="suscripcion__title">Suscripción de tu organización</h2>
    </template>

    <div v-if="!suscripcion && !error" class="suscripcion__skeleton" aria-busy="true" aria-label="Cargando la suscripción">
      <span class="suscripcion__skel suscripcion__skel--wide" />
      <span class="suscripcion__skel" />
    </div>

    <div v-else-if="!suscripcion" class="suscripcion__state" role="alert">
      <p class="suscripcion__state-text">{{ error }}</p>
      <button
        v-if="reintentable"
        type="button"
        class="suscripcion__state-action"
        :disabled="loading"
        @click="cargar()"
      >
        Reintentar
      </button>
    </div>

    <dl v-else class="suscripcion__datos">
      <div class="suscripcion__dato">
        <dt class="suscripcion__label">Plan</dt>
        <dd class="suscripcion__valor">
          <span>{{ suscripcion.planNombre }}</span>
          <span v-if="suscripcion.descripcion" class="suscripcion__descripcion">
            {{ suscripcion.descripcion }}
          </span>
        </dd>
      </div>
      <div class="suscripcion__dato">
        <dt class="suscripcion__label">Desde</dt>
        <dd class="suscripcion__valor">{{ fecha(suscripcion.altaEn) }}</dd>
      </div>
      <div class="suscripcion__dato">
        <dt class="suscripcion__label">Renovación</dt>
        <dd class="suscripcion__valor">{{ fecha(suscripcion.renovacionEn) }}</dd>
      </div>
      <div class="suscripcion__dato">
        <dt class="suscripcion__label">Método de pago</dt>
        <dd class="suscripcion__valor">{{ suscripcion.metodoPago ?? SIN_DATO }}</dd>
      </div>
    </dl>
  </BaseCard>
</template>

<style scoped>
.suscripcion__title {
  margin: 0;
  font-size: 1rem;
  font-weight: 700;
  color: var(--color-text);
}
.suscripcion__datos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1.1rem 1.5rem;
  margin: 0;
}
.suscripcion__dato {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}
.suscripcion__label {
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}
.suscripcion__valor {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin: 0;
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--color-text);
  overflow-wrap: anywhere;
}
.suscripcion__descripcion {
  font-size: 0.82rem;
  font-weight: 400;
  color: var(--color-text-muted);
}
.suscripcion__state {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  text-align: center;
}
.suscripcion__state-text {
  margin: 0;
  font-size: 0.92rem;
  color: var(--color-text-muted);
}
.suscripcion__state-action {
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  color: var(--color-text);
  font: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  padding: 0.5rem 0.9rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
}
.suscripcion__state-action:hover {
  background: var(--color-surface-muted);
}
.suscripcion__skeleton {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}
.suscripcion__skel {
  display: block;
  width: 40%;
  height: 0.95rem;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  animation: suscripcion-pulse 1.2s ease-in-out infinite;
}
.suscripcion__skel--wide {
  width: 70%;
}
@keyframes suscripcion-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
@media (max-width: 560px) {
  .suscripcion__datos {
    grid-template-columns: 1fr;
  }
}
</style>
