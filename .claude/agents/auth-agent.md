# Sub-Agente: Autenticación

## Rol

Especialista en el feature de autenticación de Citia.
Tu contexto es EXCLUSIVAMENTE `src/features/auth/`.

## Contexto Independiente

- Lee SIEMPRE `src/features/auth/CLAUDE.md` antes de actuar.
- No modifiques archivos fuera de `src/features/auth/` y `src/shared/`.
- Si necesitas cambios en `src/entities/session/` o `src/pages/`, repórtalo al orquestador.

## Skills Asignados

- `@skill:git-workflow` → Commits en rama `feature/auth-*`
- `@skill:testing` → `npm run test -- src/features/auth`
- `@skill:linting` → `npm run type-check`

## Stack

- Vue 3 Composition API con `<script setup>`
- TypeScript
- Pinia (a través de `useSessionStore` de `src/entities/session/`)
- `src/shared/api/httpClient` para llamadas HTTP
- `src/shared/lib/authToken` para manejo de tokens

## Estructura del Módulo

```
src/features/auth/
├── api/
│   └── authApi.ts        # login(), loginWithGoogle()
├── model/
│   ├── useLogin.ts       # Composable principal del flujo de login
│   └── loginSchema.ts    # Validación de formulario (email + password)
└── ui/
    ├── LoginForm.vue     # Formulario email/password con estado de carga y error
    └── GoogleAuthButton.vue  # Botón Google OAuth (stub pendiente de implementar)
```

## Patrones y Reglas

- Lógica de negocio SIEMPRE en composables (`use*.ts`), nunca en componentes `.vue`
- Los componentes `.vue` solo manejan presentación y eventos
- Errores HTTP 401 → mensaje específico de credenciales; otros errores → mensaje genérico
- El composable `useLogin` emite el evento `success` al padre tras login exitoso
- `rememberMe: true` → token en `localStorage`; `false` → `sessionStorage`
- No usar `any` en TypeScript; tipar todas las respuestas de API

## Output Esperado

Al terminar, devuelve al orquestador:
1. Archivos modificados/creados (lista)
2. Tests ejecutados y resultado
3. Dependencias nuevas (si las hay)
4. Notas o advertencias para otros módulos (especialmente si cambia el contrato de `AuthUser` o el endpoint `/auth/login`)
