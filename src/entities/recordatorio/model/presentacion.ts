// Presentación de un recordatorio: etiqueta y color del estado, motivo en
// lenguaje humano y cómo se nombra cada "momento". Lo usan el voucher de la
// cita y la pantalla de configuración, para que hablen igual.
import { formatearMomentoCorto } from '@/shared/lib/fecha'
import type { EstadoRecordatorio, MotivoRecordatorio, Recordatorio } from './types'

export type RecordatorioBadgeVariant = 'success' | 'warning' | 'info' | 'danger' | 'neutral'

/** Estado → etiqueta legible. */
export const ESTADO_RECORDATORIO_LABEL: Record<EstadoRecordatorio, string> = {
  programado: 'Programado',
  enviado: 'Enviado',
  entregado: 'Entregado',
  fallido: 'Falló',
  cancelado: 'Cancelado',
  omitido: 'Omitido',
}

/**
 * Estado → variante de `BaseBadge`.
 *
 * Verde = salió (enviado o entregado) · azul = en espera · gris = dejó de tener
 * sentido (la cita cambió) · ámbar = no salió por una regla, suele tener
 * arreglo (p. ej. agregar el correo) · rojo = se intentó y no llegó.
 */
export const ESTADO_RECORDATORIO_VARIANT: Record<EstadoRecordatorio, RecordatorioBadgeVariant> = {
  programado: 'info',
  enviado: 'success',
  entregado: 'success',
  fallido: 'danger',
  cancelado: 'neutral',
  omitido: 'warning',
}

/** Motivo → explicación para el profesional (por qué no salió). */
export const MOTIVO_RECORDATORIO_TEXTO: Record<MotivoRecordatorio, string> = {
  // cancelado: la cita cambió, no es un fallo
  cita_terminal: 'La cita ya no está vigente (se canceló o ya se cerró).',
  reprogramado: 'Se reemplazó por otro: la cita cambió de hora o cambiaste tu configuración.',
  desactivado: 'Desactivaste los recordatorios.',
  // omitido: una regla decidió no enviarlo
  creada_tarde: 'La cita se agendó cuando este momento ya había pasado.',
  fusionado: 'Quedaba muy cerca de otro recordatorio de la misma cita; se envía solo uno.',
  sin_correo: 'El paciente no tiene correo registrado.',
  correo_suprimido:
    'No se escribe a este correo porque antes rebotó o el paciente lo marcó como spam.',
  limite_tenant: 'Tu organización alcanzó el máximo de recordatorios del día.',
  sin_consentimiento: 'El paciente no autorizó recibir recordatorios.',
  // fallido: se intentó y no llegó
  correo_invalido: 'El correo del paciente no es válido o no existe.',
  rechazado: 'El servicio de correo rechazó el envío.',
  vencido: 'No se pudo enviar a tiempo.',
  cuota_agotada: 'Se agotó la cuota diaria de envíos antes de poder enviarlo.',
  rebote: 'El correo rebotó: la casilla del paciente no lo recibió.',
}

/**
 * Texto del motivo, o null si no hay. Tolera un código que el front todavía no
 * conoce (backend más nuevo): mejor un texto genérico que nada.
 */
export function textoMotivo(motivo: string | null): string | null {
  if (!motivo) return null
  return (
    (MOTIVO_RECORDATORIO_TEXTO as Record<string, string>)[motivo] ??
    'No se envió por una regla del sistema.'
  )
}

/** Etiqueta del estado; tolera un estado desconocido mostrándolo tal cual. */
export function etiquetaEstado(estado: string): string {
  return (ESTADO_RECORDATORIO_LABEL as Record<string, string>)[estado] ?? estado
}

/** Variante del badge; un estado desconocido se pinta neutro. */
export function varianteEstado(estado: string): RecordatorioBadgeVariant {
  return (ESTADO_RECORDATORIO_VARIANT as Record<string, RecordatorioBadgeVariant>)[estado] ?? 'neutral'
}

const MIN_POR_SEMANA = 7 * 24 * 60
const MIN_POR_DIA = 24 * 60

/**
 * Cómo se nombra una antelación, sin el "antes":
 *
 *   10080 → '1 semana' · 4320 → '3 días' · 1440 → '24 h' · 120 → '2 h' ·
 *   90 → '1 h 30 min' · 30 → '30 min'
 *
 * Un día se dice "24 h" (así lo nombran el producto y el backend: "24 h y 2 h
 * antes"); desde dos días, en días.
 */
export function describirAntelacion(min: number): string {
  if (min >= MIN_POR_SEMANA && min % MIN_POR_SEMANA === 0) {
    const semanas = min / MIN_POR_SEMANA
    return semanas === 1 ? '1 semana' : `${semanas} semanas`
  }
  if (min > MIN_POR_DIA && min % MIN_POR_DIA === 0) return `${min / MIN_POR_DIA} días`
  if (min >= 60 && min % 60 === 0) return `${min / 60} h`
  if (min > 60) return `${Math.floor(min / 60)} h ${min % 60} min`
  return `${min} min`
}

/**
 * Los momentos de envío en una frase, en el orden en que vienen (el backend
 * los manda de mayor a menor):
 *
 *   [1440, 120] → '24 h y 2 h antes' · [10080, 1440, 120] → '1 semana, 24 h y 2 h antes'
 *
 * Lista vacía → ''.
 */
export function describirAntelaciones(antelacionesMin: readonly number[]): string {
  const partes = antelacionesMin.map(describirAntelacion)
  const ultima = partes.pop()
  if (ultima === undefined) return ''
  const frase = partes.length === 0 ? ultima : `${partes.join(', ')} y ${ultima}`
  return `${frase} antes`
}

/** Instante ISO → 'mar, 14 oct · 10:30', o '' si no es una fecha. */
function momento(iso: string | null): string {
  if (!iso) return ''
  const fecha = new Date(iso)
  return Number.isNaN(fecha.getTime()) ? '' : formatearMomentoCorto(fecha)
}

/**
 * La línea de tiempo que importa según el estado:
 *
 * - `programado` → cuándo saldrá (`proximoIntentoEn` si difiere: tardío, reintento o espera);
 * - `enviado` / `entregado` → cuándo salió / llegó;
 * - `fallido` → cuándo salió si alcanzó a salir (rebote), si no, para cuándo estaba;
 * - `cancelado` / `omitido` → para cuándo estaba.
 *
 * Hora en la zona del navegador, igual que el resto del front (DTF-07).
 */
export function lineaDeTiempo(r: Recordatorio): string {
  switch (r.estado) {
    case 'programado':
      return `Se enviará: ${momento(r.proximoIntentoEn ?? r.programadoPara)}`
    case 'enviado':
      return `Enviado: ${momento(r.enviadoEn ?? r.programadoPara)}`
    case 'entregado':
      return `Entregado: ${momento(r.entregadoEn ?? r.enviadoEn ?? r.programadoPara)}`
    case 'fallido':
      return r.enviadoEn
        ? `Enviado: ${momento(r.enviadoEn)}`
        : `Estaba programado para: ${momento(r.programadoPara)}`
    default:
      return `Estaba programado para: ${momento(r.programadoPara)}`
  }
}
