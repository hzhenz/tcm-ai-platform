import { createRouter, createWebHistory } from 'vue-router'
// 引入首页组件 (注意核对一下你的实际路径，如果 HomeView 在 apps/home/ 下，请保持你原来的相对路径)
import HomeView from '../views/apps/home/HomeView.vue'

const TOKEN_KEY = 'tcm_token'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    // 👇 下面是我们新增的 4 个业务页面路由
    // 我们使用了“路由懒加载” ( () => import(...) )，这样可以让首页加载更快！
    {
      path: '/tongue',
      name: 'tongue',
      component: () => import('../views/Tongue/TongueView.vue') // 注意这里的路径，请根据你实际建文件的位置调整
    },
    {
      path: '/consultation',
      name: 'consultation',
      component: () => import('../views/Consultation/ConsultationView.vue')
    },
    {
      path: '/herb',
      name: 'herb',
      component: () => import('../views/HerbIdentify/HerbIdentifyView.vue')
    },
    {
      path: '/map',
      name: 'map',
      component: () => import('../views/Map/MapView.vue')
    },
    {
      path: '/science',
      name: 'science',
      component: () => import('../views/Science/ScienceView.vue')
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/apps/LoginView.vue')
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/apps/RegisterView.vue')
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/About/AboutView.vue')
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/apps/PersonalCenterView.vue')
    }
  ]
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem(TOKEN_KEY)
  const publicPaths = ['/', '/login', '/register', '/about']
  const requiresAuth = !publicPaths.includes(to.path)

  if (requiresAuth && !token) {
    next({
      path: '/login',
      query: { redirect: to.fullPath }
    })
    return
  }

  if ((to.path === '/login' || to.path === '/register') && token) {
    const redirectTarget = typeof to.query.redirect === 'string' ? to.query.redirect : ''
    if (redirectTarget && !['/login', '/register'].includes(redirectTarget)) {
      next(redirectTarget)
      return
    }

    // 已登录时再次点“登录/注册”不再跳问诊，保持在当前页面（默认首页）
    if (from && from.path && from.path !== '/login' && from.path !== '/register') {
      next(from.fullPath)
      return
    }
    next('/')
    return
  }

  next()
})

// 增加一个路由跳转后自动回到顶部的细节，体验更好
router.afterEach(() => {
  window.scrollTo(0, 0)
})

export default router