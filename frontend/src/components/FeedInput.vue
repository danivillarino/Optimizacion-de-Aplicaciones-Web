<script setup>
import { ref } from 'vue'

defineProps({
  isSubmitting: Boolean,
})

const feedUrl = ref('')
const errorMessage = ref('')

const emit = defineEmits(['add-feed'])

function submitFeed() {
  const url = feedUrl.value.trim()

  if (!url) {
    errorMessage.value = 'Introduce la URL de un feed RSS.'
    return
  }

  try {
    new URL(url)
  } catch {
    errorMessage.value = 'Introduce una URL valida.'
    return
  }

  errorMessage.value = ''
  emit('add-feed', url)
  feedUrl.value = ''
}
</script>

<template>
  <section class="control-card h-100">
    <div class="control-row">
      <div class="control-copy-block">
        <p class="control-label mb-1">Agregar feed</p>
        <h2 class="control-title mb-0">Conecta tus fuentes RSS</h2>
      </div>

      <div class="input-group input-group-sm compact-group">
        <input
          v-model="feedUrl"
          type="url"
          class="form-control"
          @keyup.enter="submitFeed"
          placeholder="https://sitio.com/feed.xml"
        />

        <button class="btn btn-primary px-3" :disabled="isSubmitting" @click="submitFeed">
          {{ isSubmitting ? 'Guardando...' : 'Agregar' }}
        </button>
      </div>
    </div>

    <p v-if="errorMessage" class="text-danger small mb-0 mt-2">
      {{ errorMessage }}
    </p>
  </section>
</template>

<style scoped>
.control-card {
  min-height: 100%;
  padding: 0.95rem 1.1rem;
  border-radius: 24px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(25, 44, 62, 0.08);
  box-shadow: 0 20px 60px rgba(25, 44, 62, 0.1);
}

.control-row {
  display: grid;
  grid-template-columns: minmax(0, 250px) minmax(0, 1fr);
  align-items: center;
  gap: 0.9rem;
}

.compact-group {
  width: 100%;
}

.control-label {
  color: #8c3d1d;
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.control-title {
  font-size: 1rem;
  line-height: 1.1;
}

@media (max-width: 767.98px) {
  .control-row {
    grid-template-columns: 1fr;
    align-items: stretch;
  }
}
</style>
