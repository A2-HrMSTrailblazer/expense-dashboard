<script setup>
import { Bar } from 'vue-chartjs'
import { valueLabels } from '../chartPlugins'

defineProps({
  data: { type: Object, required: true },
  options: { type: Object, required: true },
  height: { type: Number, default: 280 },
  label: { type: String, required: true }, // accessible name for screen readers
})
</script>

<template>
  <div class="chart" :style="{ height: `${height}px` }" role="img" :aria-label="label">
    <Bar :data="data" :options="options" :plugins="[valueLabels]" />
  </div>
</template>

<style scoped>
.chart {
  position: relative;
  width: 100%;
}
</style>
