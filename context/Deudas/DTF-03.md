# DTF-03 · El dashboard muestra datos de prueba

**Origen:** `src/features/dashboard/api/dashboardApi.ts`
**Severidad:** 🟠 media · **Estado:** abierta · **alcance de otra historia**

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

Ver el lado del backend en `citia-backend/context/Deudas/DT-29.md`.
