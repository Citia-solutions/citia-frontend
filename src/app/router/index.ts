import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { AgendaPage } from '@/pages/agenda'
import { SolicitudesPage } from '@/pages/solicitudes'
import { RecordatoriosPage } from '@/pages/recordatorios'
import { AgendarCitaPage } from '@/pages/agendar-cita'
import { NoEncontradaPage } from '@/pages/no-encontrada'
import PanelLayout from '@/app/layouts/PanelLayout.vue'

declare module 'vue-router' {
  interface RouteMeta {
    /**
     * Única marca que lee el guard: la ruta exige sesión. Va en el padre `/`
     * del panel y las hijas la heredan. Las demás rutas son públicas por
     * omisión (login, flujo del paciente, "No encontrada"): no hay `meta.public`.
     */
    requiresAuth?: boolean
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
  },
  {
    // Vista pública de autoservicio: el paciente pide hora sin iniciar sesión.
    // El slug de la organización va en la URL porque el enlace es lo que
    // identifica a quién se le está pidiendo: el profesional comparte
    // /agendar-cita/su-organizacion por WhatsApp o redes.
    path: '/agendar-cita/:tenantSlug',
    name: 'agendarCita',
    component: AgendarCitaPage,
    props: true,
  },
  {
    // Panel del profesional: `PanelLayout` pone el sidebar y cada hija su
    // contenido. `requiresAuth` va en el padre; vue-router lo mezcla en el
    // `meta` de las hijas, así que el guard las cubre a todas.
    path: '/',
    component: PanelLayout,
    meta: { requiresAuth: true },
    children: [
      { path: '', name: 'home', component: DashboardPage },
      { path: 'agenda', name: 'agenda', component: AgendaPage },
      { path: 'solicitudes', name: 'solicitudes', component: SolicitudesPage },
      // Configuración de los recordatorios por correo del profesional (US-03).
      { path: 'recordatorios', name: 'recordatorios', component: RecordatoriosPage },
    ],
  },
  {
    // Cualquier otra URL: página "No encontrada" (antes, una página en blanco).
    // Es pública: ofrece el Resumen o el login según haya sesión. vue-router
    // ordena las rutas por especificidad, así que el comodín solo gana cuando
    // nada más calza (no tapa `/agendar-cita/:tenantSlug` ni las del panel).
    path: '/:pathMatch(.*)*',
    name: 'noEncontrada',
    component: NoEncontradaPage,
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

/**
 * Guard global: protege las rutas con `requiresAuth` y evita que un usuario ya
 * autenticado vuelva al login. Vive en `app` porque es la capa que conoce a la
 * vez el router y la sesión (`entities/session`).
 *
 * Antes de decidir, rehidrata la sesión desde el almacenamiento. En la primera
 * navegación (F5, pestaña nueva) es lo que restaura `currentUser`; en las
 * siguientes, recoge un token que venció con la pestaña abierta o un cambio
 * hecho en otra pestaña. Una sesión inválida se limpia y va al login.
 */
router.beforeEach((to) => {
  const session = useSessionStore()
  const authenticated = session.restoreSession()

  if (to.meta.requiresAuth && !authenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && authenticated) {
    return { name: 'home' }
  }
})
