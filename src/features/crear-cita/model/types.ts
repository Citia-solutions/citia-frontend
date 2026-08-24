// Tipos del feature `crear-cita`.

/** Valores del formulario de "Nueva cita". */
export interface NuevaCitaForm {
  pacienteNombre: string
  correo: string
  telefono: string
  fecha: string // 'YYYY-MM-DD'
  hora: string // 'HH:mm'
  motivo: string
}

/** Pares de errores por campo (solo los que fallaron). */
export type NuevaCitaField = keyof NuevaCitaForm
export type NuevaCitaErrors = Partial<Record<NuevaCitaField, string>>

/** Carga útil que se entrega hacia fuera al intentar guardar. */
export type NuevaCitaPayload = NuevaCitaForm
