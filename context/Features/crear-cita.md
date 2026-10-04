# Crear cita — modal "Nueva cita" del profesional

**Estado:** ✅ Implementado y conectado · correo obligatorio desde la Fase 2 (2026-10-04, ⚠️ sin prueba
manual contra el backend real)
**Rama del cambio de Fase 2:** `feature/fase2-recordatorios` (sin commit)
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

- `inicio` con zona explícita (`aInicioISO`, DT-14).
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

## Pendientes

- **Prueba manual contra el backend real:** crear sin correo (debe atajarlo el front), con correo
  inválido para el backend y no para el front (debe marcar el campo), y con un RUT existente que ya
  tenga otro correo (ver que el voucher muestre el guardado).
- El modal no avisa cuando el backend conservó un correo distinto al tecleado
  (`cita.paciente.correo` ≠ lo escrito). Se podría comparar al recibir la respuesta.
