<template>
  <div class="about-page">
    <!-- 假设 NavBar 组件已经处理好了透明与固钉逻辑 -->
    <NavBar />

    <!-- 顶部 Hero 区域 - 新中式科技感氛围 -->
    <section class="hero-section">
      <div class="glow-orb orb-1"></div>
      <div class="glow-orb orb-2"></div>
      <div class="noise-overlay"></div>
      
      <div class="container hero-content">
        <div class="badge fade-in-up" style="animation-delay: 0.1s;">AI & Traditional Chinese Medicine</div>
        <h1 class="fade-in-up" style="animation-delay: 0.2s;">
          <span class="text-gradient">关于我们</span>
        </h1>
        <p class="fade-in-up subtitle" style="animation-delay: 0.3s;">
          数智驱动 · 精准高效 · 传承中医智慧
        </p >
      </div>
      
      <!-- 底部波浪/弧线过渡 -->
      <div class="hero-divider">
        <svg data-name="Layer 1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C79.44,115.54,159.2,110.4,231.5,92.83Z" class="shape-fill"></path>
        </svg>
      </div>
    </section>

    <!-- 主体内容区 -->
    <main class="main-content container">
      
      <!-- 初衷与愿景 -->
      <section class="intro-section fade-in-up" style="animation-delay: 0.4s;">
        <div class="intro-text-wrapper">
          <h2 class="section-title">初衷与愿景</h2>
          <div class="title-decorator"></div>
          <p class="text">
            欢迎来到 <strong>AI上中医</strong>！我们致力于传承和发扬中医药文化，通过结合现代人工智能与海量经典医案数据，打造数智驱动、精准高效的中医智能诊断与学习平台，赋能现代人的健康生活，让中医智慧焕发新的生命力！
          </p >
          <p class="text">
            让中医文化走进千家万户，用科技助力精准健康管理方向。我们将深奥复杂的中医理论以直观易懂、科学准确的数字化形式呈现，让更多的年轻人和世界各地的人们都能了解、学习并受益于中医。
          </p >
        </div>
      </section>

      <!-- 核心功能网格 (替换Emoji为精致SVG) -->
      <section class="features-section fade-in-up" style="animation-delay: 0.6s;">
        <div class="feature-grid">
          <!-- 卡片 1 -->
          <div class="feature-card">
            <div class="card-glow"></div>
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M2 12c0-4.4 3.6-8 8-8s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8z"/>
                <circle cx="12" cy="12" r="3"/>
                <path d="M18 6l4-4"/>
                <path d="M14 2h8v8"/>
              </svg>
            </div>
            <h3>AI舌诊</h3>
            <p>利用先进图像识别分析体质与健康状态，见微知著。</p >
          </div>

          <!-- 卡片 2 -->
          <div class="feature-card">
            <div class="card-glow"></div>
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M11 20A7 7 0 0 1 4 13c0-3.5 3-7 8-11 5 4 8 7.5 8 11a7 7 0 0 1-7 7Z"/>
                <path d="M12 22v-9"/>
              </svg>
            </div>
            <h3>药材识别</h3>
            <p>拍照秒识获取药性、功效与典籍记载，掌上百草库。</p >
          </div>

          <!-- 卡片 3 -->
          <div class="feature-card">
            <div class="card-glow"></div>
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M8 10h.01"/>
                <path d="M12 10h.01"/>
                <path d="M16 10h.01"/>
                <path d="M12 2v2"/>
              </svg>
            </div>
            <h3>智能问诊</h3>
            <p>24小时互动问答，获取个性化养生建议与健康科普。</p >
          </div>

          <!-- 卡片 4 -->
          <div class="feature-card">
            <div class="card-glow"></div>
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="18" cy="5" r="3"/>
                <circle cx="6" cy="12" r="3"/>
                <circle cx="18" cy="19" r="3"/>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
              </svg>
            </div>
            <h3>经络科普</h3>
            <p>立体交互图谱展示多维度养生知识，探索人体奥秘。</p >
          </div>
        </div>
      </section>

      <!-- 联系我们 & CTA -->
      <section class="contact-section fade-in-up" style="animation-delay: 0.8s;">
        <div class="contact-box">
          <h2 class="section-title">联系我们</h2>
          <div class="title-decorator"></div>
          <p class="text">
            我们非常期待您的宝贵意见与支持！如果您有任何问题、合作意向，或是希望加入到我们的中医数据共建生态中来，请随时与我们联系。
          </p >
          <button @click="$router.push('/')" class="btn-neo">
            返回首页体验
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="btn-icon">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
      </section>

    </main>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import NavBar from '../../components/common/NavBar.vue'

onMounted(() => {
  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  })
})
</script>

<style scoped>
/* ================= 引入全局样式 ================= */
@import '@/styles/home.css';

/* ================= 页面级局部主题变量 (自带优雅降级) ================= */
.about-page {
  --theme-dark: var(--primary, #152c22);
  --theme-main: var(--primary, #1c3b2b);
  --theme-gold: var(--accent-gold, #d4af37);
  --theme-gold-light: rgba(212, 175, 55, 0.2);
  --theme-bg: var(--bg-page, #f8f9fa);
  --theme-text: var(--text-main, #2c3e35);
  --theme-muted: var(--text-muted, #6b7c73);
  
  background-color: var(--theme-bg);
  min-height: 100vh;
  color: var(--theme-text);
  font-family: system-ui, -apple-system, "PingFang SC", "Microsoft YaHei", sans-serif;
  overflow-x: hidden;
}

/* ================= 顶部 Hero 区域 ================= */
.hero-section {
  position: relative;
  height: 55vh;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  background: linear-gradient(135deg, var(--theme-dark) 0%, var(--theme-main) 100%);
  color: #fff;
  overflow: hidden;
  margin-top: 60px; /* 根据NavBar高度调整 */
}

/* 光晕效果 */
.glow-orb {
  position: absolute;
  border-radius: 50%;
  filter: blur(80px);
  z-index: 0;
  opacity: 0.5;
}
.orb-1 {
  width: 400px;
  height: 400px;
  background: var(--theme-gold);
  top: -100px;
  right: -100px;
  opacity: 0.25;
}
.orb-2 {
  width: 300px;
  height: 300px;
  background: #3a7a5a;
  bottom: -50px;
  left: -50px;
  opacity: 0.3;
}

/* 噪点纹理增加质感 */
.noise-overlay {
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
  opacity: 0.04;
  z-index: 1;
}

.hero-content {
  position: relative;
  z-index: 2;
  padding: 0 20px;
}

.badge {
  display: inline-block;
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 30px;
  font-size: 0.85rem;
  letter-spacing: 1px;
  margin-bottom: 24px;
  backdrop-filter: blur(10px);
  color: var(--theme-gold);
}

.hero-content h1 {
  font-family: var(--font-serif, "Noto Serif SC", serif);
  font-size: 4rem;
  letter-spacing: 6px;
  margin-bottom: 20px;
  font-weight: 700;
}

.text-gradient {
  background: linear-gradient(to right, #fff, var(--theme-gold));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.subtitle {
  font-size: 1.25rem;
  letter-spacing: 4px;
  opacity: 0.9;
  font-weight: 300;
}

/* 底部过渡形状 */
.hero-divider {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  overflow: hidden;
  line-height: 0;
  transform: rotate(180deg);
  z-index: 2;
}
.hero-divider svg {
  position: relative;
  display: block;
  width: calc(100% + 1.3px);
  height: 60px;
}
.hero-divider .shape-fill {
  fill: var(--theme-bg);
}

/* ================= 主体内容区 ================= */
.main-content {
  padding: 80px 20px;
  position: relative;
  z-index: 10;
}

.section-title {
  font-family: var(--font-serif, "Noto Serif SC", serif);
  font-size: 2.2rem;
  color: var(--theme-main);
  text-align: center;
  margin-bottom: 16px;
  font-weight: 600;
}

.title-decorator {
  width: 40px;
  height: 3px;
  background: var(--theme-gold);
  margin: 0 auto 40px;
  border-radius: 2px;
  position: relative;
}
.title-decorator::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80px;
  height: 1px;
  background: rgba(212, 175, 55, 0.3);
}

/* 初衷段落 */
.intro-section {
  max-width: 800px;
  margin: 0 auto 80px;
}

.intro-text-wrapper {
  background: #fff;
  padding: 50px 60px;
  border-radius: 24px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.03);
  border: 1px solid rgba(28, 59, 43, 0.05);
}

.text {
  font-size: 1.15rem;
  line-height: 2;
  color: var(--theme-muted);
  margin-bottom: 20px;
  text-align: justify;
}
.text strong {
  color: var(--theme-main);
  font-weight: 600;
}

/* ================= 功能网格 ================= */
.features-section {
  margin-bottom: 100px;
}

.feature-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.feature-card {
  position: relative;
  background: #fff;
  padding: 40px 30px;
  border-radius: 20px;
  text-align: center;
  border: 1px solid rgba(28, 59, 43, 0.08);
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  overflow: hidden;
  z-index: 1;
}

.card-glow {
  position: absolute;
  top: 0; left: 0; width: 100%; height: 100%;
  background: radial-gradient(circle at 50% 0%, var(--theme-gold-light), transparent 60%);
  opacity: 0;
  transition: opacity 0.4s ease;
  z-index: -1;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(28, 59, 43, 0.08);
  border-color: rgba(212, 175, 55, 0.4);
}
.feature-card:hover .card-glow {
  opacity: 1;
}

.feature-icon-wrapper {
  width: 70px;
  height: 70px;
  margin: 0 auto 24px;
  background: rgba(28, 59, 43, 0.03);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--theme-main);
  transition: all 0.4s ease;
}

.feature-card:hover .feature-icon-wrapper {
  background: var(--theme-main);
  color: #fff;
  transform: scale(1.05) rotate(-5deg);
}

.feature-icon {
  width: 32px;
  height: 32px;
}

.feature-card h3 {
  font-family: var(--font-serif, "Noto Serif SC", serif);
  color: var(--theme-main);
  font-size: 1.4rem;
  margin-bottom: 12px;
  font-weight: 600;
}

.feature-card p {
  font-size: 0.95rem;
  color: var(--theme-muted);
  line-height: 1.6;
}

/* ================= 联系我们 ================= */
.contact-section {
  text-align: center;
  padding-bottom: 40px;
}

.contact-box {
  max-width: 700px;
  margin: 0 auto;
  background: linear-gradient(180deg, #fff 0%, rgba(255,255,255,0.5) 100%);
  padding: 50px;
  border-radius: 24px;
  border: 1px solid rgba(212, 175, 55, 0.15);
}

/* 现代感按钮 */
.btn-neo {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: var(--theme-main);
  color: #fff;
  padding: 14px 32px;
  font-size: 1.1rem;
  border: none;
  border-radius: 50px;
  cursor: pointer;
  margin-top: 30px;
  transition: all 0.3s ease;
  box-shadow: 0 8px 20px rgba(28, 59, 43, 0.2);
}

.btn-neo:hover {
  background: var(--theme-dark);
  transform: translateY(-2px);
  box-shadow: 0 12px 25px rgba(28, 59, 43, 0.3);
}

.btn-icon {
  width: 20px;
  height: 20px;
  transition: transform 0.3s ease;
}

.btn-neo:hover .btn-icon {
  transform: translateX(4px);
}

/* ================= 简单动画 ================= */
@keyframes fadeInUp {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.fade-in-up {
  opacity: 0;
  animation: fadeInUp 0.8s cubic-bezier(0.165, 0.84, 0.44, 1) forwards;
}

/* ================= 响应式 ================= */
@media (max-width: 768px) {
  .hero-section {
    height: 45vh;
  }
  .hero-content h1 { font-size: 2.8rem; letter-spacing: 4px; }
  .subtitle { font-size: 1.1rem; }
  
  .intro-text-wrapper { padding: 40px 25px; }
  .contact-box { padding: 40px 20px; }
  
  .feature-grid { grid-template-columns: 1fr; }
}
</style>