<template>
  <header class="header" :class="{ 'header-scrolled': isScrolled }">
    <div class="container nav">
      <div class="logo">
        <svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
          <path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="currentColor" stroke-width="2"/>
          <path d="M12 12L15.5 8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <span>AI上中医</span>
      </div>
      <div class="nav-menu">
        <a 
          v-for="item in navItems" 
          :key="item.id"
          href="javascript:void(0)" 
          :class="{ active: activeSection === item.id }" 
          @click="handleNavClick(item)"
        >
          {{ item.label }}
        </a>
      </div>

      <button v-if="!isLoggedIn" class="login-btn" @click="handleLoginClick">登录 / 注册</button>

      <div v-else ref="userMenuRef" class="user-menu-wrap">
        <button class="user-btn" @click="toggleUserMenu">
          <span class="avatar">{{ userInitial }}</span>
          <span class="username">{{ username }}</span>
          <span class="arrow" :class="{ open: userMenuOpen }">▾</span>
        </button>

        <div v-if="userMenuOpen" class="user-dropdown">
          <button class="menu-item" @click="goPersonalCenter">个人中心</button>
          <button class="menu-item danger" @click="logout">退出登录</button>
        </div>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const isScrolled = ref(false)
const activeSection = ref('home')
const isLoggedIn = ref(false)
const username = ref('')
const userMenuOpen = ref(false)
const userMenuRef = ref(null)
const router = useRouter()

const navItems = [
  { id: 'home', label: '首 页' },
  { id: 'function', label: '核心功能' },
  { id: 'local', label: '本地服务' },
  { id: 'user', label: '关于我们' }
]

const emit = defineEmits(['section-change', 'nav-action'])

const userInitial = computed(() => {
  const name = username.value?.trim()
  if (!name) {
    return 'U'
  }
  return name[0].toUpperCase()
})

const syncAuthState = () => {
  const token = localStorage.getItem('tcm_token')
  const userRaw = localStorage.getItem('tcm_user')
  isLoggedIn.value = !!token

  if (!userRaw) {
    username.value = '用户'
    return
  }

  try {
    const user = JSON.parse(userRaw)
    username.value = user?.username || '用户'
  } catch (e) {
    username.value = '用户'
  }
}

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
  updateActiveSection()
}

const updateActiveSection = () => {
  const scrollY = window.scrollY
  const sections = ['home', 'function', 'local', 'user']
  
  // if we are at the very top, always set to home
  if (scrollY < 100) {
    activeSection.value = 'home'
    return
  }

  // Define offset for header height (e.g. 72px + padding)
  const headerOffset = 100

  // Reverse iterate to find the deepest matching section
  for (let i = sections.length - 1; i >= 0; i--) {
    const id = sections[i]
    const el = document.getElementById(id)
    if (el) {
      const rect = el.getBoundingClientRect()
      // If the top of the section is near or above the viewport top (accounting for header)
      if (rect.top <= headerOffset + 50) {
        activeSection.value = id
        break
      }
    }
  }
}

const handleNavClick = (item) => {
  activeSection.value = item.id
  
  if (item.action === 'navigate') {
    emit('nav-action', { type: 'navigate', path: item.path })
  } else {
    emit('section-change', item.id)
  }
}

const handleLoginClick = () => {
  emit('nav-action', { type: 'login' })
}

const toggleUserMenu = () => {
  userMenuOpen.value = !userMenuOpen.value
}

const goPersonalCenter = () => {
  userMenuOpen.value = false
  router.push('/profile')
}

const logout = () => {
  localStorage.removeItem('tcm_token')
  localStorage.removeItem('tcm_user')
  userMenuOpen.value = false
  syncAuthState()
  router.push('/login')
}

const closeUserMenuOnOutsideClick = (event) => {
  if (!userMenuOpen.value || !userMenuRef.value) {
    return
  }

  if (!userMenuRef.value.contains(event.target)) {
    userMenuOpen.value = false
  }
}

onMounted(() => {
  syncAuthState()
  window.addEventListener('scroll', handleScroll)
  window.addEventListener('storage', syncAuthState)
  window.addEventListener('focus', syncAuthState)
  document.addEventListener('click', closeUserMenuOnOutsideClick)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  window.removeEventListener('storage', syncAuthState)
  window.removeEventListener('focus', syncAuthState)
  document.removeEventListener('click', closeUserMenuOnOutsideClick)
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
  border-bottom: 1px solid rgba(0,0,0,0.08);
  box-shadow: 0 4px 20px rgba(0,0,0,0.08);
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
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
}

.logo-icon {
  width: 28px;
  height: 28px;
  color: #C2A878;
}

.nav-menu {
  display: flex;
  gap: 32px;
  align-items: center;
}

.nav-menu a {
  font-size: 16px;
  font-weight: 500;
  color: #555;
  text-decoration: none;
  position: relative;
  padding: 8px 12px;
  transition: all 0.3s ease;
  cursor: pointer;
  border-radius: 8px;
}

.nav-menu a:hover {
  color: #1C2B26;
  background-color: rgba(28, 43, 38, 0.05); /* Slight hover background */
}

.nav-menu a.active {
  color: #fff;
  background-color: #1C2B26; /* Capsule active style */
  font-weight: 600;
}

/* Remove the old underline / bottom border logic completely */
.login-btn {
  padding: 8px 24px;
  border: 1px solid #1C2B26;
  background: transparent;
  color: #1C2B26;
  border-radius: 40px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:hover {
  background: #1C2B26;
  color: #fff;
  box-shadow: 0 4px 15px rgba(28, 43, 38, 0.2);
}

.user-menu-wrap {
  position: relative;
}

.user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 12px 6px 8px;
  border: 1px solid #d8c6aa;
  border-radius: 999px;
  background: #fff;
  cursor: pointer;
  transition: all 0.2s ease;
}

.user-btn:hover {
  border-color: #1C2B26;
}

.avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #1C2B26;
  color: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
}

.username {
  max-width: 90px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  color: #1C2B26;
  font-size: 14px;
  font-weight: 500;
}

.arrow {
  font-size: 12px;
  color: #6a6a6a;
  transition: transform 0.2s ease;
}

.arrow.open {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 140px;
  background: #fff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 10px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  z-index: 10001;
}

.menu-item {
  width: 100%;
  border: none;
  background: transparent;
  text-align: left;
  padding: 10px 12px;
  font-size: 14px;
  color: #2d2d2d;
  cursor: pointer;
}

.menu-item:hover {
  background: #f7f3eb;
}

.menu-item.danger {
  color: #9f2f2f;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .nav-menu, .login-btn {
    display: none;
  }
}
</style>
