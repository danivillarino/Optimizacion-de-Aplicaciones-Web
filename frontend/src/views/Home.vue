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

const allArticles = ref([])
const searchedArticles = ref([])
const visibleArticles = ref([])
const search = ref('')
const sortField = ref('date')
const sortOrder = ref('desc')
const selectedCategory = ref('')
const isLoading = ref(false)
const isRefreshing = ref(false)
const isAddingFeed = ref(false)
const isSearching = ref(false)
const statusMessage = ref('')
const statusType = ref('info')
const loadError = ref('')
let searchTimeoutId = null

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

function applyCategoryFilter(articleList) {
  if (!selectedCategory.value) {
    return articleList
  }

  return articleList.filter((article) => article.categories.includes(selectedCategory.value))
}

function sortClientSide(articleList) {
  const direction = sortOrder.value === 'asc' ? 1 : -1
  const sorted = [...articleList]

  sorted.sort((firstArticle, secondArticle) => {
    if (sortField.value === 'date') {
      const firstDate = new Date(firstArticle.date || 0).getTime()
      const secondDate = new Date(secondArticle.date || 0).getTime()

      return (firstDate - secondDate) * direction
    }

    const firstValue = String(firstArticle[sortField.value] || '')
      .trim()
      .toLowerCase()
    const secondValue = String(secondArticle[sortField.value] || '')
      .trim()
      .toLowerCase()
    const result = firstValue.localeCompare(secondValue, 'es', {
      sensitivity: 'base',
    })

    if (result !== 0) {
      return result * direction
    }

    return firstArticle.title.localeCompare(secondArticle.title, 'es', {
      sensitivity: 'base',
    })
  })

  return sorted
}

function syncVisibleArticles(sourceArticles = allArticles.value) {
  visibleArticles.value = sortClientSide(applyCategoryFilter(sourceArticles))
}

async function loadArticles() {
  isLoading.value = true
  loadError.value = ''

  try {
    const result = await getArticles({
      order: sortOrder.value,
      by: sortField.value,
    })

    allArticles.value = Array.isArray(result?.data) ? result.data.map(normalizeArticle) : []

    if (!search.value.trim()) {
      syncVisibleArticles(allArticles.value)
    }

    if (!allArticles.value.length) {
      setStatus('No se encontraron noticias almacenadas todavia.')
    }
  } catch (error) {
    console.error('Error cargando articulos:', error)
    loadError.value = 'No fue posible cargar las noticias desde la API.'
    setStatus(loadError.value, 'danger')
  } finally {
    isLoading.value = false
  }
}

async function loadSearchResults() {
  isSearching.value = true
  loadError.value = ''

  try {
    const result = await searchArticles(search.value.trim(), 'title|date|description')
    searchedArticles.value = Array.isArray(result?.data) ? result.data.map(normalizeArticle) : []

    visibleArticles.value = sortClientSide(applyCategoryFilter(searchedArticles.value))

    if (!searchedArticles.value.length) {
      setStatus('La busqueda no devolvio resultados.', 'info')
    }
  } catch (error) {
    console.error('Error buscando articulos:', error)
    loadError.value = 'No fue posible buscar noticias en este momento.'
    setStatus(loadError.value, 'danger')
  } finally {
    isSearching.value = false
  }
}

async function searchNow() {
  if (searchTimeoutId) {
    clearTimeout(searchTimeoutId)
  }

  if (!search.value.trim()) {
    searchedArticles.value = []
    syncVisibleArticles(allArticles.value)
    return
  }

  await loadSearchResults()
}

async function refreshFeed() {
  isRefreshing.value = true
  loadError.value = ''

  try {
    await updateArticles()
    if (search.value.trim()) {
      await Promise.all([loadArticles(), loadSearchResults()])
    } else {
      await loadArticles()
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

  allArticles.value.forEach((article) => {
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

const emptyMessage = computed(() => {
  return hasActiveFilters.value ? EMPTY_STATE_MESSAGES.filtered : EMPTY_STATE_MESSAGES.default
})

watch(selectedCategory, () => {
  if (search.value.trim()) {
    syncVisibleArticles(searchedArticles.value)
    return
  }

  syncVisibleArticles(allArticles.value)
})

watch([sortField, sortOrder], async () => {
  if (search.value.trim()) {
    syncVisibleArticles(searchedArticles.value)
    return
  }

  await loadArticles()
})

watch(search, (value) => {
  if (searchTimeoutId) {
    clearTimeout(searchTimeoutId)
  }

  searchTimeoutId = setTimeout(async () => {
    if (!value.trim()) {
      searchedArticles.value = []
      syncVisibleArticles(allArticles.value)
      return
    }

    await loadSearchResults()
  }, 300)
})

onBeforeUnmount(() => {
  if (searchTimeoutId) {
    clearTimeout(searchTimeoutId)
  }
})

onMounted(() => {
  loadArticles()
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
        :empty-message="emptyMessage"
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
