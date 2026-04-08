<template>
  <header class="header" :class="{ 'header-scrolled': isScrolled }">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 nav-container">
      <div class="logo" @click="$router.push('/')">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
          <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="currentColor" stroke-width="2"/>
          <path d="M12 12L15.5 8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>AI上中医</span>
      </div>
      <div class="nav-menu">
        <button @click="$router.push('/')" class="btn-nav">返回首页</button>
      </div>
    </div>
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isScrolled = ref(false)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 20
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<style scoped>
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 9999;
  background: transparent;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-bottom: 1px solid transparent;
}

.header-scrolled {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);
}

.nav-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 72px;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: "Noto Serif SC", "Songti SC", "STSong", "Microsoft YaHei", serif;
  font-size: 22px;
  font-weight: 700;
  color: #1C2B26;
  letter-spacing: 1px;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.logo:hover {
  transform: translateY(-2px);
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: #C2A878;
}

.nav-menu {
  display: flex;
  align-items: center;
}

.btn-nav {
  background: rgba(28, 43, 38, 0.05);
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 8px 20px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 500;
  color: #1C2B26;
  cursor: pointer;
  transition: all 0.3s ease;
}

.header-scrolled .logo,
.header-scrolled .btn-nav {
  color: #1C2B26;
}

.btn-nav:hover {
  background: #1C2B26;
  color: #fff;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(28, 43, 38, 0.15);
}
</style>
