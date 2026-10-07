// API pública del feature `dashboard`: los widgets del resumen y los stores que
// la página recarga cuando cambian las citas. Todo con datos reales (lote 2 de
// la limpieza previa al release, 2026-10-05): ya no hay API simulada.
export { default as ResumenTarjetas } from './ui/ResumenTarjetas.vue'
export { default as TodayAppointments } from './ui/TodayAppointments.vue'
export { default as CitasPorSemana } from './ui/CitasPorSemana.vue'
export { default as RecordatoriosResumen } from './ui/RecordatoriosResumen.vue'
export { useProximasCitas, useHistorialCitas } from './model/useRangosCitas'
