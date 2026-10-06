// Zona horaria en la que el front muestra las horas y arma los instantes.
//
// Decisión del MVP (DTF-07, cerrada el 2026-10-06): Citia opera solo en Chile,
// así que la zona de la clínica se fija aquí en vez de tomar la del navegador.
// Una cita "10:00" significa las 10:00 de Chile aunque el profesional abra el
// panel desde otra zona, y coincide con lo que proyecta el backend.
//
// Es espejo de `APP_TZ` del backend (default `America/Santiago`, ADR-07), con
// el que el backend calcula el día y la hora (`fecha`, `hora`) y las horas sin
// envío de los recordatorios. Si un entorno cambia `APP_TZ`, cambia esto.
// Si algún día hay clínicas fuera de Chile, la zona debe venir del backend
// (p. ej. en la respuesta del login) y no de una constante: es el único punto
// a cambiar, porque todo `shared/lib/fecha.ts` la lee de aquí.

/** Zona IANA de la clínica. `America/Santiago` cambia de horario (−04 / −03). */
export const ZONA_HORARIA = 'America/Santiago'

/** Locale de todos los textos de fecha y hora ('martes, 23 de septiembre'). */
export const LOCALE_FECHAS = 'es-CL'
