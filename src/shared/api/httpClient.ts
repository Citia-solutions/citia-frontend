import { getToken } from '@/shared/lib/authToken'

const BASE_URL = import.meta.env.VITE_API_URL ?? '/api'

/** Error de red con el status y el cuerpo de la respuesta adjuntos. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly data: unknown,
    message?: string,
  ) {
    super(message ?? `HTTP ${status}`)
    this.name = 'HttpError'
  }
}

interface RequestOptions extends Omit<RequestInit, 'body'> {
  /** Se serializa a JSON automáticamente. */
  json?: unknown
  /**
   * `false` para llamadas anónimas: no adjunta el Bearer aunque haya una
   * sesión guardada en el navegador. Por defecto `true`.
   */
  auth?: boolean
}

type UnauthorizedHandler = () => void

let unauthorizedHandler: UnauthorizedHandler | null = null

/**
 * Registra qué hacer cuando una petición **autenticada** recibe 401, es decir,
 * cuando el backend ya no acepta el token (venció, o se cerró la sesión en otra
 * pestaña). Lo registra `app` al arrancar: shared no conoce la sesión ni el router.
 *
 * Las llamadas con `{ auth: false }` nunca lo disparan: en el login un 401
 * significa "credenciales inválidas" y lo maneja quien llamó. Tampoco un 401
 * de una petición cuyo token ya no es el guardado (carrera entre pestañas o
 * token reemplazado mientras viajaba): ese 401 no habla de la sesión actual.
 * El `HttpError` se lanza igual, después de avisar.
 */
export function onUnauthorized(handler: UnauthorizedHandler | null): void {
  unauthorizedHandler = handler
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, auth = true, ...rest } = options
  const token = auth ? getToken() : null

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
  })

  const isJson = res.headers.get('content-type')?.includes('application/json') ?? false
  const data: unknown = isJson ? await res.json() : await res.text()

  if (!res.ok) {
    // Si el token guardado es otro, el 401 es de un token viejo y la sesión que
    // hay ahora es otra (otra pestaña inició sesión, o el cambio de contraseña
    // lo reemplazó, US-10): no se avisa, solo se lanza. Sin token guardado
    // (otra pestaña cerró la sesión) sí se avisa, para volver al login.
    const guardado = getToken()
    if (res.status === 401 && auth && (guardado === null || guardado === token)) {
      unauthorizedHandler?.()
    }
    throw new HttpError(res.status, data)
  }

  return data as T
}

export const http = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, json?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', json }),
  put: <T>(path: string, json?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', json }),
  patch: <T>(path: string, json?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', json }),
  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'DELETE' }),
}
