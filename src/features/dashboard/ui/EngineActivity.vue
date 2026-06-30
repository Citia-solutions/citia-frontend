<script setup lang="ts">
// Feed vertical de la actividad del motor de recuperación de cupos.
import { onMounted, ref } from 'vue'
import BaseCard from '@/shared/ui/BaseCard.vue'
import { getEngineActivity } from '../api/dashboardApi'
import type { ActivityEvent } from '../model/types'

const events = ref<ActivityEvent[]>([])

onMounted(async () => {
  events.value = await getEngineActivity()
})
</script>

<template>
  <BaseCard>
    <template #header>
      <div class="engine__head">
        <span class="engine__head-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
        </span>
        <h2 class="engine__title">Actividad del motor</h2>
      </div>
    </template>

    <ul class="engine__feed">
      <li v-for="event in events" :key="event.id" class="engine__item">
        <span class="engine__dot" :class="`engine__dot--${event.tone}`" aria-hidden="true" />
        <div class="engine__content">
          <p class="engine__text">{{ event.text }}</p>
          <span class="engine__time">{{ event.timeAgo }}</span>
        </div>
      </li>
    </ul>
  </BaseCard>
</template>

<style scoped>
.engine__head {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.engine__head-icon {
  display: flex;
  color: var(--color-text-muted);
}
.engine__title {
  margin: 0;
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--color-text);
}
.engine__feed {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.engine__item {
  display: flex;
  gap: 0.7rem;
}
.engine__dot {
  width: 10px;
  height: 10px;
  border-radius: var(--radius-full);
  flex-shrink: 0;
  margin-top: 0.3rem;
}
.engine__dot--success {
  background: var(--color-success);
}
.engine__dot--info {
  background: var(--color-info);
}
.engine__dot--warning {
  background: var(--color-warning);
}
.engine__dot--danger {
  background: var(--color-danger);
}
.engine__content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.engine__text {
  margin: 0;
  font-size: 0.85rem;
  color: var(--color-text);
  line-height: 1.35;
}
.engine__time {
  font-size: 0.78rem;
  color: var(--color-text-muted);
}
</style>
