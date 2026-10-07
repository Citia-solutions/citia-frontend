# Crear cita — modal "Nueva cita" del profesional

**Estado:** ✅ Implementado y conectado · correo obligatorio desde la Fase 2 (2026-10-04, ⚠️ sin prueba
manual contra el backend real)
**Rama del cambio de Fase 2:** `feature/fase2-recordatorios` (sin commit) · **detalles menores
(2026-10-06):** `chore/frontend-detalles-menores` — sin fechas pasadas, no se cierra mientras guarda,
hora de Chile ([abajo](#detalles-menores-2026-10-06))
**Backend:** [`us02-gestion-citas.md`](../../../citia-backend/context/Features/us02-gestion-citas.md) ·
[ADR-13 §14](../../../citia-backend/context/Decisions/ADR-13.md) (correo obligatorio)
**Feature:** `src/features/crear-cita/` (`ModalNuevaCita.vue`, `useCrearCita.ts`, `crearCitaSchema.ts`,
`toCrearCitaRequest.ts`)

> Hasta la Fase 2 este modal no tenía documento propio. Aquí se documenta lo esencial y el cambio del
> correo; el flujo público del paciente, que vive en el mismo feature, está en
> [agendar-cita-paciente](agendar-cita-paciente.md).

---

## Qué hace

**"+ Nueva cita"** (dashboard y agenda) abre un modal con: nombre, RUT (opcional), **correo**,
teléfono, fecha, bloque horario, duración, motivo (viaja como `tipoConsulta`) y el consentimiento del
paciente. Al guardar emite `created` con la cita tal como quedó en el servidor y se cierra; la página
recarga su lista y, si la cita choca con otra, muestra el aviso de solapamiento (ADR-11).

## Contrato con el backend

`POST /citas` — `{ inicio, duracionMin, tipoConsulta, paciente: { rut?, nombre, telefono, correo, consentimiento } }`

- `inicio` con zona explícita (`aInicioISO`, DT-14). La fecha y el bloque elegidos se leen como **hora de
  Chile** (`ZONA_HORARIA`), no del navegador ([DTF-07](../Deudas/DTF-07.md), cerrada).
- El backend resuelve el paciente por RUT: si existe en la organización, vincula la cita al existente.
- `rut` se omite si va vacío (el backend valida formato cuando está presente).

---

## Fase 2: el correo es obligatorio

El backend exige `paciente.correo` (`@IsEmail`, `@IsNotEmpty`, máx. 254; lo normaliza a minúsculas).
Sin él responde **400** (`"paciente.correo must be an email"`). **Este cambio del front tiene que salir
en el mismo release que el del backend**, o el modal de un front viejo recibe 400 (y uno nuevo contra
un backend viejo funciona igual: el correo ya era aceptado).

| Pieza | Cambio |
|-------|--------|
| `crearCitaSchema.ts` | Correo requerido, formato (`algo@dominio.xx`, final de 2+ caracteres) y largo ≤ `CORREO_MAX` (254, espejo del DTO — [DTF-06](../Deudas/DTF-06.md)) |
| `toCrearCitaRequest.ts` | `correo` viaja **siempre**, recortado. `PacienteEnCitaRequest.correo` deja de ser opcional |
| `useCrearCita.ts` | Un 400 que nombra campos (`paciente.correo …`, `paciente.telefono …`, `tipoConsulta …`) se traduce con `erroresDelServidor()` y se marca **en el campo**, además del aviso general *"Revisa los campos marcados: el servidor los rechazó."* |
| `ModalNuevaCita.vue` | Ayuda bajo el campo, `maxlength`, `autocomplete="off"` (para no autocompletar el correo del profesional), borde rojo y `aria-invalid` con error |
| `shared/api/erroresValidacion.ts` | Nuevo: `mensajesDeValidacion(e)` lee `message: string[] | string` de un 400 de NestJS. Lo usan también la configuración de recordatorios y el contacto del voucher |

### Copy que carga significado

| Texto | Por qué importa |
|-------|-----------------|
| *"Ingresa el correo del paciente: ahí le llegan los recordatorios."* | Explica por qué ahora es obligatorio, en vez de un "campo requerido" seco. |
| *"Si el paciente ya existe, se reutiliza su ficha (y su correo, si ya tenía uno)."* (ayuda del RUT) | Con un RUT existente el backend **solo completa un correo vacío; nunca reemplaza uno distinto**. Si el profesional escribe otro correo, los recordatorios siguen yendo al guardado: se corrige desde el voucher (*Contacto → Editar*). |

### Otros formularios que crean pacientes

- **Flujo público** (`/agendar-cita/:tenantSlug`): el correo ya era obligatorio. Sin cambios.
- **Aceptar una solicitud** (bandeja): el paciente sale de la solicitud, que trae correo. Sin cambios.
- `POST /pacientes` no tiene consumidor en el front (`DT-29`).

## Bloques horarios y fin de la jornada (2026-10-05)

Lote 2 de la limpieza previa al release, por decisión del usuario:

- **Bloques de 1 hora con inicios de 07:00 a 21:00** (antes 09:00–18:00 sin las 14:00). Viven en
  `shared/config/bloquesHorarios.ts`, que los **calcula** de tres constantes fáciles de cambiar
  (`PRIMER_BLOQUE`, `ULTIMO_BLOQUE`, `DURACION_BLOQUE_MIN`). La misma lista usan reagendar (voucher),
  aceptar una solicitud (bandeja), el paso Horario del flujo público y la grilla de la agenda.
- **La última cita termina a las 22:00** (`FIN_DE_JORNADA`, derivado: último bloque + 1 h). El modal
  valida que `hora + duración` no pase de ahí: a las 21:00 una cita de 90 min se rechaza con *"Con 90
  min, la cita terminaría a las 22:30. La última cita debe terminar a más tardar a las 22:00. Elige una
  hora más temprana o una duración más corta."* La misma regla (`errorFinDeJornada`) se aplica al
  reagendar y al aceptar una solicitud. **El backend no la impone**: es una regla de la interfaz, como no
  agendar al pasado.

## Detalles menores (2026-10-06)

Rama `chore/frontend-detalles-menores`, por la auditoría previa al release:

- **Sin fechas pasadas.** El selector de fecha lleva `min` = hoy (en hora de Chile, se renueva al abrir el
  modal) y `validateNuevaCita` rechaza un día pasado (error en *Fecha*) o un bloque de hoy que ya empezó
  (error en *Hora*), con el mismo texto que reagendar: *"Elige una fecha y hora futuras."* El backend no lo
  impide (DT-13); es una regla de la interfaz. **Aceptar una solicitud** aplica la misma regla y el mismo
  texto (`useAceptarSolicitud`), y el **flujo público** la suya con el tono del paciente (ver
  [agendar-cita-paciente](agendar-cita-paciente.md)).
- **No se cierra mientras guarda.** Con el envío en curso se ignoran el clic fuera y `Esc` (además de la X
  y "Cancelar", que ya estaban deshabilitados), igual que el voucher y los modales de la bandeja. Si no,
  la cita podía quedar creada sin que el profesional lo viera. Se sumó lo que el modal no tenía y pide
  la convención de modales: `Esc` cierra cuando no se está guardando, el foco inicial va al nombre del
  paciente, `Tab` no sale del diálogo (mismo código que el voucher) y al cerrar el foco vuelve al botón
  que lo abrió.
- **Hora de Chile.** Ver [DTF-07](../Deudas/DTF-07.md): `aInicioISO` arma el instante en
  `America/Santiago` y es seguro ante el cambio de horario.

Verificado en el navegador con `fetch` simulado: fecha pasada y bloque de hoy ya pasado bloqueados sin
pedir nada al servidor; con un `POST /citas` demorado 4 s, el clic fuera y `Esc` no cierran el modal, que
se cierra solo al responder; `Esc` y el clic fuera sí cierran sin envío en curso; 10:00 del 7 de octubre
viaja como `2026-10-07T13:00:00.000Z`.

## Pendientes

- **Prueba manual contra el backend real:** crear sin correo (debe atajarlo el front), con correo
  inválido para el backend y no para el front (debe marcar el campo), y con un RUT existente que ya
  tenga otro correo (ver que el voucher muestre el guardado).
- El modal no avisa cuando el backend conservó un correo distinto al tecleado
  (`cita.paciente.correo` ≠ lo escrito). Se podría comparar al recibir la respuesta.
