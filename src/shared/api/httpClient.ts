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
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { json, headers, ...rest } = options
  const token = getToken()

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
