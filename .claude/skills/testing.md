# Skill: Testing

## Estado Actual

El proyecto **no tiene suite de tests** (no hay Vitest, Vue Test Utils ni script `test`). Hasta que se
configure, "probar" es:

1. **`npm run build`**, que corre `vue-tsc` (type-check) y el build de Vite. Mientras se trabaja,
   `npm run type-check` es más rápido.
2. **Prueba manual en el navegador** de todo cambio visible: `npm run dev` (puerto 3002). Sin backend,
   con respuestas simuladas (reemplazar `fetch` en la página) para cubrir éxito, 400, 401, 404, 409
   y error de red según corresponda. Detener el dev server al terminar.

## Comandos Actuales

| Acción | Comando |
|--------|---------|
| Type-check + build | `npm run build` |
| Solo type-check | `npm run type-check` |
| Dev server para la prueba manual | `npm run dev` |

`npm run build-only` es solo el build de Vite: **no** revisa tipos, así que no sirve como verificación.

## Qué reportar

- Resultado de `npm run build` (o `npm run type-check`)
- Qué se probó en el navegador, con qué respuestas simuladas, y qué quedó sin probar (p. ej. contra el
  backend real)

## Convenciones para cuando se agreguen tests (propuesta, nada de esto está configurado)

- Framework: Vitest + Vue Test Utils
- Ubicación: junto al archivo que testean (`useLogin.test.ts` al lado de `useLogin.ts`)
- Nombre: `describe('<nombre>')` → `it('<hace qué> cuando <condición>')`
- Mocks: mockear `httpClient` en tests de composables; no llamadas reales de red
- Cobertura mínima objetivo: 80% en composables y lógica de negocio

## Reglas

- No commitear código con errores de TypeScript
- Los composables deben ser testeables de forma unitaria (sin montar componentes): la lógica va en
  `model/`, no en los `.vue`
