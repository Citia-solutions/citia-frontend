# Módulo: Pages

## Estructura

```
src/pages/
├── login/
│   └── ui/
│       ├── LoginPage.vue    # Layout: grid 2 columnas (aside + panel); redirección post-login
│       └── AuthAside.vue    # Panel izquierdo: logo (BaseLogo), headline y lo que Citia hace hoy
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
├── perfil/
│   └── ui/
│       └── PerfilPage.vue       # Mi perfil (US-10): pestañas locales + "Contactar soporte"; compone
│                                # editar-perfil, compartir-enlace-agenda, ver-suscripcion,
│                                # cambiar-contrasena y contactar-soporte
├── agendar-cita/
│   └── ui/
│       └── AgendarCitaPage.vue  # Vista pública por secciones (flujo + stepper)
├── cita-paciente/
│   └── ui/
│       └── CitaPacientePage.vue # Pública /cita#<token> (Fase 3): lee el token del fragmento, lo borra
│                                # de la URL (router.replace) y compone features/responder-cita
└── no-encontrada/
    └── ui/
        └── NoEncontradaPage.vue # 404: ruta pedida + enlace al Resumen (con sesión) o al login (sin ella)
```

## Rutas

| Ruta           | Componente        | Requiere auth | Notas                                    |
|----------------|-------------------|---------------|------------------------------------------|
| `/login`       | `LoginPage`       | No            | Redirige a `/` si ya está autenticado; respeta `?redirect=` (solo rutas internas) |
| `/agendar-cita/:tenantSlug` | `AgendarCitaPage` | No | Pública, split-screen 78/22, sin layout |
| `/cita` (`#<token>`) | `CitaPacientePage` | No | Ruta `citaPaciente`. Pública, sin layout, móvil primero. El token va en el **fragmento**: la página lo lee de `route.hash`, lo pasa en memoria al feature y lo borra con `router.replace({ hash: '' })` (no con un `replaceState` a mano: vue-router lo reescribiría). Sin token → "enlace no válido" sin llamar a la API. **Vigila `route.hash`**: un fragmento nuevo con la página abierta (otro enlace en la misma pestaña, sin recarga) se trata igual que al abrir y remonta el feature con `:key` (descarta todo lo anterior; solo GET) |
| `/`            | `DashboardPage`   | Sí            | Hija de `PanelLayout`; redirige a `/login?redirect=/` si no auth |
| `/agenda`      | `AgendaPage`      | Sí            | Hija de `PanelLayout` |
| `/solicitudes` | `SolicitudesPage` | Sí            | Hija de `PanelLayout` |
| `/recordatorios` | `RecordatoriosPage` | Sí          | Hija de `PanelLayout`; compone `features/configurar-recordatorios` |
| `/perfil`      | `PerfilPage`      | Sí            | Ruta `perfil`, hija de `PanelLayout` (US-10). Pestañas como estado local, sin rutas hijas ni query (ver [Mi perfil](#mi-perfil-perfil)) |
| `/:pathMatch(.*)*` | `NoEncontradaPage` | No         | Ruta `noEncontrada`: cualquier URL que no calce con otra. Pública, sin layout |

El guard solo lee `meta.requiresAuth` (en el padre `/`); el resto de las rutas son públicas por
omisión, sin `meta.public`.

Las vistas autenticadas son hijas de `app/layouts/PanelLayout.vue` (sidebar + `<RouterView />`):
las páginas no pintan el sidebar. El sidebar (`app/layouts/PanelSidebar.vue`) muestra la clínica, la
navegación, la sección **CUENTA** (*Mi perfil* y *Contactar soporte*, que monta su propio
`ContactarSoporteModal`), el usuario y su rol —un enlace a `/perfil`— y el botón **Cerrar sesión**, fuera de
ese enlace.

## Mi perfil (`/perfil`)

`PerfilPage` (US-10, [`context/Features/perfil-cuenta.md`](../../context/Features/perfil-cuenta.md)) solo compone:

| Pestaña | Compone | Notas |
|---------|---------|-------|
| *Información personal* | `InformacionPersonal` (`features/editar-perfil`) + `CopiarEnlaceAgenda` (`features/compartir-enlace-agenda`, tal como está, con su advertencia) | El feature pide `GET /usuarios/me` al montarse y refresca la sesión: el sidebar cambia solo |
| *Suscripción* | `SuscripcionOrganizacion` (`features/ver-suscripcion`) | **Solo con `useSessionStore().isAdmin`**: la pestaña y su panel no existen para un profesional. El permiso lo decide el backend (403) |
| *Seguridad* | `CambiarContrasenaForm` (`features/cambiar-contrasena`) | |

- **Pestañas = estado local** (F4): sin rutas hijas ni query; al recargar se vuelve a la primera. Patrón ARIA
  (`role="tablist"`, flechas, Inicio y Fin). Cada pestaña se **monta la primera vez que se abre** (`visitadas`) y
  después solo se oculta (`v-show`): el perfil se pide una vez, la suscripción solo si se mira y lo escrito no
  se pierde al cambiar de pestaña. Si la pestaña activa deja de existir (la sesión dejó de ser de un
  administrador), se vuelve a la primera.
- El botón **Contactar soporte** del encabezado abre `ContactarSoporteModal` (`features/contactar-soporte`); el
  sidebar monta otra instancia del mismo modal (ids únicos con `useId`).
- Los cuatro features no se conocen entre sí: la página no les pasa datos de uno a otro.

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
- `PerfilPage` lee `useSessionStore().isAdmin` solo para decidir si existe la pestaña *Suscripción*: es el
  único lugar del front que ramifica por rol
- `AuthAside` es presentacional, sin lógica. **No lleva cifras ni promesas que el producto no
  cumpla** (nada de dinero, porcentajes ni "recuperar cupos"): solo lo que Citia hace hoy
- Nada en `pages/` cierra la sesión: eso es del sidebar y del 401 global (`app/router/cerrarSesion.ts`)

## Responsive

- `LoginPage`: grid 2 columnas en ≥ 860px; 1 columna (solo panel) en < 860px
- El aside se oculta con CSS en móvil (en escritorio conserva su propio `display: flex`; no pisarlo
  desde `LoginPage`)

## Dependencias Permitidas

- `src/features/auth` (LoginForm)
- `PerfilPage`: `src/features/{editar-perfil,ver-suscripcion,cambiar-contrasena,contactar-soporte}` y
  `src/features/compartir-enlace-agenda`, por su `index.ts`
- `src/entities/session` (leer estado; `isAdmin` en `PerfilPage`)
- `src/shared/ui/*` (BaseButton, etc.)
- `vue-router` (useRouter, useRoute)
