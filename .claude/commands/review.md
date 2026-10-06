# Comando: Revisión Cruzada

Revisa los cambios recientes `$ARGUMENTS` buscando conflictos entre capas FSD.

1. Ver qué cambió: `git diff --name-only develop...HEAD` (lo que la rama agrega sobre `develop`) y
   `git status` (lo que aún no tiene commit). Si `$ARGUMENTS` nombra un rango o archivos, usar ese.
2. Agrupar cambios por capa FSD (`app`, `pages`, `features`, `entities`, `shared`) y por dueño
   (`shared-agent`, `auth-agent`, `ui-agent`; ver `CLAUDE.md`)
3. Para cada capa afectada, cargar su contexto y verificar:
   - Contexto: `src/shared/CLAUDE.md`, `src/entities/CLAUDE.md`, `src/pages/CLAUDE.md`,
     `src/features/auth/CLAUDE.md`; para los demás features, `context/Features/<feature>.md`;
     para `app/`, el `CLAUDE.md` raíz y `.claude/agents/shared-agent.md`
   - ¿Se respetan las convenciones de la capa?
   - ¿Hay imports que violen el orden FSD (`shared` importando de `features`, etc.) o imports entre
     slices de la misma capa?
   - ¿Se importa desde fuera de un slice por su `index.ts` y no por archivos internos?
4. Verificar `src/shared/` y `src/entities/` por breaking changes en tipos compartidos
5. Correr `npm run build` (incluye `vue-tsc`). No hay tests ni ESLint que correr
6. Revisar que `context/` refleje el cambio (feature tocada, deudas `DTF-*`)
7. Reportar hallazgos clasificados:
   - Crítico: viola reglas FSD, rompe TypeScript o el build, o introduce un bug de autenticación
   - Mejora: funciona pero podría respetar mejor las convenciones
   - Sugerencia: opcional, nice-to-have
