<script setup lang="ts">
// Logo de citiahealth en su versión negativa (en blanco): hoy va siempre sobre
// fondo azul oscuro o azul de marca (login, sidebar del panel, /agendar-cita y
// /cita). `logotipo` es el "ch" + "citiahealth"; `isotipo`, solo el "ch" (para el
// sidebar colapsado). Los PNG salen del kit de marca, recortados al dibujo y a
// unas 3 veces el alto en que se muestran.
import { computed } from 'vue'
import logotipo from '@/shared/assets/marca/logotipo-negativo.png'
import isotipo from '@/shared/assets/marca/isotipo-negativo.png'

const props = withDefaults(
  defineProps<{
    variante?: 'logotipo' | 'isotipo'
    /** Alto en px; el ancho sale de la proporción del dibujo. */
    alto?: number
  }>(),
  { variante: 'logotipo', alto: 32 },
)

// Ancho / alto de cada PNG (588×120 y 132×96).
const PROPORCION = { logotipo: 588 / 120, isotipo: 132 / 96 } as const

const src = computed(() => (props.variante === 'isotipo' ? isotipo : logotipo))
const ancho = computed(() => Math.round(props.alto * PROPORCION[props.variante]))
</script>

<template>
  <img :src="src" alt="citiahealth" :width="ancho" :height="alto" class="logo" />
</template>

<style scoped>
/* Sin `display`: quien lo usa puede ocultarlo o mostrarlo con su propia clase. */
.logo {
  flex-shrink: 0;
}
</style>
