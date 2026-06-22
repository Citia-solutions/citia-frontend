# Skill: Git Workflow

## Instrucciones

1. Verificar rama actual: `git branch --show-current`
2. Si estás en `main`, crear rama nueva: `git checkout -b feature/<descripcion>`
3. Hacer cambios incrementales con commits atómicos
4. Formato de commit: `<type>(<scope>): <description>`
   - `feat(auth): add Google OAuth callback handler`
   - `fix(login): resolve password toggle not resetting on error`
   - `test(session): add store unit tests`
   - `refactor(shared): extract HTTP error class`
   - `chore(deps): update vue-router to 4.6.4`
5. Antes de finalizar: `git diff --staged` para verificar

## Reglas

- Un commit por cambio lógico (no commits gigantes)
- No commitear `.env`, secrets, ni `node_modules`
- Siempre verificar `git status` antes de commit
- Rama activa del proyecto: `feature/login`
