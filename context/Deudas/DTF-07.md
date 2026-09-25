# DTF-07 · Se asume que la zona del navegador es la de la clínica

**Origen:** `src/shared/lib/fecha.ts` (`aInicioISO` y utilidades de fecha local)
**Severidad:** 🟡 baja · **Estado:** abierta

## Qué pasa

Cuando el profesional elige día y hora —al **crear** una cita o al **reagendarla** desde el voucher—
el front arma el instante con la zona **del navegador**. El backend, en cambio, muestra y agrupa por
día con la zona **de la clínica** ([ADR-07](../../../citia-backend/context/Decisions/ADR-07.md)).

Coinciden mientras el profesional trabaje desde Chile.

## Por qué importa

Si no coinciden (un profesional de viaje, un equipo con la zona mal configurada), elegir "10:00"
guarda las 10:00 **de donde esté el navegador**, y el dashboard la muestra corrida. Lo mismo al
decidir si una cita "es de hoy" para el aviso *"Ya no aparece en tu lista de hoy"*.

No corrompe nada: el instante viaja con desfase explícito (cumple DT-14). El error es de
interpretación, no de formato.

## Cómo se cierra

Que el front conozca la zona de la clínica (p. ej. que el backend la exponga en la sesión o en
`/me`) y arme el instante en esa zona en vez de en la del navegador. No se resolvió en US-02.08
porque ya afectaba al modal de creación y cambiarlo ahí era alcance aparte.
