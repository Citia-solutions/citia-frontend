# Comando: Orquestar Tarea

Analiza la solicitud `$ARGUMENTS` y ejecuta este flujo:

## Paso 1: Análisis

- ¿Qué capas FSD se ven afectadas? (`shared`, `entities`, `features/auth`, `pages`)
- ¿Hay dependencias entre capas? (recordar: `pages` → `features` → `entities` → `shared`)
- ¿Cuál es el orden correcto de ejecución? (siempre de capas bajas a altas)

## Paso 2: Plan

Presenta al usuario:
- Sub-agentes que se activarán (`auth-agent`, `ui-agent`, `shared-agent`)
- Orden de ejecución
- Riesgos o conflictos potenciales (breaking changes en tipos, contratos de API)

Espera confirmación antes de ejecutar.

## Paso 3: Ejecución Secuencial

Para cada sub-agente involucrado:
1. Cargar su definición desde `.claude/agents/<nombre>.md`
2. Cargar el contexto del módulo desde `src/<modulo>/CLAUDE.md`
3. Cargar los skills necesarios desde `.claude/skills/`
4. Ejecutar la tarea delegada
5. Recoger el output estructurado del sub-agente

## Paso 4: Consolidación

- Verificar que no haya imports que violen las capas FSD
- Verificar que `npm run type-check` pase sin errores
- Reportar resumen completo al usuario

## Paso 5: Commit

- Preparar commit(s) organizados por capa/módulo
- Seguir `@skill:git-workflow` para el formato
