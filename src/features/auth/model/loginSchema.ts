export interface LoginFormValues {
  tenantSlug: string
  email: string
  password: string
  rememberMe: boolean
}

export type LoginField = 'tenantSlug' | 'email' | 'password'
export type LoginErrors = Partial<Record<LoginField, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

/**
 * Validación mínima sin librería externa. Si el proyecto adopta zod/yup más
 * adelante, este archivo es el único punto a cambiar.
 */
export function validateLogin(values: LoginFormValues): LoginErrors {
  const errors: LoginErrors = {}

  if (!values.tenantSlug.trim()) {
    errors.tenantSlug = 'Ingresa el identificador de tu clínica.'
  } else if (!SLUG_RE.test(values.tenantSlug.trim())) {
    errors.tenantSlug = 'El identificador solo puede tener minúsculas, números y guiones.'
  }

  if (!values.email.trim()) {
    errors.email = 'Ingresa tu correo.'
  } else if (!EMAIL_RE.test(values.email)) {
    errors.email = 'El correo no es válido.'
  }

  if (!values.password) {
    errors.password = 'Ingresa tu contraseña.'
  }

  return errors
}
