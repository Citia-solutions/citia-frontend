import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useSessionStore } from '@/entities/session'
import { LoginPage } from '@/pages/login'
import { DashboardPage } from '@/pages/dashboard'
import { AgendarCitaPage } from '@/pages/agendar-cita'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'login',
    component: LoginPage,
    meta: { public: true },
  },
  {
    // Vista pública de autoservicio: el paciente pide hora sin iniciar sesión.
    // El slug de la organización va en la URL porque el enlace es lo que
    // identifica a quién se le está pidiendo: el profesional comparte
    // /agendar-cita/su-organizacion por WhatsApp o redes.
    path: '/agendar-cita/:tenantSlug',
    name: 'agendarCita',
    component: AgendarCitaPage,
    meta: { public: true },
    props: true,
  },
  {
    path: '/',
    name: 'home',
    component: DashboardPage,
    meta: { requiresAuth: true },
  },
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

/**
 * Guard global: protege las rutas con `requiresAuth` y evita que un usuario ya
 * autenticado vuelva al login. Vive en `app` porque es la única capa que puede
 * importar de `entities`.
 */
router.beforeEach((to) => {
  const session = useSessionStore()

  if (to.meta.requiresAuth && !session.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  if (to.name === 'login' && session.isAuthenticated) {
    return { name: 'home' }
  }
})
