<script setup>
const sortBy = defineModel('sortBy')
const sortOrder = defineModel('sortOrder')

const fields = [
  {
    value: 'date',
    label: 'Fecha',
  },
  {
    value: 'title',
    label: 'Titulo',
  },
  {
    value: 'description',
    label: 'Descripcion',
  },
]
</script>

<template>
  <div class="sort-grid">
    <div>
      <label class="form-label filter-label" for="sort-by"> Ordenar por </label>
      <select id="sort-by" v-model="sortBy" class="form-select form-select-lg">
        <option v-for="field in fields" :key="field.value" :value="field.value">
          {{ field.label }}
        </option>
      </select>
    </div>

    <div>
      <label class="form-label filter-label" for="sort-order"> Direccin </label>
      <select id="sort-order" v-model="sortOrder" class="form-select form-select-lg">
        <option value="desc">Descendente</option>
        <option value="asc">Ascendente</option>
      </select>
    </div>
  </div>
</template>

<style scoped>
.sort-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.filter-label {
  font-weight: 600;
  color: rgba(25, 44, 62, 0.72);
}

@media (max-width: 575.98px) {
  .sort-grid {
    grid-template-columns: 1fr;
  }
}
</style>
