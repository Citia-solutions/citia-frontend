// API mock del dashboard. Datos exactos del diseño de US-06.
// Todas las funciones son async para imitar el contrato del backend real.
import type { Appointment } from '@/entities/appointment'
import type { Metric, WeeklyBar, ActivityEvent } from '../model/types'

// TODO: reemplazar por httpClient cuando el backend exista
export function getTodayAppointments(): Promise<Appointment[]> {
  return Promise.resolve([
    { id: 'a1', time: '09:00', patientName: 'María González', type: 'Terapia individual', durationMin: 50, status: 'confirmada' },
    { id: 'a2', time: '10:00', patientName: 'Felipe Soto', type: 'Terapia individual', durationMin: 50, status: 'pendiente' },
    { id: 'a3', time: '11:30', patientName: 'Carla Méndez', type: 'Terapia de pareja', durationMin: 60, status: 'confirmada' },
    { id: 'a4', time: '13:00', patientName: 'Valentina Rojas', type: 'Cupo recuperado', durationMin: 50, status: 'recuperada' },
    { id: 'a5', time: '15:00', patientName: 'Jorge Lillo', type: 'Terapia individual', durationMin: 50, status: 'pendiente' },
    { id: 'a6', time: '16:30', patientName: 'Antonia Pérez', type: 'Evaluación', durationMin: 80, status: 'confirmada' },
    { id: 'a7', time: '18:00', patientName: 'Roberto Díaz', type: 'Terapia individual', durationMin: 50, status: 'riesgo_alto' },
  ])
}

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
