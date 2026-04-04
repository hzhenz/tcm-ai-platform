<template>
  <div class="info-bar">
    <div class="info-track">
      <span>🌿 长沙今日甘草价32元/公斤 ↓2%</span>
      <span class="divider"></span>
      <span>🏥 岳麓区中医馆新馆开业 免3天诊费</span>
      <span class="divider"></span>
      <span>🍵 今日节气养生：宜健脾祛湿，忌生冷</span>
    </div>
  </div>
</template>

<style scoped>
.info-bar {
  background: #1C2B26;
  color: #fff;
  padding: 10px 0;
  font-size: 13px;
  overflow: hidden;
  position: relative;
}

.info-track {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  white-space: nowrap;
}

.info-track .divider {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background-color: #C2A878;
}
</style>
