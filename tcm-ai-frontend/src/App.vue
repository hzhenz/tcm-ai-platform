<template>
  <router-view></router-view>
</template>

<script setup>
// 根组件暂时不需要写什么逻辑
</script>

<style lang="css" scoped>
/* 清除浏览器默认边距，让页面完美铺满 */
html, body {
  margin: 0;
  padding: 0;
  width: 100%;
  height: 100%;
}

#app {
  width: 100%;
  height: 100%;
}
</style>