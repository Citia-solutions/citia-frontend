# Comando: Orquestar Tarea

Analiza la solicitud `$ARGUMENTS` y ejecuta este flujo:

## Paso 1: Análisis

- ¿Qué capas FSD y qué slices se ven afectados?
  - `shared/` — `api` (httpClient, errores de validación), `config` (bloques horarios, zona horaria),
    `lib` (authToken, fecha, rut), `ui` (componentes `Base*`)
  - `entities/` — `session`, `appointment`, `recordatorio`, `solicitud`
  - `features/` — `auth`, `dashboard`, `agenda`, `crear-cita`, `gestionar-cita`,
    `bandeja-solicitudes`, `compartir-enlace-agenda`, `configurar-recordatorios`
  - `pages/` — `login`, `dashboard`, `agenda`, `solicitudes`, `recordatorios`, `agendar-cita`,
    `no-encontrada`
  - `app/` — router (guard, `cerrarSesion`), providers (Pinia, router, 401 global), layouts del
    panel, estilos globales
- ¿Hay dependencias entre capas? Una capa solo importa de las de **abajo**:
  `app` → `pages` → `features` → `entities` → `shared`. Un slice no importa de otro slice de su misma
  capa (un feature no importa de otro feature): lo compartido baja a `entities/` o `shared/`.
- ¿Cuál es el orden de ejecución? Siempre de capas bajas a altas:
  `shared` → `entities` → `features` → `pages` → `app`.
- ¿Cambia algún contrato con el backend? Los contratos y ADRs viven en `citia-backend/context/`.

## Paso 2: Plan

Presenta al usuario:

- Sub-agentes que se activarán y qué le toca a cada uno (cada carpeta tiene un solo dueño):

  | Agente | Dominio |
  |--------|---------|
  | `shared-agent` | `src/shared/` (salvo `ui/`), `src/entities/`, `src/app/`, `public/_redirects`, `.env.example` |
  | `auth-agent` | `src/features/auth/` |
  | `ui-agent` | `src/pages/`, `src/shared/ui/` y los features `dashboard`, `agenda`, `crear-cita`, `gestionar-cita`, `bandeja-solicitudes`, `compartir-enlace-agenda`, `configurar-recordatorios` |

- Orden de ejecución: en un cambio que cruza dominios, primero `shared-agent` y después `auth-agent`
  o `ui-agent` (que pueden ir en paralelo si no se tocan entre sí).
- Riesgos o conflictos potenciales: breaking changes en tipos compartidos (`AuthUser`, `Session`,
  `Appointment`, DTOs, `HttpError`), cambios en rutas o en el guard, contratos de API.
- La rama: `feature/<descripcion>` (o `chore/<descripcion>`) creada desde `develop` actualizado,
  según `@skill:git-workflow`. Nunca se trabaja en `main` ni en `develop`.

Espera confirmación antes de ejecutar.

## Paso 3: Ejecución Secuencial

Para cada sub-agente involucrado:

1. Cargar su definición desde `.claude/agents/<nombre>.md`
2. Cargar el contexto de lo que va a tocar: `src/shared/CLAUDE.md`, `src/entities/CLAUDE.md`,
   `src/pages/CLAUDE.md` o `src/features/auth/CLAUDE.md`. Los demás features no tienen
   `CLAUDE.md` propio: su contexto es `context/Features/<feature>.md` (tabla en
   `.claude/agents/ui-agent.md`)
3. Cargar los skills necesarios desde `.claude/skills/`
4. Ejecutar la tarea delegada
5. Recoger el output estructurado del sub-agente

## Paso 4: Consolidación

- Verificar que no haya imports que violen las capas FSD ni imports entre slices de la misma capa
- Verificar que `npm run build` (incluye `vue-tsc`) pase sin errores. No hay tests ni ESLint
- Si el cambio se ve, probarlo en el navegador (`npm run dev`, puerto 3002), con `fetch` simulado
  si no hay backend
- Actualizar `context/` (`Features/`, deudas `DTF-*`) y los `CLAUDE.md` de capa si cambió su
  contrato o su estructura
- Reportar resumen completo al usuario

## Paso 5: Commit

- Solo si el usuario lo pide
- Commits organizados por capa/módulo en la rama `feature/*` o `chore/*`; PR a `develop`
- Seguir `@skill:git-workflow` para el formato
