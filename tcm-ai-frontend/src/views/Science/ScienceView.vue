<template>
  <div class="science-wrapper">
    <div class="science-nav-shell">
      <header class="page-nav-bar bg-ancient-tan text-white text-center py-3 text-lg font-bold shadow-md z-30 flex items-center justify-center gap-4 md:gap-6">
        <span class="page-nav-title whitespace-nowrap">中医科普课堂</span>

        <div class="page-nav-items flex items-center gap-3 md:gap-4">
          <button @click="goToAiTongue" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
            <i class="fa-solid fa-face-smile text-base md:text-lg"></i>
            <span class="text-xs mt-0.5 hidden md:inline">AI舌诊</span>
          </button>

          <button @click="goToAiConsult" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
            <i class="fa-solid fa-user-doctor text-base md:text-lg"></i>
            <span class="text-xs mt-0.5 hidden md:inline">AI问诊</span>
          </button>

          <button @click="goToHerbRecog" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
            <i class="fa-solid fa-leaf text-base md:text-lg"></i>
            <span class="text-xs mt-0.5 hidden md:inline">中药识别</span>
          </button>

          <button @click="goToTcmScience" class="page-nav-item flex flex-col items-center transition-colors duration-200" :class="{ active: currentPage === 'tcmScience' }" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
            <i class="fa-solid fa-book-open text-base md:text-lg"></i>
            <span class="text-xs mt-0.5 hidden md:inline">中医科普</span>
          </button>

          <button @click="goToHome" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
            <i class="fa-solid fa-house text-base md:text-lg"></i>
            <span class="text-xs mt-0.5 hidden md:inline">返回首页</span>
          </button>
        </div>
      </header>

      <aside class="sidebar-nav-vertical">
        <button
          class="sidebar-btn"
          :class="{ active: activeTab === 'meridian' }"
          @click="activeTab = 'meridian'"
        >
          <i class="fa-solid fa-chart-line"></i>
          <span>脉络图</span>
        </button>
        <button
          class="sidebar-btn"
          :class="{ active: activeTab === 'diagnosis' }"
          @click="activeTab = 'diagnosis'"
        >
          <i class="fa-solid fa-stethoscope"></i>
          <span>四诊</span>
        </button>
        <button
          class="sidebar-btn"
          :class="{ active: activeTab === 'history' }"
          @click="activeTab = 'history'"
        >
          <i class="fa-solid fa-book-open"></i>
          <span>十大名医</span>
        </button>
      </aside>
    </div>

    <div class="layout-container">

      <div class="main-content-area">
        <div class="science-content">
          <transition name="fade-slide" mode="out-in">
            <component :is="currentSection" :key="activeTab" />
          </transition>
        </div>

        <div class="science-footer">
          <p>中医科学知识库 | 长沙中医 AI 平台</p>
          <p class="footer-info">致力于传承中医文化，普及中医知识</p>
        </div>
      </div>
    </div>

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
const currentPage = ref('tcmScience')

const sectionMap = {
  meridian: MeridianSection,
  diagnosis: DiagnosisSection,
  history: HistorySection
}

const currentSection = computed(() => sectionMap[activeTab.value] || MeridianSection)

const goToHome = () => {
  router.push({ name: 'home' })
}

const goToAiTongue = () => {
  router.push({ name: 'tongue' })
}

const goToAiConsult = () => {
  router.push({ name: 'consultation' })
}

const goToHerbRecog = () => {
  router.push({ name: 'herb' })
}

const goToTcmScience = () => {
  router.push({ name: 'science' })
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
  --top-nav-height: 64px;
  --home-surface: rgba(252, 250, 244, 0.82);
  --glass-border: rgba(205, 196, 176, 0.42);
  --bg-main: #f7f4ec;
  --ink-main: #1f2f2a;
  --ink-muted: #657069;
  --gold: #b7a17a;
  --jade: #20342d;
  --jade-light: #4f6960;
  --shadow-soft: 0 10px 28px rgba(31, 47, 42, 0.07);
  --science-sidebar-offset: 170px;
  
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
  overflow-x: hidden; 
}

.science-nav-shell {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  z-index: 29;
  display: flex;
  flex-direction: column;
  pointer-events: auto;
}

.page-nav-item.active {
  color: #E8D8B0 !important;
  filter: drop-shadow(0 0 6px rgba(194, 168, 120, 0.8));
}

.page-nav-bar {
  background: linear-gradient(180deg, #1C2B26 0%, #16211d 100%);
  width: 100%;
  flex: 0 0 auto;
}

.layout-container {
  display: flex;
  min-height: 100vh;
  padding-top: var(--top-nav-height);
}

.sidebar-nav-vertical {
  width: 170px;
  background: #fefaf3;
  border-right: 1px solid #eadbbe;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 24px 16px;
  position: relative;
  top: 0;
  left: 0;
  height: calc(100vh - var(--top-nav-height));
  overflow-y: auto;
  z-index: 29;
}

.sidebar-btn {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 500;
  color: #4a3b2c;
  background: transparent;
  transition: all 0.2s;
  cursor: pointer;
  border: none;
  width: 100%;
  text-align: left;
}

.sidebar-btn i {
  width: 24px;
  font-size: 18px;
  color: #b68b40;
}

.sidebar-btn:hover {
  background: #f5ede1;
}

.sidebar-btn.active {
  background: #e8dcc8;
  color: #5a3a1a;
  border-left: 3px solid #c2a878;
}

.sidebar-btn.active i {
  color: #8b5a2b;
}

.sidebar-btn span {
  white-space: nowrap;
}

.main-content-area {
  flex: 1;
  overflow-x: hidden;
  margin-left: 170px;
  min-width: 0;
}

.science-footer {
  background: #1C2B26;
  color: white;
  text-align: center;
  padding: 15px 24px;
  margin-top: 40px;
}

.science-footer p {
  margin: 8px 0;
}

.footer-info {
  color: #AAA;
  font-size: 14px;
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

/* ★★★ 核心修改区：纯透明度渐变，移除 transform ★★★ */
.fade-slide-enter-active,
.fade-slide-leave-active {
  transition: opacity 0.3s ease; /* 仅保留 opacity 过渡 */
}
.fade-slide-enter-from,
.fade-slide-leave-to {
  opacity: 0;
  /* 删除了 transform: translateY(15px); */
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

/* ================= 内容区排版 ================= */
.science-content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0; 
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

/* ================= 动画与响应式 ================= */
@keyframes drift {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(20px, -20px) scale(1.05); }
}

@media (max-width: 1024px) {
}
@media (max-width: 768px) {
  .science-wrapper {
    --science-sidebar-offset: 0px;
  }

  .layout-container {
    flex-direction: column;
  }

  .science-nav-shell {
    position: static;
    width: 100%;
    height: auto;
  }

  .page-nav-bar {
    width: 100%;
  }

  .sidebar-nav-vertical {
    position: static;
    width: 100%;
    height: auto;
    flex-direction: row;
    justify-content: flex-start;
    gap: 8px;
    padding: 10px 16px;
    background: #E8D8B0;
    border-top: 1px solid #eadbbe;
    border-right: none;
    z-index: 20;
    overflow-x: auto;
    height: auto;
  }

  .sidebar-btn {
    width: auto;
    padding: 8px 12px;
    justify-content: center;
  }

  .main-content-area {
    margin-bottom: 0;
    margin-left: 0;
  }

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

  .science-content {
    padding: 24px 16px;
  }
}

/* 回到顶部按钮的过渡动画也去除了 transform 避免潜在干扰 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>