# Login y sesión — sesión persistente, 401 global y cerrar sesión

**Estado:** ✅ Implementado (2026-10-05) · ⚠️ verificado solo con respuestas simuladas (backend local apagado)
**Rama:** `feature/frontend-prerelease` (lote 1 de la limpieza previa al release) · sin commit
**Backend:** [`us00b-login.md`](../../../citia-backend/context/Features/us00b-login.md) (contrato del login,
`tenantNombre` desde 2026-10-05)
**Código:** `src/features/auth/` · `src/entities/session/` · `src/shared/lib/authToken.ts` ·
`src/shared/api/httpClient.ts` (`onUnauthorized`) · `src/app/router/` (guard y `cerrarSesion.ts`) ·
`src/app/providers/index.ts` (401) · `src/app/layouts/PanelSidebar.vue` · **Ruta:** `/login`

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
| **Cerrar sesión** | Botón (ícono) junto al perfil, abajo en el sidebar |
| **Sidebar** | "Citia" + nombre de la clínica (`tenantNombre`; si no viene, sin esa línea), y abajo el nombre del usuario y su rol en español (*Administrador* / *Profesional*) |

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
- No hay `GET /me`: la sesión se rehidrata desde el navegador ([DTF-02](../Deudas/DTF-02.md), cerrada).

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

## 401 global

`httpClient` avisa a `onUnauthorized` cuando una petición **con** `auth` (la opción por defecto)
recibe 401, y después lanza el `HttpError` como siempre. El handler, en `app/providers`:

1. Si ya no hay sesión, no hace nada (varias peticiones fallan juntas: actúa solo la primera).
2. Si la ruta actual no es protegida, solo limpia la sesión.
3. Si no, `cerrarSesion(router, rutaActual)` → `/login?redirect=<rutaActual>`.

`LoginPage` respeta `?redirect=` **solo con rutas internas que existen** (empieza con `/`, no con `//`,
no es el login); cualquier otra cosa va al Resumen. Evita usar el login como redirección abierta.

## Cerrar sesión

`cerrarSesion` (`app/router/cerrarSesion.ts`) limpia la sesión y navega al login con una **carga
completa** de la página (`window.location.assign`), no con `router.push`: así no queda en memoria
(stores de Pinia) nada del usuario anterior —citas, solicitudes— que alcance a verse si otra persona
inicia sesión después en la misma pestaña.

**Solo cierra la sesión en este navegador.** El token sigue siendo válido en el servidor hasta que
vence (1 día): el backend no tiene revocación (`DT-01` del backend).

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
| *"Citia les recuerda la cita automáticamente, en los momentos que elijas."* (aside) | Recordatorios **por correo** de US-03; no promete WhatsApp ni cifras de ausentismo |

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

## Pendientes

| Qué | Nota |
|-----|------|
| **Prueba contra el backend real** | Login con `tenantNombre`, F5, vencimiento real del token (o `JWT_EXPIRES_IN` corto en local) y el 401 en una pantalla abierta |
| Aviso de "tu sesión expiró" en el login | Hoy el 401 lleva al login sin explicar por qué. Se podría pasar un motivo en la query y mostrarlo sobre el formulario |
| Sincronía inmediata entre pestañas | Un cierre de sesión en otra pestaña se nota en la siguiente navegación o petición, no al instante. Un listener de `storage` lo haría inmediato |
| Datos del usuario desactualizados | Sin `GET /me`, nombre/rol/clínica son los del login hasta el próximo (ver [DTF-02](../Deudas/DTF-02.md)) |
| Token en `localStorage` | Con "mantener", el JWT queda accesible a cualquier script de la página (XSS). Es la decisión vigente; la alternativa es una cookie `httpOnly` emitida por el backend |

## Deudas técnicas asociadas

- [DTF-01](../Deudas/DTF-01.md) — sesión a medias. **Cerrada** aquí.
- [DTF-02](../Deudas/DTF-02.md) — `fetchCurrentUser()` sin endpoint. **Cerrada** (se quitó).
- [DTF-04](../Deudas/DTF-04.md) — rol `recepcion`. **Cerrada** (se quitó del tipo).
- Backend: `DT-01` (sin renovación ni revocación de token), `DT-03` (sin recuperar contraseña).
