# Skill: Linting y Formato

## Instrucciones

1. Ejecutar type-check antes de hacer commit
2. Corregir errores de TypeScript antes de continuar
3. Reportar errores que no se puedan corregir automáticamente

## Comandos

- Type-check Vue + TS: `npm run type-check`
- Build para verificar: `npm run build-only`

## Estado del Proyecto

El proyecto no tiene ESLint ni Prettier configurados todavía. Cuando se agreguen:
- ESLint: `npx eslint src/ --fix`
- Prettier: `npx prettier src/ --write`

## Reglas

- No commitear código con errores de TypeScript (`vue-tsc` debe pasar sin errores)
- Usar `const` por defecto; `let` solo si la variable se reasigna
- No usar `any`; tipar explícitamente o usar `unknown` + type guard
- Evitar `!` (non-null assertion) a menos que sea absolutamente seguro
- Props de Vue: siempre tipadas con `defineProps<{ ... }>()`
