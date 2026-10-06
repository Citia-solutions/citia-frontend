<script setup lang="ts">
// Tarjeta de cifra del resumen: etiqueta, valor y detalle, con sus estados de
// carga (esqueleto) y error (con "Reintentar"). Presentacional: los datos y qué
// significa "vacío" los decide quien la usa (`ResumenTarjetas`). El slot
// `accion` es para un enlace o botón discreto al pie ("Ver cita", "Ver solicitudes").
import BaseCard from '@/shared/ui/BaseCard.vue'

withDefaults(
  defineProps<{
    etiqueta: string
    valor?: string
    detalle?: string
    /** Valor que es una frase ("No quedan citas hoy"), no una cifra: letra más chica. */
    valorTexto?: boolean
    cargando?: boolean
    /** Fallo sin datos que mostrar: reemplaza el contenido por el mensaje y "Reintentar". */
    error?: string | null
  }>(),
  { valor: '', detalle: '', valorTexto: false, cargando: false, error: null },
)

const emit = defineEmits<{ reintentar: [] }>()
</script>

<template>
  <BaseCard>
    <div class="tarjeta">
      <span class="tarjeta__etiqueta">{{ etiqueta }}</span>

      <div v-if="cargando" class="tarjeta__esqueleto" aria-busy="true" :aria-label="`Cargando ${etiqueta}`">
        <span class="tarjeta__skel tarjeta__skel--valor" />
        <span class="tarjeta__skel tarjeta__skel--detalle" />
      </div>

      <div v-else-if="error" class="tarjeta__error" role="alert">
        <p class="tarjeta__error-texto">{{ error }}</p>
        <button type="button" class="tarjeta__reintentar" @click="emit('reintentar')">Reintentar</button>
      </div>

      <template v-else>
        <p class="tarjeta__valor" :class="{ 'tarjeta__valor--texto': valorTexto }">{{ valor }}</p>
        <p v-if="detalle" class="tarjeta__detalle">{{ detalle }}</p>
        <div v-if="$slots.accion" class="tarjeta__accion">
          <slot name="accion" />
        </div>
      </template>
    </div>
  </BaseCard>
</template>

<style scoped>
.tarjeta {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  min-height: 6.5rem;
}
.tarjeta__etiqueta {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--color-text-muted);
}
.tarjeta__valor {
  margin: 0;
  font-size: 1.85rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-text);
}
.tarjeta__valor--texto {
  font-size: 1.05rem;
  line-height: 1.3;
  padding: 0.35rem 0 0.15rem;
}
.tarjeta__detalle {
  margin: 0;
  font-size: 0.8rem;
  font-weight: 500;
  color: var(--color-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.tarjeta__accion {
  margin-top: auto;
  padding-top: 0.25rem;
}
.tarjeta__accion :slotted(a),
.tarjeta__accion :slotted(button) {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-primary);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
}
.tarjeta__accion :slotted(a:hover),
.tarjeta__accion :slotted(button:hover) {
  text-decoration: underline;
}
.tarjeta__accion :slotted(a:focus-visible),
.tarjeta__accion :slotted(button:focus-visible) {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
.tarjeta__error {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}
.tarjeta__error-texto {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-danger);
}
.tarjeta__reintentar {
  padding: 0;
  border: none;
  background: transparent;
  color: var(--color-danger);
  font: inherit;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
}
.tarjeta__reintentar:hover {
  text-decoration: underline;
}
.tarjeta__esqueleto {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 0.2rem;
}
.tarjeta__skel {
  display: block;
  border-radius: var(--radius-sm);
  background: var(--color-surface-muted);
  animation: tarjeta-pulse 1.2s ease-in-out infinite;
}
.tarjeta__skel--valor {
  width: 3.5rem;
  height: 1.85rem;
}
.tarjeta__skel--detalle {
  width: 70%;
  height: 0.8rem;
}
@keyframes tarjeta-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.45;
  }
}
</style>
