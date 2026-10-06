# Módulo: Feature Auth

## Estructura

```
src/features/auth/
├── api/
│   └── authApi.ts          # login(credentials) → POST /auth/login (con { auth: false })
├── model/
│   ├── useLogin.ts         # Composable: estado form, validación, submit, errores
│   └── loginSchema.ts      # validateLogin(): clínica (slug) + email + password
└── ui/
    └── LoginForm.vue        # Form clínica/email/password + rememberMe + loading/error
```

## Tipos

```typescript
// authApi.ts
interface LoginCredentials { tenantSlug: string; email: string; password: string }
type LoginResponse = Session   // { user: AuthUser; token: string }, de entities/session
```

## Endpoints Consumidos

- `POST /auth/login` — body `{ tenantSlug, email, password }` → response
  `{ accessToken, usuario: { id, email, nombreCompleto, rol, tenantId, tenantSlug?, tenantNombre? } }`.
  `authApi.ts` lo traduce a `Session` (`nombreCompleto → name`, `ADMINISTRADOR/PROFESIONAL →
  admin/profesional`; `tenantSlug` y `tenantNombre` solo si vienen).
- Va con `{ auth: false }`: es pública, no lleva Bearer y su 401 no dispara el cierre global de sesión.

## Convenciones

- `useLogin.ts` expone: `{ values, errors, submitError, isSubmitting, submit }`
- Errores 401 → `submitError = 'Correo o contraseña incorrectos.'`
- Otros errores (incluida una respuesta sin usuario o sin token: `setSession` lanza) →
  `submitError = 'No pudimos iniciar sesión. Inténtalo de nuevo.'`
- `LoginForm` emite `success` tras guardar la sesión; la redirección la decide `LoginPage`
- `rememberMe: true` → token y usuario en `localStorage`; `false` → `sessionStorage`
- El campo "Clínica" muestra la ayuda *"El identificador de tu clínica, p. ej. clinica-demo."*

## Dependencias Permitidas

- `src/shared/api/httpClient` (HTTP)
- `src/entities/session` (setSession, AuthUser, Session, UserRole)
- `src/shared/ui/*` (componentes base)

## Notas

- **Sin Google OAuth, sin "¿Olvidaste tu clave?" y sin "Solicita una demo"** desde la limpieza
  previa al release (2026-10-05): ninguno tenía backend. El botón y el stub `loginWithGoogle()` se
  borraron; si algún día existe el flujo, se agrega aquí. Recuperar contraseña es `DT-03` del backend.
