// API mock del dashboard. Datos exactos del diseño de US-06.
// Todas las funciones son async para imitar el contrato del backend real.
//
// Las citas del día ya NO están aquí: vienen de `GET /citas/hoy` y viven en
// `entities/appointment` (US-02.09). Lo que queda son métricas, ausentismo y
// actividad del motor, que aún no tienen endpoint (DTF-03).
import type { Metric, WeeklyBar, ActivityEvent } from '../model/types'

// TODO: reemplazar por httpClient cuando el backend exista
export function getMetrics(): Promise<Metric[]> {
  return Promise.resolve([
    { id: 'm1', label: 'Tasa de ausentismo', value: '15%', caption: '-4 pts vs. mes anterior', trend: 'up', trendTone: 'positive' },
    { id: 'm2', label: 'Horas recuperadas', value: '42h', caption: 'este mes · 27 cupos reasignados' },
    { id: 'm3', label: 'Ingresos recuperados', value: '$1.470k', caption: '+18% vs. mes anterior', trend: 'up', trendTone: 'positive' },
    { id: 'm4', label: 'Pacientes en riesgo', value: '31', caption: '12 requieren prepago', trendTone: 'warning' },
  ])
}

// TODO: reemplazar por httpClient cuando el backend exista
export function getWeeklyAbsenteeism(): Promise<WeeklyBar[]> {
  return Promise.resolve([
    { label: 'S1', value: 55 },
    { label: 'S2', value: 80 },
    { label: 'S3', value: 95 },
    { label: 'S4', value: 50 },
    { label: 'S5', value: 40 },
    { label: 'S6', value: 35 },
    { label: 'S7', value: 65, highlight: true },
    { label: 'S8', value: 70, highlight: true },
  ])
}

// TODO: reemplazar por httpClient cuando el backend exista
export function getEngineActivity(): Promise<ActivityEvent[]> {
  return Promise.resolve([
    { id: 'e1', tone: 'success', text: 'Cupo recuperado — mar 13:00 asignado a Valentina Rojas (+$35.000)', timeAgo: 'Hace 12 min' },
    { id: 'e2', tone: 'info', text: 'Confirmaciones enviadas a 6 pacientes para mañana', timeAgo: 'Hace 1 h' },
    { id: 'e3', tone: 'warning', text: 'Felipe Soto marcado riesgo alto — se solicitó prepago', timeAgo: 'Hace 2 h' },
    { id: 'e4', tone: 'danger', text: 'Roberto Díaz no confirmó en 24h — cupo liberado a lista de espera', timeAgo: 'Hace 3 h' },
  ])
}
