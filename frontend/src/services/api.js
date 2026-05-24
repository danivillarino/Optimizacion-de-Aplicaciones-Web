const API_BASE = 'http://localhost:3000/api'

const DEFAULT_HEADERS = {
  Accept: 'application/json',
  'ngrok-skip-browser-warning': 'true',
}

async function parseResponseBody(response) {
  const text = await response.text()

  if (!text) {
    return null
  }

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function getErrorMessage(payload, fallbackMessage) {
  if (typeof payload === 'string' && payload.trim()) {
    return fallbackMessage
  }

  return payload?.message || payload?.error || fallbackMessage
}

async function request(path, { method = 'GET', body, signal } = {}) {
  const hasBody = body !== undefined
  const headers = {
    ...DEFAULT_HEADERS,
  }

  if (hasBody) {
    headers['Content-Type'] = 'application/json'
  }

  const requestOptions = {
    method,
    headers,
    signal,
  }

  if (hasBody) {
    requestOptions.body = JSON.stringify(body)
  }

  const response = await fetch(`${API_BASE}${path}`, requestOptions)

  const payload = await parseResponseBody(response)

  if (!response.ok) {
    throw new Error(getErrorMessage(payload, 'Request failed'))
  }

  return payload
}

function normalizeCollectionResponse(payload) {
  if (Array.isArray(payload)) {
    return { data: payload }
  }

  if (Array.isArray(payload?.data)) {
    return payload
  }

  return { data: [] }
}

/**
 * 1. Agregar Feed RSS
 */
export async function addFeed(url) {
  return request('/feeds', {
    method: 'POST',
    body: { url },
  })
}

/**
 * 2. Actualizar artículos desde los feeds
 */
export async function updateArticles() {
  await request('/articles/update', {
    method: 'POST',
  })

  return null
}

/**
 * 4. Listar artículos
 */
export async function getArticles({
  order = 'desc',
  by = 'date',
  page = 1,
  size = 20,
  category = '',
  signal,
} = {}) {
  const params = new URLSearchParams()

  params.set('order', order)
  params.set('by', by)
  params.set('page', String(page))
  params.set('size', String(size))

  if (typeof category === 'string' && category.trim()) {
    params.set('category', category.trim())
  }

  const payload = await request(`/articles?${params}`, {
    signal,
  })

  return normalizeCollectionResponse(payload)
}

/**
 * 5. Buscar artículos
 */
export async function searchArticles(query, fields = 'title|content|description', options = {}) {
  const params = new URLSearchParams({
    query,
    fields,
  })

  const payload = await request(`/articles/search?${params}`, {
    signal: options.signal,
  })

  return normalizeCollectionResponse(payload)
}

/**
 * 6. Listar categorías
 */
export async function getCategories(signal) {
  const payload = await request('/categories', {
    signal,
  })

  return normalizeCollectionResponse(payload)
}
