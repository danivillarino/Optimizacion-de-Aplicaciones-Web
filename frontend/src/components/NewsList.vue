<script setup>
import NewsCard from './NewsCard.vue'

defineProps({
  news: {
    type: Array,
    default: () => [],
  },
  loading: Boolean,
  emptyMessage: {
    type: String,
    default: 'No hay noticias disponibles.',
  },
})
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
      <div v-for="item in news" :key="item.id" class="col-12 col-md-6 col-xxl-4">
        <NewsCard :article="item" />
      </div>
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
</style>
