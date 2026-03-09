<script setup>
defineProps({
  categories: Array,
  modelValue: String,
})

defineEmits(['update:modelValue'])
</script>

<template>
  <div>
    <label class="form-label filter-label" for="category-filter"> Categoría </label>
    <select
      id="category-filter"
      class="form-select form-select-lg"
      :value="modelValue"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option value="">Todas las categorías</option>

      <option v-for="cat in categories" :key="cat" :value="cat">
        {{ cat }}
      </option>
    </select>
  </div>
</template>

<style scoped>
.filter-label {
  font-weight: 600;
  color: rgba(25, 44, 62, 0.72);
}
</style>
