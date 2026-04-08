<template>
  <div class="science-wrapper">
    <div class="bg-ornament bg-1" aria-hidden="true"></div>
    <div class="bg-ornament bg-2" aria-hidden="true"></div>

    <header class="science-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">🌿</span> <div class="logo-copy">
            <span class="logo-text">中医科普</span>
            <span class="logo-sub">TCM SCIENCE ATLAS</span>
          </div>
        </div>
        <nav class="header-nav">
          <button 
            class="nav-btn" 
            :class="{ active: activeTab === 'meridian' }" 
            @click="activeTab = 'meridian'"
          >
            <span class="icon">🌌</span> 脉络图
          </button>
          <button 
            class="nav-btn" 
            :class="{ active: activeTab === 'diagnosis' }" 
            @click="activeTab = 'diagnosis'"
          >
            <span class="icon">📜</span> 四诊八脉
          </button>
          <button
            class="nav-btn"
            :class="{ active: activeTab === 'history' }"
            @click="activeTab = 'history'"
          >
            <span class="icon">📚</span> 十大名医
          </button>
          <div class="divider"></div>
          <button class="nav-btn back-btn" @click="goBack">← 返回首页</button>
        </nav>
      </div>
    </header>

    <main class="science-content">
      <transition name="fade-slide" mode="out-in">
        <component :is="currentSection" :key="activeTab" />
      </transition>
    </main>

    <Transition name="fade">
      <button
        v-if="activeTab !== 'meridian' && showBackToTop"
        class="back-to-top"
        @click="backToTop"
        title="回到顶部"
      >
        <svg class="back-to-top-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M7 14L12 9L17 14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </Transition>

    <footer class="science-footer glass-panel">
      <p class="footer-info">宣传中医文化，普及中医知识</p>
    </footer>
  </div>
</template>

<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import MeridianSection from '@/components/science/MeridianSection.vue'
import DiagnosisSection from '@/components/science/DiagnosisSection.vue'
import HistorySection from '@/components/science/SolarTermSection.vue'

const router = useRouter()
const activeTab = ref('meridian')
const showBackToTop = ref(false)

const sectionMap = {
  meridian: MeridianSection,
  diagnosis: DiagnosisSection,
  history: HistorySection
}

const currentSection = computed(() => sectionMap[activeTab.value] || MeridianSection)

const goBack = () => {
  router.push('/')
}

const backToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true })
  handleScroll()
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
/* ================= CSS 变量与全局设置 ================= */
.science-wrapper {
  --home-surface: rgba(252, 250, 244, 0.82);
  --glass-border: rgba(205, 196, 176, 0.42);
  --bg-main: #f7f4ec;
  --ink-main: #1f2f2a;
  --ink-muted: #657069;
  --gold: #b7a17a;
  --jade: #20342d;
  --jade-light: #4f6960;
  --shadow-soft: 0 10px 28px rgba(31, 47, 42, 0.07);
  
  min-height: 100vh;
  background:
    radial-gradient(1200px 600px at 15% -10%, rgba(163, 179, 169, 0.16), transparent 70%),
    radial-gradient(1000px 500px at 85% 15%, rgba(191, 176, 143, 0.12), transparent 70%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.5), rgba(247, 244, 236, 0.82)),
    var(--bg-main);
  display: flex;
  flex-direction: column;
  color: var(--ink-main);
  font-family: "Source Han Serif SC", "Noto Serif SC", STZhongsong, "Microsoft YaHei", serif;
  position: relative;
  overflow: hidden;
}

/* ================= 动画与通用类 ================= */
.glass-panel {
  background: var(--home-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-soft);
}

.hover-lift {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease;
}
.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(42, 64, 57, 0.12);
}

/* Vue 过渡动画 */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.2, 0, 0, 1);
}
.fade-slide-enter-from {
  opacity: 0;
  transform: translateY(15px);
}
.fade-slide-leave-to {
  opacity: 0;
  transform: translateY(-15px);
}

/* 背景装饰 */
.bg-ornament {
  position: absolute;
  border-radius: 50%;
  filter: blur(60px);
  pointer-events: none;
  z-index: 0;
}
.bg-1 {
  width: 500px; height: 500px; left: -100px; top: -50px;
  background: rgba(147, 172, 160, 0.3);
  animation: drift 12s ease-in-out infinite alternate;
}
.bg-2 {
  width: 600px; height: 600px; right: -150px; bottom: 0px;
  background: rgba(201, 187, 150, 0.2);
  animation: drift 15s ease-in-out infinite alternate-reverse;
}

/* ================= 导航栏 ================= */
.science-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(243, 240, 231, 0.92);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-bottom: 1px solid rgba(32, 52, 45, 0.1);
  box-shadow: 0 4px 18px rgba(20, 31, 27, 0.04);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 14px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo { display: flex; align-items: center; gap: 12px; }
.logo-icon { font-size: 28px; }
.logo-copy { display: flex; flex-direction: column; line-height: 1.2; }
.logo-text { font-size: 22px; font-weight: 700; letter-spacing: 2px; }
.logo-sub { font-family: sans-serif; font-size: 10px; letter-spacing: 2px; color: var(--ink-muted); }

.header-nav { display: flex; align-items: center; gap: 12px; }
.divider { width: 1px; height: 20px; background: rgba(0,0,0,0.1); margin: 0 4px; }

.nav-btn {
  background: transparent;
  border: 1px solid transparent;
  color: var(--ink-muted);
  padding: 8px 18px;
  border-radius: 30px;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  gap: 6px;
}
.nav-btn:hover { background: rgba(32, 52, 45, 0.05); color: var(--jade); }
.nav-btn.active {
  background: var(--jade);
  color: #fff;
  box-shadow: 0 4px 12px rgba(32, 52, 45, 0.2);
}
.back-btn { border: 1px solid rgba(32, 52, 45, 0.14); }

/* ================= 内容区排版 ================= */
.science-content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 24px;
  position: relative;
  z-index: 1;
}

.back-to-top {
  position: fixed;
  bottom: 80px;
  right: 30px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1C2B26 0%, #2C3E35 100%);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(28, 43, 38, 0.3);
  z-index: 999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.back-to-top:hover {
  width: 56px;
  height: 56px;
  bottom: 82px;
  right: 28px;
  box-shadow: 0 8px 24px rgba(28, 43, 38, 0.4);
  background: linear-gradient(135deg, #C2A878 0%, #D4B896 100%);
}

.back-to-top:active {
  transform: scale(0.95);
}

.back-to-top-icon {
  width: 24px;
  height: 24px;
  color: #fff;
  transition: color 0.3s ease;
}

.back-to-top:hover .back-to-top-icon {
  color: #1C2B26;
}

/* ================= 页脚 ================= */
.science-footer { margin-top: 60px; padding: 40px 24px; text-align: center; border-top: 1px solid var(--glass-border); border-radius: 24px 24px 0 0; }
.science-footer p { margin: 0 0 8px; font-weight: 600; color: var(--jade); }
.footer-info { font-size: 14px; color: var(--ink-muted); font-weight: 400 !important; }

/* ================= 动画与响应式 ================= */
@keyframes drift {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(20px, -20px) scale(1.05); }
}

@media (max-width: 1024px) {
}
@media (max-width: 768px) {
  .header-content { flex-wrap: wrap; gap: 16px; justify-content: center; }
  .header-nav { width: 100%; justify-content: center; }

  .back-to-top {
    width: 48px;
    height: 48px;
    bottom: 70px;
    right: 20px;
  }

  .back-to-top:hover {
    width: 48px;
    height: 48px;
    bottom: 70px;
    right: 20px;
  }

  .back-to-top-icon {
    width: 20px;
    height: 20px;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>