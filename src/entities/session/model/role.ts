import type { UserRole } from './types'

/** Nombre del rol para mostrar (sidebar). También es la lista de roles válidos. */
export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrador',
  profesional: 'Profesional',
}

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === 'string' && Object.hasOwn(ROLE_LABELS, value)
}

export function roleLabel(role: UserRole): string {
  return ROLE_LABELS[role]
}
