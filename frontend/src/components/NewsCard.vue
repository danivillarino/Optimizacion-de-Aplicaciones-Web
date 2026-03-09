<script setup>
import { computed, ref } from 'vue'

const props = defineProps({
  article: {
    type: Object,
    required: true,
  },
})

const hasImageError = ref(false)

const placeholderImage =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 480'%3E%3Crect width='800' height='480' fill='%23192c3e'/%3E%3Ccircle cx='675' cy='98' r='88' fill='%23d8774a' fill-opacity='0.92'/%3E%3Crect x='72' y='118' width='300' height='30' rx='15' fill='%23fffaf2' fill-opacity='0.9'/%3E%3Crect x='72' y='176' width='470' height='24' rx='12' fill='%23fffaf2' fill-opacity='0.74'/%3E%3Crect x='72' y='218' width='420' height='24' rx='12' fill='%23fffaf2' fill-opacity='0.58'/%3E%3Crect x='72' y='300' width='170' height='48' rx='24' fill='%23d8774a'/%3E%3C/svg%3E"

const resolvedImage = computed(() => {
  return !hasImageError.value && props.article.image ? props.article.image : placeholderImage
})

const formattedDate = computed(() => {
  if (!props.article.date) {
    return 'Fecha no disponible'
  }

  const parsedDate = new Date(props.article.date)

  if (Number.isNaN(parsedDate.getTime())) {
    return props.article.date
  }

  return new Intl.DateTimeFormat('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(parsedDate)
})

const formattedUrl = computed(() => {
  if (!props.article.url) {
    return 'URL no disponible'
  }

  try {
    return new URL(props.article.url).hostname.replace('www.', '')
  } catch {
    return props.article.url
  }
})
</script>

<template>
  <article class="news-card card h-100 border-0">
    <img
      :src="resolvedImage"
      class="card-img-top news-image"
      :alt="article.title"
      @error="hasImageError = true"
    />

    <div class="card-body d-flex flex-column p-3">
      <div class="d-flex flex-wrap gap-2 mb-3">
        <span v-for="cat in article.categories" :key="cat" class="badge category-badge">
          {{ cat }}
        </span>

        <span v-if="!article.categories.length" class="badge category-badge muted">
          Sin categoria
        </span>
      </div>

      <p class="news-meta mb-2">{{ formattedDate }}</p>

      <h3 class="card-title h4 mb-3">
        <a :href="article.url" class="news-link" target="_blank" rel="noopener noreferrer">
          {{ article.title }}
        </a>
      </h3>

      <p class="card-text mb-4">{{ article.description }}</p>

      <div class="mt-auto">
        <p class="news-url mb-3">
          Fuente:
          <a :href="article.url" target="_blank" rel="noopener noreferrer">{{ formattedUrl }}</a>
        </p>

        <a
          :href="article.url"
          target="_blank"
          rel="noopener noreferrer"
          class="btn btn-primary btn-sm px-3"
        >
          Abrir articulo
        </a>
      </div>
    </div>
  </article>
</template>

<style scoped>
.news-card {
  overflow: hidden;
  min-height: 420px;
  border-radius: 26px;
  background: rgba(255, 255, 255, 0.82);
  box-shadow: 0 20px 60px rgba(25, 44, 62, 0.1);
  transition:
    transform 180ms ease,
    box-shadow 180ms ease;
}

.news-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 28px 80px rgba(25, 44, 62, 0.16);
}

.news-image {
  height: 155px;
  object-fit: cover;
}

.news-meta {
  color: #6c2f16;
  font-size: 0.92rem;
  font-weight: 700;
}

.news-link {
  color: #192c3e;
  text-decoration: none;
}

.news-link:hover {
  color: #d8774a;
}

.card-text {
  color: rgba(25, 44, 62, 0.78);
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

.news-url {
  color: rgba(25, 44, 62, 0.72);
  word-break: break-word;
}

.news-url a {
  color: inherit;
}

.category-badge {
  padding: 0.5rem 0.8rem;
  border-radius: 999px;
  background: #192c3e;
  color: #fffaf2;
}

.category-badge.muted {
  background: #5c6a78;
  color: #fffaf2;
}

@media (max-width: 767.98px) {
  .news-card {
    min-height: 380px;
  }

  .news-image {
    height: 140px;
  }
}
</style>
