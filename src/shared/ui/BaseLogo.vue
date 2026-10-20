<script setup lang="ts">
// Logo de citiahealth. Dos temas: `negativo` (blanco) para fondo oscuro o azul, y
// `positivo` (a color/oscuro) para fondo claro. `logotipo` es el "ch" +
// "citiahealth"; `isotipo`, solo el "ch" (para el sidebar colapsado). Los PNG y
// SVG salen del kit de marca, recortados al dibujo y a unas 3 veces el alto en
// que se muestran.
import { computed } from 'vue'
import logotipoNegativo from '@/shared/assets/marca/logotipo-negativo.png'
import isotipoNegativo from '@/shared/assets/marca/isotipo-negativo.png'
import logotipoPositivo from '@/shared/assets/marca/logotipo-positivo.svg'
import isotipoPositivo from '@/shared/assets/marca/isotipo-positivo.svg'

const props = withDefaults(
  defineProps<{
    variante?: 'logotipo' | 'isotipo'
    tema?: 'negativo' | 'positivo'
    /** Alto en px; el ancho sale de la proporción del dibujo. */
    alto?: number
  }>(),
  { variante: 'logotipo', tema: 'negativo', alto: 32 },
)

const LOGOS = {
  negativo: { logotipo: logotipoNegativo, isotipo: isotipoNegativo },
  positivo: { logotipo: logotipoPositivo, isotipo: isotipoPositivo },
} as const

// Ancho / alto de cada dibujo (PNG 588×120 y 132×96; SVG 5713×1151 y 1657×1151).
const PROPORCION = {
  negativo: { logotipo: 588 / 120, isotipo: 132 / 96 },
  positivo: { logotipo: 5713.31 / 1150.93, isotipo: 1657.46 / 1150.93 },
} as const

const src = computed(() => LOGOS[props.tema][props.variante])
const ancho = computed(() => Math.round(props.alto * PROPORCION[props.tema][props.variante]))
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
