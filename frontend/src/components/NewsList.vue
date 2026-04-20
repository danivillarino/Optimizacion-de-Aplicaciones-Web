<script setup>
import NewsCard from './NewsCard.vue'

defineProps({
  news: {
    type: Array,
    default: () => [],
  },
  loading: Boolean,
  loadingMore: Boolean,
  canLoadMore: Boolean,
  emptyMessage: {
    type: String,
    default: 'No hay noticias disponibles.',
  },
})

defineEmits(['load-more'])
</script>

<template>
  <section>
    <div v-if="loading" class="empty-state">
      <h3 class="h4 mb-2">Cargando noticias...</h3>
      <p class="mb-0">La aplicacion esta consultando la base de datos y preparando tu portada.</p>
    </div>

    <div v-else-if="!news.length" class="empty-state">
      <h3 class="h4 mb-2">Sin resultados</h3>
      <p class="mb-0">{{ emptyMessage }}</p>
    </div>

    <div v-else class="row g-4">
      <div
        v-for="(item, index) in news"
        :key="item.id"
        v-memo="[item.id, item.title, item.date, item.image, item.description, item.url]"
        class="col-12 col-md-6 col-xxl-4 news-list-item"
      >
        <NewsCard :article="item" :eager-image="index < 2" />
      </div>
    </div>

    <div v-if="canLoadMore && news.length" class="load-more-wrap">
      <button class="btn btn-primary px-4" :disabled="loadingMore" @click="$emit('load-more')">
        {{ loadingMore ? 'Cargando mas...' : 'Cargar mas noticias' }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.empty-state {
  padding: 3rem 1.5rem;
  border-radius: 24px;
  text-align: center;
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(25, 44, 62, 0.08);
}

.load-more-wrap {
  margin-top: 1.5rem;
  display: flex;
  justify-content: center;
}

.news-list-item {
  content-visibility: auto;
  contain-intrinsic-size: 420px;
}
</style>
