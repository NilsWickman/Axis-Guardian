<script setup lang="ts">
/**
 * Site Map View - Displays the floor plan PDF
 */
</script>

<template>
  <div class="site-map-view">
    <embed
      src="/floor-plan.pdf"
      type="application/pdf"
      width="100%"
      height="100%"
    />
  </div>
</template>

<style scoped>
.site-map-view {
  width: 100%;
  height: 100vh;
  display: flex;
}
</style>
