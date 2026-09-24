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
- **`us/`** — planes de historias de usuario.
- **[`rf.md`](rf.md)** · **[`stack-tecnologico.md`](stack-tecnologico.md)**

---

## Estado, de un vistazo

**Conectado al backend:** login · modal "nueva cita" del profesional · flujo público del paciente
(`/agendar-cita/:tenantSlug`).

**Con datos de prueba:** el dashboard. `dashboardApi.ts` devuelve datos fijos, así que **una cita
que se guarda correctamente no aparece en la lista del día**. Se ve como un bug del guardado y no lo
es — ver [DTF-03](Deudas/DTF-03.md).

**Arquitectura:** Feature-Sliced Design. La regla que no se rompe es la dirección de las capas:
`pages → features → entities → shared`, nunca al revés.
