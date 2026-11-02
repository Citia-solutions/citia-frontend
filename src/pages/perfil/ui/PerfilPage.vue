<script setup lang="ts">
// Página "Mi perfil" (US-10, Fase 7). Compone cuatro features que no se
// conocen entre sí:
//
// - Información personal: `editar-perfil` + `CopiarEnlaceAgenda`
//   (`compartir-enlace-agenda`, tal como está, con su advertencia: F9).
// - Suscripción: `ver-suscripcion`, solo para el administrador. El permiso lo
//   decide el backend (403); aquí solo se decide qué se muestra.
// - Seguridad: `cambiar-contrasena`.
// - "Contactar soporte" abre el modal de `contactar-soporte`.
//
// Las pestañas son estado local (F4): sin rutas hijas ni query; al recargar se
// vuelve a la primera. Cada pestaña se monta la primera vez que se abre y
// después solo se oculta: así el perfil se pide una vez al entrar (F5), la
// suscripción solo si se mira, y lo escrito no se pierde al cambiar de pestaña.
import { computed, reactive, ref, watch } from 'vue'
import BaseButton from '@/shared/ui/BaseButton.vue'
import { useSessionStore } from '@/entities/session'
import { InformacionPersonal } from '@/features/editar-perfil'
import { CopiarEnlaceAgenda } from '@/features/compartir-enlace-agenda'
import { SuscripcionOrganizacion } from '@/features/ver-suscripcion'
import { CambiarContrasenaForm } from '@/features/cambiar-contrasena'
import { ContactarSoporteModal } from '@/features/contactar-soporte'

type Pestana = 'personal' | 'suscripcion' | 'seguridad'

const session = useSessionStore()

const pestanas = computed<{ id: Pestana; etiqueta: string }[]>(() => [
  { id: 'personal', etiqueta: 'Información personal' },
  ...(session.isAdmin ? [{ id: 'suscripcion' as const, etiqueta: 'Suscripción' }] : []),
  { id: 'seguridad', etiqueta: 'Seguridad' },
])

const activa = ref<Pestana>('personal')
/** Pestañas ya abiertas: siguen montadas (ocultas) al cambiar de pestaña. */
const visitadas = reactive<Record<Pestana, boolean>>({
  personal: true,
  suscripcion: false,
  seguridad: false,
})

function abrir(pestana: Pestana): void {
  activa.value = pestana
  visitadas[pestana] = true
}

// Si la pestaña activa deja de existir (la sesión dejó de ser de un
// administrador), se vuelve a la primera.
watch(pestanas, (lista) => {
  if (!lista.some((p) => p.id === activa.value)) abrir('personal')
})

/** Flechas, Inicio y Fin entre pestañas (patrón ARIA de tabs). */
function onTabKeydown(e: KeyboardEvent, indice: number): void {
  const lista = pestanas.value
  let destino: number
  if (e.key === 'ArrowRight') destino = (indice + 1) % lista.length
  else if (e.key === 'ArrowLeft') destino = (indice - 1 + lista.length) % lista.length
  else if (e.key === 'Home') destino = 0
  else if (e.key === 'End') destino = lista.length - 1
  else return
  e.preventDefault()
  const siguiente = lista[destino]
  if (!siguiente) return
  abrir(siguiente.id)
  document.getElementById(`perfil-tab-${siguiente.id}`)?.focus()
}

const soporteAbierto = ref(false)
</script>

<template>
  <main class="page">
    <header class="page__head">
      <div class="page__head-text">
        <h1 class="page__title">Mi perfil</h1>
        <p class="page__subtitle">
          {{
            session.isAdmin
              ? 'Tus datos, la suscripción de tu organización y tu contraseña.'
              : 'Tus datos y tu contraseña.'
          }}
        </p>
      </div>
      <BaseButton
        type="button"
        variant="outline"
        :block="false"
        aria-haspopup="dialog"
        @click="soporteAbierto = true"
      >
        Contactar soporte
      </BaseButton>
    </header>

    <div class="page__tabs" role="tablist" aria-label="Secciones de Mi perfil">
      <button
        v-for="(tab, i) in pestanas"
        :id="`perfil-tab-${tab.id}`"
        :key="tab.id"
        type="button"
        role="tab"
        class="page__tab"
        :class="{ 'page__tab--active': activa === tab.id }"
        :aria-selected="activa === tab.id"
        :aria-controls="`perfil-panel-${tab.id}`"
        :tabindex="activa === tab.id ? 0 : -1"
        @click="abrir(tab.id)"
        @keydown="onTabKeydown($event, i)"
      >
        {{ tab.etiqueta }}
      </button>
    </div>

    <section
      v-show="activa === 'personal'"
      id="perfil-panel-personal"
      class="page__panel"
      role="tabpanel"
      aria-labelledby="perfil-tab-personal"
    >
      <template v-if="visitadas.personal">
        <InformacionPersonal />
        <CopiarEnlaceAgenda />
      </template>
    </section>

    <section
      v-if="session.isAdmin"
      v-show="activa === 'suscripcion'"
      id="perfil-panel-suscripcion"
      class="page__panel"
      role="tabpanel"
      aria-labelledby="perfil-tab-suscripcion"
    >
      <SuscripcionOrganizacion v-if="visitadas.suscripcion" />
    </section>

    <section
      v-show="activa === 'seguridad'"
      id="perfil-panel-seguridad"
      class="page__panel"
      role="tabpanel"
      aria-labelledby="perfil-tab-seguridad"
    >
      <CambiarContrasenaForm v-if="visitadas.seguridad" />
    </section>
  </main>

  <ContactarSoporteModal :is-open="soporteAbierto" @close="soporteAbierto = false" />
</template>

<style scoped>
.page {
  flex: 1;
  min-width: 0;
  padding: 1.75rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}
.page__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}
.page__head-text {
  min-width: 0;
}
.page__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-text);
}
.page__subtitle {
  margin: 0.2rem 0 0;
  max-width: 64ch;
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
.page__tabs {
  display: inline-flex;
  align-self: flex-start;
  gap: 0.25rem;
  padding: 0.25rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
}
.page__tab {
  border: none;
  background: transparent;
  color: var(--color-text-muted);
  font: inherit;
  font-size: 0.88rem;
  font-weight: 600;
  padding: 0.5rem 0.95rem;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.page__tab:hover {
  color: var(--color-text);
}
.page__tab--active {
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
}
.page__tab:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 1px;
}
.page__panel {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  max-width: 820px;
}
@media (max-width: 560px) {
  .page {
    padding: 1.25rem 1rem;
  }
  .page__head :deep(.btn) {
    width: 100%;
  }
  .page__tabs {
    align-self: stretch;
  }
  .page__tab {
    flex: 1;
    padding: 0.5rem 0.4rem;
  }
}
</style>
