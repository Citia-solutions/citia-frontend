# Módulo: Pages

## Estructura

```
src/pages/
├── login/
│   └── ui/
│       ├── LoginPage.vue    # Layout: grid 2 columnas (aside + panel)
│       └── AuthAside.vue    # Panel izquierdo: logo Citia, headline, estadísticas
├── home/
│   └── ui/
│       └── HomePage.vue     # Dashboard placeholder: saludo con nombre + botón logout
├── dashboard/
│   └── ui/
│       ├── DashboardPage.vue    # Resumen: topbar + métricas y citas del día
│       └── DashboardTopbar.vue
├── agenda/
│   └── ui/
│       └── AgendaPage.vue       # Agenda semanal + lista, modal nueva cita, voucher
├── solicitudes/
│   └── ui/
│       └── SolicitudesPage.vue  # Bandeja de solicitudes + enlace de agenda
└── agendar-cita/
    └── ui/
        └── AgendarCitaPage.vue  # Vista pública por secciones (flujo + stepper)
```

## Rutas

| Ruta           | Componente        | Requiere auth | Notas                                    |
|----------------|-------------------|---------------|------------------------------------------|
| `/login`       | `LoginPage`       | No            | Redirige a `/` si ya está autenticado    |
| `/agendar-cita/:tenantSlug` | `AgendarCitaPage` | No | Pública, split-screen 78/22, sin layout |
| `/`            | `DashboardPage`   | Sí            | Hija de `PanelLayout`; redirige a `/login?redirect=/` si no auth |
| `/agenda`      | `AgendaPage`      | Sí            | Hija de `PanelLayout` |
| `/solicitudes` | `SolicitudesPage` | Sí            | Hija de `PanelLayout` |

Las vistas autenticadas son hijas de `app/layouts/PanelLayout.vue` (sidebar + `<RouterView />`):
las páginas no pintan el sidebar.

## Convenciones

- Las páginas SOLO componen features y layouts; no contienen lógica de negocio
- `LoginPage` maneja la redirección post-login usando `route.query.redirect`
- El aside (`AuthAside`) es puramente decorativo/marketing — no tiene lógica
- `HomePage` usa `useSessionStore()` solo para leer `currentUser` y llamar `clearSession()`

## Responsive

- `LoginPage`: grid 2 columnas en ≥ 860px; 1 columna (solo panel) en < 860px
- El aside se oculta con CSS en móvil

## Dependencias Permitidas

- `src/features/auth/ui/*` (LoginForm, GoogleAuthButton)
- `src/entities/session/model/store` (leer estado, clearSession)
- `src/shared/ui/*` (BaseButton, etc.)
- `vue-router` (useRouter, useRoute)
