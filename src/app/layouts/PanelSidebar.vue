<script setup lang="ts">
// Sidebar fijo del panel del profesional (lo pinta `PanelLayout` en todas las
// vistas autenticadas). Navegación principal + tarjeta de IA + perfil.
//
// Resumen, Agenda y Solicitudes navegan; Pacientes y Citas anuladas siguen
// siendo visuales (sin vista todavía; la píldora "3" es dato fijo, DTF-03).
// La píldora de Solicitudes es real: cuántas esperan respuesta.
import BaseAvatar from '@/shared/ui/BaseAvatar.vue'
import { useSolicitudesRecibidas } from '@/entities/solicitud'

const recibidas = useSolicitudesRecibidas()
</script>

<template>
  <aside class="sidebar">
    <!-- Marca -->
    <div class="sidebar__brand">
      <span class="sidebar__logo" aria-hidden="true">C</span>
      <div class="sidebar__brand-text">
        <span class="sidebar__brand-name">Citia</span>
        <span class="sidebar__brand-sub">SaludX · Centro Clínico</span>
      </div>
    </div>

    <!-- Navegación principal -->
    <nav class="sidebar__nav">
      <span class="sidebar__label">PRINCIPAL</span>

      <RouterLink :to="{ name: 'home' }" class="sidebar__item" exact-active-class="sidebar__item--active">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="7" height="9" rx="1" />
          <rect x="14" y="3" width="7" height="5" rx="1" />
          <rect x="14" y="12" width="7" height="9" rx="1" />
          <rect x="3" y="16" width="7" height="5" rx="1" />
        </svg>
        <span>Resumen</span>
      </RouterLink>

      <RouterLink :to="{ name: 'agenda' }" class="sidebar__item" active-class="sidebar__item--active">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M16 2v4M8 2v4M3 10h18" />
        </svg>
        <span>Agenda</span>
      </RouterLink>

      <RouterLink :to="{ name: 'solicitudes' }" class="sidebar__item" active-class="sidebar__item--active">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <path d="M5.5 5.1 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.5-6.9A2 2 0 0 0 16.7 4H7.3a2 2 0 0 0-1.8 1.1z" />
        </svg>
        <span>Solicitudes</span>
        <span
          v-if="recibidas.etiqueta"
          class="sidebar__pill sidebar__pill--info"
          :aria-label="`${recibidas.etiqueta} por responder`"
        >
          {{ recibidas.etiqueta }}
        </span>
      </RouterLink>

      <a href="#" class="sidebar__item">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
        <span>Pacientes</span>
      </a>

      <a href="#" class="sidebar__item">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="9" />
          <path d="m15 9-6 6M9 9l6 6" />
        </svg>
        <span>Citas anuladas</span>
        <span class="sidebar__pill">3</span>
      </a>
    </nav>

    <!-- Inteligencia -->
    <div class="sidebar__intel">
      <span class="sidebar__label">INTELIGENCIA</span>
      <div class="sidebar__ai">
        <div class="sidebar__ai-head">
          <span class="sidebar__ai-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M12 3l2.2 5.5L20 10l-5.8 1.5L12 17l-2.2-5.5L4 10l5.8-1.5L12 3Z" />
            </svg>
          </span>
          <span class="sidebar__ai-title">Citia IA</span>
        </div>
        <p class="sidebar__ai-text">
          31 pacientes en riesgo de ausentismo esta semana. Revisa las recomendaciones.
        </p>
      </div>
    </div>

    <!-- Perfil -->
    <div class="sidebar__profile">
      <BaseAvatar name="Matías Rivera" :size="38" />
      <div class="sidebar__profile-text">
        <span class="sidebar__profile-name">Dr. Matías Rivera</span>
        <span class="sidebar__profile-role">Psicólogo clínico</span>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 248px;
  flex-shrink: 0;
  height: 100vh;
  position: sticky;
  top: 0;
  background: var(--color-sidebar);
  color: var(--color-sidebar-text);
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.25rem 1rem;
  overflow-y: auto;
}
.sidebar__brand {
  display: flex;
  align-items: center;
  gap: 0.7rem;
}
.sidebar__logo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border-radius: var(--radius-md);
  background: var(--color-primary);
  color: #fff;
  font-weight: 700;
  font-size: 1.15rem;
  flex-shrink: 0;
}
.sidebar__brand-text {
  display: flex;
  flex-direction: column;
}
.sidebar__brand-name {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-sidebar-text);
}
.sidebar__brand-sub {
  font-size: 0.75rem;
  color: var(--color-sidebar-text-muted);
}
.sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.sidebar__label {
  font-size: 0.68rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  color: var(--color-sidebar-text-muted);
  margin-bottom: 0.4rem;
}
.sidebar__item {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.6rem 0.7rem;
  border-radius: var(--radius-sm);
  color: var(--color-sidebar-text-muted);
  text-decoration: none;
  font-size: 0.9rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.sidebar__item:hover {
  background: var(--color-sidebar-surface);
  color: var(--color-sidebar-text);
}
.sidebar__item--active {
  background: var(--color-sidebar-active);
  color: var(--color-sidebar-text);
}
.sidebar__item span:first-of-type {
  flex: 1;
}
.sidebar__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.35rem;
  border-radius: var(--radius-full);
  background: var(--color-danger);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
}
.sidebar__intel {
  display: flex;
  flex-direction: column;
}
.sidebar__ai {
  background: var(--color-sidebar-surface);
  border-radius: var(--radius-md);
  padding: 0.85rem;
}
.sidebar__ai-head {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
.sidebar__ai-icon {
  display: flex;
  color: var(--color-primary);
}
.sidebar__ai-title {
  font-weight: 600;
  font-size: 0.88rem;
  color: var(--color-sidebar-text);
}
.sidebar__ai-text {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: var(--color-sidebar-text-muted);
}
.sidebar__profile {
  margin-top: auto;
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding-top: 0.5rem;
}
.sidebar__profile-text {
  display: flex;
  flex-direction: column;
}
.sidebar__profile-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-sidebar-text);
}
.sidebar__profile-role {
  font-size: 0.75rem;
  color: var(--color-sidebar-text-muted);
}
/* Contador informativo (solicitudes por responder), no una alerta. */
.sidebar__pill.sidebar__pill--info {
  background: var(--color-primary);
}
@media (max-width: 860px) {
  .sidebar {
    width: 72px;
    padding: 1.25rem 0.6rem;
  }
  .sidebar__brand-text,
  .sidebar__item span,
  .sidebar__intel,
  .sidebar__profile-text {
    display: none;
  }
  .sidebar__item {
    position: relative;
    justify-content: center;
  }
  /* Colapsado: la píldora queda como contador en la esquina del ícono. */
  .sidebar__item .sidebar__pill {
    display: inline-flex;
    position: absolute;
    top: 2px;
    right: 2px;
    min-width: 16px;
    height: 16px;
    font-size: 0.6rem;
  }
}
</style>
