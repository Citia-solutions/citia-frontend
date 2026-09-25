// Lista única de bloques horarios que se ofrecen al elegir una hora.
//
// Antes estaba escrita dos veces (modal "Nueva cita" y paso Horario del flujo
// público); reagendar habría sido la tercera. Si algún día los bloques se
// configuran por organización o salen de un modelo de disponibilidad, este
// arreglo es el único punto a cambiar.
export const BLOQUES_HORARIOS: readonly string[] = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
]
