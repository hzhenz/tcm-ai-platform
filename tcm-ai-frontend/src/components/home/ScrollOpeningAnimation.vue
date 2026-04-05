<template>
  <div 
    v-if="isVisible" 
    class="scroll-wrapper" 
    :style="{ opacity: opacity, pointerEvents: isPageShow ? 'none' : 'auto' }"
  >
    <div class="scroll-left"></div>
    <div class="scroll-right"></div>
    <div class="scroll-center-line"></div>
    <div class="scroll-title">
      <span class="title-main">AI上中医</span>
      <span class="title-sub">AI赋能 · 中医传承</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const isVisible = ref(true)
const opacity = ref(1)
const isPageShow = ref(false)
const OPENING_PLAYED_KEY = 'tcm_home_opening_played'

const emit = defineEmits(['animation-complete'])

onMounted(() => {
  const hasPlayed = localStorage.getItem(OPENING_PLAYED_KEY) === '1'

  if (hasPlayed) {
    isVisible.value = false
    isPageShow.value = true
    emit('animation-complete')
    return
  }

  // 先落标记，避免动画期间发生重挂载导致重复拉帷幕
  localStorage.setItem(OPENING_PLAYED_KEY, '1')
  setTimeout(() => {
    opacity.value = 0
    setTimeout(() => {
      isVisible.value = false
      isPageShow.value = true
      emit('animation-complete')
    }, 800)
  }, 2200)
})
</script>

<style scoped>
.scroll-wrapper {
  position: fixed;
  inset: 0;
  background: #FBFBF9;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
}

.scroll-left, .scroll-right {
  position: absolute;
  top: 0;
  width: 50%;
  height: 100%;
  background: #1C2B26;
  z-index: 2;
  box-shadow: 0 0 30px rgba(0,0,0,0.5);
}

.scroll-left {
  left: 0;
  transform-origin: left;
  animation: scrollDoorLeft 1.2s cubic-bezier(0.7, 0, 0.2, 1) 0.5s forwards;
}

.scroll-right {
  right: 0;
  transform-origin: right;
  animation: scrollDoorRight 1.2s cubic-bezier(0.7, 0, 0.2, 1) 0.5s forwards;
}

.scroll-center-line {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 2px;
  height: 100%;
  background: linear-gradient(to bottom, transparent, #C2A878, transparent);
  z-index: 3;
  animation: fadeOutLine 0.5s ease 0.4s forwards;
}

.scroll-title {
  position: absolute;
  z-index: 4;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  animation: titleFadeOut 1s cubic-bezier(0.7, 0, 0.2, 1) 0.5s forwards;
}

.scroll-title .title-main {
  font-family: "Noto Serif SC", "Songti SC", "STSong", "Microsoft YaHei", serif;
  font-size: 48px;
  color: #C2A878;
  letter-spacing: 12px;
  margin-right: -12px;
}

.scroll-title .title-sub {
  font-size: 14px;
  color: #fff;
  letter-spacing: 6px;
  margin-right: -6px;
  opacity: 0.8;
}

@keyframes scrollDoorLeft {
  0% { transform: translateX(0); }
  100% { transform: translateX(-100%); }
}

@keyframes scrollDoorRight {
  0% { transform: translateX(0); }
  100% { transform: translateX(100%); }
}

@keyframes fadeOutLine {
  0% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes titleFadeOut {
  0% { opacity: 1; transform: scale(1); }
  100% { opacity: 0; transform: scale(1.1); pointer-events: none; }
}
</style>
