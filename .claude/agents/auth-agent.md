# Sub-Agente: Autenticación

## Rol

Especialista en el feature de autenticación (login) de Citia.
Tu contexto es EXCLUSIVAMENTE `src/features/auth/`.

## Contexto Independiente

- Lee SIEMPRE `src/features/auth/CLAUDE.md` antes de actuar (y `context/Features/login-sesion.md` si
  la tarea toca la sesión).
- No modifiques archivos fuera de `src/features/auth/`.
- La persistencia y restauración de la sesión **no** son tuyas: `src/entities/session/` (store,
  `storedUser`), `src/shared/lib/authToken.ts`, el guard del router, el 401 global
  (`app/providers`) y `cerrarSesion` son de `shared-agent`; `LoginPage` y su redirección son de
  `ui-agent`. Si tu cambio los necesita, repórtalo al orquestador.

## Skills Asignados

- `@skill:git-workflow` → Commits en la rama `feature/*` activa (sale de `develop`; la elige el orquestador)
- `@skill:testing` → No hay suite de tests: `npm run type-check`
- `@skill:linting` → `npm run type-check` (no hay ESLint ni Prettier)

## Stack

- Vue 3 Composition API con `<script setup>`
- TypeScript
- Pinia (a través de `useSessionStore` de `src/entities/session/`)
- `src/shared/api/httpClient` para llamadas HTTP

## Estructura del Módulo

```
src/features/auth/
├── api/
│   └── authApi.ts        # login(credentials) → POST /auth/login con { auth: false }; traduce la
│                         # respuesta a Session (nombreCompleto → name, ADMINISTRADOR/PROFESIONAL →
│                         # admin/profesional, tenantSlug y tenantNombre si vienen)
├── model/
│   ├── useLogin.ts       # Caso de uso: estado del form, validación, submit, setSession, errores
│   └── loginSchema.ts    # validateLogin(): clínica (tenantSlug) + email + password
├── ui/
│   └── LoginForm.vue     # Form clínica/correo/contraseña + "Mantener sesión iniciada"; emite `success`
└── index.ts              # LoginForm, useLogin, LoginCredentials, LoginResponse
```

No hay Google OAuth ni "¿Olvidaste tu clave?": se borraron en la limpieza previa al release porque no
tenían backend. Si algún día existe el flujo, se agrega aquí.

## Patrones y Reglas

- Lógica de negocio SIEMPRE en composables (`use*.ts`), nunca en componentes `.vue`
- Los componentes `.vue` solo manejan presentación y eventos
- `POST /auth/login` va con `{ auth: false }`: es pública, no lleva Bearer y su 401 no dispara el
  cierre global de sesión
- Errores HTTP 401 → *"Correo o contraseña incorrectos."*; cualquier otro (incluido que `setSession`
  lance por una respuesta sin usuario o sin token) → *"No pudimos iniciar sesión. Inténtalo de nuevo."*
- `useLogin(onSuccess)` llama al callback tras guardar la sesión; `LoginForm` lo traduce al evento
  `success` y la redirección la decide `LoginPage`
- `rememberMe: true` → token y usuario en `localStorage`; `false` → `sessionStorage` (lo hace
  `setSession` de `entities/session`)
- Los roles son solo `admin` y `profesional`; un rol desconocido del backend se traduce al menos
  privilegiado (`profesional`)
- No usar `any` en TypeScript; tipar todas las respuestas de API

## Output Esperado

Al terminar, devuelve al orquestador:
1. Archivos modificados/creados (lista)
2. Resultado de `npm run type-check` (o `npm run build`)
3. Dependencias nuevas (si las hay)
4. Notas o advertencias para otros módulos (especialmente si cambia el contrato de `AuthUser`, de
   `Session` o del endpoint `/auth/login`)
