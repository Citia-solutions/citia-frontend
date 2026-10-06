# Módulo: Entities

## Propósito

Entidades de negocio con su estado global: `session` (usuario autenticado), `appointment`,
`recordatorio` y `solicitud` (ver "Otros slices").

## Estructura de `session`

```
src/entities/
└── session/
    ├── model/
    │   ├── store.ts          # Pinia store: useSessionStore()
    │   ├── storedUser.ts     # saveUser / loadUser / removeUser — el AuthUser junto al token
    │   ├── role.ts           # ROLE_LABELS, roleLabel(role), isUserRole(value)
    │   └── types.ts          # AuthUser, UserRole, Session
    └── index.ts             # Barrel: useSessionStore, roleLabel, AuthUser, Session, UserRole
```

No hay `api/`: el backend no tiene `GET /me` (DTF-02, cerrada). La sesión se rehidrata desde el
almacenamiento del navegador.

## Store: useSessionStore()

```typescript
// Estado
currentUser: Ref<AuthUser | null>
isAuthenticated: ComputedRef<boolean>  // currentUser != null (ni null ni undefined, DTF-01)

// Acciones
setSession(user: AuthUser, token: string, persistent: boolean): void  // lanza si falta user o token
clearSession(): void
restoreSession(): boolean  // rehidrata desde el almacenamiento; si no sirve, limpia y da false
```

## Persistencia de la sesión

| Clave | Contenido | Dónde |
|-------|-----------|-------|
| `citia.token` | JWT (`shared/lib/authToken`) | `localStorage` con "Mantener sesión iniciada", si no `sessionStorage` |
| `citia.user` | `AuthUser` en JSON (`model/storedUser.ts`) | El mismo almacenamiento que el token |

- `setSession` escribe los dos (limpiando antes ambos almacenamientos) y actualiza `currentUser`.
- `restoreSession` lo llama el **guard del router en cada navegación** (`app/router/index.ts`): en la
  primera (F5, pestaña nueva) restaura la sesión; en las siguientes recoge un token vencido o un cambio
  hecho en otra pestaña. Limpia todo si falta el token o el usuario, si el JWT no se puede leer o ya
  venció (`exp`, leído sin verificar la firma), si el usuario no tiene la forma esperada (JSON roto,
  rol desconocido) o si el `sub` del token no es el `id` del usuario.
- `clearSession` borra el store y las dos claves de ambos almacenamientos.

## Tipos Compartidos

```typescript
type UserRole = 'admin' | 'profesional'   // los dos que emite el backend (DTF-04, cerrada)

interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  tenantSlug?: string   // del login (cierre de Fase 1); arma el enlace /agendar-cita/:tenantSlug
  tenantNombre?: string // del login (2026-10-05); nombre de la clínica en el sidebar
}
```

## Otros slices

- `appointment/` — citas: tipos, estados, `toAppointment`, stores `useTodayAppointments` (`/citas/hoy`)
  y `useAgendaAppointments` (`/citas?desde&hasta`), `AvisoSolapamiento` (ADR-11).
  - `status.ts`: etiqueta y color de cada estado (los usan lista, agenda y voucher), `isTerminalStatus`,
    `isActiveStatus` (vigente = `pendiente`/`confirmada`), `hasStarted` (`inicio <= ahora`) e
    `isPastAppointment`. **Solo presentación**: qué acciones se ofrecen lo decide `accionesPermitidas`.
  - `useTodayAppointments`: sus conteos (`scheduledCount` = no canceladas, `pendingCount`, …) los leen el
    topbar y la tarjeta "Citas hoy"; no dupliques esos cálculos.
  - `useAgendaAppointments.setRange(desde, hasta, { forzar })`: sin `forzar` no repite un rango ya
    cargado; la agenda pasa `forzar: true` al montarse (2026-10-05).
- `recordatorio/` — recordatorios por correo (US-03): tipos (`EstadoRecordatorio`, `MotivoRecordatorio`),
  `getRecordatoriosDeCita` (`/citas/:id/recordatorios`), `getConfiguracionRecordatorios` +
  `ConfiguracionRecordatoriosDto` (`GET /recordatorios/configuracion`, aquí desde el 2026-10-05 porque lo
  leen la pantalla de configuración y el dashboard), presentación (etiqueta y color del estado, motivo en
  español, `describirAntelacion`, `describirAntelaciones` → "24 h y 2 h antes", `lineaDeTiempo`) y
  `RecordatorioEstadoBadge`. Nombra en español.
- `solicitud/` — solicitudes del enlace público: `toSolicitud`, `getSolicitudes(estado)`, store
  `useSolicitudesRecibidas` (píldora del sidebar y tarjeta "Solicitudes por responder" del dashboard:
  `total`, `loading`, `error`; un `refresh()` con otro en curso espera ese en vez de pedir de nuevo).
  Nombra en español, como el backend.

## Reglas

- `UserRole` es un union type — un rol nuevo se agrega en `types.ts`, en `ROLE_LABELS` (`role.ts`) y
  en la traducción de `features/auth/api/authApi.ts`. Un `citia.user` guardado con un rol que ya no
  existe se descarta al restaurar
- El store es la fuente de verdad en memoria; el almacenamiento es lo que sobrevive a un F5, y
  `restoreSession` mantiene uno al día con el otro
- Solo importar de `src/shared/`; nunca de `features/` ni `pages/`
