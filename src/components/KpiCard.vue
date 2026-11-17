<script setup>
defineProps({
  label: String,
  value: String,
  note: String,
  tone: { type: String, default: '' }, // '', 'good', 'bad', 'accent'
})
</script>

<template>
  <div class="kpi">
    <div class="kpi-label">{{ label }}</div>
    <div class="kpi-value" :class="tone">{{ value }}</div>
    <div v-if="note" class="kpi-note">{{ note }}</div>
  </div>
</template>

<style scoped>
.kpi {
  background: var(--panel);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 16px 18px;
  min-width: 0;
}
.kpi-label {
  font-size: 13px;
  color: var(--muted);
}
.kpi-value {
  font-size: 26px;
  font-weight: 650;
  letter-spacing: -0.02em;
  margin-top: 4px;
  font-variant-numeric: tabular-nums;
}
.kpi-value.good { color: var(--good); }
.kpi-value.bad { color: var(--bad); }
.kpi-value.accent { color: var(--accent); }
.kpi-note {
  font-size: 12px;
  color: var(--muted);
  margin-top: 2px;
}
</style>
