<script setup lang="ts">
const stats = [
  { value: '−40%', label: 'ausentismo' },
  { value: '42h', label: 'recuperadas/mes' },
  { value: '$1.47M', label: 'ingresos/mes' },
]
</script>

<template>
  <aside class="aside">
    <div class="aside__brand">
      <span class="aside__logo">
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="17" rx="3" />
          <path d="M3 9h18M8 2v4M16 2v4" />
          <path d="m9 14 2 2 4-4" />
        </svg>
      </span>
      <span class="aside__name">Citia</span>
    </div>

    <div class="aside__pitch">
      <h1 class="aside__headline">Cada hora perdida es una hora que podemos recuperar.</h1>
      <p class="aside__subtitle">
        Automatiza confirmaciones, recupera cupos cancelados y reduce el ausentismo de tus
        pacientes.
      </p>
    </div>

    <dl class="aside__stats">
      <div v-for="stat in stats" :key="stat.label" class="aside__stat">
        <dt class="aside__stat-value">{{ stat.value }}</dt>
        <dd class="aside__stat-label">{{ stat.label }}</dd>
      </div>
    </dl>
  </aside>
</template>

<style scoped>
.aside {
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 3rem;
  padding: 3rem;
  min-height: 100%;
  color: #fff;
  background: radial-gradient(circle at 70% 15%, #1e3a8a 0%, transparent 55%),
    linear-gradient(160deg, #0f1f3d 0%, #102a52 100%);
  overflow: hidden;
}
.aside__brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.aside__logo {
  display: grid;
  place-items: center;
  width: 42px;
  height: 42px;
  border-radius: 12px;
  background: var(--color-primary);
  box-shadow: 0 8px 20px rgba(37, 99, 235, 0.45);
}
.aside__name {
  font-size: 1.3rem;
  font-weight: 700;
}
.aside__headline {
  font-size: 2.4rem;
  line-height: 1.1;
  font-weight: 800;
  margin: 0 0 1.2rem;
  max-width: 18ch;
}
.aside__subtitle {
  font-size: 1rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.7);
  max-width: 38ch;
  margin: 0;
}
.aside__stats {
  display: flex;
  gap: 2.5rem;
  margin: 0;
}
.aside__stat {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.aside__stat-value {
  font-size: 1.8rem;
  font-weight: 800;
}
.aside__stat-label {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
}
</style>
