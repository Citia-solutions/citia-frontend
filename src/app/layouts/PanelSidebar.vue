<script setup lang="ts">
// Sidebar fijo del panel del profesional (lo pinta `PanelLayout` en todas las
// vistas autenticadas). Marca + nombre de la clínica, navegación y perfil con
// "Cerrar sesión".
//
// Solo muestra lo que funciona: Resumen, Agenda, Solicitudes y Recordatorios.
// La píldora de Solicitudes es real: cuántas esperan respuesta. Usuario, rol y
// clínica salen de la sesión (respuesta del login, restaurada al recargar).
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import BaseAvatar from '@/shared/ui/BaseAvatar.vue'
import { roleLabel, useSessionStore } from '@/entities/session'
import { useSolicitudesRecibidas } from '@/entities/solicitud'
import { cerrarSesion } from '@/app/router/cerrarSesion'

const router = useRouter()
const session = useSessionStore()
const recibidas = useSolicitudesRecibidas()

const user = computed(() => session.currentUser)
/** Nombre para el perfil; si el backend no mandó nombre, el correo. */
const displayName = computed(() => user.value?.name.trim() || user.value?.email || '')

function salir(): void {
  cerrarSesion(router)
}
</script>

<template>
  <aside class="sidebar">
    <!-- Marca -->
    <div class="sidebar__brand">
      <span class="sidebar__logo" aria-hidden="true">C</span>
      <div class="sidebar__brand-text">
        <span class="sidebar__brand-name">Citia</span>
        <span v-if="user?.tenantNombre" class="sidebar__brand-sub" :title="user.tenantNombre">
          {{ user.tenantNombre }}
        </span>
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
          class="sidebar__pill"
          :aria-label="`${recibidas.etiqueta} por responder`"
        >
          {{ recibidas.etiqueta }}
        </span>
      </RouterLink>

      <RouterLink :to="{ name: 'recordatorios' }" class="sidebar__item" active-class="sidebar__item--active">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        <span>Recordatorios</span>
      </RouterLink>
    </nav>

    <!-- Perfil + cerrar sesión -->
    <div v-if="user" class="sidebar__profile">
      <BaseAvatar :name="displayName" :size="38" />
      <div class="sidebar__profile-text">
        <span class="sidebar__profile-name" :title="displayName">{{ displayName }}</span>
        <span class="sidebar__profile-role">{{ roleLabel(user.role) }}</span>
      </div>
      <button
        type="button"
        class="sidebar__logout"
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
        @click="salir"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      </button>
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
  min-width: 0;
}
.sidebar__brand-name {
  font-weight: 700;
  font-size: 1.05rem;
  color: var(--color-sidebar-text);
}
.sidebar__brand-sub {
  font-size: 0.75rem;
  color: var(--color-sidebar-text-muted);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
/* Contador informativo (solicitudes por responder), no una alerta. */
.sidebar__pill {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 0.35rem;
  border-radius: var(--radius-full);
  background: var(--color-primary);
  color: #fff;
  font-size: 0.72rem;
  font-weight: 700;
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
  flex: 1;
  min-width: 0;
}
.sidebar__profile-name {
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--color-sidebar-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.sidebar__profile-role {
  font-size: 0.75rem;
  color: var(--color-sidebar-text-muted);
}
.sidebar__logout {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  flex-shrink: 0;
  padding: 0;
  border: none;
  border-radius: var(--radius-sm);
  background: transparent;
  color: var(--color-sidebar-text-muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.sidebar__logout:hover {
  background: var(--color-sidebar-surface);
  color: var(--color-sidebar-text);
}
.sidebar__logout:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
@media (max-width: 860px) {
  .sidebar {
    width: 72px;
    padding: 1.25rem 0.6rem;
  }
  .sidebar__brand-text,
  .sidebar__item span,
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
  /* Colapsado: avatar arriba y "Cerrar sesión" debajo, centrados. */
  .sidebar__profile {
    flex-direction: column;
  }
}
</style>
