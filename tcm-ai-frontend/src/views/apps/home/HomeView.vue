<template>
  <div class="home-wrapper">
    <!-- 卷轴打开动画 -->
    <ScrollOpeningAnimation @animation-complete="onAnimationComplete" />

    <!-- 主页内容显示 -->
    <div v-show="isPageShow" class="page-content">
      <!-- 导航栏 -->
      <HomeHeader 
        @section-change="scrollToSection"
        @nav-action="handleNavAction"
      />

      <!-- Hero Banner -->
      <div data-aos="fade-up" data-aos-duration="1200" data-aos-delay="200">
        <HeroBanner @navigate="goTo" />
      </div>

      <!-- 功能卡片 -->
      <div id="function" data-aos="fade-up" data-aos-duration="1000">
        <FunctionGrid @navigate="goTo" />
      </div>

      <!-- 本地服务 -->
      <div id="local" data-aos="fade-up" data-aos-duration="1000">
        <LocalService @navigate="goTo" />
      </div>

      <!-- 用户生态 -->
      <div id="user" data-aos="fade-up" data-aos-duration="1000">
        <UserEcosystem @action="handleAction" />
      </div>

      <!-- 页脚 -->
      <div data-aos="fade-in" data-aos-duration="800">
        <HomeFooter />
      </div>
    </div>

    <!-- 回到顶部按钮 -->
    <Transition name="fade">
      <button 
        v-if="showBackToTop" 
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
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

import ScrollOpeningAnimation from '@/components/home/ScrollOpeningAnimation.vue'
import HomeHeader from '@/components/home/HomeHeader.vue'
import HeroBanner from '@/components/home/HeroBanner.vue'
import FunctionGrid from '@/components/home/FunctionGrid.vue'
import LocalService from '@/components/home/LocalService.vue'
import UserEcosystem from '@/components/home/UserEcosystem.vue'
import HomeFooter from '@/components/home/HomeFooter.vue'

const router = useRouter()
const isPageShow = ref(false)
const showBackToTop = ref(false)
let scrollTimeout = null

// ===== 页面初始化 =====
import AOS from 'aos'
import { nextTick } from 'vue'

const onAnimationComplete = () => {
  isPageShow.value = true
  // 由于页面最初是隐藏的，显示后需要刷新 AOS 动画以重新计算各元素位置
  nextTick(() => {
    setTimeout(() => {
      AOS.init({
        duration: 800,
        easing: 'ease-out-cubic',
        once: false, // <-- 改为 false，这样每次上下滑动都会重新触发动画
        offset: 50
      })
      AOS.refresh()
    }, 100)
  })
}

// ===== 导航路由 =====
const goTo = (path) => {
  if (path) router.push(path)
}

const handleNavAction = ({ type, path }) => {
  if (type === 'navigate' && path) {
    goTo(path)
  } else if (type === 'login') {
    router.push('/login')
  } else if (type === 'register') {
    router.push('/register')
  }
}

const handleAction = ({ type }) => {
  if (type === 'login') {
    router.push('/login')
  } else if (type === 'register') {
    router.push('/register')
  }
}

// ===== 页面平滑滚动 =====
const scrollToSection = (sectionId) => {
  const isScrolling = true
  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    // Reset flag
  }, 800)

  const element = document.getElementById(sectionId)
  if (element) {
    const headerOffset = 80
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset

    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

// ===== 回到顶部 =====
const backToTop = () => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
}

// ===== 监听滚动位置，决定是否显示回顶按钮 =====
const handleScroll = () => {
  showBackToTop.value = window.scrollY > 300
}

// ===== 消息显示 =====
const showMessage = (message) => {
  const tempMsg = document.createElement('div')
  tempMsg.innerText = message
  Object.assign(tempMsg.style, {
    position: 'fixed',
    bottom: '40px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#1C2B26',
    color: '#D4AF37',
    padding: '12px 24px',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '500',
    zIndex: '9998',
    boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
    opacity: '0',
    transition: 'opacity 0.3s ease'
  })
  document.body.appendChild(tempMsg)

  requestAnimationFrame(() => tempMsg.style.opacity = '1')

  setTimeout(() => {
    tempMsg.style.opacity = '0'
    setTimeout(() => tempMsg.remove(), 300)
  }, 2000)
}

// ===== 页面挂载和卸载 =====
onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.home-wrapper {
  background-color: #FBFBF9;
  color: #2C2C2C;
  line-height: 1.6;
  font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;
  min-height: 100vh;
  overflow-x: hidden;
  position: relative;
}

.page-content {
  animation: fadeIn 1.2s ease-out;
  padding-top: 72px;
  position: relative;
  z-index: 1;
}

/* ===== 回到顶部按钮 ===== */
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
  color: white;
  transition: color 0.3s ease;
}

.back-to-top:hover .back-to-top-icon {
  color: #1C2B26;
}

/* ===== 动画 ===== */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

/* ===== 响应式 ===== */
@media (max-width: 768px) {
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
</style>
