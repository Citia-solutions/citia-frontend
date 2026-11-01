# US-10 · Perfil, suscripción, contraseña y soporte (frontend)

> Fase 7 (RF-04). Pantalla nueva **Mi Perfil** (`/perfil`) y *Contactar soporte* desde cualquier pantalla
> del panel.

**Estado:** ✅ **Implementada y verificada en local** (2026-11-01, `feature/fase7-perfil-cuenta`, sale de
`origin/develop` = `2b63d31`, sin commit) · `npm run build` en verde y **prueba manual en el navegador** contra
el backend local (ver [Verificación](#verificación)) · docs de cierre hechos: feature
[perfil-cuenta](../Features/perfil-cuenta.md), [login-sesion](../Features/login-sesion.md),
[DTF-06](../Deudas/DTF-06.md), [DTF-08](../Deudas/DTF-08.md) (nueva), `CLAUDE.md` y agentes · **falta** la
verificación manual en staging (tras el merge a `develop`) y el release. El backend está **en producción desde
el 2026-11-01** (backend PR #15, `cd659c1`), sin casilla de soporte todavía (Q19).
**Lado:** panel (profesional y administrador)
**Feature:** [perfil-cuenta](../Features/perfil-cuenta.md) (lo que quedó en el código)
**Backend (contrato):** [plan US-10](https://github.com/Citia-solutions/citia-backend/blob/develop/context/US/10-perfil-cuenta.md)
(`citia-backend/context/US/10-perfil-cuenta.md`), secciones
[*Frontend*](https://github.com/Citia-solutions/citia-backend/blob/develop/context/US/10-perfil-cuenta.md#frontend-citia-frontend-en-vue),
[*DTO*](https://github.com/Citia-solutions/citia-backend/blob/develop/context/US/10-perfil-cuenta.md#dto) y
[*Desvíos de la implementación*](https://github.com/Citia-solutions/citia-backend/blob/develop/context/US/10-perfil-cuenta.md#desvíos-de-la-implementación-2026-11-01) ·
[ADR-15](https://github.com/Citia-solutions/citia-backend/blob/develop/context/Decisions/ADR-15.md)
(`citia-backend/context/Decisions/ADR-15.md`), con sus
[notas de implementación](https://github.com/Citia-solutions/citia-backend/blob/develop/context/Decisions/ADR-15.md#notas-de-implementación-2026-11-01)
**Features que se crean:** `editar-perfil`, `ver-suscripcion`, `cambiar-contrasena`, `contactar-soporte`
· **página nueva:** `pages/perfil` · **cambian:** [login-sesion](../Features/login-sesion.md)
(sesión refrescable, token reemplazable, 401 de un token viejo) y el sidebar

---

## Descripción

> Como **profesional de la salud** quiero ver y corregir mi nombre y mi especialidad, ver el enlace de agenda
> de mi organización y cambiar mi contraseña, para mantener mi cuenta al día sin pedírselo a nadie.
>
> Como **administrador de la organización** quiero ver en qué plan estoy y desde cuándo, aunque todavía no
> se cobre.
>
> Como **profesional** quiero escribirle a soporte desde la aplicación cuando algo no funciona.

### Criterios de aceptación (lado del front)

Todos implementados. Una casilla marcada = el camino principal se vio en la
[prueba en el navegador](#prueba-en-el-navegador-2026-11-01); lo que **no se probó** va en cursiva al final de cada
criterio.

- [x] Se llega a *Mi Perfil* desde el bloque avatar + nombre + rol del sidebar (enlace; *Cerrar sesión* queda
      fuera del enlace) **y** desde un ítem *Mi perfil* de la navegación (F1). Visto: con el sidebar colapsado
      (800 px) los ítems de *CUENTA* quedan como íconos y el avatar sigue enlazando al perfil.
- [x] *Mi Perfil* tiene tres pestañas: *Información personal*, *Suscripción* (**solo** administrador) y
      *Seguridad*. Cambiar de pestaña no cambia la URL (F4). *No probado: que Suscripción no aparezca para un
      `PROFESIONAL` (hoy todo usuario es `ADMINISTRADOR`, DT-07 del backend).*
- [x] *Información personal* muestra el avatar con iniciales, el nombre, la especialidad, el **correo en
      lectura** (con una nota del estilo *"Es tu usuario para iniciar sesión; por ahora no se puede
      cambiar."*), el rol, la **organización en lectura** y el **enlace de agenda en lectura** con su botón de
      copiar (el de `compartir-enlace-agenda`, con su advertencia, F9). Visto: el correo con su nota, el rol
      *Administrador* y la organización. *Sin registro en la prueba: el botón de copiar el enlace.*
- [x] Se editan **solo** el nombre (obligatorio, ≤ 120) y la especialidad (opcional, ≤ 100, ayuda *"Solo se ve
      en tu perfil"*; vaciarla la borra). Guardar cambia el nombre en el sidebar **sin recargar** (F5). Visto:
      *"Cambios guardados."*, el sidebar cambia sin recargar y los datos quedan en la base. *Sin registro en la
      prueba: vaciar la especialidad.*
- [x] Al entrar a *Mi Perfil* se pide `GET /usuarios/me` y se refresca la sesión (`name`, `tenantSlug`,
      `tenantNombre`); también tras un `PATCH` 200. En ningún otro lugar (F5).
- [x] *Suscripción* (admin): *Plan* (`planNombre`), la `descripcion`, *Desde* (`altaEn`, fecha en la zona de
      Chile), *Renovación* "—" y *Método de pago* "—". Un 403 muestra *"Solo el administrador de la
      organización ve la suscripción."* (no debería verse: la pestaña no existe para un profesional). Visto:
      *Plan piloto*, *"Sin cobro durante el piloto"*, *Desde* "1 de noviembre de 2026" y "—" en los otros dos.
      *No probado: el 403.*
- [x] *Seguridad*: contraseña actual, nueva y confirmación. La nueva, ≥ 8 caracteres reales y ≤ 72 bytes UTF-8;
      la confirmación igual a la nueva (solo en el front). Con el 200, el token guardado se reemplaza y se
      avisa *"Listo. Cerramos las demás sesiones abiertas."*; la sesión actual sigue. Visto: el aviso, los
      campos vacíos y el token reemplazado en el mismo `sessionStorage`; el token nuevo responde 200, el viejo
      401, y la página no vuelve al login. *No probado: una contraseña de más de 72 bytes; el corte en un
      segundo navegador real (lo cubren los e2e del backend).*
- [x] Con la contraseña actual mal escrita, el error aparece **junto al campo** y **la sesión sigue abierta**
      (el backend responde 400, nunca 401). 409 → *"Tu contraseña cambió mientras tanto; vuelve a
      intentarlo."* · 429 → el mensaje del backend. Visto: *"La contraseña actual no es correcta"* bajo el
      campo, y la sesión sigue. *No probados: el 409 y el 429.*
- [x] *Contactar soporte* se abre desde *Mi Perfil* **y** desde una entrada del sidebar (*Contactar soporte*), en cualquier
      pantalla del panel (F2). El modal pide la **categoría** (obligatoria, ninguna marcada al abrir, F3) y el
      texto (≤ 2000, con contador), con el aviso fijo *"No incluyas datos de tus pacientes (nombres, RUT,
      diagnósticos)."* y **sin** prometer respuesta por correo (F8). Visto desde el sidebar en el Resumen: sin
      categoría, *"Elige una categoría."*; el aviso a la vista y ninguna promesa de respuesta por correo. *Sin
      registro en la prueba: abrirlo desde Mi Perfil.*
- [x] Soporte: 201 → *"Recibimos tu mensaje."* · 429 → el mensaje del backend (el del tope por organización o
      el del límite por IP) · 400 → junto al campo. Visto: con *Consulta* y un texto, el `POST` da 201, aparece
      *"Recibimos tu mensaje."* y la fila queda en `mensajes_soporte` como `consulta`, `pendiente`. *No
      probados: los 429 y un 400 del servidor (la validación previa lo evita).*
- [x] Los 400 del `ValidationPipe` (inglés) nunca se ven tal cual: se valida antes de enviar y, si llegan, se
      traducen por nombre de campo. Los de dominio (español) se muestran tal cual (F6). Visto: un 400 de
      dominio (la contraseña actual) tal cual. *No ejercitada: la traducción de un 400 en inglés, que la
      validación previa no deja llegar.*
- [x] Un 401 de una petición que viajó con un token que ya no es el guardado **no cierra la sesión** (F7).
      Hecho en la capa base. En la prueba del cambio de contraseña, el token viejo responde 401 y la página
      no vuelve al login.

---

## Contrato que consume

Todas las rutas exigen sesión (`JwtAuthGuard`): van con el Bearer por defecto (sin `{ auth: false }`). Un 401
de cualquiera de ellas lo atiende el handler global (cierra la sesión), salvo el caso de F7.

| Llamada | Cuerpo | Respuesta | Errores |
|---------|--------|-----------|---------|
| `GET /usuarios/me` | — | 200 `PerfilDto` | 401 |
| `PATCH /usuarios/me` | `{ nombreCompleto?, especialidad? }` | 200 `PerfilDto` | 400, 401 |
| `PUT /usuarios/me/contrasena` | `{ contrasenaActual, contrasenaNueva }` | 200 `{ accessToken }` | 400, 401, 409, 429 |
| `GET /organizacion/suscripcion` | — | 200 `SuscripcionDto` | 401, 403 |
| `POST /soporte/mensajes` | `{ categoria?, mensaje }` | 201 `{ id, creadoEn }` | 400, 401, 429 |

Formas crudas (las fechas llegan como texto ISO; los tipos del front van en el `model/types.ts` de cada
feature y la traducción a nombres del front, en su `api/`, como `features/auth/api/authApi.ts`):

```ts
// GET y PATCH /usuarios/me
interface PerfilDto {
  id: string
  email: string
  nombreCompleto: string
  especialidad: string | null   // solo se muestra en el perfil
  rol: 'ADMINISTRADOR' | 'PROFESIONAL'
  tenantId: string
  tenantSlug: string            // arma /agendar-cita/<slug>
  tenantNombre: string
  creadoEn: string
}

// PATCH /usuarios/me — ausente = no cambia
interface ActualizarPerfilRequest {
  nombreCompleto?: string       // no vacío tras recortar, ≤ 120; null → 400 (no se borra)
  especialidad?: string | null  // ≤ 100; null o '' → se borra
}

// PUT /usuarios/me/contrasena — las contraseñas no se recortan nunca
interface CambiarContrasenaRequest { contrasenaActual: string; contrasenaNueva: string }
interface ContrasenaCambiadaDto { accessToken: string }   // token NUEVO de esta sesión

// GET /organizacion/suscripcion
interface SuscripcionDto {
  plan: string                  // código interno, hoy 'free'
  planNombre: string            // 'Plan piloto' (provisional, Q18)
  descripcion: string | null    // 'Sin cobro durante el piloto'
  altaEn: string                // tenants.creado_en
  renovacionEn: string | null   // siempre null en la v1
  metodoPago: string | null     // siempre null en la v1
}

// POST /soporte/mensajes
interface CrearMensajeSoporteRequest {
  categoria?: 'problema' | 'consulta' | 'sugerencia' | 'otro'   // en la API opcional (→ 'otro'); en el front, obligatoria (F3)
  mensaje: string               // 1 a 2000 tras recortar los extremos
}
interface MensajeSoporteCreadoDto { id: string; creadoEn: string }
```

- El backend descarta en silencio los campos que no conoce (`whitelist`): un `email` en el `PATCH` no cambia
  nada. Un `PATCH` sin campos responde 200 con el perfil actual, sin escribir.
- El rol para mostrar sale de la **sesión** (`roleLabel(currentUser.role)`), no de `PerfilDto.rol`: la
  traducción `ADMINISTRADOR` → `admin` vive en `features/auth/api/authApi.ts` y un feature no importa de otro.
  `updateUser` no toca el rol.

### Errores que el front tiene que reconocer

| Status | `message` | Origen | Qué hace el front |
|--------|-----------|--------|-------------------|
| 400 | `string[]` en inglés, p. ej. `nombreCompleto should not be empty`, `nombreCompleto must be shorter than or equal to 120 characters`, `especialidad must be shorter than or equal to 100 characters`, `contrasenaNueva must be longer than or equal to 8 characters`, `mensaje should not be empty`, `mensaje must be shorter than or equal to 2000 characters` | `ValidationPipe` | traducir por el campo que nombra el texto (`mensajesDeValidacion` + `erroresDelServidor` del feature) |
| 400 | `categoria debe ser problema, consulta, sugerencia u otro` (en la lista, pero en español) | `ValidationPipe` | ídem, campo `categoria` |
| 400 | *"La contraseña actual no es correcta"* | `ContrasenaActualIncorrectaError` | tal cual, junto a *Contraseña actual*; **la sesión sigue** |
| 400 | *"La nueva contraseña debe tener al menos 8 caracteres"* · *"La nueva contraseña es demasiado larga: como máximo 72 bytes (…)"* · *"La nueva contraseña debe ser distinta de la actual"* | `ContrasenaNoValidaError`, `ContrasenaRepetidaError` | tal cual, junto a *Nueva contraseña* |
| 400 | *"El nombre no puede quedar vacío"* · *"El nombre puede tener como máximo 120 caracteres"* · *"La especialidad puede tener como máximo 100 caracteres"* | `PerfilInvalidoError` (red de seguridad: el DTO responde antes) | tal cual, junto al campo |
| 400 | *"Mensaje a soporte inválido (…): …"* | `MensajeSoporteInvalidoError` (red de seguridad) | tal cual, junto al texto |
| 403 | *"Solo el administrador de la organización puede ver la suscripción"* | `SoloAdministradorError` | *"Solo el administrador de la organización ve la suscripción."* |
| 409 | *"Tu contraseña cambió mientras tanto; vuelve a intentarlo"* | `ContrasenaCambiadaEnParaleloError` | tal cual |
| 429 | *"Ya enviaste 5 mensajes a soporte en las últimas 24 horas. Vuelve a intentarlo más tarde."* | tope por organización | tal cual |
| 429 | *"Demasiados intentos, prueba en unos minutos"* | cubos `cambioContrasena` y `soporte` (5 por hora por IP) | tal cual |
| 401 | — | usuario inexistente o token anterior al corte | handler global (cierra la sesión), salvo F7 |

`mensajeDelBackend(e)` devuelve el `message` cuando es un texto (todas las filas en español) y `null` con una
lista (`ValidationPipe`). Los 429 llegan **antes** que el 401 (el límite de tasa corre primero).

---

## Decisiones del front

Del usuario (2026-11-01). No se reabren.

| # | Decisión | Por qué |
|---|----------|---------|
| F1 | Se llega a *Mi Perfil* de **dos** formas: el bloque avatar + nombre + rol del sidebar es un enlace a `/perfil` (el botón de cerrar sesión queda **fuera** del enlace) **y** un ítem *Mi perfil* en la navegación | El bloque del usuario es donde se busca "mi cuenta"; el ítem lo hace visible en la lista de siempre. Con el botón fuera del enlace no se anidan elementos interactivos ni se navega al cerrar sesión |
| F2 | *Contactar soporte* está en *Mi Perfil* **y** en el sidebar: un ícono o entrada *Ayuda* que abre el modal desde cualquier pantalla del panel | Se le escribe a soporte cuando algo falla, y eso pasa en cualquier pantalla, no en el perfil |
| F3 | Categoría del mensaje **visible y obligatoria**: `problema`, `consulta`, `sugerencia` u `otro`, **sin ninguna marcada al abrir** | Es la opción (a) de la pregunta 4 del plan del backend. Una opción por defecto terminaría guardada sin que nadie la eligiera (mismo criterio que *"¿Quién lo pidió?"*, F6 de [US-07.01](07.01-registro-hechos.md)) |
| F4 | Las pestañas (*Información personal*, *Suscripción* solo admin, *Seguridad*) son **estado local** de la página | Ninguna necesita una URL propia; sin rutas hijas ni query. Al recargar se vuelve a la primera |
| F5 | La sesión (`name`, `tenantSlug`, `tenantNombre`) se refresca con `GET /usuarios/me` **solo al entrar a Mi Perfil** y tras un `PATCH` 200 (`updateUser`) | `restoreSession` sigue sin pedir nada al backend: una petición más en cada navegación no aporta. Mi Perfil es donde esos datos se ven y se cambian |
| F6 | Los 400 del `ValidationPipe` (inglés, `message: string[]`) los traduce el front por nombre de campo, validando antes de enviar. Los de dominio (`message: string`, español) se muestran tal cual. Patrón `erroresDelServidor` de `configurar-recordatorios` y `gestionar-cita` | Los textos de class-validator no son para el usuario; los de dominio sí (el backend los escribió para mostrarse). Validar antes hace que el 400 en inglés sea casi imposible |
| F7 | Carrera entre pestañas: en `httpClient`, ante un 401, si **hay** un token guardado (`getToken()`) y ya no es el que se envió, se lanza el `HttpError` **sin** llamar a `onUnauthorized`. Sin token guardado sí se avisa (ver riesgo 6) | Tras el cambio de contraseña, una petición en vuelo con el token viejo recibe 401 y cerraría la sesión que acaba de recibir su token nuevo; igual en otra pestaña con `localStorage`. ✅ Hecho |
| F8 | Mientras no haya casilla de soporte ([Q19](https://github.com/Citia-solutions/citia-backend/blob/develop/context/PREGUNTAS-ABIERTAS.md#q19--casilla-de-soporte)), el modal **no promete respuesta por correo**: aviso fijo *"No incluyas datos de tus pacientes (nombres, RUT, diagnósticos)."*; con el 201, *"Recibimos tu mensaje."* | Sin `SOPORTE_CORREO_DESTINO` en production los mensajes quedan `pendiente` y no salen. *"Recibimos tu mensaje"* es cierto (riesgo 9 del plan del backend). Cuando se resuelva Q19 se agrega *"Te responderemos a <correo>"* (pendiente) |
| F9 | El aviso viejo de `ENLACE_PUBLICO_LISTO = false` (dice que la página pública no limita envíos; el backend ya limita y tiene `trust proxy`) **no se toca en esta rama** | Es otro feature (`compartir-enlace-agenda`) y otro cambio: va en un `chore` aparte (pendiente). En *Mi Perfil* el botón se reutiliza tal como está, con la advertencia |

---

## Capa base (hecha)

Lo que el resto de la historia usa. `npm run build` en verde (2026-11-01).

| Export | Import público | Firma |
|--------|----------------|-------|
| `isTokenPersistent` | `@/shared/lib/authToken` | `(): boolean` — `true` si `citia.token` está en `localStorage` |
| `replaceToken` | `@/shared/lib/authToken` | `(token: string): void` — reescribe el token en el almacenamiento en que está; sin token guardado no escribe. **Desde un feature, usar el del store** |
| `mensajeDelBackend` | `@/shared/api/erroresValidacion` | `(e: unknown): string \| null` — `message` cuando es texto, con cualquier status |
| `useSessionStore().isAdmin` | `@/entities/session` | `boolean` (getter; `ComputedRef<boolean>` dentro del store) — `currentUser?.role === 'admin'` |
| `useSessionStore().updateUser` | `@/entities/session` | `(cambios: Pick<AuthUser, 'name' \| 'tenantSlug' \| 'tenantNombre'>): void` — memoria **y** `citia.user`, en el almacenamiento del token; sin sesión no hace nada; no toca `id`, `email` ni `role` |
| `useSessionStore().replaceToken` | `@/entities/session` | `(token: string): void` — lanza si el `sub` del token no es `currentUser.id`; no reescribe `citia.user` |
| `BaseInput` | `@/shared/ui/BaseInput.vue` | prop nueva `disabled?: boolean`; los atributos que no son props (`maxlength`, `readonly`, `inputmode`, `name`, `@blur`…) van al `<input>`, `class` y `style` a la raíz |

- `updateUser` y `replaceToken` del store **no escriben** si el token guardado ya no es del usuario en memoria
  (otra pestaña cerró la sesión o entró con otra cuenta): la próxima navegación recoge lo guardado.
- Con el 200 del cambio de contraseña: `session.replaceToken(res.accessToken)`. Si lanza (no debería: el token
  es del mismo usuario), tratarlo como error inesperado; el token viejo ya no vale y el próximo 401 cierra la
  sesión.
- Con `GET` o `PATCH` 200: `session.updateUser({ name: p.nombreCompleto, tenantSlug: p.tenantSlug,
  tenantNombre: p.tenantNombre })`. El sidebar y `CopiarEnlaceAgenda` leen `currentUser`, así que cambian solos.

---

## Archivos

| Archivo | Cambio | Estado |
|---------|--------|--------|
| `shared/lib/authToken.ts` | `isTokenPersistent`, `replaceToken` | ✅ |
| `shared/api/erroresValidacion.ts` | `mensajeDelBackend` (antes copia privada de `gestionar-cita`) | ✅ |
| `shared/api/httpClient.ts` | F7: 401 sin `onUnauthorized` si hay otro token guardado (sin token guardado, sí avisa) | ✅ |
| `shared/ui/BaseInput.vue` | `inheritAttrs: false` (atributos al `<input>`), prop `disabled` | ✅ |
| `entities/session/model/store.ts` | `isAdmin`, `updateUser`, `replaceToken` | ✅ |
| `entities/session/model/storedUser.ts` | comentario (ya hay `GET /usuarios/me`) | ✅ |
| `features/gestionar-cita/model/mensajeDeError.ts` | usa `mensajeDelBackend` de shared; mismo comportamiento | ✅ |
| `src/shared/CLAUDE.md`, `src/entities/CLAUDE.md` | API nueva, F7, sin "no hay `GET /me`" | ✅ |
| `app/router/index.ts` | ruta hija del panel `{ path: 'perfil', name: 'perfil', component: PerfilPage }` | ✅ |
| `app/layouts/PanelSidebar.vue` | sección *CUENTA* con el ítem *Mi perfil* (F1) y el botón *Contactar soporte* que abre el modal (F2); el bloque avatar + nombre + rol es un `RouterLink` a `perfil` con *Cerrar sesión* fuera (F1). Conserva `ConfirmarCerrarSesion`. Colapsado (< 860 px): íconos con `title` y `aria-label`, avatar como enlace y *Cerrar sesión* debajo | ✅ |
| `pages/perfil/index.ts`, `pages/perfil/ui/PerfilPage.vue` | **nuevo**: título *Mi perfil*, botón *Contactar soporte*, pestañas locales (F4, `role="tablist"`, flechas, Inicio y Fin) con *Suscripción* solo con `isAdmin`. Cada pestaña se monta la primera vez que se abre y después solo se oculta (`v-show`): el perfil se pide una vez al entrar (F5), la suscripción solo si se mira y lo escrito no se pierde al cambiar de pestaña. Compone `CopiarEnlaceAgenda` en *Información personal* | ✅ |
| `features/editar-perfil/` | **nuevo**: `api/perfilApi.ts` (`GET` y `PATCH /usuarios/me`, traducción de `PerfilDto` a `Perfil`), `model/` (`types.ts`, `perfilSchema.ts` con `NOMBRE_MAX` 120 y `ESPECIALIDAD_MAX` 100, validación y `erroresDelServidor`; `useEditarPerfil.ts`, que pide el perfil, llama a `updateUser` con el `GET` y el `PATCH` 200 y envía solo lo que cambió), `ui/InformacionPersonal.vue` (avatar, correo con su nota, rol de la sesión y organización en lectura + formulario) | ✅ |
| `features/ver-suscripcion/` | **nuevo**: `api/suscripcionApi.ts` (`GET /organizacion/suscripcion`, fechas a `Date`), `model/` (`types.ts`, `useSuscripcion.ts` con el texto del 403, sin reintento), `ui/SuscripcionOrganizacion.vue` (*Plan* + `descripcion`, *Desde* con `formatearFecha` en la zona de Chile, *Renovación* y *Método de pago* "—" con `null`) | ✅ |
| `features/cambiar-contrasena/` | **nuevo**: `api/contrasenaApi.ts` (`PUT /usuarios/me/contrasena`, con el Bearer), `model/` (`types.ts`, `contrasenaSchema.ts` con 8 caracteres reales y 72 bytes UTF-8, confirmación y `erroresDelServidor`; `useCambiarContrasena.ts`, que con el 200 llama a `replaceToken`, avisa y limpia), `ui/CambiarContrasenaForm.vue` (tres campos + `username` oculto con el correo) | ✅ |
| `features/contactar-soporte/` | **nuevo**: `api/soporteApi.ts` (`POST /soporte/mensajes`), `model/` (`types.ts`, `soporteSchema.ts` con `MENSAJE_MAX` 2000, las categorías, el aviso de F8 y `erroresDelServidor`; `useContactarSoporte.ts`), `ui/ContactarSoporteModal.vue` (modal con foco atrapado, sin cierre mientras envía). Lo montan `pages/perfil` y `app/layouts/PanelSidebar.vue` | ✅ |
| `context/Features/` | feature nueva [perfil-cuenta](../Features/perfil-cuenta.md), [login-sesion](../Features/login-sesion.md) (`GET /usuarios/me`, `updateUser`, `replaceToken`, `isAdmin`, F7, el sidebar) y el índice | ✅ |
| `context/Deudas/` | [DTF-06](../Deudas/DTF-06.md) con los límites de US-10; [DTF-08](../Deudas/DTF-08.md) nueva (riesgo 1); el índice | ✅ |
| `context/README.md` | la entrada de este plan, la de la feature y el estado de la Fase 7 | ✅ |
| `CLAUDE.md` raíz, `src/pages/CLAUDE.md`, `.claude/agents/{ui,shared}-agent.md`, `.claude/commands/orchestrate.md` | ruta `/perfil`, roles (*"el front no ramifica por rol"*), *"No hay `GET /me`"*, la sesión refrescable y F7, lista de features, de páginas y de `shared/` | ✅ |

---

## Verificación

- `npm run build` (`vue-tsc` + Vite) en verde. El repo no tiene ESLint ni tests (`npm run lint` no existe).
  - Capa base: ✅ 2026-11-01. `BaseInput` renderizado aparte: `maxlength`, `name` y `disabled` caen en el
    `<input>`, `class` y `style` en la raíz, y el login se ve igual que antes.
  - Features, página, ruta y sidebar: ✅ 2026-11-01.

### Prueba en el navegador (2026-11-01)

Contra el **backend local** (NestJS en `localhost:3000`, con Postgres y los datos del seed) y el front en
`localhost:3002`, con el usuario demo (administrador) y la sesión en `sessionStorage` (sin *"Mantener sesión
iniciada"*).

| Qué | Resultado |
|-----|-----------|
| *Información personal* | Se ven el correo con su nota, el rol *Administrador* y la organización. Al guardar nombre y especialidad: *"Cambios guardados."*, el sidebar cambia sin recargar y los datos quedan en la base |
| *Suscripción* | *Plan piloto*, *"Sin cobro durante el piloto"*, *Desde* "1 de noviembre de 2026", y "—" en *Renovación* y *Método de pago* |
| Contraseña actual incorrecta | *"La contraseña actual no es correcta"* bajo el campo; la sesión sigue |
| Cambio de contraseña correcto | *"Listo. Cerramos las demás sesiones abiertas."*, los campos quedan vacíos y el token se reemplaza en el mismo `sessionStorage`. El token nuevo responde 200, el viejo 401, y la página no vuelve al login |
| *Contactar soporte* desde el sidebar, en el Resumen | Sin categoría: *"Elige una categoría."*. Con *Consulta* y un texto: `POST` 201 y *"Recibimos tu mensaje."*; la fila queda en `mensajes_soporte` como `consulta`, `pendiente`. El aviso de no incluir datos de pacientes está a la vista y no se promete respuesta por correo |
| Sidebar colapsado (800 px) | Los ítems nuevos quedan como íconos y el avatar sigue enlazando al perfil |
| Consola | Sin errores de JavaScript; solo el 400 y el 401 esperados |

**No se probó:**

- el corte de sesiones con un segundo navegador real (lo cubren los e2e del backend);
- el 409 y los 429 desde la UI (contraseña y soporte);
- que la pestaña *Suscripción* no aparezca para un `PROFESIONAL`: hoy todo usuario es `ADMINISTRADOR` (DT-07 del
  backend), y con ella el 403;
- una contraseña nueva de más de 72 bytes.

Tampoco figuran en la prueba el botón de copiar el enlace de agenda, vaciar la especialidad y abrir el modal de
soporte desde *Mi Perfil*.

### Lo que falta

- **Verificación manual en staging** (después del merge a `develop`), puntos 2 a 6 de la
  [verificación manual mínima del backend](https://github.com/Citia-solutions/citia-backend/blob/develop/context/US/10-perfil-cuenta.md#verificación-manual-mínima):
  2. *Mi Perfil*: se ven los datos; cambiar el nombre lo cambia en el sidebar sin recargar; la especialidad se
     guarda y se borra; el correo y la organización no se pueden editar; el enlace se copia.
  3. Sesión en dos navegadores (A y B). En A, cambiar la contraseña: A sigue funcionando; **B vuelve al login
     en su siguiente acción**; la contraseña vieja ya no entra. Además (F7): otra pestaña de A con
     "Mantener sesión iniciada" sigue con sesión (lee el token nuevo).
  4. Con la contraseña actual mal escrita: error en el formulario y **la sesión sigue abierta**.
  5. *Contactar soporte* (desde Mi Perfil y desde la entrada *Contactar soporte* del sidebar en otra
     pantalla): el mensaje queda en
     `mensajes_soporte`; con `MENSAJERIA_ADAPTADOR=registro` pasa a `enviado` con `proveedor = 'registro'` sin
     salir (esperado en staging). El modal no promete respuesta por correo (F8).
  6. *Suscripción*: visible para el administrador, con el nombre del plan y la fecha de alta. Hoy todo usuario
     es `ADMINISTRADOR` (no hay alta de profesionales, DT-07 del backend): la rama de un profesional (sin
     pestaña) solo se puede ver con un usuario cambiado a mano o con respuestas simuladas.
- **Commit y PR** de esta rama a `develop` (hoy todo está sin commit).
- **Release `develop` → `main`:** lleva además `2b63d31` (modal de confirmación al cerrar sesión, de otro
  autor), que está en `develop` y no en `main` (riesgo 5): probarlo en staging y nombrarlo en el PR.

---

## Riesgos

| # | Riesgo | Mitigación |
|---|--------|------------|
| 1 | **Los 400 no traen un código**: el campo se deduce del texto (`nombreCompleto …` del `ValidationPipe`, *"La contraseña actual…"* del dominio). Si el backend cambia un texto, el error cae en el mensaje general en vez de junto al campo | Validar antes de enviar (F6) deja el 400 como caso raro; reconocer por el **comienzo** del texto (`startsWith`), como `useEditarContacto`; lo no reconocido va al mensaje general, nunca se pierde. Fichado como [DTF-08](../Deudas/DTF-08.md) (2026-11-01), junto con los features anteriores que hacen lo mismo |
| 2 | **Límites copiados a mano** ([DTF-06](../Deudas/DTF-06.md)): nombre 120, especialidad 100 (en `.length` tras recortar), contraseña nueva de **8 caracteres reales** (`Array.from(texto).length`) y **≤ 72 bytes UTF-8** (`new TextEncoder().encode(texto).length`), mensaje de soporte 2000 en `.length` tras recortar | Una constante por límite, con el comentario del DTO o la constante de dominio que copia; sumadas a la tabla de DTF-06 (2026-11-01), con las cuatro categorías. El backend valida siempre |
| 3 | **`altaEn` sin zona** ([DT-46](https://github.com/Citia-solutions/citia-backend/blob/develop/context/Deudas/DT-46.md) del backend): `tenants.creado_en` es `timestamptz` en producción, pero no en los entornos que arman el esquema con `synchronize` | Mostrar solo la fecha y siempre con `shared/lib/fecha.ts` en `ZONA_HORARIA`; si en un entorno de pruebas sale un día corrido, es DT-46, no el front |
| 4 | **No hay `BaseModal`, `BaseTextarea` ni `BaseTabs`** | Copiar los patrones que ya existen: modal con foco inicial, `Escape` y devolución del foco (`app/layouts/ConfirmarCerrarSesion.vue`, `AceptarSolicitudModal.vue`); `<textarea>` con `maxlength` y contador (`ReagendarCitaForm.vue`); pestañas con `role="tablist"` (`BandejaSolicitudes.vue`). Si el modal de soporte se usa desde el sidebar y desde la página, que viva **una sola vez** en `features/contactar-soporte` |
| 5 | **El release del front arrastra `2b63d31`** (modal de confirmación del cierre de sesión), que está en `develop` y no en `main` | Probarlo también en staging antes del release `develop` → `main`, y nombrarlo en el PR del release |
| 6 | **Un 401 de un token viejo se lanza igual** (F7): el feature que lo reciba (p. ej. una petición en vuelo durante el cambio de contraseña) muestra su texto de 401 (*"Tu sesión expiró…"*) aunque la sesión siga. `httpClient` solo calla cuando **hay** un token guardado y es **otro** distinto del enviado. Si otra pestaña **vació** el almacenamiento (cerró la sesión), `getToken()` es `null` y el 401 **sí** avisa a `onUnauthorized`: la pestaña vuelve al login como siempre | Raro (solo peticiones en vuelo justo en el cambio); repetir la acción funciona. Si molesta, el feature puede reintentar una vez un 401 cuyo token cambió |
| 7 | **El aviso de soporte depende de Q19**: cuando haya casilla, el texto cambia (*"Te responderemos a <correo>"*) | Pendiente anotado; el texto vive en una constante del feature |
| 8 | **El nombre del plan es provisional** ([Q18](https://github.com/Citia-solutions/citia-backend/blob/develop/context/PREGUNTAS-ABIERTAS.md#q18--nombre-legible-del-plan-free)) | El front muestra `planNombre` tal cual: cambiarlo es del backend |

---

## Pendientes fuera de esta rama

- **`chore` de `ENLACE_PUBLICO_LISTO`** (F9): el aviso dice que la página pública no limita envíos; el backend
  ya limita (y tiene `trust proxy`). Revisar el texto o pasar la constante a `true`.
- **Q19 resuelta → texto de soporte** (F8): agregar *"Te responderemos a <correo>"* (el correo de la sesión).

---

## Diferencias con el plan del backend

- **Soporte sin promesa de respuesta** (F8): el plan pide el aviso *"… Te responderemos a <correo>."*; queda
  sin la segunda frase hasta Q19.
- **Categoría** (F3): el plan la dejaba sujeta a la pregunta 4; queda en (a), visible y obligatoria en la
  pantalla (en la API sigue opcional).
- **Acceso a Mi Perfil** (F1): el plan ofrecía avatar **o** una entrada del menú; quedan los dos. *Ayuda* en el
  sidebar (F2) es el *"donde el usuario quiera del panel"* del plan.
- **Refresco de la sesión** (F5): además de al entrar (plan), tras cada `PATCH` 200.
- **401 de un token viejo** (F7): no estaba en el plan; el plan da por esperado que otra pestaña con
  `localStorage` lea el token nuevo en su siguiente petición, y F7 evita que una petición en vuelo con el token
  viejo la saque antes.

---

## Desvíos de la implementación (2026-11-01)

Lo que el código hizo distinto o más allá de este plan. Ninguno toca una decisión F1–F9.

- **Entrada del sidebar (F2):** se llama *Contactar soporte*, no *Ayuda*: dice qué hace y coincide con el
  título del modal y con el botón de Mi Perfil. Va en una sección nueva *CUENTA*, junto a *Mi perfil*.
- **Pestañas montadas al primer uso** (F4): no estaba en el plan. Sin eso, volver a *Información personal*
  repetiría el `GET /usuarios/me` y borraría lo escrito; con `v-show` desde el inicio, la suscripción se
  pediría aunque nadie la mire.
- **400 de cambio de contraseña:** con un error reconocido junto a su campo no se muestra además un mensaje
  general (en el perfil sí: *"Revisa los campos marcados: el servidor los rechazó."*, como en
  `configurar-recordatorios`).
- **Soporte enviado:** con el 201 el modal cambia a una vista con *"Recibimos tu mensaje."* y un botón
  *Cerrar* (con el foco), en vez de cerrarse solo: así el aviso se alcanza a leer.
- **`Perfil` sin `rol`, `tenantId` ni `creadoEn`:** la pantalla no los usa (el rol sale de la sesión).
- **`altaEn` y `renovacionEn` como `Date | null`:** `api/` las convierte; un texto ilegible se muestra "—"
  en vez de romper el formato.
- **Textos que el plan no fijaba** (todos en constantes o en la plantilla del feature): *"Cambios
  guardados."* (`PATCH` 200), *"Ingresa tu nombre."*, *"Ingresa tu contraseña actual."*, *"Repite la nueva
  contraseña."*, *"Las contraseñas no coinciden."*, *"Elige una categoría."*, *"Escribe tu mensaje."* y los
  de red, 401 y 5xx del patrón de siempre. La ayuda de la especialidad lleva punto final: *"Solo se ve en tu
  perfil."*
