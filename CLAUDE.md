# Proyecto: Citia Frontend

## Rol: Agente Orquestador

Eres el agente principal de este proyecto. Tu trabajo es:
1. Analizar la tarea del usuario
2. Decidir qué sub-agente(s) necesitan actuar
3. Delegar tareas usando los comandos disponibles
4. Consolidar resultados y reportar al usuario

## Descripción del Proyecto

Citia es el frontend (SPA) de un sistema de gestión de citas para clínicas, **multi-organización**: se
inicia sesión indicando la clínica (`tenantSlug`), el correo y la contraseña. El backend es
`citia-backend` (NestJS); los contratos de la API y las decisiones de arquitectura (ADRs) se documentan
allí.

Lo que existe hoy:

| Ruta | Qué es | Auth |
|------|--------|------|
| `/login` | Login con clínica + correo + contraseña y "Mantener sesión iniciada". Sin Google OAuth ni recuperación de contraseña | No |
| `/` | **Resumen** (dashboard): topbar con conteos y "+ Nueva cita", cuatro tarjetas con datos reales (citas hoy, próxima cita, próximos 7 días, solicitudes por responder), "Citas de hoy", "Citas por semana" y resumen de recordatorios | Sí |
| `/agenda` | Agenda del profesional: semana + lista por rango, "Nueva cita" y voucher | Sí |
| `/solicitudes` | Bandeja de solicitudes del enlace público (aceptar / rechazar) y botón para copiar el enlace de agenda | Sí |
| `/recordatorios` | Configuración de los recordatorios por correo (US-03) | Sí |
| `/agendar-cita/:tenantSlug` | Flujo público: el paciente pide hora sin cuenta (`POST /publico/:tenantSlug/solicitudes`) | No |

- **Voucher de la cita** (se abre desde el Resumen y desde la agenda): reagendar, cancelar, confirmar,
  registrar asistencia / inasistencia (solo desde la hora de inicio), estado de los recordatorios de
  la cita y editar el contacto del paciente. Qué botones existen lo decide `accionesPermitidas` del
  backend.
- Las rutas autenticadas son hijas de `app/layouts/PanelLayout.vue`; el sidebar
  (`PanelSidebar.vue`) muestra la clínica, el usuario, su rol y **Cerrar sesión**.
- **Roles:** el backend emite solo `ADMINISTRADOR` y `PROFESIONAL`, que el front traduce a
  `UserRole = 'admin' | 'profesional'` (`entities/session/model/types.ts`). No hay más roles. Hoy el
  front no ramifica por rol: solo muestra la etiqueta en el sidebar.

### Sesión: cómo se persiste y se restaura

No hay `GET /me`: la sesión se rehidrata desde el navegador. Detalle en `src/entities/CLAUDE.md` y en
`context/Features/login-sesion.md`.

- **Login** (`features/auth`): `setSession(user, token, rememberMe)` guarda el JWT en `citia.token`
  (`shared/lib/authToken`) y el `AuthUser` en `citia.user` (`entities/session/model/storedUser.ts`),
  los dos en `localStorage` con "Mantener sesión iniciada" o en `sessionStorage` si no.
- **Restaurar:** el guard del router (`app/router/index.ts`) llama a `restoreSession()` antes de **cada**
  navegación. Acepta la sesión solo si hay token y usuario, el JWT se puede leer (se leen `sub` y `exp`
  sin verificar la firma), no venció, su `sub` es el `id` del usuario y el rol es conocido; si no,
  limpia todo y una ruta protegida manda a `/login?redirect=<ruta>`.
- **401 global:** `httpClient` avisa a `onUnauthorized` cuando una petición autenticada recibe 401; el
  handler (`app/providers/index.ts`) cierra la sesión y lleva al login recordando la ruta. Las llamadas
  públicas (el login incluido) van con `{ auth: false }` y no lo disparan.
- **Cerrar sesión:** `cerrarSesion(router, redirect?)` (`app/router/cerrarSesion.ts`) limpia la sesión y
  navega al login con una carga completa de la página, para no dejar en memoria datos del usuario
  anterior. Lo usan el botón del sidebar y el 401 global.

## Stack Tecnológico

- **Vue 3.5** (Composition API + `<script setup>`)
- **TypeScript** ~6.0 (`vue-tsc` para el type-check)
- **Vite** 8 como build tool (dev server en el puerto **3002**)
- **Pinia** 3 para estado global
- **Vue Router** 4 con route guards
- **CSS** custom properties en `src/app/styles/main.css` (sin frameworks externos como Tailwind)
- HTTP con `fetch` nativo a través de `src/shared/api/httpClient.ts`; fechas sin librerías
  (`src/shared/lib/fecha.ts`)
- Node `^22.18.0 || >=24.12.0`
- **Sin suite de tests ni ESLint/Prettier configurados.** La verificación es `npm run build`, que corre
  `vue-tsc` y el build de Vite; los cambios visibles se prueban en el navegador, con respuestas
  simuladas (`fetch`) cuando no hay backend

| Acción | Comando |
|--------|---------|
| Dev | `npm run dev` |
| Type-check + build | `npm run build` |
| Solo type-check | `npm run type-check` |
| Solo build | `npm run build-only` |

## Arquitectura: Feature-Sliced Design (FSD)

```
src/
├── app/          # Arranque y configuración global: router (+ guard y cerrarSesion), providers
│                 # (Pinia, router, handler del 401), layouts del panel, estilos raíz
├── pages/        # Composición de pantallas: login, dashboard, agenda, solicitudes,
│                 # recordatorios, agendar-cita (pública)
├── features/     # Casos de uso (ui + model + api):
│   ├── auth/                      # login
│   ├── dashboard/                 # widgets del Resumen
│   ├── agenda/                    # agenda semanal + lista
│   ├── crear-cita/                # modal "Nueva cita" y flujo público del paciente
│   ├── gestionar-cita/            # voucher: reagendar, cancelar, confirmar, asistencia, contacto
│   ├── bandeja-solicitudes/       # aceptar / rechazar solicitudes
│   ├── compartir-enlace-agenda/   # copiar el enlace /agendar-cita/:tenantSlug
│   └── configurar-recordatorios/  # configuración de recordatorios por correo
├── entities/     # Entidades de negocio: session, appointment, recordatorio, solicitud
└── shared/       # api (httpClient, errores de validación), config (bloques horarios),
                  # lib (authToken, fecha, rut), ui (componentes Base*)
```

**Regla FSD crítica:** una capa solo importa de las que están **debajo**, nunca al revés:
`app` → `pages` → `features` → `entities` → `shared`. Un slice tampoco importa de otro slice de su
misma capa (un feature no importa de otro feature). `app` es la capa superior: el router importa las
páginas y `entities/session`.

Desde fuera de un slice se importa por su `index.ts` (API pública), no por archivos internos. Hoy hay una
excepción: `pages/agendar-cita` importa `@/features/crear-cita/model/flujoCitaModel`.

**Contexto por capa** (léelo antes de tocar esa carpeta): `src/shared/CLAUDE.md`,
`src/entities/CLAUDE.md`, `src/features/auth/CLAUDE.md`, `src/pages/CLAUDE.md`. Los demás features no
tienen `CLAUDE.md` propio: su contrato y sus decisiones están en `context/Features/<feature>.md`.

## Backend y despliegue

- **Backend:** NestJS + Postgres en **Railway**, con un entorno de staging y uno de producción.
  Contratos y ADRs en `citia-backend/context/`.
- **Frontend:** **Netlify**, un sitio por entorno: rama `develop` → **staging**, rama `main` →
  **producción**. Build `npm run build`, publish directory `dist/`.
- `public/_redirects` (`/*  /index.html  200`) es el fallback de la SPA: sin él, recargar una ruta que no
  sea `/` da 404.
- **`VITE_API_URL`**: URL del backend **incluido el prefijo `/api`**. Vite la incrusta al compilar, así que
  en Netlify va como variable de entorno **de cada sitio** (apuntando al backend de Railway de ese
  entorno). En local va en `.env` (plantilla en `.env.example`: `http://localhost:3000/api`). Sin ella el
  front usa `/api` del mismo dominio.
- El dominio de cada sitio tiene que estar en el CORS del backend de su entorno (`FRONTEND_URL` /
  `CORS_ORIGENES_EXTRA`).
- Detalle: `context/stack-tecnologico.md` § Despliegue: Netlify.

## Reglas de Orquestación

- NUNCA modifiques código directamente. Delega a sub-agentes.
- Antes de delegar, verifica qué módulos se ven afectados.
- Si una tarea toca múltiples módulos, coordina la secuencia respetando el orden FSD: shared → entities → features → pages.
- Después de cada sub-agente, valida que no haya conflictos entre capas.
- Antes de cerrar, `npm run build` sin errores.

## Convenciones Globales

- **Git Flow:** `main` = producción, `develop` = integración (staging). Las ramas salen de `develop`
  (`feature/<descripcion>`; `chore/…` para lo que no es una feature) y vuelven a `develop` por PR. Un
  release es `develop` → `main`. Conventional Commits (`feat:`, `fix:`, `chore:`, `refactor:`, `docs:`).
- **Nombres:** PascalCase para componentes Vue; camelCase para funciones, variables y archivos `.ts`
  (`useLogin.ts`, `httpClient.ts`); kebab-case para carpetas de slices (`gestionar-cita`) y rutas
  (`/agendar-cita`).
- **Idioma:** el código de negocio nuevo se nombra en español, como el backend (`recordatorio`,
  `solicitud`, los features). `session` y `appointment` conservan identificadores en inglés; los valores
  que vienen del contrato (estados, acciones) se usan tal cual.
- **Imports:** relativos dentro del mismo slice; con el alias `@/` hacia otras capas
  (`@/entities/appointment`, `@/shared/ui/BaseButton.vue`).
- **Documentación:** `context/` (Features, Deudas `DTF-*`, planes en `us/`). Una feature nueva o un
  cambio de contrato se refleja en `context/Features/`.

## Comandos Disponibles

- `/orchestrate <tarea>` → Orquestar tarea completa multi-módulo
- `/review <alcance>` → Revisión cruzada entre capas FSD

## Sub-Agentes Disponibles

| Agente         | Dominio                                                                    | Contexto                                      |
|----------------|----------------------------------------------------------------------------|-----------------------------------------------|
| `auth-agent`   | `src/features/auth/` (login y su contrato con la sesión)                   | `src/features/auth/CLAUDE.md`                 |
| `ui-agent`     | `src/pages/`, `src/shared/ui/` y los features del panel y del flujo público: `dashboard`, `agenda`, `crear-cita`, `gestionar-cita`, `bandeja-solicitudes`, `compartir-enlace-agenda`, `configurar-recordatorios` | `src/pages/CLAUDE.md` + `context/Features/<feature>.md` |
| `shared-agent` | `src/shared/` (salvo `ui/`), `src/entities/` y `src/app/` (router, guard, providers, layouts, estilos), más `public/_redirects` y `.env.example` | `src/shared/CLAUDE.md` + `src/entities/CLAUDE.md` |

Cada carpeta de `src/` tiene un solo dueño. Un cambio que cruza dominios (p. ej. un campo nuevo en una
entidad que después muestra el voucher) se reparte en orden FSD: primero `shared-agent`, luego
`ui-agent` o `auth-agent`.
