# Módulo: Entities

## Propósito

Entidades de negocio con su estado global. Actualmente solo existe `session` (usuario autenticado).

## Estructura

```
src/entities/
└── session/
    ├── api/
    │   └── sessionApi.ts    # fetchCurrentUser() → GET /me → AuthUser
    ├── model/
    │   ├── store.ts          # Pinia store: useSessionStore()
    │   └── types.ts          # AuthUser { id, email, name, role }
    └── index.ts             # Barrel: export { useSessionStore, AuthUser, ... }
```

## Store: useSessionStore()

```typescript
// Estado
currentUser: Ref<AuthUser | null>
isAuthenticated: ComputedRef<boolean>  // true si currentUser !== null

// Acciones
setSession(user: AuthUser, token: string, persistent: boolean): void
clearSession(): void
```

## Tipos Compartidos

```typescript
interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'profesional' | 'recepcion'
  tenantSlug?: string // del login (cierre de Fase 1); arma el enlace /agendar-cita/:tenantSlug
}
```

## Otros slices

- `appointment/` — citas: tipos, estados, `toAppointment`, stores `useTodayAppointments` (`/citas/hoy`)
  y `useAgendaAppointments` (`/citas?desde&hasta`), `AvisoSolapamiento` (ADR-11).
- `recordatorio/` — recordatorios por correo (US-03): tipos (`EstadoRecordatorio`, `MotivoRecordatorio`),
  `getRecordatoriosDeCita` (`/citas/:id/recordatorios`), presentación (etiqueta y color del estado,
  motivo en español, `describirAntelacion`, `lineaDeTiempo`) y `RecordatorioEstadoBadge`. Nombra en
  español. Lo usan el voucher y la pantalla de configuración.
- `solicitud/` — solicitudes del enlace público: `toSolicitud`, `getSolicitudes(estado)`, store
  `useSolicitudesRecibidas` (píldora del sidebar). Nombra en español, como el backend.

## Reglas

- `AuthUser.role` es un union type — añadir un rol nuevo requiere actualizar route guards y posiblemente la UI
- `setSession` almacena el token (via `authToken`) Y actualiza `currentUser`
- `clearSession` limpia tanto el store como el token del storage
- Solo importar de `src/shared/`; nunca de `features/` ni `pages/`
