# Skill: Git Workflow

Git Flow, el mismo que `citia-backend`. Cada rama de larga vida despliega a su entorno:

| Rama | Qué es | Despliega a |
|------|--------|-------------|
| `main` | Producción. Solo recibe releases desde `develop` | Netlify producción (front) · Railway producción (back) |
| `develop` | Integración | Netlify staging (front) · Railway staging (back) |
| `feature/<descripcion>` | Una funcionalidad | — (PR a `develop`) |
| `chore/<descripcion>` | Lo que no es una feature: limpieza, docs, tooling, ajustes menores | — (PR a `develop`) |

## Instrucciones

1. Verificar la rama actual: `git branch --show-current`.
2. Si estás en `main` o en `develop`, **no commitees ahí**: crea la rama desde `develop` actualizado.
   Si el orquestador ya eligió la rama, usa esa.
   ```sh
   git checkout develop
   git pull origin develop
   git checkout -b feature/<descripcion>   # o chore/<descripcion>
   ```
   Nombres en kebab-case, como las ramas que ya existen: `feature/fase2-recordatorios`,
   `feature/frontend-prerelease`, `chore/netlify-spa`.
3. Cambios incrementales con **commits atómicos** (un commit por cambio lógico).
4. Antes de cada commit, verificar que compila: **`npm run build`** (corre `vue-tsc` y el build de
   Vite). El repo **no tiene tests ni ESLint/Prettier**, así que esa es toda la verificación
   automática; un cambio visible se prueba además en el navegador (`npm run dev`, puerto 3002).
5. Revisar qué entra: `git status` y `git diff --staged`.
6. Al terminar: push de la rama y **PR a `develop`**, con una descripción clara y `npm run build`
   pasando. Commits y pushes, **solo cuando el usuario lo pida**.

## Formato de commit

Conventional Commits: `<type>(<scope>): <descripción>`, en español y en minúscula. El scope suele ser
el slice o la capa tocada. Ejemplos reales del historial:

- `feat(crear-cita): correo del paciente obligatorio en el modal "Nueva cita"`
- `feat(gestionar-cita): bloquear la asistencia antes de la hora de la cita`
- `feat(sesion): sesion persistente, cerrar sesion y panel sin datos falsos`
- `chore(deploy): fallback de SPA para Netlify`
- `docs(context): despliegue del frontend en Netlify`
- `docs(claude): CLAUDE.md y agentes al dia con el frontend actual`

Tipos: `feat`, `fix`, `refactor`, `chore`, `docs` (y `test` el día que haya tests).

## Reglas

- **Nunca** commits directos a `main` ni a `develop`: todo entra por PR.
- Las ramas `feature/*` y `chore/*` salen **siempre de `develop`** y vuelven a `develop`.
- **Release** = PR de `develop` a `main`. `main` no recibe nada que no venga de `develop`.
- Un commit por cambio lógico; nada de commits gigantes mezclando capas.
- **Nunca** commitear `.env`, secretos, `dist/` ni `node_modules/` (`.gitignore` ya los excluye: no
  forzarlos con `git add -f`). La plantilla de variables es `.env.example`.
- Verificar `git status` antes de cada commit.
- No usar `--no-verify` ni saltarse hooks salvo que el usuario lo pida explícitamente.
