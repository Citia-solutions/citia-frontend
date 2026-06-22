# Skill: Testing

## Estado Actual

El proyecto aún no tiene suite de tests configurada (no hay Vitest ni Vue Test Utils instalados). Hasta que se configure, el "testing" consiste en type-checking y verificación manual.

## Instrucciones (cuando Vitest esté configurado)

1. Antes de escribir código, verificar tests existentes en el módulo
2. Escribir tests para cada composable y función nueva
3. Ejecutar la suite del módulo afectado
4. Reportar: total, passed, failed

## Comandos Actuales

- Type-check: `npm run type-check`
- Build (verifica compilación): `npm run build-only`

## Convenciones para cuando se agreguen tests

- Framework: Vitest + Vue Test Utils
- Ubicación: junto al archivo que testean (`useLogin.test.ts` al lado de `useLogin.ts`)
- Nombre: `describe('<nombre>')` → `it('<hace qué> cuando <condición>')`
- Mocks: mockear `httpClient` en tests de composables; no llamadas reales de red
- Cobertura mínima objetivo: 80% en composables y lógica de negocio

## Reglas

- No commitear código con errores de TypeScript
- Los composables deben ser testeables de forma unitaria (sin montar componentes)
