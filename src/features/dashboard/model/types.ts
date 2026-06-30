// Tipos del feature `dashboard` (widgets del resumen de citas del día).

export interface Metric {
  id: string
  label: string // "Tasa de ausentismo"
  value: string // "15%" | "42h" | "$1.470k" | "31"
  caption: string // "-4 pts vs. mes anterior" | "este mes · 27 cupos reasignados" ...
  trend?: 'up' | 'down' // muestra flecha; color verde positivo
  trendTone?: 'positive' | 'warning' // color del caption/flecha (verde / ámbar)
}

export interface WeeklyBar {
  label: string // "S1".."S8"
  value: number // 0-100, proporcional a la altura de la barra
  highlight?: boolean
}

export type ActivityTone = 'success' | 'info' | 'warning' | 'danger'

export interface ActivityEvent {
  id: string
  tone: ActivityTone
  text: string
  timeAgo: string
}
