<template>
  <div class="app-shell">
    <router-view />
    <AgentButlerBubble />
  </div>
</template>

<script setup>
import AgentButlerBubble from '@/components/AgentButlerBubble.vue'
</script>

<style lang="css">
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

#app {
  width: 100%;
  min-height: 100%;
}

.app-shell {
  position: relative;
  min-height: 100vh;
}
</style>