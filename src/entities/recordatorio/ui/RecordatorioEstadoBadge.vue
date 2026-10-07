<script setup lang="ts">
// Badge del estado de un recordatorio. Mismo patrón que `AppointmentStatusBadge`.
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import { etiquetaEstado, varianteEstado } from '../model/presentacion'
import type { EstadoRecordatorio } from '../model/types'

defineProps<{ estado: EstadoRecordatorio }>()
</script>

<template>
  <BaseBadge :variant="varianteEstado(estado)">{{ etiquetaEstado(estado) }}</BaseBadge>
</template>
