import { reactive, ref } from 'vue'
import { HttpError } from '@/shared/api/httpClient'
import { useSessionStore } from '@/entities/session'
import { login } from '../api/authApi'
import { validateLogin, type LoginErrors, type LoginFormValues } from './loginSchema'

/**
 * Lógica del caso de uso "iniciar sesión": estado del formulario, validación,
 * llamada a la API y guardado de la sesión. La UI (LoginForm) solo consume esto.
 *
 * @param onSuccess callback tras autenticar (ej. redirigir al panel).
 */
export function useLogin(onSuccess?: () => void) {
  const session = useSessionStore()

  const values = reactive<LoginFormValues>({
    tenantSlug: '',
    email: '',
    password: '',
    rememberMe: false,
  })

  const errors = ref<LoginErrors>({})
  const submitError = ref<string | null>(null)
  const isSubmitting = ref(false)

  async function submit(): Promise<void> {
    submitError.value = null
    errors.value = validateLogin(values)
    if (Object.keys(errors.value).length > 0) return

    isSubmitting.value = true
    try {
      const { user, token } = await login({
        tenantSlug: values.tenantSlug.trim(),
        email: values.email,
        password: values.password,
      })
      session.setSession(user, token, values.rememberMe)
      onSuccess?.()
    } catch (e) {
      submitError.value =
        e instanceof HttpError && e.status === 401
          ? 'Correo o contraseña incorrectos.'
          : 'No pudimos iniciar sesión. Inténtalo de nuevo.'
    } finally {
      isSubmitting.value = false
    }
  }

  return { values, errors, submitError, isSubmitting, submit }
}
