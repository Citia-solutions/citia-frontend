# Módulo: Pages

## Estructura

```
src/pages/
├── login/
│   └── ui/
│       ├── LoginPage.vue    # Layout: grid 2 columnas (aside + panel); redirección post-login
│       └── AuthAside.vue    # Panel izquierdo: logo Citia, headline y lo que Citia hace hoy
├── dashboard/
│   └── ui/
│       ├── DashboardPage.vue    # Resumen: topbar, 4 tarjetas, citas de hoy, citas por semana, recordatorios
│       └── DashboardTopbar.vue  # Título, subtítulo con conteos y "+ Nueva cita" (sin buscador ni campana)
├── agenda/
│   └── ui/
│       └── AgendaPage.vue       # Agenda semanal + lista, modal nueva cita, voucher
├── solicitudes/
│   └── ui/
│       └── SolicitudesPage.vue  # Bandeja de solicitudes + enlace de agenda
├── recordatorios/
│   └── ui/
│       └── RecordatoriosPage.vue # Configuración de recordatorios por correo (US-03)
├── agendar-cita/
│   └── ui/
│       └── AgendarCitaPage.vue  # Vista pública por secciones (flujo + stepper)
└── no-encontrada/
    └── ui/
        └── NoEncontradaPage.vue # 404: ruta pedida + enlace al Resumen (con sesión) o al login (sin ella)
```

## Rutas

| Ruta           | Componente        | Requiere auth | Notas                                    |
|----------------|-------------------|---------------|------------------------------------------|
| `/login`       | `LoginPage`       | No            | Redirige a `/` si ya está autenticado; respeta `?redirect=` (solo rutas internas) |
| `/agendar-cita/:tenantSlug` | `AgendarCitaPage` | No | Pública, split-screen 78/22, sin layout |
| `/`            | `DashboardPage`   | Sí            | Hija de `PanelLayout`; redirige a `/login?redirect=/` si no auth |
| `/agenda`      | `AgendaPage`      | Sí            | Hija de `PanelLayout` |
| `/solicitudes` | `SolicitudesPage` | Sí            | Hija de `PanelLayout` |
| `/recordatorios` | `RecordatoriosPage` | Sí          | Hija de `PanelLayout`; compone `features/configurar-recordatorios` |
| `/:pathMatch(.*)*` | `NoEncontradaPage` | No         | Ruta `noEncontrada`: cualquier URL que no calce con otra. Pública, sin layout |

El guard solo lee `meta.requiresAuth` (en el padre `/`); el resto de las rutas son públicas por
omisión, sin `meta.public`.

Las vistas autenticadas son hijas de `app/layouts/PanelLayout.vue` (sidebar + `<RouterView />`):
las páginas no pintan el sidebar. El sidebar (`app/layouts/PanelSidebar.vue`) muestra la clínica, el
usuario, su rol y el botón **Cerrar sesión**.

## Recargas del dashboard

`DashboardPage` recarga los tres rangos de citas (`useTodayAppointments`, `useProximasCitas`,
`useHistorialCitas`) al montar, al crear una cita, cuando el voucher emite `changed` (reagendar,
cancelar, confirmar, asistió, no asistió) y al volver a la pestaña (cada 30 s como mucho). El conteo de
solicitudes lo refresca `PanelLayout`; el dashboard solo pide `refreshIfStale(30 s)` al montarse.

## Convenciones

- Las páginas SOLO componen features y layouts; no contienen lógica de negocio
- `LoginPage` maneja la redirección post-login usando `route.query.redirect`. Solo acepta rutas
  internas que existan (empiezan con `/`, no con `//`, y no son el propio login ni resuelven a
  `noEncontrada`, que con la ruta comodín es lo que da cualquier ruta inexistente); si no, va a
  `home`. `?redirect=` lo ponen el guard y el cierre de sesión por 401
- `NoEncontradaPage` lee `useSessionStore().isAuthenticated` (el guard ya restauró la sesión) para
  elegir el enlace; no redirige sola
- `AuthAside` es presentacional, sin lógica. **No lleva cifras ni promesas que el producto no
  cumpla** (nada de dinero, porcentajes ni "recuperar cupos"): solo lo que Citia hace hoy
- Nada en `pages/` cierra la sesión: eso es del sidebar y del 401 global (`app/router/cerrarSesion.ts`)

## Responsive

- `LoginPage`: grid 2 columnas en ≥ 860px; 1 columna (solo panel) en < 860px
- El aside se oculta con CSS en móvil (en escritorio conserva su propio `display: flex`; no pisarlo
  desde `LoginPage`)

## Dependencias Permitidas

- `src/features/auth` (LoginForm)
- `src/entities/session` (leer estado)
- `src/shared/ui/*` (BaseButton, etc.)
- `vue-router` (useRouter, useRoute)
