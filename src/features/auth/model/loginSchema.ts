export interface LoginFormValues {
  email: string
  password: string
  rememberMe: boolean
}

export type LoginField = 'email' | 'password'
export type LoginErrors = Partial<Record<LoginField, string>>

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Validación mínima sin librería externa. Si el proyecto adopta zod/yup más
 * adelante, este archivo es el único punto a cambiar.
 */
export function validateLogin(values: LoginFormValues): LoginErrors {
  const errors: LoginErrors = {}

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
