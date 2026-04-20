<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import placeholderImage from '../assets/news-placeholder.svg'

const props = defineProps({
  article: {
    type: Object,
    required: true,
  },
  eagerImage: {
    type: Boolean,
    default: false,
  },
})

const hasImageError = ref(false)
const hasImageLoaded = ref(false)
const imageRef = ref(null)
const shouldLoadImage = ref(false)
let imageObserver = null

const imageLoading = computed(() => (props.eagerImage ? 'eager' : 'lazy'))
const imageFetchPriority = computed(() => (props.eagerImage ? 'high' : 'low'))

const resolvedImage = computed(() => {
  if (!shouldLoadImage.value || hasImageError.value || !props.article.image) {
    return placeholderImage
  }

  return props.article.image
})

const isRealImageVisible = computed(() => {
  return (
    shouldLoadImage.value &&
    !hasImageError.value &&
    hasImageLoaded.value &&
    Boolean(props.article.image)
  )
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

function initializeObserver() {
  if (props.eagerImage || !props.article.image) {
    shouldLoadImage.value = true
    hasImageLoaded.value = false
    return
  }

  if (typeof IntersectionObserver !== 'function') {
    shouldLoadImage.value = true
    hasImageLoaded.value = false
    return
  }

  imageObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) {
          return
        }

        shouldLoadImage.value = true
        hasImageLoaded.value = false
        imageObserver?.disconnect()
        imageObserver = null
      })
    },
    {
      rootMargin: '300px 0px',
      threshold: 0.01,
    },
  )

  if (imageRef.value) {
    imageObserver.observe(imageRef.value)
  }
}

onMounted(() => {
  initializeObserver()
})

onBeforeUnmount(() => {
  imageObserver?.disconnect()
})
</script>

<template>
  <article class="news-card card h-100 border-0">
    <div class="news-image-frame">
      <img
        ref="imageRef"
        :src="resolvedImage"
        class="card-img-top news-image"
        :class="{ 'is-visible': isRealImageVisible }"
        :alt="article.title"
        width="800"
        height="480"
        :loading="imageLoading"
        :fetchpriority="imageFetchPriority"
        decoding="async"
        @load="hasImageLoaded = true"
        @error="hasImageError = true"
      />
    </div>

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

.news-image-frame {
  position: relative;
  height: 155px;
  overflow: hidden;
  background: url('../assets/news-placeholder.svg') center center / cover no-repeat;
}

.news-image {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 160ms ease;
}

.news-image.is-visible {
  opacity: 1;
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

  .news-image-frame {
    height: 140px;
  }
}
</style>
