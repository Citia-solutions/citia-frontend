Frontend: 
Vue: Familiaridad y curva de aprendizaje mas suave
Gestion de estado: Pinia ya que es el mas popular y recomendado por vue
Estilos y ui: prime vue o vuetify
Conexión a api: Fetch

---

## Despliegue: Cloudflare Workers (Static Assets)

*Fase 2, 2026-10-04.* Decisión del backend: SPA en **Cloudflare** (Workers Static Assets o Pages),
backend + Postgres en Railway; Netlify descartado — ver `citia-backend/context/stack-tecnologico.md`.

| Pieza | Valor |
|-------|-------|
| Configuración | `wrangler.jsonc` en la raíz: `name: "citia-frontend"`, `compatibility_date`, `assets.directory: "./dist"` |
| Rutas de la SPA | `assets.not_found_handling: "single-page-application"`: cualquier ruta que no sea un archivo (`/agenda`, `/recordatorios`, `/agendar-cita/<slug>`) devuelve `index.html` y la resuelve vue-router. Sin esto, recargar una ruta que no sea `/` da 404 |
| Build | `npm run build` (incluye `vue-tsc`) → `dist/` |
| Deploy | `npx wrangler deploy` o Cloudflare Workers Builds conectado al repo. **`wrangler` no es dependencia** del proyecto |
| Backend en producción | `VITE_API_URL=https://api.citiahealth.cl/api` |

**`VITE_API_URL` se incrusta al compilar.** Vite reemplaza `import.meta.env.VITE_API_URL` en el
bundle; en Cloudflare va como **variable de build** (Workers Builds → *Build variables*), no como
`vars` del Worker ni en `.env` (que no se versiona). Sin ella, el front cae al default `/api` del
mismo dominio, que no existe en Cloudflare.

**CORS:** el backend acepta `FRONTEND_URL` + `CORS_ORIGENES_EXTRA` (lista con comodín para vistas
previas). El dominio final del front y el de las vistas previas de Cloudflare tienen que estar ahí.

**Local:** `npx wrangler dev` sirve `dist/` como lo haría Cloudflare (útil para probar el *fallback*
de SPA); deja estado en `.wrangler/`, que está en `.gitignore`.
