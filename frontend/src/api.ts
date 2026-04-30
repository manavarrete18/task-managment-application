const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export class ApiError extends Error {
  status: number

  constructor (message: string, status: number) {
    super(message)
    this.status = status
  }
}

type ApiOptions = RequestInit & {
  token?: string;
}

export async function apiRequest<T> (path: string, options: ApiOptions = {}) {
  const headers = new Headers(options.headers)
  headers.set('Content-Type', 'application/json')

  if (options.token) {
    headers.set('Authorization', `Bearer ${options.token}`)
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers
  })

  if (!response.ok) {
    const payload = await response.json().catch(() => null) as { message?: string } | null
    throw new ApiError(payload?.message ?? 'Request failed', response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json() as Promise<T>
}
