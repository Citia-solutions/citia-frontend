<script setup lang="ts">
// Panel izquierdo del login: marca y lo que Citia hace hoy. Sin cifras: no hay
// datos reales que las respalden, y el texto no promete nada que el producto
// no haga (ni dinero, ni "recuperar cupos").
const features = [
  {
    title: 'Agenda del día y de la semana',
    text: 'Revisa tus citas en lista o en vista semanal, con el estado de cada una.',
    icon: 'agenda',
  },
  {
    title: 'Solicitudes desde tu enlace',
    text: 'Tus pacientes piden hora desde un enlace y tú decides si la aceptas.',
    icon: 'solicitudes',
  },
  {
    title: 'Recordatorios por correo',
    text: 'Citia les recuerda la cita automáticamente, en los momentos que elijas.',
    icon: 'recordatorios',
  },
] as const
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
      <h1 class="aside__headline">Tu agenda clínica, en orden y al día.</h1>
      <p class="aside__subtitle">
        Citia reúne tus citas, las solicitudes de hora de tus pacientes y los recordatorios por
        correo en un solo panel.
      </p>
    </div>

    <ul class="aside__features">
      <li v-for="feature in features" :key="feature.title" class="aside__feature">
        <span class="aside__feature-icon" aria-hidden="true">
          <svg
            v-if="feature.icon === 'agenda'"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
          <svg
            v-else-if="feature.icon === 'solicitudes'"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M22 12h-6l-2 3h-4l-2-3H2" />
            <path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z" />
          </svg>
          <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="m3 7 9 6 9-6" />
          </svg>
        </span>
        <div class="aside__feature-text">
          <span class="aside__feature-title">{{ feature.title }}</span>
          <span class="aside__feature-desc">{{ feature.text }}</span>
        </div>
      </li>
    </ul>
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
.aside__features {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  list-style: none;
  margin: 0;
  padding: 0;
}
.aside__feature {
  display: flex;
  align-items: flex-start;
  gap: 0.85rem;
}
.aside__feature-icon {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  flex-shrink: 0;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}
.aside__feature-text {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  max-width: 40ch;
}
.aside__feature-title {
  font-size: 0.95rem;
  font-weight: 700;
}
.aside__feature-desc {
  font-size: 0.85rem;
  line-height: 1.45;
  color: rgba(255, 255, 255, 0.65);
}
</style>
