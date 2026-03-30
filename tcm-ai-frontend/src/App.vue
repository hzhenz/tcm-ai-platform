<template>
  <div class="scroll-wrapper" ref="scrollWrapperRef">
      <div class="scroll-paper"></div>
      <div class="scroll-left"></div>
      <div class="scroll-right"></div>
      <div class="scroll-title">智汇岐黄 数字传承</div>
  </div>

  <div class="page-content" ref="pageContentRef">
      <header class="header">
          <div class="container nav">
              <div class="logo">🌿 智汇岐黄 - AI辅助中医平台</div>
              <div class="nav-menu">
                  <a href="#home">首页</a>
                  <a href="#function">核心功能</a>
                  <a href="#knowledge">中医科普</a>
                  <a href="#local">本地服务</a>
                  <a href="#user">用户中心</a>
              </div>
              <a href="#" class="login-btn">登录 / 注册</a>
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
                  <button class="btn btn-main">AI舌诊分析</button>
                  <button class="btn btn-light">中药智能识别</button>
              </div>
          </div>
      </section>

      <section class="section" id="function">
          <div class="container">
              <h2 class="section-title">AI赋能中医 · 智能健康服务</h2>
              <div class="function-grid">
                  <div class="function-card">
                      <img src="https://pic4.zhimg.com/v2-c6a7748e7ecf846eb4a0582b48912b07_b.jpg" alt="舌诊图标">
                      <h3>AI舌诊分析</h3>
                      <p>智能识别舌象、舌苔、齿痕，判断体质与证型</p>
                      <a href="#" class="card-link">立即舌诊 →</a>
                  </div>
                  
                  <div class="function-card">
                      <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='45' r='30' fill='%23F5DEB3'/%3E%3Cpath d='M35 40 L40 38 L45 40 L50 38 L55 40 L60 38 L65 40' stroke='%238B4513' stroke-width='2' fill='none' /%3E%3Ccircle cx='38' cy='38' r='2.5' fill='%23332' /%3E%3Ccircle cx='62' cy='38' r='2.5' fill='%23332' /%3E%3Cpath d='M45 55 Q50 62 55 55' stroke='%23A0522D' stroke-width='2' fill='none' /%3E%3Crect x='44' y='62' width='12' height='18' fill='%23CD853F' rx='3' /%3E%3Cpath d='M30 68 L25 75 L75 75 L70 68' fill='%23B87333' /%3E%3Ctext x='50' y='95' font-size='8' text-anchor='middle' fill='%238B4513'%3E⚕️%3C/text%3E%3C/svg%3E" alt="老中医智能问诊">
                      <h3>智能问诊 <span class="badge-new">全新升级</span></h3>
                      <p>基于中医辨证模型，模拟资深中医问询，输出个性化调理建议</p>
                      <a href="#" class="card-link ai-consult-btn">开始问诊 →</a>
                  </div>

                  <div class="function-card">
                      <img src="https://ts4.tc.mm.bing.net/th/id/OIP-C.kNPA41B0RQZCdssMZ5qq3wHaE8?rs=1&pid=ImgDetMain&o=7&rm=3" alt="中药材图标">
                      <h3>中药智能识别</h3>
                      <p>拍照识别100+中药材，查看药性与食疗方案</p>
                      <a href="#" class="card-link">拍照识药 →</a>
                  </div>
                  
                  <div class="function-card">
                      <img src="https://preview.qiantucdn.com/freepik/512/2679/2679219.png!w1024_new_small_1" alt="健康报告">
                      <h3>个性化健康报告</h3>
                      <p>生成体质报告、调理方案、护理建议全维度数据</p>
                      <a href="#" class="card-link">查看报告 →</a>
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
                  <button class="btn btn-main" style="margin-top:20px">探索本地资源</button>
              </div>
          </div>
      </section>

      <section class="section" id="user">
          <div class="container">
              <h2 class="section-title">加入中医志愿者计划</h2>
              <div class="user-box">
                  <p>验证舌象/药材数据，获取健康积分，解锁优质科普内容，登上平台排行榜！</p>
                  <button class="btn btn-main" style="margin-top:20px;background:#fff;color:#8B4513; border:1px solid #8B4513;">立即加入 →</button>
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
</template>

<script setup>
import { onMounted, ref } from 'vue'

// 获取 DOM 元素的引用
const scrollWrapperRef = ref(null)
const pageContentRef = ref(null)

// onMounted 钩子：当页面加载完成后执行你的动画逻辑
onMounted(() => {
  const scrollWrapper = scrollWrapperRef.value;
  const pageContent = pageContentRef.value;
  
  if (pageContent) {
      pageContent.classList.remove('show');
  }
  
  setTimeout(() => {
      if (scrollWrapper) {
          scrollWrapper.style.opacity = '0';
          const onTransitionEnd = () => {
              scrollWrapper.style.display = 'none';
              if (pageContent) {
                  pageContent.classList.add('show');
              }
              scrollWrapper.removeEventListener('transitionend', onTransitionEnd);
          };
          scrollWrapper.addEventListener('transitionend', onTransitionEnd);
          
          setTimeout(() => {
              if (scrollWrapper.style.display !== 'none') {
                  scrollWrapper.style.display = 'none';
                  if (pageContent) pageContent.classList.add('show');
              }
          }, 1000);
      } else {
          if (pageContent) pageContent.classList.add('show');
      }
  }, 2500);
  
  // 按钮模拟点击事件
  const allMockBtns = document.querySelectorAll('.card-link, .btn-main, .btn-light, .login-btn, .local-box .btn, .user-box .btn');
  allMockBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
          if(btn.getAttribute('href') === '#' || btn.tagName === 'BUTTON' || btn.classList.contains('card-link')) {
              e.preventDefault();
              const originalText = btn.innerText;
              
              if(btn.classList.contains('ai-consult-btn')){
                  alert('🌿 智能问诊即将开启：请上传舌象或描述症状，AI老中医为您辨证～');
                  return;
              }

              if(btn.classList.contains('card-link')) {
                  btn.innerText = '功能开发中 ⚙️';
                  setTimeout(() => { btn.innerText = originalText; }, 800);
              } else {
                  const tempMsg = document.createElement('div');
                  tempMsg.innerText = '✨ 模拟体验，正式版即将上线 ✨';
                  tempMsg.style.position = 'fixed';
                  tempMsg.style.bottom = '20px';
                  tempMsg.style.left = '50%';
                  tempMsg.style.transform = 'translateX(-50%)';
                  tempMsg.style.backgroundColor = '#8B4513';
                  tempMsg.style.color = '#fff';
                  tempMsg.style.padding = '8px 20px';
                  tempMsg.style.borderRadius = '40px';
                  tempMsg.style.fontSize = '14px';
                  tempMsg.style.zIndex = '10000';
                  tempMsg.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
                  document.body.appendChild(tempMsg);
                  setTimeout(() => tempMsg.remove(), 1500);
              }
          }
      });
  });
})
</script>

<style>
/* 注意：这里我去掉了 scoped，因为 :root 和 body 样式需要全局生效 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Microsoft YaHei", "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, 'Roboto', sans-serif;
}

:root {
  --primary: #8B4513;
  --secondary: #D2B48C;
  --light: #F8F5F0;
  --dark: #3C2A21;
  --white: #ffffff;
  --paper: #F5EFE0;
  --scroll: #A67C52;
  --accent-gold: #C9A87C;
}

body {
  background-color: var(--light);
  color: var(--dark);
  line-height: 1.6;
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
  transition: 0.3s;
}

.nav-menu a:hover {
  color: var(--primary);
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

.user-box {
  background: var(--secondary);
  color: var(--dark);
  padding: 40px;
  border-radius: 15px;
  text-align: center;
}

.footer {
  background: var(--dark);
  color: var(--white);
  padding: 30px 0;
  text-align: center;
}

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

.page-content {
  opacity: 0;
  transition: opacity 1.2s ease-out;
}

.page-content.show {
  opacity: 1;
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
</style>