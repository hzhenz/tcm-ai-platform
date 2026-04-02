import { createRouter, createWebHistory } from 'vue-router'
// 引入首页组件 (注意核对一下你的实际路径，如果 HomeView 在 apps/home/ 下，请保持你原来的相对路径)
import HomeView from '../views/apps/home/HomeView.vue'

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
  ]
})

// 增加一个路由跳转后自动回到顶部的细节，体验更好
router.afterEach(() => {
  window.scrollTo(0, 0)
})

export default router