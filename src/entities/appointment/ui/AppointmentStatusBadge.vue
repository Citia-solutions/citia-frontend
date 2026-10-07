<script setup lang="ts">
// Badge del estado de una cita: el mismo en la fila de la lista y en el voucher.
import BaseBadge from '@/shared/ui/BaseBadge.vue'
import { STATUS_BADGE_VARIANT, STATUS_LABEL } from '../model/status'
import type { AppointmentStatus } from '../model/types'

defineProps<{ status: AppointmentStatus }>()
</script>

<template>
  <BaseBadge :variant="STATUS_BADGE_VARIANT[status]">{{ STATUS_LABEL[status] }}</BaseBadge>
</template>
