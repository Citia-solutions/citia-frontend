# Contexto del frontend

Documentación viva de `citia-frontend`. Es **deliberadamente más delgada** que la del backend: las
decisiones de arquitectura y de dominio se documentan una sola vez, del lado del backend
(`citia-backend/context/Decisions/`), y aquí solo vive lo que es propio de la interfaz.

---

## Por dónde empezar

| Si quieres saber… | Ve a |
|---|---|
| **qué está construido** y cuál es su contrato con el backend | [`Features/`](Features/README.md) |
| **qué falta o está a medias** en el front | [`Deudas/`](Deudas/README.md) |
| los requisitos funcionales | [`rf.md`](rf.md) |
| el stack y las convenciones | [`stack-tecnologico.md`](stack-tecnologico.md) |
| **por qué el sistema es así** | `citia-backend/context/Decisions/` |

---

## Contenido

- **[`Features/`](Features/README.md)** — una por funcionalidad implementada.
- **[`Deudas/`](Deudas/README.md)** — deudas técnicas del front, con prefijo `DTF-` para no
  confundirlas con las del backend al hablar de ellas.
- **Cierre de Fase 1 de US-02** (2026-09-25): [agenda-profesional](Features/agenda-profesional.md)
  (semana + lista, aviso de solapamiento) y [bandeja-solicitudes](Features/bandeja-solicitudes.md)
  (aceptar/rechazar solicitudes, enlace de agenda). Contrato del lado del backend.
- **Fase 2 — US-03 recordatorios** (2026-10-04): [recordatorios](Features/recordatorios.md)
  (configuración `/recordatorios` + estado en el voucher), correo obligatorio en
  [crear-cita](Features/crear-cita.md) y despliegue en Cloudflare
  ([stack-tecnologico](stack-tecnologico.md#despliegue-cloudflare-workers-static-assets)).
- **`us/`** — planes de historias de usuario, **antes** de implementarlas. Cuando una se
  implementa, su contrato real pasa a `Features/`.
  - [`06-epic.md`](us/06-epic.md) — dashboard de citas del día (US-06).
  - **Subtareas de US-02** (gestión de citas; archivos `02.NN-*`, no son historias propias):
    - [`02.07-paciente-reagenda-cancela.md`](us/02.07-paciente-reagenda-cancela.md) — el paciente
      cancela o pide cambiar la hora desde un enlace. ⛔ Bloqueada por backend (ADR-10) y por el canal.
    - [`02.08-voucher-cita.md`](us/02.08-voucher-cita.md) — voucher de la cita para el profesional,
      con reagendar y cancelar. ✅ Implementada → [gestionar-cita](Features/gestionar-cita.md).
    - [`02.09-dashboard-refleja-cambios.md`](us/02.09-dashboard-refleja-cambios.md) — conectar la
      lista del día y mantenerla al día. ✅ Implementada → [dashboard-citas-del-dia](Features/dashboard-citas-del-dia.md); cerró la parte de citas de DTF-03.
- **[`rf.md`](rf.md)** · **[`stack-tecnologico.md`](stack-tecnologico.md)**

---

## Estado, de un vistazo

**Conectado al backend:** login · modal "nueva cita" del profesional · flujo público del paciente
(`/agendar-cita/:tenantSlug`) · **lista "Citas de hoy"** del dashboard
([US-02.09](Features/dashboard-citas-del-dia.md)) · **voucher con reagendar y cancelar**
([US-02.08](Features/gestionar-cita.md)). Estas dos últimas, sin prueba manual contra el backend real.

**Construido contra el contrato, sin backend todavía** (cierre de Fase 1, verificado con respuestas
simuladas): **agenda** `/agenda` · **bandeja de solicitudes** `/solicitudes` · **aviso de
solapamiento** al crear, reagendar y aceptar · **enlace de agenda** copiable (con advertencia DT-18).

**Fase 2, verificado solo con respuestas simuladas:** pantalla **Recordatorios** `/recordatorios` ·
**estado de los recordatorios** y **editar contacto** en el voucher · **correo obligatorio** en el
modal "nueva cita" (sale en el mismo release que el backend) · `wrangler.jsonc` para Cloudflare.

**Con datos de prueba:** métricas, ausentismo semanal y actividad del motor del dashboard (no tienen
endpoint) — ver [DTF-03](Deudas/DTF-03.md).

**Planificado:** la vista del paciente ([US-02.07](us/02.07-paciente-reagenda-cancela.md)), bloqueada
hasta que se acepte `ADR-10` (propuesto) en el backend y se responda cómo le llega el enlace al
paciente (Q11).

**Arquitectura:** Feature-Sliced Design. La regla que no se rompe es la dirección de las capas:
`pages → features → entities → shared`, nunca al revés.
