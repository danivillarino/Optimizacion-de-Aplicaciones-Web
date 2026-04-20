<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { addFeed, getArticles, searchArticles, updateArticles } from '../services/api'

import CategoryFilter from '../components/CategoryFilter.vue'
import FeedInput from '../components/FeedInput.vue'
import NewsList from '../components/NewsList.vue'
import SearchBar from '../components/SearchBar.vue'
import SortSelect from '../components/SortSelect.vue'

defineOptions({
  name: 'HomeView',
})

const EMPTY_STATE_MESSAGES = {
  default: 'Aún no hay noticias cargadas. Agrega uno o mas feeds RSS y actualiza para comenzar.',
  filtered: 'No hay noticias que coincidan con tu busqueda y filtros actuales.',
}
const SEARCH_FIELDS = 'title|date|description'
const PAGE_SIZE = 12

const baseArticles = ref([])
const searchResults = ref([])
const search = ref('')
const sortField = ref('date')
const sortOrder = ref('desc')
const selectedCategory = ref('')
const isLoading = ref(false)
const isLoadingMore = ref(false)
const isRefreshing = ref(false)
const isAddingFeed = ref(false)
const isSearching = ref(false)
const hasMorePages = ref(false)
const currentPage = ref(1)
const statusMessage = ref('')
const statusType = ref('info')
const loadError = ref('')
let searchTimeoutId = null
let listAbortController = null
let requestSequence = 0

function normalizeCategories(categories) {
  if (!Array.isArray(categories)) {
    return []
  }

  return categories
    .map((category) => {
      if (typeof category === 'string') {
        return category
      }

      return category?.name || 'Sin categoria'
    })
    .filter(Boolean)
}

function normalizeUrl(value) {
  if (typeof value !== 'string') {
    return ''
  }

  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return ''
  }

  if (
    trimmedValue.startsWith('http://') ||
    trimmedValue.startsWith('https://') ||
    trimmedValue.startsWith('data:') ||
    trimmedValue.startsWith('blob:')
  ) {
    return trimmedValue
  }

  if (trimmedValue.startsWith('//')) {
    return `https:${trimmedValue}`
  }

  return `https://${trimmedValue}`
}

function normalizeArticle(article) {
  return {
    id: article?.id ?? crypto.randomUUID(),
    guid: article?.guid || '',
    title: article?.title || 'Sin titulo',
    url: normalizeUrl(article?.url),
    description: article?.description || 'Sin descripcion disponible.',
    content: article?.content || '',
    date: article?.date || '',
    image: normalizeUrl(article?.image),
    categories: normalizeCategories(article?.categories),
  }
}

function setStatus(message, type = 'info') {
  statusMessage.value = message
  statusType.value = type
}

function getNextPage(payload, requestedPage, receivedItems) {
  const meta = payload?.meta || payload?.pagination
  const totalPages = Number(meta?.totalPages || meta?.pages || 0)
  const page = Number(meta?.page || requestedPage)

  if (totalPages > 0) {
    return {
      page,
      hasMore: page < totalPages,
    }
  }

  return {
    page: requestedPage,
    hasMore: receivedItems === PAGE_SIZE,
  }
}

function dedupeById(list) {
  const uniqueArticles = new Map()

  list.forEach((article) => {
    uniqueArticles.set(article.id, article)
  })

  return [...uniqueArticles.values()]
}

function getArticleSortValue(article, field) {
  if (field === 'title') {
    return article.title || ''
  }

  if (field === 'description') {
    return article.description || ''
  }

  const dateValue = Date.parse(article.date || '')

  return Number.isNaN(dateValue) ? 0 : dateValue
}

function sortArticles(list) {
  const direction = sortOrder.value === 'asc' ? 1 : -1

  return [...list].sort((firstArticle, secondArticle) => {
    const firstValue = getArticleSortValue(firstArticle, sortField.value)
    const secondValue = getArticleSortValue(secondArticle, sortField.value)

    if (typeof firstValue === 'number' && typeof secondValue === 'number') {
      return (firstValue - secondValue) * direction
    }

    return (
      String(firstValue).localeCompare(String(secondValue), 'es', {
        sensitivity: 'base',
      }) * direction
    )
  })
}

function filterByCategory(list) {
  const category = selectedCategory.value.trim()

  if (!category) {
    return list
  }

  return list.filter((article) => article.categories.includes(category))
}

function getActiveArticles() {
  const trimmedSearch = search.value.trim()

  return trimmedSearch ? searchResults.value : baseArticles.value
}

function getVisibleArticles() {
  return sortArticles(filterByCategory(getActiveArticles()))
}

async function loadBaseArticles({ reset = false } = {}) {
  if (listAbortController) {
    listAbortController.abort()
  }

  const controller = new AbortController()
  listAbortController = controller
  const requestedPage = reset ? 1 : currentPage.value + 1

  if (reset) {
    isLoading.value = true
    loadError.value = ''
  } else {
    isLoadingMore.value = true
  }

  try {
    const result = await getArticles({
      order: sortOrder.value,
      by: sortField.value,
      page: requestedPage,
      size: PAGE_SIZE,
      signal: controller.signal,
    })

    const nextArticles = Array.isArray(result?.data) ? result.data.map(normalizeArticle) : []

    if (reset) {
      baseArticles.value = nextArticles
    } else {
      baseArticles.value = dedupeById([...baseArticles.value, ...nextArticles])
    }

    const paginationState = getNextPage(result, requestedPage, nextArticles.length)
    currentPage.value = paginationState.page
    hasMorePages.value = paginationState.hasMore

    if (!getVisibleArticles().length) {
      setStatus('No se encontraron noticias con los filtros actuales.')
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      return
    }

    console.error('Error cargando articulos:', error)
    loadError.value = 'No fue posible cargar las noticias desde la API.'
    setStatus(loadError.value, 'danger')
  } finally {
    if (listAbortController === controller) {
      listAbortController = null
    }
    isLoading.value = false
    isLoadingMore.value = false
  }
}

async function loadSearchResults() {
  const trimmedSearch = search.value.trim()

  if (!trimmedSearch) {
    searchResults.value = []
    hasMorePages.value = true
    await loadBaseArticles({ reset: true })
    return
  }

  if (listAbortController) {
    listAbortController.abort()
  }

  const controller = new AbortController()
  listAbortController = controller
  const sequence = ++requestSequence

  isSearching.value = true
  loadError.value = ''

  try {
    const result = await searchArticles(trimmedSearch, SEARCH_FIELDS, {
      signal: controller.signal,
    })

    if (sequence !== requestSequence) {
      return
    }

    searchResults.value = Array.isArray(result?.data) ? result.data.map(normalizeArticle) : []
    currentPage.value = 1
    hasMorePages.value = false

    if (!getVisibleArticles().length) {
      setStatus('No se encontraron noticias con los filtros actuales.')
    }
  } catch (error) {
    if (error?.name === 'AbortError') {
      return
    }

    console.error('Error buscando articulos:', error)
    loadError.value = 'No fue posible buscar las noticias en este momento.'
    setStatus(loadError.value, 'danger')
  } finally {
    if (listAbortController === controller) {
      listAbortController = null
    }
    isSearching.value = false
  }
}

async function searchNow() {
  if (searchTimeoutId) {
    clearTimeout(searchTimeoutId)
  }

  await loadSearchResults()
}

async function loadMoreArticles() {
  if (search.value.trim() || !hasMorePages.value || isLoading.value || isLoadingMore.value) {
    return
  }

  await loadBaseArticles()
}

async function refreshFeed() {
  isRefreshing.value = true
  loadError.value = ''

  try {
    await updateArticles()

    if (search.value.trim()) {
      await loadSearchResults()
    } else {
      await loadBaseArticles({ reset: true })
    }

    setStatus('Noticias actualizadas correctamente.', 'success')
  } catch (error) {
    console.error('Error actualizando noticias:', error)
    loadError.value = 'No fue posible actualizar las noticias en este momento.'
    setStatus(loadError.value, 'danger')
  } finally {
    isRefreshing.value = false
  }
}

async function addFeedHandler(url) {
  isAddingFeed.value = true

  try {
    await addFeed(url)
    setStatus('Feed agregado correctamente. Ahora puedes actualizar las noticias.', 'success')
  } catch (error) {
    console.error('Error agregando feed:', error)
    setStatus('No fue posible agregar el feed. Revisa la URL e intenta de nuevo.', 'danger')
  } finally {
    isAddingFeed.value = false
  }
}

const categories = computed(() => {
  const uniqueCategories = new Set()

  dedupeById([...baseArticles.value, ...searchResults.value]).forEach((article) => {
    article.categories.forEach((category) => uniqueCategories.add(category))
  })

  return [...uniqueCategories].sort((first, second) => {
    return first.localeCompare(second, 'es', {
      sensitivity: 'base',
    })
  })
})

const hasActiveFilters = computed(() => {
  return Boolean(search.value.trim() || selectedCategory.value)
})

const visibleArticles = computed(() => getVisibleArticles())

const emptyMessage = computed(() => {
  return hasActiveFilters.value ? EMPTY_STATE_MESSAGES.filtered : EMPTY_STATE_MESSAGES.default
})

watch(search, () => {
  if (searchTimeoutId) {
    clearTimeout(searchTimeoutId)
  }

  const trimmedSearch = search.value.trim()

  if (!trimmedSearch) {
    searchResults.value = []
    loadBaseArticles({ reset: true })
    return
  }

  searchTimeoutId = setTimeout(async () => {
    await loadSearchResults()
  }, 300)
})

onBeforeUnmount(() => {
  if (searchTimeoutId) {
    clearTimeout(searchTimeoutId)
  }

  if (listAbortController) {
    listAbortController.abort()
  }
})

onMounted(() => {
  loadBaseArticles({ reset: true })
})
</script>

<template>
  <section class="home-shell">
    <div class="container py-5">
      <div
        v-if="statusMessage"
        class="alert border-0 shadow-sm mb-4"
        :class="`alert-${statusType}`"
        role="alert"
      >
        {{ statusMessage }}
      </div>

      <div class="controls-stack mb-4">
        <FeedInput :is-submitting="isAddingFeed" @add-feed="addFeedHandler" />

        <SearchBar
          v-model="search"
          :is-refreshing="isRefreshing"
          :is-searching="isSearching"
          @refresh-feed="refreshFeed"
          @search-now="searchNow"
        />
      </div>

      <div class="toolbar-panel mb-4">
        <div class="row g-3">
          <div class="col-12 col-lg-4">
            <CategoryFilter v-model="selectedCategory" :categories="categories" />
          </div>

          <div class="col-12 col-lg-8">
            <SortSelect v-model:sort-by="sortField" v-model:sort-order="sortOrder" />
          </div>
        </div>
      </div>

      <NewsList
        :news="visibleArticles"
        :loading="isLoading || isSearching"
        :loading-more="isLoadingMore"
        :can-load-more="hasMorePages"
        :empty-message="emptyMessage"
        @load-more="loadMoreArticles"
      />
    </div>
  </section>
</template>

<style scoped>
.home-shell {
  min-height: 100vh;
}

.hero-panel {
  display: grid;
  gap: 1.5rem;
  grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr);
  padding: 2rem;
  border-radius: 28px;
  background: linear-gradient(135deg, rgba(255, 248, 238, 0.92), rgba(255, 255, 255, 0.7));
  border: 1px solid rgba(25, 44, 62, 0.08);
  box-shadow: 0 24px 80px rgba(25, 44, 62, 0.12);
}

.eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.45rem 0.85rem;
  border-radius: 999px;
  background: #192c3e;
  color: #fffaf2;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

.hero-title {
  max-width: 12ch;
  font-size: clamp(2.6rem, 6vw, 4.8rem);
  line-height: 0.95;
}

.hero-copy {
  max-width: 58ch;
  color: rgba(25, 44, 62, 0.78);
  font-size: 1.02rem;
}

.stats-grid {
  display: grid;
  gap: 1rem;
}

.stat-card {
  padding: 1.2rem;
  border-radius: 22px;
  background: rgba(25, 44, 62, 0.96);
  color: #fffaf2;
}

.stat-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  line-height: 1;
}

.stat-label {
  display: inline-block;
  margin-top: 0.45rem;
  color: rgba(255, 250, 242, 0.76);
}

.toolbar-panel {
  padding: 1.2rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.72);
  border: 1px solid rgba(25, 44, 62, 0.08);
  backdrop-filter: blur(16px);
}

.controls-stack {
  display: grid;
  gap: 0.85rem;
}

@media (max-width: 991.98px) {
  .hero-panel {
    grid-template-columns: 1fr;
    padding: 1.5rem;
  }

  .hero-title {
    max-width: none;
  }
}
</style>
