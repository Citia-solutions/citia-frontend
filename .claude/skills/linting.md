# Skill: Linting y Formato

## Estado del Proyecto

El proyecto **no tiene ESLint ni Prettier** configurados (no hay dependencias, configuración ni
scripts de lint). La única verificación automática es el type-check de `vue-tsc`, que corre dentro
de `npm run build`.

## Instrucciones

1. Antes de hacer commit, `npm run build` (type-check + build de Vite) o, mientras se trabaja,
   `npm run type-check`
2. Corregir los errores de TypeScript antes de continuar
3. Reportar los errores que no se puedan corregir

## Comandos

| Acción | Comando |
|--------|---------|
| Type-check + build (lo que se corre antes de commitear) | `npm run build` |
| Solo type-check (`vue-tsc --build`) | `npm run type-check` |
| Solo build de Vite (**no** revisa tipos) | `npm run build-only` |

Si algún día se agregan ESLint o Prettier, sus scripts se documentan aquí y en el `CLAUDE.md` raíz.

## Reglas

- No commitear código con errores de TypeScript (`vue-tsc` debe pasar sin errores)
- Sin linter, el formato se cuida a mano: seguir el estilo del archivo que se edita (sin punto y coma,
  comillas simples, 2 espacios)
- Usar `const` por defecto; `let` solo si la variable se reasigna
- No usar `any`; tipar explícitamente o usar `unknown` + type guard
- Evitar `!` (non-null assertion) a menos que sea absolutamente seguro
- Props de Vue: siempre tipadas con `defineProps<{ ... }>()`
