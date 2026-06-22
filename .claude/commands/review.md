# Comando: Revisión Cruzada

Revisa los cambios recientes `$ARGUMENTS` buscando conflictos entre capas FSD.

1. `git diff --name-only HEAD~5` para ver archivos cambiados
2. Agrupar cambios por capa FSD (`app`, `entities`, `features`, `pages`, `shared`)
3. Para cada capa afectada, cargar su `CLAUDE.md` y verificar:
   - ¿Se respetan las convenciones de la capa?
   - ¿Hay imports que violen el orden FSD? (`shared` importando de `features`, etc.)
   - ¿`npm run type-check` pasa?
4. Verificar `src/shared/` y `src/entities/` por breaking changes en tipos compartidos
5. Reportar hallazgos clasificados:
   - Crítico: viola reglas FSD, rompe TypeScript, o introduce bug de autenticación
   - Mejora: funciona pero podría respetar mejor las convenciones
   - Sugerencia: opcional, nice-to-have
