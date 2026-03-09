<script setup>
defineProps({
  isRefreshing: Boolean,
  isSearching: Boolean,
})

const model = defineModel()
defineEmits(['refresh-feed', 'search-now'])
</script>

<template>
  <section class="control-card h-100">
    <div class="control-row">
      <div class="control-copy-block">
        <p class="control-label mb-1">Búsqueda y sincronización</p>
        <h2 class="control-title mb-0">Encuentra noticias al instante</h2>
      </div>

      <div class="controls-actions">
        <div class="input-group input-group-sm compact-group">
          <!-- <span class="input-group-text bg-white border-end-0">Buscar</span> -->

          <input
            v-model="model"
            type="text"
            class="form-control border-start-0"
            placeholder="Título, descripción o fecha"
            @keyup.enter="$emit('search-now')"
          />

          <button
            type="button"
            class="btn btn-search px-3"
            :disabled="isSearching"
            @click="$emit('search-now')"
          >
            {{ isSearching ? 'Buscando...' : 'Buscar' }}
          </button>
        </div>

        <button
          type="button"
          class="btn btn-refresh px-3"
          :disabled="isRefreshing"
          @click="$emit('refresh-feed')"
        >
          {{ isRefreshing ? 'Actualizando...' : 'Actualizar feed' }}
        </button>
      </div>
    </div>
  </section>
</template>

<style scoped>
.control-card {
  min-height: 100%;
  padding: 0.95rem 1.1rem;
  border-radius: 24px;
  background: rgba(25, 44, 62, 0.92);
  color: #fffaf2;
  box-shadow: 0 20px 60px rgba(25, 44, 62, 0.12);
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

.controls-actions {
  display: flex;
  align-items: center;
  gap: 0.65rem;
}

.control-label {
  color: rgba(255, 250, 242, 0.72);
  font-size: 0.72rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.control-title {
  font-size: 1rem;
  line-height: 1.1;
}

.btn-search {
  border: 1px solid #8f3d1c;
  background: #8f3d1c;
  color: #fffaf2;
}

.btn-search:hover,
.btn-search:focus {
  border-color: #6f2e15;
  background: #6f2e15;
  color: #fffaf2;
}

.btn-refresh {
  flex-shrink: 0;
  border: 1px solid rgba(255, 250, 242, 0.2);
  background: #fffaf2;
  color: #192c3e;
}

.btn-refresh:hover,
.btn-refresh:focus {
  border-color: #fffaf2;
  background: #f0e6d8;
  color: #192c3e;
}

@media (max-width: 767.98px) {
  .control-row {
    grid-template-columns: 1fr;
    align-items: stretch;
  }

  .controls-actions {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
