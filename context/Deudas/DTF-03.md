# DTF-03 · El dashboard muestra datos de prueba

**Origen:** `src/features/dashboard/api/dashboardApi.ts` (borrado el 2026-10-05)
**Severidad:** 🟡 baja (antes 🟠 media) · **Estado:** **cerrada (2026-10-05)** — parte de citas por US-02.09
(2026-09-24); el resto por el lote 2 de la limpieza previa al release

> **Cierre (2026-10-05, lote 2 de la limpieza previa al release):** por decisión del usuario, el dashboard
> **no muestra ningún dato inventado**. Se borraron `dashboardApi.ts`, `MetricsRow`, `MetricCard`,
> `WeeklyAbsenteeism`, `EngineActivity` y sus tipos: fuera ausentismo, horas e ingresos recuperados,
> pacientes en riesgo, prepago y la actividad del motor (con sus nombres falsos). En su lugar, todo con
> endpoints existentes: cuatro tarjetas (citas hoy, próxima cita, próximos 7 días, solicitudes por
> responder), "Citas por semana" (6 semanas, un pedido de 42 días) y la tarjeta de Recordatorios — ver
> [dashboard-citas-del-dia](../Features/dashboard-citas-del-dia.md). Las métricas de ausentismo volverán
> cuando exista RF-08, como tarjetas nuevas sobre datos reales.

> **Actualización:** la lista "Citas de hoy" ya consume `GET /api/citas/hoy` y los estados son los seis
> del backend (`recuperada`/`riesgo_alto` salieron del código) — ver
> [dashboard-citas-del-dia](../Features/dashboard-citas-del-dia.md). **Quedan con datos de prueba:**
> métricas, ausentismo semanal y actividad del motor, que no tienen endpoint. Lo de abajo es el
> registro original.
>
> **Actualización (2026-10-05, limpieza previa al release):** el ítem "Citas anuladas" del sidebar,
> con su píldora fija "3", **se quitó** junto con "Pacientes" y la tarjeta "Citia IA": el sidebar
> solo muestra lo que funciona. Ya no forma parte de esta deuda.

## Qué pasa

Las cuatro funciones del dashboard devuelven datos fijos escritos a mano, con un `TODO` cada una:
citas del día, métricas, ausentismo semanal y actividad del motor. Ninguna consulta al backend.

## Por qué importa

**Una cita que se guarda correctamente no aparece en la lista.** Se ve como un bug del guardado y
no lo es: el POST funciona, la cita queda en la base, y la lista simplemente no la consulta.

Es la confusión más probable para cualquiera que pruebe la aplicación.

## Cómo se cierra

De las cuatro, **solo una tiene backend disponible hoy**: `GET /api/citas/hoy` responde
`{ id, pacienteNombre, hora, inicio, duracionMin, tipoConsulta, estado }`. Las otras tres
—métricas, ausentismo, actividad— no tienen endpoint y dependen de requisitos que aún no existen
(RF-08 para el comportamiento del paciente, RF-05/RF-06 para la actividad).

**No se decide en este documento** qué hacer con los estados que el diseño contempla y el backend
no conoce (`recuperada`, `riesgo_alto`): es alcance de la historia que aborde el dashboard.

**La subtarea que la cierra (parte citas) es [US-02.09](../us/02.09-dashboard-refleja-cambios.md).**
Conecta `getTodayAppointments` a `GET /api/citas/hoy` y **propone el mapeo de estados**: el tipo
adopta los seis del backend y `recuperada`/`riesgo_alto` salen (son atributos de otra naturaleza, no
estados). No requiere cambios de backend. Al terminarla, esta deuda queda reducida a las tres
funciones sin endpoint.

Ver el lado del backend en `citia-backend/context/Deudas/DT-29.md`.
