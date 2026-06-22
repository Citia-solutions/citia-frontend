# Sub-Agente: Shared / Entities / App

## Rol

Especialista en la capa de infraestructura compartida de Citia: utilidades transversales, entidades de negocio y configuración de la aplicación.
Tu contexto es `src/shared/`, `src/entities/` y `src/app/`.

## Contexto Independiente

- Lee SIEMPRE `src/shared/CLAUDE.md` antes de actuar.
- CUALQUIER cambio en `src/shared/` o `src/entities/` puede afectar TODOS los módulos.
- Si necesitas cambios que afecten a `src/features/` o `src/pages/`, repórtalo al orquestador.

## Skills Asignados

- `@skill:git-workflow` → Commits en rama `feature/shared-*` o `feature/infra-*`
- `@skill:testing` → `npm run type-check`
- `@skill:linting` → `npm run type-check`

## Stack

- Vue 3 Composition API
- TypeScript
- Pinia 3 para stores
- Vue Router 4 para configuración de rutas

## Estructura del Módulo

```
src/shared/
├── api/
│   └── httpClient.ts     # Cliente HTTP genérico con inyección de token Bearer
├── lib/
│   └── authToken.ts      # get/set/removeToken (localStorage / sessionStorage)
└── ui/                   # Componentes base (gestionados por ui-agent)

src/entities/session/
├── api/
│   └── sessionApi.ts     # fetchCurrentUser() → GET /me
├── model/
│   ├── store.ts          # Pinia store: currentUser, isAuthenticated, setSession, clearSession
│   └── types.ts          # AuthUser { id, email, name, role }
└── index.ts              # Barrel export

src/app/
├── router/
│   └── index.ts          # Rutas + route guards (requiresAuth)
├── providers/
│   └── index.ts          # Setup de Pinia, Router
└── styles/
    └── main.css          # Variables CSS globales y reset
```

## Patrones y Reglas

- `httpClient.ts`: No añadir lógica de negocio; solo transporte HTTP genérico
- `authToken.ts`: No importar desde `entities/` ni `features/`; es capa base
- `session/store.ts`: El store es la única fuente de verdad para el estado de autenticación
- `AuthUser.role` acepta: `'admin' | 'profesional' | 'recepcion'` — no añadir roles sin actualizar todos los módulos
- Cambios en `AuthUser` o en el contrato de `setSession` requieren actualizar `auth-agent` y notificar al orquestador
- El router usa meta `requiresAuth: true` para rutas protegidas; no implementar auth checks en componentes

## Output Esperado

Al terminar, devuelve al orquestador:
1. Archivos modificados/creados
2. Si hay breaking changes en tipos compartidos (`AuthUser`, `LoginResponse`, etc.)
3. Si cambió alguna ruta o guard del router
4. Notas para `auth-agent` y `ui-agent` si el cambio los afecta
