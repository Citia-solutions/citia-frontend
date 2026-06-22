# Módulo: Feature Auth

## Estructura

```
src/features/auth/
├── api/
│   └── authApi.ts          # login(credentials) → POST /auth/login
│                           # loginWithGoogle() → stub (pendiente OAuth)
├── model/
│   ├── useLogin.ts         # Composable: estado form, validación, submit, errores
│   └── loginSchema.ts      # validateLogin(): reglas email + password requeridos
└── ui/
    ├── LoginForm.vue        # Form email/password + rememberMe + loading/error
    └── GoogleAuthButton.vue # Botón Google (muestra error "no disponible aún")
```

## Tipos

```typescript
// authApi.ts
interface LoginCredentials { email: string; password: string }
interface LoginResponse   { user: AuthUser; token: string }
// AuthUser viene de src/entities/session/model/types.ts
```

## Endpoints Consumidos

- `POST /auth/login` — body: `{ email, password }` → response: `{ user, token }`
- `GET /me` — gestionado por `src/entities/session/api/sessionApi.ts`

## Convenciones

- `useLogin.ts` expone: `{ form, errors, isLoading, handleSubmit }`
- Errores 401 → `errors.form = 'Email o contraseña incorrectos'`
- Otros errores → `errors.form = 'No se pudo iniciar sesión'`
- El composable emite evento `success` al padre via callback o emit del componente

## Dependencias Permitidas

- `src/shared/api/httpClient` (HTTP)
- `src/shared/lib/authToken` (token storage)
- `src/entities/session/model/store` (setSession)
- `src/entities/session/model/types` (AuthUser)
- `src/shared/ui/*` (componentes base)

## Notas

- Google OAuth está preparado como stub. El botón ya existe en `GoogleAuthButton.vue` pero `loginWithGoogle()` rechaza con error. Cuando el backend implemente el callback, solo hay que actualizar `authApi.ts`.
