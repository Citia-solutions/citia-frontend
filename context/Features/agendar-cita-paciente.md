# Agendar cita — flujo público del paciente

**Estado:** ✅ Implementado y conectado (2026-09-10)
**Rama:** `feature/agendar-cita-paciente`
**Commits:** `e18c34c` (flujo multi-paso), `1980990` (envío real como preferencia)
**Detalles menores (2026-10-06):** `chore/frontend-detalles-menores` — calendario con navegación entre
meses, sin días ni horas pasados, "hoy" de Chile ([abajo](#el-calendario-del-paso-horario-2026-10-06))
**Backend:** [`citia-backend/context/Features/us02-gestion-citas.md`](../../../citia-backend/context/Features/us02-gestion-citas.md)

---

## Qué hace

Página pública de autoservicio: el paciente pide hora sin tener cuenta. El profesional comparte el
enlace por WhatsApp o redes.

```
/agendar-cita/:tenantSlug
```

**La organización va en la URL.** No es un detalle de rutas: el enlace es lo único que identifica a
quién se le está pidiendo hora, y el endpoint del backend la necesita para saber en qué bandeja
entra la solicitud.

Cuatro pasos, con validación por sección para no bloquear el avance con errores de secciones
futuras: **identificación** (RUT, nombre, apellidos) → **contacto** (teléfono, correo) → **horario**
(día y hora) → **motivo** (texto + consentimiento).

---

## La idea que hay que no romper

> **El paciente PIDE una hora, no la reserva.**

Elige día y hora en un calendario porque es la forma más clara de expresar cuándo le acomoda, pero
**eso no reserva nada**: el profesional lee la preferencia y fija la hora real al aceptar la
solicitud. Es la decisión 2 de [ADR-09](../../../citia-backend/context/Decisions/ADR-09.md) del
backend.

De ahí que el copy importe tanto como el código:

| Antes | Ahora |
|-------|-------|
| "Elige el día" | "¿Qué día te acomoda?" |
| **"Hora disponible"** | **"¿A qué hora?"** |
| — | *"Es tu horario preferido, no una reserva: revisaremos tu solicitud y te contactaremos para confirmar la hora definitiva."* |

"Hora disponible" prometía una disponibilidad que el sistema **no conoce**: las franjas de
`HorarioStep` son fijas (`BLOQUES_HORARIOS`: 07:00–21:00 cada hora desde el 2026-10-05; antes
09:00–18:00) y no consultan nada, porque no existe modelo de disponibilidad. Si algún día el paciente reserva de verdad, ese paso tendrá que consultarlo.

### El calendario del paso Horario (2026-10-06)

Antes solo mostraba el mes en curso: a fin de mes el paciente no podía pedir hora para la semana
siguiente. Ahora:

- **Navegación entre meses** con flechas *Mes anterior* / *Mes siguiente* (`aria-label`, título del mes
  con `aria-live`). Abre en el mes en curso, **no retrocede** a meses pasados y avanza hasta
  `MESES_HACIA_ADELANTE = 3` meses (el actual y los 3 siguientes), constante en
  `features/crear-cita/model/calendarioMes.ts` junto con la lógica pura del mes (`celdasDelMes`,
  `sumarMeses`). Cambiar de mes no borra el día elegido.
- **"Hoy" es el de Chile** (`fechaEnClinicaISO`), no el del navegador del paciente: los días anteriores se
  deshabilitan como antes y, si el día elegido es hoy, las **horas que ya pasaron** se deshabilitan y se ven
  tachadas (también en el selector de horas de móvil, que además se cierra con `Esc`).
- **Validación** en `validarPaso('horario')`, por si la página queda abierta hasta que pasen: *"Ese día ya
  pasó. Elige otro."* y *"Esa hora ya pasó. Elige otra."* Es la misma regla del modal "Nueva cita" y de
  aceptar una solicitud, con el tono del paciente.

La preferencia sigue siendo texto (`'jueves, 18 de septiembre a las 10:00'`), ahora formateada con
`formatearFechaLarga(fechaCalendario(fecha))` de `shared/lib/fecha.ts`; el texto no cambió, así que
`sugerirInicio` (bandeja) lo sigue leyendo igual.

---

## Contrato con el backend

`POST /publico/:tenantSlug/solicitudes` — **sin token**.

URL completa en local: `http://localhost:3000/api/publico/<slug>/solicitudes`. El formulario se abre
en `http://localhost:3002/agendar-cita/<slug>` (el slug sale de `SELECT slug FROM tenants`).

**"Sin token" es explícito, no casual.** `enviarSolicitud` llama con `{ auth: false }`, y el
`httpClient` entonces no adjunta el Bearer aunque haya sesión guardada. Sin eso, un profesional que
abre su propio enlace en el mismo navegador mandaba su token a una ruta anónima. El backend lo
ignoraba (no hay guard), pero una llamada anónima no debe cargar credenciales.

`toSolicitudRequest.ts` hace dos conversiones de forma:

| Formulario | Backend | Por qué |
|------------|---------|---------|
| `nombre` + `apellidos` | `nombrePaciente` | el diseño los separa, el backend guarda uno |
| `fecha` + `hora` | `preferenciaHoraria` | `'viernes, 18 de septiembre a las 10:00'` |
| `rut` | `rut` | normalizado a forma canónica |

El día se formatea con `fechaCalendario` (mediodía UTC de ese día, que en Chile sigue siendo el mismo
día) y en la zona de la clínica. Pasar `'2026-09-18'` a `new Date()` lo interpretaría como medianoche
UTC y en Chile mostraría el día anterior.

### El 202 no significa "guardado"

El backend responde **siempre `202` con el mismo mensaje**: exista o no la organización, y haya o no
una solicitud abierta con ese RUT. Es deliberado — si variara, se podría averiguar qué
organizaciones existen y qué RUT es paciente de qué profesional.

**Consecuencia para el front:** un `202` significa *"recibido para revisión"*, no *"guardado con
certeza"*. La pantalla final dice exactamente eso.

Lo único que devuelve `400` es un RUT que no pasa el dígito verificador, un campo faltante o un
campo que supera su largo máximo. El front muestra un mensaje genérico para el 400, así que **las
tres causas se validan antes de enviar** (ver abajo); si aun así llega un 400, es que el front y el
DTO se desalinearon.

### Largos máximos

`LIMITES` en `flujoCitaModel.ts` es espejo de los `@MaxLength` de `CrearSolicitudDto`:

| Campo | Límite | Cómo se aplica |
|-------|--------|----------------|
| `nombre` + `apellidos` | 120 combinados | `maxlength=60` en cada input + validación de la suma (error en apellidos) |
| `telefono` | 30 | `maxlength` + validación |
| `motivo` | 300 | `maxlength` + validación + contador visible `n/300` |

El límite del motivo es **intencional** (ADR-09 §10): una caja grande en una página que circula por
redes invita a escribir una historia clínica completa. El contador lo hace visible antes de chocar
con él. `preferenciaHoraria` (200) no se valida: la genera el front y no pasa de ~45 caracteres.

**Si el DTO cambia, `LIMITES` cambia con él** — ver [DTF-06](../Deudas/DTF-06.md).

---

## Validación del RUT

`shared/lib/rut.ts` implementa el módulo 11, igual que el backend. Existe para dar feedback mientras
el paciente escribe, en vez de descubrir el error después de enviar.

**El backend valida siempre**; esto es comodidad, no autoridad. Ver
[DTF-05](../Deudas/DTF-05.md) por la duplicación, que se aceptó a conciencia.

---

## Pendientes

| Qué | Nota |
|-----|------|
| ⛔ **No compartir el enlace todavía** | Falta el límite de tasa en el backend (`DT-18`). Cuando exista, la ruta responderá `429` y `mensajeDeError` en `useAgendarCita.ts` necesitará un texto para ese caso ("Demasiados intentos, espera unos minutos"). |
| ~~El profesional no tiene dónde copiar su enlace~~ | Resuelto en el cierre de Fase 1: "Copiar enlace de agenda" en `/solicitudes` (`features/compartir-enlace-agenda`, ver [bandeja-solicitudes](bandeja-solicitudes.md)). |
| Se pierde el instante estructurado | `preferenciaHoraria` viaja como texto. La bandeja lo lee con `sugerirInicio` para precargar la hora al aceptar; si el texto cambia de forma, la precarga deja de funcionar (sin romper nada). |
| Campos provisionales | El backend los marcó como tales; si cambian, `toSolicitudRequest.ts` es el único archivo a tocar. |
| Sin tests | El flujo no tiene pruebas: el proyecto todavía no tiene infraestructura de testing. |

---

## Deudas técnicas asociadas

- [DTF-05](../Deudas/DTF-05.md) — el módulo 11 del RUT duplicado en los dos repos (aceptada).
- [DTF-06](../Deudas/DTF-06.md) — los largos máximos del DTO copiados en el front (aceptada).
- `DT-18` (backend) — sin límite de tasa en la ruta pública; bloquea compartir el enlace.
- [DTF-01](../Deudas/DTF-01.md) — no afecta a esta ruta (es pública), pero sí al resto de la app.

Índice completo: [`../Deudas/README.md`](../Deudas/README.md).
