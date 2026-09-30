const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://localhost:8080'

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export function isAuthenticated() {
  return Boolean(localStorage.getItem('token'))
}

export function logout() {
  localStorage.removeItem('token')
}

export async function login(username, password) {
  let response
  try {
    response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
  } catch {
    throw new ApiError(`No se pudo conectar con la API (${API_BASE})`, 0)
  }

  if (!response.ok) {
    throw new ApiError('Credenciales inválidas', response.status)
  }

  const data = await response.json()
  localStorage.setItem('token', data.access_token)
  return data.access_token
}

function headers(withBody) {
  const result = {}
  const token = localStorage.getItem('token')
  if (token) result.Authorization = `Bearer ${token}`
  if (withBody) result['Content-Type'] = 'application/json'
  return result
}

async function request(path, options = {}) {
  const mergedOptions = { ...options, headers: { ...headers(false), ...(options.headers ?? {}) } }
  const response = await fetch(`${API_BASE}${path}`, mergedOptions)
  const body = await response.json().catch(() => null)

  if (!response.ok) {
    if (response.status === 401) {
      const authHeader = response.headers.get('www-authenticate')
      console.error(`401 en ${path}:`, authHeader)
      logout()
      throw new ApiError(
        `Sesión expirada o credenciales inválidas${authHeader ? ` (${authHeader})` : ''}`,
        response.status,
      )
    }
    throw new ApiError(body?.message || `Error ${response.status}`, response.status)
  }

  return body?.data
}

export function getBlueprintsByAuthor(author) {
  return request(`/api/blueprints/${encodeURIComponent(author)}`)
}

export function getBlueprint(author, name) {
  return request(`/api/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`)
}

export function createBlueprint(blueprint) {
  return request('/api/blueprints', {
    method: 'POST',
    headers: headers(true),
    body: JSON.stringify(blueprint),
  })
}

export function addPoint(author, name, point) {
  return request(`/api/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}/points`, {
    method: 'PUT',
    headers: headers(true),
    body: JSON.stringify(point),
  })
}

export function deleteBlueprint(author, name) {
  return request(`/api/blueprints/${encodeURIComponent(author)}/${encodeURIComponent(name)}`, {
    method: 'DELETE',
    headers: headers(false),
  })
}
