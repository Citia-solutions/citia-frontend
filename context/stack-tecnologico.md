Frontend: 
Vue: Familiaridad y curva de aprendizaje mas suave
Gestion de estado: Pinia ya que es el mas popular y recomendado por vue
Estilos y ui: prime vue o vuetify
Conexión a api: Fetch

---

## Despliegue: Netlify

*Decisión del usuario, 2026-10-04:* el frontend se queda en **Netlify** (revierte la propuesta de
Cloudflare Workers del 2026-09-30). Cloudflare sigue solo como **DNS** de `citiahealth.cl`; el backend +
Postgres están en Railway — ver `citia-backend/context/stack-tecnologico.md`.

| Pieza | Valor |
|-------|-------|
| Rutas de la SPA | `public/_redirects` con `/*  /index.html  200`: cualquier ruta que no sea un archivo (`/agenda`, `/recordatorios`, `/agendar-cita/<slug>`) devuelve `index.html` y la resuelve vue-router. Sin esto, recargar una ruta que no sea `/` da 404 |
| Build | `npm run build` (incluye `vue-tsc`) → publish directory `dist/` |
| Sitios | Uno por entorno: **staging** ← rama `develop` (`staging.citiahealth.cl`) y **producción** ← rama `main` (`app.citiahealth.cl`). Dominio propio con un CNAME en Cloudflare hacia `<sitio>.netlify.app`, en modo *DNS only* |
| Backend | `VITE_API_URL` = backend de Railway de **ese** entorno, con su prefijo `/api` |
| Plan | Free: ~300 créditos/mes (~15 deploys); **al agotarse, el sitio se pausa**. Plan Personal US$9/mes si hace falta |

**`VITE_API_URL` se incrusta al compilar.** Vite reemplaza `import.meta.env.VITE_API_URL` en el
bundle; en Netlify va como variable de entorno del sitio (disponible en el build), no en `.env` (que no
se versiona). Sin ella, el front cae al default `/api` del mismo dominio, que en Netlify no existe.

**CORS:** el backend acepta `FRONTEND_URL` + `CORS_ORIGENES_EXTRA`. El dominio de cada sitio tiene
que estar ahí (staging en el backend de staging, producción en el de producción). El único comodín
que admite hoy el backend es el de Cloudflare Pages (`*.<proyecto>.pages.dev`): las *deploy previews*
de Netlify (`deploy-preview-N--<sitio>.netlify.app`) van como orígenes exactos si se quieren usar.
