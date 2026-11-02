# Mi perfil — datos, suscripción, contraseña y soporte

**Estado:** ✅ Implementado (2026-11-01) · verificado en el navegador contra el **backend local** · ⚠️ sin
verificación manual en staging
**Rama:** `feature/fase7-perfil-cuenta` (sale de `develop` = `2b63d31`) · sin commit
**Origen:** US-10, Fase 7 (RF-04) — [plan del front](../us/10-perfil-cuenta.md), con las decisiones
[F1–F9](../us/10-perfil-cuenta.md#decisiones-del-front)
**Backend:** [`us10-perfil-cuenta.md`](../../../citia-backend/context/Features/us10-perfil-cuenta.md) ·
[plan backend](../../../citia-backend/context/US/10-perfil-cuenta.md) ·
[ADR-15](../../../citia-backend/context/Decisions/ADR-15.md). En producción desde el 2026-11-01 (backend PR #15)
**Código:** `src/pages/perfil/` · `src/features/editar-perfil/` · `src/features/ver-suscripcion/` ·
`src/features/cambiar-contrasena/` · `src/features/contactar-soporte/` · `src/app/layouts/PanelSidebar.vue` ·
**Ruta:** `/perfil` (`perfil`, hija del panel)

> Primera pantalla de la cuenta del usuario. La sesión pasa a poder refrescarse y a cambiar de token sin volver
> a iniciar sesión: eso está en [login-sesion](login-sesion.md#cambios-de-us-10--mi-perfil-2026-11-01).

---

## Qué hace

| Pieza | Qué ve el usuario |
|-------|-------------------|
| **Información personal** | Avatar con iniciales, nombre y especialidad. En lectura: el correo (*"Es tu usuario para iniciar sesión; por ahora no se puede cambiar."*), el rol y la organización. Debajo, el enlace de agenda con su botón de copiar y su advertencia (el de `compartir-enlace-agenda`, tal como está, F9). Se editan **solo** el nombre y la especialidad (*Guardar cambios* / *Descartar cambios*) |
| **Suscripción** (solo administrador) | *Plan* (`planNombre` y su `descripcion`), *Desde* (fecha de alta), *Renovación* y *Método de pago*. En la v1 los dos últimos son siempre "—": no hay cobro |
| **Seguridad** | Contraseña actual, nueva y su confirmación. Al cambiarla se cierran las demás sesiones abiertas con la cuenta; **esta sigue** con un token nuevo |
| **Contactar soporte** | Modal con la categoría (*Problema*, *Consulta*, *Sugerencia*, *Otro*; obligatoria, ninguna marcada al abrir) y el mensaje (hasta 2000, con contador), con el aviso fijo de no incluir datos de pacientes. Con el 201, *"Recibimos tu mensaje."* y un botón *Cerrar* |

Las tres primeras son **pestañas** de la página; el modal se abre desde la página y desde el sidebar.

## Cómo se llega

| Desde | Qué |
|-------|-----|
| Sidebar, sección **CUENTA** | Ítem **Mi perfil** (enlace a `/perfil`) y botón **Contactar soporte**, que abre el modal en cualquier pantalla del panel (F1, F2) |
| Sidebar, bloque del usuario | Avatar + nombre + rol es un enlace a `/perfil`; **Cerrar sesión** queda fuera del enlace (F1) |
| *Mi perfil* | Botón **Contactar soporte** junto al título |

Con el sidebar colapsado (< 860 px) los dos ítems de *CUENTA* quedan como íconos con `title` y `aria-label`, el
avatar sigue siendo el enlace y *Cerrar sesión* va debajo.

---

## Archivos

| Archivo | Qué |
|---------|-----|
| `pages/perfil/ui/PerfilPage.vue` (+ `index.ts`) | Título *Mi perfil*, botón *Contactar soporte* y las pestañas (`role="tablist"`, flechas, Inicio y Fin). *Suscripción* existe solo con `isAdmin`. Cada pestaña se **monta la primera vez que se abre** y después solo se oculta (`v-show`). Compone `InformacionPersonal` + `CopiarEnlaceAgenda`, `SuscripcionOrganizacion`, `CambiarContrasenaForm` y `ContactarSoporteModal`; no tiene lógica de negocio |
| `features/editar-perfil/` | `api/perfilApi.ts` (`getPerfil`, `actualizarPerfil`; traduce `PerfilDto` a `Perfil`) · `model/perfilSchema.ts` (`NOMBRE_MAX`, `ESPECIALIDAD_MAX`, `validarPerfil`, `erroresDelServidor`) · `model/useEditarPerfil.ts` (carga, `updateUser` con el `GET` y con el `PATCH` 200, envía solo lo que cambió) · `ui/InformacionPersonal.vue` |
| `features/ver-suscripcion/` | `api/suscripcionApi.ts` (`getSuscripcion`; fechas a `Date`, `null` si no se leen) · `model/useSuscripcion.ts` (`SOLO_ADMINISTRADOR`, el 403 no se reintenta) · `ui/SuscripcionOrganizacion.vue` |
| `features/cambiar-contrasena/` | `api/contrasenaApi.ts` (`cambiarContrasena`) · `model/contrasenaSchema.ts` (`CONTRASENA_MIN_CARACTERES`, `CONTRASENA_MAX_BYTES`, `validarContrasena`, `erroresDelServidor`) · `model/useCambiarContrasena.ts` (con el 200, `session.replaceToken`, avisa y limpia) · `ui/CambiarContrasenaForm.vue` (tres campos + un `username` oculto con el correo, para el gestor de contraseñas) |
| `features/contactar-soporte/` | `api/soporteApi.ts` (`enviarMensajeSoporte`) · `model/soporteSchema.ts` (`MENSAJE_MAX`, `CATEGORIAS`, `AVISO_DATOS_PACIENTES`, `MENSAJE_RECIBIDO`, `validarMensaje`, `erroresDelServidor`) · `model/useContactarSoporte.ts` · `ui/ContactarSoporteModal.vue`. Vive **una sola vez** aquí y lo montan `pages/perfil` y `app/layouts/PanelSidebar.vue` |
| `app/router/index.ts` | Ruta hija del panel `{ path: 'perfil', name: 'perfil', component: PerfilPage }` (hereda `requiresAuth`) |
| `app/layouts/PanelSidebar.vue` | Sección *CUENTA* (*Mi perfil* y *Contactar soporte*), el bloque del usuario como enlace y el modal de soporte. Conserva `ConfirmarCerrarSesion` |
| `entities/session/model/store.ts` | `isAdmin`, `updateUser`, `replaceToken` — ver [login-sesion](login-sesion.md#cambios-de-us-10--mi-perfil-2026-11-01) |
| `shared/lib/authToken.ts` · `shared/api/httpClient.ts` | `isTokenPersistent`, `replaceToken` · el 401 de un token viejo no cierra la sesión (F7) |
| `shared/api/erroresValidacion.ts` | `mensajeDelBackend(e)`: el `message` cuando es un texto (antes, copia privada de `gestionar-cita`) |
| `shared/ui/BaseInput.vue` | Prop `disabled`; `inheritAttrs: false` (los atributos que no son props van al `<input>`, `class` y `style` a la raíz) |

Los cuatro features no se conocen entre sí: la página los compone. El rol que se muestra sale de la **sesión**
(`roleLabel(currentUser.role)`), no de `PerfilDto.rol`: la traducción `ADMINISTRADOR` → `admin` vive en
`features/auth` y un feature no importa de otro.

---

## Contrato que consume

Todas las rutas exigen sesión: van con el Bearer por defecto (sin `{ auth: false }`). Las formas crudas, los
textos de error y qué hace el front con cada uno están en el
[plan](../us/10-perfil-cuenta.md#contrato-que-consume).

| Llamada | Cuerpo | Respuesta | Errores | Quién |
|---------|--------|-----------|---------|-------|
| `GET /usuarios/me` | — | 200 `PerfilDto` | 401 | `editar-perfil`, al montar *Información personal* |
| `PATCH /usuarios/me` | `{ nombreCompleto?, especialidad? }` | 200 `PerfilDto` | 400, 401 | `editar-perfil` |
| `PUT /usuarios/me/contrasena` | `{ contrasenaActual, contrasenaNueva }` | 200 `{ accessToken }` | 400, 401, 409, 429 | `cambiar-contrasena` |
| `GET /organizacion/suscripcion` | — | 200 `SuscripcionDto` | 401, 403 | `ver-suscripcion`, al abrir la pestaña |
| `POST /soporte/mensajes` | `{ categoria, mensaje }` | 201 `{ id, creadoEn }` | 400, 401, 429 | `contactar-soporte` |

- **`PATCH`:** viaja solo lo que cambió; la especialidad vacía va como `null` (la borra). El nombre no se puede
  borrar. El backend descarta los campos que no conoce.
- **Contraseñas:** viajan tal cual se escribieron, sin recortar (ni aquí ni en el backend).
- **Soporte:** en la API la categoría es opcional (→ `otro`); el front la manda siempre (F3). El mensaje va
  recortado en los extremos.
- **Fechas:** `altaEn`, `renovacionEn` y `creadoEn` llegan como texto ISO; `api/` las pasa a `Date` y un texto
  ilegible se muestra "—".

### Cómo se muestran los errores

| Caso | Qué hace el front |
|------|-------------------|
| 400 del `ValidationPipe` (`message: string[]`, inglés) | Casi imposible: se valida antes de enviar. Si llega, se traduce por el nombre del campo al comienzo del texto (`erroresDelServidor` de cada feature) y se muestra **junto al campo** (F6) |
| 400 de dominio (`message: string`, español) | Tal cual, junto al campo que nombra (*"La contraseña actual no es correcta"* → *Contraseña actual*; *"La nueva contraseña …"* → *Nueva contraseña*; *"El nombre …"*, *"La especialidad …"*, *"Mensaje a soporte inválido (…)"*). Lo que no se reconoce va al mensaje general, nunca se pierde |
| 403 de la suscripción | *"Solo el administrador de la organización ve la suscripción."*, sin *Reintentar*. No debería verse: la pestaña no existe para un profesional |
| 409 del cambio de contraseña | *"Tu contraseña cambió mientras tanto; vuelve a intentarlo."* |
| 429 (contraseña y soporte) | El `message` del backend tal cual (el tope de 5 mensajes por organización en 24 horas o el límite por IP); sin texto, *"Demasiados intentos, prueba en unos minutos."* |
| 401 | Handler global (cierra la sesión), salvo el de un token viejo (F7) |

Los textos se reconocen por su **comienzo** porque los 400 no traen un código: [DTF-08](../Deudas/DTF-08.md).

---

## La sesión

| Qué | Cómo |
|-----|------|
| **Refresco (F5)** | Con la respuesta de `GET` y de `PATCH /usuarios/me` 200, `session.updateUser({ name, tenantSlug, tenantNombre })` reescribe la sesión en memoria y en `citia.user`. El sidebar y `CopiarEnlaceAgenda` leen `currentUser`, así que cambian sin recargar. **En ningún otro lugar** se pide el perfil: `restoreSession` sigue sin llamar al backend |
| **Token nuevo** | Con el 200 del cambio de contraseña, `session.replaceToken(accessToken)` lo guarda en el mismo almacenamiento en que estaba (`localStorage` o `sessionStorage`). Si lanzara (no debería: el token es del mismo usuario), el formulario lo dice como error inesperado |
| **401 de un token viejo (F7)** | Una petición que viajó con un token que ya no es el guardado no llama a `onUnauthorized`: no cierra la sesión que acaba de recibir su token nuevo. Sin token guardado (otra pestaña cerró la sesión) sí avisa |
| **Rol** | `isAdmin` decide si existe la pestaña *Suscripción*. Es presentación: el permiso lo decide el backend (403). Es el único lugar del front que ramifica por rol |

Detalle de `updateUser`, `replaceToken` y F7 en [login-sesion](login-sesion.md#cambios-de-us-10--mi-perfil-2026-11-01) y
en `src/entities/CLAUDE.md` / `src/shared/CLAUDE.md`.

---

## Decisiones

Del usuario (2026-11-01). El porqué de cada una, en el [plan](../us/10-perfil-cuenta.md#decisiones-del-front).

| # | Decisión |
|---|----------|
| F1 | A *Mi perfil* se llega por el bloque avatar + nombre + rol del sidebar (enlace, con *Cerrar sesión* fuera) **y** por el ítem *Mi perfil* |
| F2 | *Contactar soporte* está en *Mi perfil* **y** en el sidebar, desde cualquier pantalla del panel |
| F3 | Categoría visible y obligatoria, sin ninguna marcada al abrir |
| F4 | Las pestañas son estado local de la página: sin rutas hijas ni query; al recargar se vuelve a la primera |
| F5 | La sesión se refresca con `GET /usuarios/me` solo al entrar a *Mi perfil* y tras un `PATCH` 200 |
| F6 | Los 400 en inglés se traducen por nombre de campo, validando antes de enviar; los de dominio, tal cual |
| F7 | Un 401 de un token que ya no es el guardado no cierra la sesión |
| F8 | El modal de soporte no promete respuesta por correo mientras no haya casilla (Q19) |
| F9 | El aviso viejo de `ENLACE_PUBLICO_LISTO` no se toca en esta rama: va en un `chore` aparte |

**Desvíos de la implementación** (ninguno toca una decisión): la entrada del sidebar se llama *Contactar soporte*
(no *Ayuda*) y va en una sección nueva *CUENTA*; las pestañas se montan al primer uso; con un 400 de contraseña
reconocido junto a su campo no se repite un mensaje general; el modal de soporte, con el 201, cambia a una vista
de *"Recibimos tu mensaje."* en vez de cerrarse solo. Lista completa en el
[plan](../us/10-perfil-cuenta.md#desvíos-de-la-implementación-2026-11-01).

---

## Copy que carga significado

| Texto | Por qué importa |
|-------|-----------------|
| *"Es tu usuario para iniciar sesión; por ahora no se puede cambiar."* (correo) | El correo es la credencial del login y el backend no lo deja cambiar; sin la nota parece un campo roto |
| *"Solo se ve en tu perfil."* (especialidad) | La especialidad no se muestra en ninguna otra pantalla ni al paciente (decisión provisional del backend): se dice para no crear esa expectativa |
| *"Al cambiarla cerramos las demás sesiones abiertas con tu cuenta, en otros navegadores o equipos. Esta sesión sigue abierta."* | El backend corta las demás sesiones al cambiar la contraseña; se avisa antes de hacerlo |
| *"Listo. Cerramos las demás sesiones abiertas."* | Confirma el corte y que esta sesión sigue (token nuevo) |
| *"La nueva contraseña es demasiado larga: como máximo 72 bytes (72 letras sin tildes; menos si lleva tildes, ñ o emojis)."* | El tope es en bytes (bcrypt), no en caracteres: el texto explica por qué una contraseña con tildes cabe menos |
| *"No incluyas datos de tus pacientes (nombres, RUT, diagnósticos)."* | Los mensajes a soporte salen de la plataforma por correo: que no lleven datos clínicos |
| *"Recibimos tu mensaje."* | Es cierto aunque el correo a soporte todavía no salga (sin casilla en production, Q19). No promete respuesta (F8) |
| *"Solo el administrador de la organización ve la suscripción."* | El 403, en palabras del usuario; no debería verse |
| *"Cambios guardados."* · *"Tienes cambios sin guardar."* | El perfil no se guarda solo; el botón *Guardar cambios* se habilita solo con cambios |

---

## Reglas de la interfaz

- **Límites copiados del backend** ([DTF-06](../Deudas/DTF-06.md)): nombre 120 y especialidad 100 (`.length`
  tras recortar); contraseña nueva de 8 caracteres reales (`Array.from`) y como mucho 72 bytes UTF-8
  (`TextEncoder`); mensaje de soporte 2000 (`.length` tras recortar); las cuatro categorías. Los inputs llevan
  `maxlength` y el mensaje un contador. La confirmación de la contraseña solo existe en el front.
- **Errores visibles al salir del campo o al intentar enviar**, no mientras se escribe. Al editar un campo, el
  error que mandó el servidor para él y el aviso de éxito dejan de valer.
- **Fechas** con `formatearFecha` de `shared/lib/fecha.ts`, en la zona de Chile. Si en un entorno de pruebas la
  fecha de alta sale corrida un día, es [DT-46](../../../citia-backend/context/Deudas/DT-46.md) del backend
  (`creado_en` sin zona con `synchronize`), no el front.
- **Modal de soporte:** foco inicial en la primera categoría (enfocarla no la marca), `Tab` no sale del diálogo,
  `Esc` y el clic fuera cierran salvo mientras envía, y el foco vuelve a donde estaba. Ids únicos por instancia
  (`useId`): el modal se monta en el sidebar y en la página. Cada vez que se abre empieza vacío.
- **Pestañas:** patrón ARIA (`role="tab"`, `aria-selected`, `aria-controls`, `tabindex` móvil, flechas, Inicio
  y Fin). Montadas al primer uso: el perfil se pide una vez al entrar, la suscripción solo si se mira y lo
  escrito no se pierde al cambiar de pestaña. Si la sesión deja de ser de un administrador con *Suscripción*
  abierta, se vuelve a la primera.
- **Sin `BaseModal`, `BaseTextarea` ni `BaseTabs`:** el modal, el `<textarea>` con contador y las pestañas
  copian los patrones que ya había (`ConfirmarCerrarSesion`, `ReagendarCitaForm`, `BandejaSolicitudes`).

---

## Verificación

- `npm run build` (`vue-tsc` + Vite) en verde. El front no tiene tests automáticos ni lint.
- **Prueba manual en el navegador (2026-11-01)** contra el backend local (NestJS en `localhost:3000`, Postgres
  con los datos del seed) y el front en `localhost:3002`, con el usuario demo administrador y la sesión en
  `sessionStorage`:
  - *Información personal*: el correo con su nota, el rol *Administrador* y la organización. Guardar nombre y
    especialidad → *"Cambios guardados."*, el sidebar cambia sin recargar y los datos quedan en la base.
  - *Suscripción*: *Plan piloto*, *"Sin cobro durante el piloto"*, *Desde* "1 de noviembre de 2026", "—" en
    *Renovación* y *Método de pago*.
  - Contraseña actual incorrecta → *"La contraseña actual no es correcta"* bajo el campo; la sesión sigue.
  - Cambio correcto → *"Listo. Cerramos las demás sesiones abiertas."*, campos vacíos y el token reemplazado en
    el mismo `sessionStorage`. El token nuevo responde 200, el viejo 401, y la página no vuelve al login.
  - Soporte desde el sidebar en el Resumen: sin categoría, *"Elige una categoría."*; con *Consulta* y un texto,
    `POST` 201 y *"Recibimos tu mensaje."*; la fila queda en `mensajes_soporte` como `consulta`, `pendiente`.
    El aviso de datos de pacientes está a la vista y no se promete respuesta por correo.
  - Sidebar colapsado a 800 px: los ítems nuevos quedan como íconos y el avatar sigue enlazando al perfil.
  - Consola sin errores de JavaScript; solo el 400 y el 401 esperados.
- **No se probó:** el corte de sesiones con un segundo navegador real (lo cubren los e2e del backend); el 409 y
  los 429 desde la UI; la pestaña *Suscripción* oculta para un `PROFESIONAL` (hoy todo usuario es
  `ADMINISTRADOR`, [DT-07](../../../citia-backend/context/Deudas/DT-07.md) del backend), y con ella el 403; una
  contraseña de más de 72 bytes. Tampoco figuran en la prueba copiar el enlace de agenda, vaciar la especialidad
  ni abrir el modal desde *Mi perfil*.

## Pendientes

| Qué | Nota |
|-----|------|
| **Verificación manual en staging** | Tras el merge a `develop`: puntos 2 a 6 de la [verificación manual mínima](../../../citia-backend/context/US/10-perfil-cuenta.md#verificación-manual-mínima) del backend, con dos navegadores para el corte de sesiones (detalle en el [plan](../us/10-perfil-cuenta.md#lo-que-falta)) |
| **Commit, PR y release** | Todo sin commit. El release `develop` → `main` lleva además `2b63d31` (modal de confirmación al cerrar sesión, de otro autor), que está en `develop` y no en `main`: probarlo en staging y nombrarlo en el PR |
| `chore` de `ENLACE_PUBLICO_LISTO` (F9) | El aviso del enlace de agenda dice que la página pública no limita envíos; el backend ya limita (DT-18 en producción desde la Fase 3) y tiene `trust proxy`. Revisar el texto o pasar la constante a `true`, fuera de esta rama |
| Q19 resuelta → texto de soporte (F8) | Agregar *"Te responderemos a <correo>"* (el correo de la sesión) cuando haya casilla de soporte ([Q19](../../../citia-backend/context/PREGUNTAS-ABIERTAS.md#q19--casilla-de-soporte)). Mientras, en production los mensajes quedan `pendiente` |
| Nombre del plan | *Plan piloto* es provisional ([Q18](../../../citia-backend/context/PREGUNTAS-ABIERTAS.md#q18--nombre-legible-del-plan-free)); el front muestra `planNombre` tal cual, así que cambiarlo es del backend |
| 401 de un token viejo con texto de sesión vencida | Una petición en vuelo durante el cambio de contraseña recibe 401: F7 no cierra la sesión, pero el feature que la hizo muestra *"Tu sesión expiró…"* aunque la sesión siga. Raro; repetir la acción funciona (riesgo 6 del plan) |

## Deudas técnicas asociadas

- [DTF-06](../Deudas/DTF-06.md) — los límites de nombre, especialidad, contraseña y mensaje, y las categorías,
  copiados del backend.
- [DTF-08](../Deudas/DTF-08.md) — los errores del backend se reconocen por su texto (nueva, 2026-11-01).
- Backend: [DT-01](../../../citia-backend/context/Deudas/DT-01.md) (en parte cerrada por US-10: el cambio de
  contraseña corta las demás sesiones; cerrar sesión sigue sin revocar el token) ·
  [DT-07](../../../citia-backend/context/Deudas/DT-07.md) (sin alta de un segundo usuario: no hay profesionales
  con quien probar la rama sin *Suscripción*) · [DT-46](../../../citia-backend/context/Deudas/DT-46.md) (fecha
  de alta sin zona en los entornos con `synchronize`) · [DT-57](../../../citia-backend/context/Deudas/DT-57.md)
  (sin foto: el avatar son iniciales) · [DT-58](../../../citia-backend/context/Deudas/DT-58.md) (el nombre de la
  organización no se corrige: por eso va en lectura).
