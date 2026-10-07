# DTF-07 · Se asume que la zona del navegador es la de la clínica

**Origen:** `src/shared/lib/fecha.ts` (`aInicioISO` y utilidades de fecha local)
**Severidad:** 🟡 baja · **Estado:** cerrada (2026-10-06, `chore/frontend-detalles-menores`)

> **Cierre: zona fija de Chile.** Para el MVP, que opera solo en Chile, el front ya no usa la zona del
> navegador: la fija en `ZONA_HORARIA = 'America/Santiago'` (`src/shared/config/zonaHoraria.ts`), espejo
> de `APP_TZ` del backend (default `America/Santiago`, [ADR-07](../../../citia-backend/context/Decisions/ADR-07.md)).
>
> - **Mostrar:** todos los formateadores de `shared/lib/fecha.ts` (`formatearFechaLarga`,
>   `formatearMomentoCorto`, `horaEnClinica`, `fechaEnClinicaISO`, el nuevo `formatearFecha`) pasan
>   `timeZone: ZONA_HORARIA`. Las horas de los recordatorios del voucher, el voucher, la bandeja, el
>   topbar y la agenda muestran la hora de Chile aunque el navegador esté en otra zona. Los dos
>   `Intl.DateTimeFormat` que vivían en features (`agenda.ts`, `toSolicitudRequest.ts`) pasan por ahí.
> - **Armar instantes:** `aInicioISO(fecha, hora)` lee la fecha y la hora elegidas como hora de Chile
>   ('2026-08-25' + '10:00' → `2026-08-25T14:00:00.000Z`). Es **seguro ante el cambio de horario**:
>   prueba el desfase de un día antes y uno después del momento pedido y se queda con el que calza; una
>   hora repetida (fin del horario de verano) toma la primera y una inexistente (inicio) se corre hacia
>   adelante lo que dura el salto, como `Temporal` con `disambiguation: 'compatible'`. Los bloques
>   (07:00–21:00) nunca caen en esas horas.
> - **"Hoy" y "pasado":** `fechaEnClinicaISO(new Date())` (antes `fechaLocalISO`), `esDiaPasado`,
>   `esMismoDia` y el nuevo `esInicioPasado` comparan en hora de Chile: el aviso *"Ya no aparece en tu
>   lista de hoy"*, el `min` de los selectores de fecha, la semana inicial de la agenda y los rangos del
>   dashboard.
> - **Días calendario** ('YYYY-MM-DD'): `fechaCalendario` devuelve el día a **mediodía UTC**, que en Chile
>   (UTC−3/−4) sigue siendo el mismo día, y quien necesita sus números usa `partesDeFecha` en vez de
>   `getDate()`. `sugerirInicio` (bandeja) y el calendario público ya no usan `new Date(año, mes, día)`.
>
> Verificado con Node forzando 7 zonas del navegador (de UTC−11 a UTC+14, incluida
> `America/Santiago`): mismos instantes y mismos textos en todas, incluidos los fines de semana de
> cambio de horario de 2026. **Lo que queda:** es una zona para todo el sistema, igual que en el
> backend. Si algún día hay clínicas fuera de Chile, la zona tiene que venir de la organización (por
> ejemplo, en la respuesta del login) y reemplazar la constante; `shared/lib/fecha.ts` es el único
> lugar que la lee.
>
> Lo de abajo es el registro original.

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

**Fase 2 (2026-10-04):** las horas de los recordatorios del voucher (*"Se enviará: mar, 14 oct ·
10:30"*, `formatearMomentoCorto` en `shared/lib/fecha.ts`) también se formatean en la zona del
navegador. El backend decide las horas sin envío (21:00–08:00) en la zona de la clínica; con zonas
distintas, la pantalla mostraría un recordatorio "a las 22:00" que en realidad sale a las 20:59 de
la clínica.

## Cómo se cierra

Que el front conozca la zona de la clínica (p. ej. que el backend la exponga en la sesión o en
`/me`) y arme el instante en esa zona en vez de en la del navegador. No se resolvió en US-02.08
porque ya afectaba al modal de creación y cambiarlo ahí era alcance aparte.
