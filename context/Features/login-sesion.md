# Login y sesión — sesión persistente, 401 global y cerrar sesión

**Estado:** ✅ Implementado (2026-10-05) · ⚠️ verificado solo con respuestas simuladas (backend local apagado)
**Rama:** `feature/frontend-prerelease` (lote 1 de la limpieza previa al release) · sin commit
**Backend:** [`us00b-login.md`](../../../citia-backend/context/Features/us00b-login.md) (contrato del login,
`tenantNombre` desde 2026-10-05)
**Código:** `src/features/auth/` · `src/entities/session/` · `src/shared/lib/authToken.ts` ·
`src/shared/api/httpClient.ts` (`onUnauthorized`) · `src/app/router/` (guard y `cerrarSesion.ts`) ·
`src/app/providers/index.ts` (401) · `src/app/layouts/PanelSidebar.vue` · **Ruta:** `/login`
**Detalles menores (2026-10-06):** `chore/frontend-detalles-menores` — página "No encontrada" y `meta`
del router ([abajo](#rutas-públicas-y-no-encontrada-2026-10-06))
**US-10, Fase 7 (2026-11-01, `feature/fase7-perfil-cuenta`, sin commit):** la sesión se refresca desde *Mi
perfil* (`updateUser`), el token se reemplaza tras cambiar la contraseña (`replaceToken`), `isAdmin`, el 401 de
un token viejo no cierra la sesión (F7) y el sidebar enlaza a *Mi perfil* — ver
[Cambios de US-10](#cambios-de-us-10--mi-perfil-2026-11-01) y [perfil-cuenta](perfil-cuenta.md). Probado en el
navegador contra el backend local.

> El login existía desde el inicio sin documento propio. Este documento nace con la limpieza previa al
> release, que le agregó la sesión persistente, el 401 global y el botón "Cerrar sesión".

---

## Qué hace

| Pieza | Qué ve el usuario |
|-------|-------------------|
| **Login** (`/login`) | Clínica (slug, con ayuda *"El identificador de tu clínica, p. ej. clinica-demo."*), correo, contraseña y "Mantener sesión iniciada". Nada más: sin Google, sin "¿Olvidaste tu clave?", sin "Solicita una demo" |
| **Sesión persistente** | F5 conserva la sesión. Con "Mantener sesión iniciada", también una pestaña nueva o el navegador reabierto |
| **Token vencido** | Al recargar o navegar con un token vencido, se limpia la sesión y va al login con `?redirect=` |
| **401 global** | Si el backend rechaza el token en cualquier pantalla, se cierra la sesión y va a `/login?redirect=<ruta>`; al volver a entrar, regresa ahí |
| **Cerrar sesión** | Botón (ícono) junto al perfil, abajo en el sidebar, fuera del enlace a *Mi perfil* |
| **Sidebar** | "Citia" + nombre de la clínica (`tenantNombre`; si no viene, sin esa línea), y abajo el nombre del usuario y su rol en español (*Administrador* / *Profesional*). Desde US-10 ese bloque es un enlace a *Mi perfil*, y la sección *CUENTA* tiene *Mi perfil* y *Contactar soporte* |

---

## Contrato con el backend

`POST /auth/login` — `{ tenantSlug, email, password }` →
`{ accessToken, usuario: { id, email, nombreCompleto, rol, tenantId, tenantSlug?, tenantNombre? } }`

- Va con **`{ auth: false }`**: es pública, no lleva Bearer y su 401 significa "credenciales inválidas"
  (*"Correo o contraseña incorrectos."*), no "sesión vencida".
- `tenantSlug` y `tenantNombre` se toleran ausentes (backend anterior): sin `tenantSlug` no aparece
  "Copiar enlace de agenda"; sin `tenantNombre` no aparece la línea de la clínica.
- Del JWT el front lee **solo** `sub` y `exp`, **sin verificar la firma** (`readTokenClaims`): para
  saber de quién es y si venció. La validez real la decide el backend en cada petición.
- La sesión se rehidrata desde el navegador, sin pedir nada al backend en cada navegación
  ([DTF-02](../Deudas/DTF-02.md), cerrada). Desde US-10 el backend tiene `GET /usuarios/me`, pero lo pide
  **solo** *Mi perfil* (al entrar y tras un `PATCH` 200), que con la respuesta refresca la sesión
  (`updateUser`) — ver [abajo](#cambios-de-us-10--mi-perfil-2026-11-01).

---

## Persistencia

| Clave | Contenido | Almacenamiento |
|-------|-----------|----------------|
| `citia.token` | JWT | `localStorage` con "Mantener sesión iniciada"; si no, `sessionStorage` |
| `citia.user` | `AuthUser` en JSON (`id, email, name, role, tenantSlug?, tenantNombre?`) | El mismo que el token |

- **Al iniciar sesión** `setSession(user, token, rememberMe)` limpia ambos almacenamientos y escribe
  las dos claves en el elegido.
- **Al arrancar y en cada navegación** el guard llama a `restoreSession()` antes de decidir. Acepta la
  sesión solo si hay token y usuario, el JWT se puede leer, no venció y su `sub` es el `id` del
  usuario, y el usuario tiene la forma esperada (rol conocido). Si no, **limpia todo** y el guard manda
  al login. Como relee el almacenamiento en cada navegación, también recoge lo hecho en otra pestaña:
  un cierre de sesión la manda al login en la siguiente navegación; otro inicio de sesión la pasa a
  ese usuario.
- `sessionStorage` es por pestaña: una sesión sin "mantener" **no** pasa a pestañas nuevas (a
  propósito).
- **Desde US-10**, `updateUser` reescribe solo `citia.user` y `replaceToken` solo `citia.token`, cada uno
  en el almacenamiento en que ya está la sesión (`isTokenPersistent()`).

## 401 global

`httpClient` avisa a `onUnauthorized` cuando una petición **con** `auth` (la opción por defecto)
recibe 401, y después lanza el `HttpError` como siempre. El handler, en `app/providers`:

1. Si ya no hay sesión, no hace nada (varias peticiones fallan juntas: actúa solo la primera).
2. Si la ruta actual no es protegida, solo limpia la sesión.
3. Si no, `cerrarSesion(router, rutaActual)` → `/login?redirect=<rutaActual>`.

**Excepción (US-10, F7):** si **hay** un token guardado y no es el que viajó en la petición, el 401 es de un
token viejo (otra pestaña inició sesión, o el cambio de contraseña lo reemplazó mientras la petición iba):
`httpClient` lanza el `HttpError` **sin** avisar a `onUnauthorized`, para no cerrar la sesión nueva. Sin
token guardado (otra pestaña cerró la sesión) sí avisa, como siempre.

`LoginPage` respeta `?redirect=` **solo con rutas internas que existen** (empieza con `/`, no con `//`,
no es el login ni cae en "No encontrada"); cualquier otra cosa va al Resumen. Evita usar el login como
redirección abierta.

## Rutas públicas y "No encontrada" (2026-10-06)

- **El guard solo lee `meta.requiresAuth`**, que va en el padre `/` del panel y heredan las hijas. Todo lo
  demás es público por omisión. El `meta.public` que llevaban `/login` y `/agendar-cita/:tenantSlug` no lo
  leía nadie y **se quitó**; `RouteMeta` quedó tipado en `app/router/index.ts` con `requiresAuth` como
  única marca.
- **Ruta comodín** `/:pathMatch(.*)*` → `NoEncontradaPage` (`pages/no-encontrada`, ruta `noEncontrada`).
  Antes una URL desconocida mostraba una página en blanco. Es pública y sin layout: con sesión ofrece
  *"Volver al inicio"* (Resumen) y sin sesión *"Ir a iniciar sesión"*; el guard ya restauró la sesión al
  llegar. vue-router ordena por especificidad, así que no tapa `/agendar-cita/:tenantSlug` ni las rutas
  del panel; `/agendar-cita` sin slug y `/agenda/algo` sí caen en ella.
- Con el comodín toda ruta "calza", por eso `LoginPage` descarta además `noEncontrada` al leer
  `?redirect=`.

Verificado en el navegador: URL inventada sin sesión → 404 con "Ir a iniciar sesión"; con sesión →
"Volver al inicio", que lleva al Resumen; `/agendar-cita/demo` sigue resolviendo a la vista pública.

## Cerrar sesión

El botón del sidebar abre una confirmación (`ConfirmarCerrarSesion.vue`, junto a `PanelSidebar.vue`)
antes de cerrar: "¿Cerrar sesión?" con "Volver" y "Cerrar sesión". Solo al confirmar se ejecuta
`cerrarSesion`.

`cerrarSesion` (`app/router/cerrarSesion.ts`) limpia la sesión y navega al login con una **carga
completa** de la página (`window.location.assign`), no con `router.push`: así no queda en memoria
(stores de Pinia) nada del usuario anterior —citas, solicitudes— que alcance a verse si otra persona
inicia sesión después en la misma pestaña.

**Solo cierra la sesión en este navegador.** El token sigue siendo válido en el servidor hasta que
vence (1 día): cerrar sesión no lo revoca (`DT-01` del backend). Desde US-10 lo que sí corta las demás
sesiones es **cambiar la contraseña** (ver abajo).

---

## Cambios de US-10 — Mi perfil (2026-11-01)

Rama `feature/fase7-perfil-cuenta` (sin commit) · plan en [`us/10-perfil-cuenta.md`](../us/10-perfil-cuenta.md)
· la pantalla en [perfil-cuenta](perfil-cuenta.md). La sesión deja de ser "la del login hasta el próximo login":

| Qué | Dónde | Cómo |
|-----|-------|------|
| `isAdmin` | `entities/session` (getter del store) | `currentUser?.role === 'admin'`. Decide si existe la pestaña *Suscripción* de *Mi perfil*: **el único lugar del front que ramifica por rol**, y solo para mostrar (el permiso lo decide el backend, 403) |
| `updateUser({ name, tenantSlug, tenantNombre })` | `entities/session` | Lo llama *Mi perfil* con la respuesta de `GET` y de `PATCH /usuarios/me` 200 (F5). Escribe en memoria **y** en `citia.user`, en el almacenamiento del token: las dos cosas, porque `restoreSession` corre en cada navegación. Nunca toca `id`, `email` ni `role`; sin sesión no hace nada. El sidebar cambia sin recargar |
| `replaceToken(token)` | `entities/session` (sobre `replaceToken` de `shared/lib/authToken`) | Lo llama *Mi perfil* con el `accessToken` del cambio de contraseña. Lanza si el `sub` del token no es el usuario de la sesión; guarda en el mismo almacenamiento en que estaba; no reescribe `citia.user` |
| Sin escribir sobre otra sesión | `entities/session` | `updateUser` y `replaceToken` no escriben si el token guardado ya no es del usuario en memoria (otra pestaña cerró la sesión o entró con otra cuenta): la próxima navegación recoge lo guardado |
| 401 de un token viejo (F7) | `shared/api/httpClient.ts` | No avisa a `onUnauthorized` si hay otro token guardado (ver [401 global](#401-global)) |
| Enlace a *Mi perfil* | `app/layouts/PanelSidebar.vue` | El bloque avatar + nombre + rol es un `RouterLink` a `perfil`, con *Cerrar sesión* fuera; ítems *Mi perfil* y *Contactar soporte* en la sección *CUENTA* |

**Cambiar la contraseña** (`PUT /usuarios/me/contrasena`) corta en el backend todas las sesiones de la cuenta
y devuelve un token nuevo para la que lo pidió: esta pestaña sigue (token reemplazado), otra pestaña con
"Mantener sesión iniciada" lee el token nuevo en su siguiente petición, y otro navegador vuelve al login en su
siguiente acción (401 → handler global). Una contraseña actual mal escrita es un **400**, nunca un 401: no
cierra la sesión.

---

## Lo que se quitó en la limpieza previa al release

| Dónde | Qué | Por qué |
|-------|-----|---------|
| Login | "¿Olvidaste tu clave?", botón "Google Workspace" + separador, "Solicita una demo" | Ninguno tenía backend (`href="#"` o un stub que rechazaba). `GoogleAuthButton.vue` y `loginWithGoogle()` se borraron |
| `AuthAside` | Cifras "−40% ausentismo · 42h recuperadas/mes · $1.47M ingresos/mes" y "recupera cupos cancelados" | Inventadas. Ahora: agenda del día y semanal, solicitudes desde un enlace, recordatorios por correo |
| Sidebar | Clínica "SaludX", perfil "Dr. Matías Rivera", tarjeta "Citia IA", "Pacientes", "Citas anuladas 3" | Datos fijos o sin vista. Quedan Resumen, Agenda, Solicitudes (contador real) y Recordatorios |
| Topbar del Resumen | Buscador "Buscar paciente…" y campana | No hay `GET /pacientes` ni notificaciones. El subtítulo *"N citas hoy · N pendientes de confirmar"* se mantiene |
| `pages/home/` | `HomePage` (placeholder con el único "Cerrar sesión") | Código muerto, sin ruta |

### Copy que carga significado

| Texto | Por qué importa |
|-------|-----------------|
| *"El identificador de tu clínica, p. ej. clinica-demo."* | El login es multi-tenant por slug (ADR-03 del backend): sin él el usuario no sabe qué escribir en "Clínica" |
| *"Tus pacientes piden hora desde un enlace y tú decides si la aceptas."* (aside) | Describe la bandeja tal como es. El enlace público sigue gobernado por `ENLACE_PUBLICO_LISTO` mientras el backend no cierre `DT-18` |
| *"citiahealth les recuerda la cita automáticamente, en los momentos que elijas."* (aside) | Recordatorios **por correo** de US-03; no promete WhatsApp ni cifras de ausentismo |

---

## Verificación

`npm run build` (con `vue-tsc`) sin errores. Prueba manual en el dev server con `fetch` simulado
(backend local apagado): login sin "mantener" → `sessionStorage`; F5 en `/agenda` conserva la sesión;
pestaña nueva no la hereda; con "mantener" → `localStorage` y otra pestaña sí la hereda; login con
contraseña mala → mensaje, sin Bearer y sin redirección; 401 en una petición autenticada →
`/login?redirect=/agenda` con almacenamiento limpio, y al volver a entrar regresa a `/agenda`; cierre
en una pestaña → la otra va al login en su siguiente navegación; token vencido, JSON roto, rol
desconocido, `sub` distinto o token que no es JWT → limpia y va al login; `?redirect=//otro-sitio` →
Resumen; usuario autenticado que abre `/login` → Resumen; sin `tenantNombre` → sin línea de clínica.

**US-10 (2026-11-01), en el navegador contra el backend local** (usuario demo administrador, sesión en
`sessionStorage`): guardar el nombre en *Mi perfil* lo cambia en el sidebar sin recargar; tras cambiar la
contraseña el token se reemplaza en el mismo `sessionStorage`, el nuevo responde 200, el viejo 401 y la página
no vuelve al login; una contraseña actual mal escrita no cierra la sesión; con el sidebar colapsado (800 px) el
avatar sigue enlazando al perfil. **No se probó** el corte con un segundo navegador real (lo cubren los e2e del
backend) ni la rama de un `PROFESIONAL` (hoy todo usuario es `ADMINISTRADOR`).

## Pendientes

| Qué | Nota |
|-----|------|
| **Prueba contra el backend real** | Login con `tenantNombre`, F5, vencimiento real del token (o `JWT_EXPIRES_IN` corto en local) y el 401 en una pantalla abierta. Lo de US-10 ya se probó contra el backend local (arriba); el corte de sesiones con dos navegadores queda para staging |
| Aviso de "tu sesión expiró" en el login | Hoy el 401 lleva al login sin explicar por qué. Se podría pasar un motivo en la query y mostrarlo sobre el formulario |
| Sincronía inmediata entre pestañas | Un cierre de sesión en otra pestaña se nota en la siguiente navegación o petición, no al instante. Un listener de `storage` lo haría inmediato |
| Datos del usuario desactualizados | Desde US-10, nombre, clínica y slug se refrescan al entrar a *Mi perfil* (`GET /usuarios/me`, F5); fuera de ahí siguen siendo los del login (o del último refresco). El **rol** no se refresca nunca: `updateUser` no lo toca y su traducción vive en `features/auth` (ver [DTF-02](../Deudas/DTF-02.md)) |
| Token en `localStorage` | Con "mantener", el JWT queda accesible a cualquier script de la página (XSS). Es la decisión vigente; la alternativa es una cookie `httpOnly` emitida por el backend |

## Deudas técnicas asociadas

- [DTF-01](../Deudas/DTF-01.md) — sesión a medias. **Cerrada** aquí.
- [DTF-02](../Deudas/DTF-02.md) — `fetchCurrentUser()` sin endpoint. **Cerrada** (se quitó).
- [DTF-04](../Deudas/DTF-04.md) — rol `recepcion`. **Cerrada** (se quitó del tipo).
- Backend: `DT-01` (sin renovación ni revocación de token; **en parte cerrada** por US-10: el cambio de
  contraseña corta las demás sesiones), `DT-03` (sin recuperar contraseña).
