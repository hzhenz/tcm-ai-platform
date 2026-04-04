<template>
  <section class="section bg-light" id="local">
    <div class="container local-container reveal-item">
      <div class="local-text">
        <h2 class="section-title" style="text-align: left;">长沙本地中医资源</h2>
        <p class="section-desc" style="text-align: left; margin-bottom: 30px;">
          打通线上线下，一键查看您附近的中医医院、名老中医排班表、信誉良好的中药房以及线下中医理疗馆。为您的健康提供便捷通道。
        </p>
        <button class="btn btn-primary" @click="emit('navigate', '/map')">探索本地资源</button>
      </div>
      <div class="local-image-box">
        <div class="glass-map">
           <div class="pulse-dot" style="top: 30%; left: 40%"></div>
           <div class="pulse-dot" style="top: 60%; left: 70%"></div>
           <div class="pulse-dot" style="top: 50%; left: 20%"></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const emit = defineEmits(['navigate'])
</script>

<style scoped>
.section {
  padding: 100px 0;
  position: relative;
}

.bg-light {
  background-color: #ffffff;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

.local-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
}

.section-title {
  font-family: "Noto Serif SC", "Songti SC", "STSong", "Microsoft YaHei", serif;
  font-size: 36px;
  color: #1C2B26;
  margin-bottom: 16px;
  position: relative;
  display: inline-block;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 0;
  width: 40px;
  height: 3px;
  background-color: #C2A878;
  border-radius: 2px;
}

.section-desc {
  font-size: 16px;
  color: #666666;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 32px;
  border-radius: 40px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
}

.btn-primary {
  background: #1C2B26;
  color: #fff;
}

.btn-primary:hover {
  background: #2A4039;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(28, 43, 38, 0.2);
}

.glass-map {
  width: 100%;
  aspect-ratio: 4/3;
  background: linear-gradient(135deg, #F0EBE1 0%, #E6DFD3 100%);
  border-radius: 24px;
  position: relative;
  overflow: hidden;
  box-shadow: inset 0 0 40px rgba(255,255,255,0.5), 0 10px 40px rgba(28, 43, 38, 0.05);
  border: 4px solid #fff;
}

.pulse-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  background-color: #C2A878;
  border-radius: 50%;
  box-shadow: 0 0 0 0 rgba(194, 168, 120, 0.7);
  animation: pulse 2s infinite cubic-bezier(0.66, 0, 0, 1);
}

@keyframes pulse {
  to { box-shadow: 0 0 0 20px rgba(194, 168, 120, 0); }
}

.reveal-item {
  opacity: 0;
  transform: translateY(30px);
  animation: reveal 0.8s cubic-bezier(0.5, 0, 0, 1) forwards;
}

@keyframes reveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 900px) {
  .local-container {
    grid-template-columns: 1fr;
  }
  
  .local-text {
    text-align: center;
  }
  
  .local-text .section-title::after {
    left: 50%;
    transform: translateX(-50%);
  }
}

@media (max-width: 768px) {
  .section {
    padding: 60px 0;
  }
}
</style>
