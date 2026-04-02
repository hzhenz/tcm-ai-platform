<template>
  <div class="home-wrapper">
    <div 
      v-if="isScrollVisible" 
      class="scroll-wrapper" 
      :style="{ opacity: scrollOpacity }"
    >
      <div class="scroll-paper"></div>
      <div class="scroll-left"></div>
      <div class="scroll-right"></div>
      <div class="scroll-title">智汇岐黄 数字传承</div>
    </div>

    <div class="page-content" :class="{ show: isPageShow }">
      <header class="header">
        <div class="container nav">
          <div class="logo">🌿 智汇岐黄 - AI辅助中医平台</div>
          <div class="nav-menu">
            <a href="javascript:void(0)" :class="{ active: activeSection === 'home' }" @click="scrollToSection('home')">首页</a>
            <a href="javascript:void(0)" :class="{ active: activeSection === 'function' }" @click="scrollToSection('function')">核心功能</a>
            <a href="javascript:void(0)" :class="{ active: activeSection === 'knowledge' }" @click="scrollToSection('knowledge')">中医科普</a>
            <a href="javascript:void(0)" :class="{ active: activeSection === 'local' }" @click="scrollToSection('local')">本地服务</a>
            <a href="javascript:void(0)" :class="{ active: activeSection === 'user' }" @click="scrollToSection('user')">用户中心</a>
          </div>
          <a href="javascript:void(0)" class="login-btn" @click="mockBtnClick($event)">登录 / 注册</a>
        </div>
      </header>
      
      <div class="info-bar">
        <span>🌿 长沙今日甘草价32元/公斤 ↓2%</span>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span>🏥 岳麓区中医馆新馆开业 免3天诊费 →</span>
        &nbsp;&nbsp;|&nbsp;&nbsp;
        <span>🍵 今日节气养生：宜健脾祛湿</span>
      </div>

      <section class="banner" id="home">
        <div class="banner-content">
          <h1>中医四诊 · 辨证调理</h1>
          <p>望闻问切，四诊合参，由表及里，察知全身气血阴阳变化，为体质偏颇提供精准中医调理思路。</p>
          <div class="btn-group">
            <button class="btn btn-main" @click="goTo('/tongue')">AI舌诊分析</button>
            <button class="btn btn-light" @click="goTo('/herb')">中药智能识别</button>
          </div>
        </div>
      </section>

      <section class="section" id="function">
        <div class="container">
          <h2 class="section-title">AI赋能中医 · 智能健康服务</h2>
          <div class="function-grid">
            <div class="function-card" @click="goTo('/tongue')">
              <img src="https://pic4.zhimg.com/v2-c6a7748e7ecf846eb4a0582b48912b07_b.jpg" alt="舌诊图标">
              <h3>AI舌诊分析</h3>
              <p>智能识别舌象、舌苔、齿痕，判断体质与证型</p>
              <a href="javascript:void(0)" class="card-link" @click.stop="goTo('/tongue')">立即舌诊 →</a>
            </div>
            
            <div class="function-card" @click="goTo('/consultation')">
              <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='45' r='30' fill='%23F5DEB3'/%3E%3Cpath d='M35 40 L40 38 L45 40 L50 38 L55 40 L60 38 L65 40' stroke='%238B4513' stroke-width='2' fill='none' /%3E%3Ccircle cx='38' cy='38' r='2.5' fill='%23332' /%3E%3Ccircle cx='62' cy='38' r='2.5' fill='%23332' /%3E%3Cpath d='M45 55 Q50 62 55 55' stroke='%23A0522D' stroke-width='2' fill='none' /%3E%3Crect x='44' y='62' width='12' height='18' fill='%23CD853F' rx='3' /%3E%3Cpath d='M30 68 L25 75 L75 75 L70 68' fill='%23B87333' /%3E%3Ctext x='50' y='95' font-size='8' text-anchor='middle' fill='%238B4513'%3E⚕️%3C/text%3E%3C/svg%3E"
                   alt="老中医智能问诊">
              <h3>智能问诊 <span class="badge-new">全新升级</span></h3>
              <p>基于中医辨证模型，模拟资深中医问询，输出个性化调理建议</p>
              <a href="javascript:void(0)" class="card-link" @click.stop="goTo('/consultation')">开始问诊 →</a>
            </div>

            <div class="function-card" @click="goTo('/herb')">
              <img src="https://ts4.tc.mm.bing.net/th/id/OIP-C.kNPA41B0RQZCdssMZ5qq3wHaE8?rs=1&pid=ImgDetMain&o=7&rm=3" alt="中药材图标">
              <h3>中药智能识别</h3>
              <p>拍照识别100+中药材，查看药性与食疗方案</p>
              <a href="javascript:void(0)" class="card-link" @click.stop="goTo('/herb')">拍照识药 →</a>
            </div>
            
            <div class="function-card" @click="goTo('/science')">
              <img src="https://p0.ssl.qhimgs1.com/sdr/400__/t0434ff7e75be13ec6a.png" alt="报告">
              <h3>中医文化科普</h3>
              <p>节气养生、穴位按摩、食疗方等优质科普内容</p >
              <a href="javascript:void(0)" class="card-link" @click.stop="goTo('/science')">科普知识 →</a >
            </div>
          </div>
        </div>
      </section>

      <section class="section" id="knowledge">
        <div class="container">
          <h2 class="section-title">中医四诊概要</h2>
          <div class="four-box">
            <div class="four-grid">
              <div class="four-item">
                <h3>望诊</h3>
                <p>观神、色、形、态，重点观察面色、舌象、神态，判断脏腑盛衰与气血情况。</p>
              </div>
              <div class="four-item">
                <h3>闻诊</h3>
                <p>听声音、嗅气味，从语音、呼吸、咳嗽、体味等判断寒热虚实。</p>
              </div>
              <div class="four-item">
                <h3>问诊</h3>
                <p>问寒热、汗、头身、二便、饮食、睡眠、既往史，全面了解病情。</p>
              </div>
              <div class="four-item">
                <h3>切诊</h3>
                <p>以脉诊为主，按诊为辅，体察脉象变化，判断脏腑气血状态。</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section" id="local">
        <div class="container">
          <h2 class="section-title">长沙本地中医资源</h2>
          <div class="local-box">
            <img src="https://ts1.tc.mm.bing.net/th/id/R-C.d8fde5f092326b66b80f86975dbfe427?rik=HkqCFjR1TsuGQg&riu=http%3a%2f%2fd.51240.com%2fmap%2fditu%2f8%2fca%2fchangsha.jpg&ehk=BnQGj%2bV3o4jCbpsS7G%2bu2godkApz99kXn%2bPvZUuBI6o%3d&risl=&pid=ImgRaw&r=0" alt="长沙中医地图">
            <p>一键查看附近中医医院、医师排班、中药购买点与线下理疗馆</p>
            <button class="btn btn-main" style="margin-top:20px" @click="goTo('/map')">探索本地资源</button>
          </div>
        </div>
      </section>

      <section class="section" id="user">
        <div class="container">
          <h2 class="section-title">加入中医志愿者计划</h2>
          <div class="user-box">
            <p>验证舌象/药材数据，获取健康积分，解锁优质科普内容，登上平台排行榜！</p>
            <button class="btn btn-main" style="margin-top:20px;background:#fff;color:#8B4513; border:1px solid #8B4513;" @click="mockBtnClick($event)">立即加入 →</button>
          </div>
        </div>
      </section>

      <footer class="footer">
        <div class="container">
          <p>© 2026 智汇岐黄-AI辅助中医平台 版权所有</p>
          <p>数据来源：中药天地网 | 本地医疗资源对接：长沙中医协会</p>
          <p>隐私政策 | 服务条款 | 联系我们：zhihuiqihuang@163.com</p>
        </div>
      </footer>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// ===== 导航高亮状态控制 =====
const activeSection = ref('home') 

// ===== 新增：滚动防抖锁变量 =====
const isClickScrolling = ref(false)
let scrollTimeout = null

// 卷轴动画状态控制
const isScrollVisible = ref(true)
const scrollOpacity = ref(1)
const isPageShow = ref(false)

// ===== 修改：页面滚动时自动计算当前高亮的菜单 =====
const handleScroll = () => {
  // 【核心机制】：如果是用户点击导航条触发的平滑滚动，直接跳过检测，防止横线乱跳！
  if (isClickScrolling.value) return 

  const sections = ['home', 'function', 'knowledge', 'local', 'user']
  const scrollY = window.scrollY
  
  for (const id of sections) {
    const el = document.getElementById(id)
    if (el) {
      if (scrollY >= el.offsetTop - 80) {
        activeSection.value = id
      }
    }
  }
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)

  setTimeout(() => {
    scrollOpacity.value = 0 
    setTimeout(() => {
      isScrollVisible.value = false 
      isPageShow.value = true       
    }, 800)
  }, 2500)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})

const goTo = (path) => {
  if (path) {
    router.push(path)
  }
}

// ===== 修改：页面内平滑滚动导航功能 =====
const scrollToSection = (sectionId) => {
  activeSection.value = sectionId // 点击时立刻将目标设为高亮
  
  // 【开启防抖锁】：告诉页面我现在是强行滚动，800毫秒内别乱改我的高亮
  isClickScrolling.value = true
  clearTimeout(scrollTimeout)
  scrollTimeout = setTimeout(() => {
    isClickScrolling.value = false
  }, 800)

  const element = document.getElementById(sectionId)
  if (element) {
    const headerOffset = 70 
    const elementPosition = element.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset
    
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth' 
    })
  }
}

const mockLinkClick = (e) => {
  e.preventDefault()
  const btn = e.target
  const originalText = btn.innerText
  btn.innerText = '功能开发中 ⚙️'
  setTimeout(() => { 
    btn.innerText = originalText 
  }, 800)
}

const mockBtnClick = (e) => {
  e.preventDefault()
  const btn = e.target
  const originalText = btn.innerText
  console.log(`【智汇岐黄】用户点击: ${originalText || '按钮'} – 演示模式`)
  
  const tempMsg = document.createElement('div')
  tempMsg.innerText = '✨ 模拟体验，正式版即将上线 ✨'
  tempMsg.style.position = 'fixed'
  tempMsg.style.bottom = '20px'
  tempMsg.style.left = '50%'
  tempMsg.style.transform = 'translateX(-50%)'
  tempMsg.style.backgroundColor = '#8B4513'
  tempMsg.style.color = '#fff'
  tempMsg.style.padding = '8px 20px'
  tempMsg.style.borderRadius = '40px'
  tempMsg.style.fontSize = '14px'
  tempMsg.style.zIndex = '10000'
  tempMsg.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)'
  document.body.appendChild(tempMsg)
  
  setTimeout(() => tempMsg.remove(), 1500)
}

const consultClick = (e) => {
  e.preventDefault()
  alert('🌿 智能问诊即将开启：请上传舌象或描述症状，AI老中医为您辨证～')
  goTo('/consultation')
}
</script>

<style scoped>
/* ================= 全局配色与重置 ================= */
.home-wrapper {
  /* 全局配色 - 中医暖色调 */
  --primary: #8B4513;
  --secondary: #D2B48C;
  --light: #F8F5F0;
  --dark: #3C2A21;
  --white: #ffffff;
  --paper: #F5EFE0;
  --scroll: #A67C52;
  --accent-gold: #C9A87C;

  background-color: var(--light);
  color: var(--dark);
  line-height: 1.6;
  font-family: "Microsoft YaHei", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
  min-height: 100vh;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

a {
  text-decoration: none;
  color: inherit;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

/* ================= 顶部导航 ================= */
.header {
  background: var(--white);
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
  position: sticky;
  top: 0;
  z-index: 999;
}

.nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  flex-wrap: wrap;
}

.logo {
  font-size: 24px;
  font-weight: bold;
  color: var(--primary);
}

.nav-menu {
  display: flex;
  gap: 30px;
}

.nav-menu a {
  font-weight: 500;
  transition: all 0.3s ease;
  padding-bottom: 4px; /* 为底部高亮横线留出空间 */
  position: relative;
}

.nav-menu a:hover {
  color: var(--primary);
}

/* ===== 核心修改：基础横线设置 ===== */
.nav-menu a::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 50%; /* 起点在中间 */
  transform: translateX(-50%);
  width: 0; /* 默认宽度为0，看不见 */
  height: 2px;
  background-color: var(--primary);
  border-radius: 2px;
  transition: width 0.3s ease; /* 增加宽度变化的过渡动画 */
}

/* 高亮文字变粗 */
.nav-menu a.active {
  color: var(--primary);
  font-weight: bold;
}

/* ===== 核心修改：高亮状态或鼠标悬浮时，横线展开到100% ===== */
.nav-menu a.active::after,
.nav-menu a:hover::after {
  width: 100%;
}

.login-btn {
  padding: 8px 20px;
  border: 1px solid var(--primary);
  color: var(--primary);
  border-radius: 30px;
  transition: 0.3s;
}

.login-btn:hover {
  background: var(--primary);
  color: var(--white);
}

/* ================= 实时中医信息栏 ================= */
.info-bar {
  background: var(--secondary);
  color: var(--dark);
  padding: 12px 0;
  text-align: center;
  font-size: 17px;
  letter-spacing: 1px;
  border-top: 1px solid var(--primary);
  border-bottom: 1px solid var(--primary);
  white-space: nowrap;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* ================= Banner 首屏 ================= */
.banner {
  height: 550px;
  background: linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url('https://d.ifengimg.com/q100/img1.ugc.ifeng.com/newugc/20210130/17/wemedia/e1566de808d30b8d526cd1ddc217cee713723842_size391_w554_h362.png') center/cover no-repeat;
  display: flex;
  align-items: center;
  color: var(--white);
  text-align: center;
}

.banner-content {
  max-width: 700px;
  margin: 0 auto;
  padding: 20px;
}

.banner h1 {
  font-size: 42px;
  margin-bottom: 20px;
}

.banner p {
  font-size: 18px;
  margin-bottom: 30px;
}

.btn-group {
  display: flex;
  gap: 20px;
  justify-content: center;
  flex-wrap: wrap;
}

.btn {
  padding: 12px 30px;
  border-radius: 50px;
  font-weight: bold;
  transition: 0.3s;
  cursor: pointer;
  border: none;
  font-size: 16px;
  display: inline-block;
}

.btn-main {
  background: var(--primary);
  color: var(--white);
}

.btn-main:hover {
  background: #6d360f;
}

.btn-light {
  background: var(--white);
  color: var(--primary);
}

/* ================= 核心功能区 ================= */
.section {
  padding: 60px 0;
}

.section-title {
  text-align: center;
  font-size: 30px;
  color: var(--primary);
  margin-bottom: 40px;
  position: relative;
}

.section-title:after {
  content: '';
  display: block;
  width: 60px;
  height: 3px;
  background: var(--secondary);
  margin: 12px auto 0;
  border-radius: 2px;
}

.function-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 30px;
}

.function-card {
  background: var(--white);
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  box-shadow: 0 3px 15px rgba(0,0,0,0.05);
  transition: 0.3s;
  cursor: pointer;
}

.function-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(139,69,19,0.12);
}

.function-card img {
  width: 60px;
  height: 60px;
  object-fit: contain;
  margin-bottom: 20px;
}

.function-card h3 {
  font-size: 20px;
  margin-bottom: 10px;
  color: var(--dark);
}

.function-card p {
  color: #666;
  margin-bottom: 15px;
  font-size: 14px;
}

.card-link {
  color: var(--primary);
  font-weight: bold;
}

.badge-new {
  background: #E67E22;
  color: white;
  font-size: 10px;
  border-radius: 20px;
  padding: 2px 8px;
  display: inline-block;
  margin-left: 8px;
  vertical-align: middle;
}

/* ================= 中医四诊 ================= */
.four-box {
  background: var(--white);
  padding: 40px;
  border-radius: 15px;
}

.four-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.four-item {
  padding: 20px;
  border-left: 4px solid var(--secondary);
  background: #f9f5f0;
}

.four-item h3 {
  color: var(--primary);
  margin-bottom: 8px;
}

/* ================= 本地服务 ================= */
.local-box {
  background: var(--white);
  padding: 40px;
  border-radius: 15px;
  text-align: center;
}

.local-box img {
  max-width: 100%;
  border-radius: 10px;
  margin: 20px 0;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}

/* ================= 用户生态 ================= */
.user-box {
  background: var(--secondary);
  color: var(--dark);
  padding: 40px;
  border-radius: 15px;
  text-align: center;
}

/* ================= 页脚 ================= */
.footer {
  background: var(--dark);
  color: var(--white);
  padding: 30px 0;
  text-align: center;
}

/* ================= 移动端适配 ================= */
@media (max-width: 768px) {
  .nav-menu {
    display: none;
  }
  .banner h1 {
    font-size: 28px;
  }
  .four-grid {
    grid-template-columns: 1fr;
  }
  .section {
    padding: 40px 0;
  }
  .four-box, .local-box, .user-box {
    padding: 24px;
  }
}

/* ================= 核心：立体卷轴展开动画 ================= */
.scroll-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100vh;
  background: var(--light);
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: opacity 0.8s ease-out;
}

.scroll-paper {
  position: absolute;
  width: 100%;
  height: 100%;
  background: url('#') center/cover no-repeat;
  background-color: var(--paper);
  background-blend-mode: soft-light;
  z-index: 1;
  opacity: 0;
  animation: paperFadeIn 1s ease-out 1.8s forwards;
}

.scroll-left {
  position: absolute;
  top: 0;
  left: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(90deg, var(--scroll) 0%, #B88A62 50%, transparent 100%);
  border-right: 3px solid var(--primary);
  z-index: 2;
  animation: scrollLeftOpen 2s ease-in-out forwards;
}

.scroll-right {
  position: absolute;
  top: 0;
  right: 0;
  width: 50%;
  height: 100%;
  background: linear-gradient(270deg, var(--scroll) 0%, #B88A62 50%, transparent 100%);
  border-left: 3px solid var(--primary);
  z-index: 2;
  animation: scrollRightOpen 2s ease-in-out forwards;
}

.scroll-title {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 52px;
  color: var(--primary);
  font-weight: bold;
  font-family: "汉仪尚巍手书简", "字魂御风行楷", "华文行书", serif;
  letter-spacing: 8px;
  z-index: 3;
  opacity: 0;
  animation: titleFadeIn 1.2s ease-out 1.2s forwards;
  text-shadow: 2px 2px 4px rgba(128, 66, 29, 0.3);
  white-space: nowrap;
}

@keyframes scrollLeftOpen {
  0% { transform: translateX(0); width: 50%; }
  100% { transform: translateX(-100%); width: 30%; }
}

@keyframes scrollRightOpen {
  0% { transform: translateX(0); width: 50%; }
  100% { transform: translateX(100%); width: 30%; }
}

@keyframes paperFadeIn {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

@keyframes titleFadeIn {
  0% { opacity: 0; transform: translate(-50%, -55%); }
  100% { opacity: 1; transform: translate(-50%, -50%); }
}

/* 页面内容容器 - 动画结束后显示 */
.page-content {
  opacity: 0;
  transition: opacity 1.2s ease-out;
}

.page-content.show {
  opacity: 1;
}
</style>