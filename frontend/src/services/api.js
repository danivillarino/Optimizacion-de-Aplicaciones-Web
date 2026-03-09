const API_BASE = 'https://regretably-scepterless-chu.ngrok-free.dev/api'

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

async function request(path, { method = 'GET', body } = {}) {
  const hasBody = body !== undefined
  const headers = {
    ...DEFAULT_HEADERS,
  }

  if (hasBody) {
    headers['Content-Type'] = 'application/json'
  }

  const response = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: hasBody ? JSON.stringify(body) : undefined,
  })

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

function normalizeEntityResponse(payload) {
  if (payload?.data && !Array.isArray(payload.data)) {
    return payload.data
  }

  return payload
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
 * 3. Obtener artículo por ID
 */
export async function getArticleById(id) {
  const payload = await request(`/articles/${id}`)

  return normalizeEntityResponse(payload)
}

/**
 * 4. Listar artículos
 */
export async function getArticles({ order = 'desc', by = 'date', page = 1, size = 100 } = {}) {
  const params = new URLSearchParams({
    order,
    by,
    page,
    size,
  })

  const payload = await request(`/articles?${params}`)

  return normalizeCollectionResponse(payload)
}

/**
 * 5. Buscar artículos
 */
export async function searchArticles(query, fields = 'title|content|description') {
  const params = new URLSearchParams({
    query,
    fields,
  })

  const payload = await request(`/articles/search?${params}`)

  return normalizeCollectionResponse(payload)
}
