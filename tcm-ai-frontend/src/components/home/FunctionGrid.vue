<template>
  <section class="section bg-light" id="function">
    <div class="container">
      <div class="section-header" data-aos="fade-up">
        <h2 class="section-title">智能健康服务</h2>
        <p class="section-desc">打破常规的 AI 医疗体验，由内而外为您提供深度健康管理方案</p>
      </div>
      
      <!-- Bento Grid (便当盒流式布局) -->
      <div class="bento-grid">
        
        <!-- 核心功能1: AI舌诊分析 (宽屏卡片) -->
        <div 
          class="bento-card bento-tongue" 
          data-aos="fade-right" data-aos-duration="1000"
          @click="emit('navigate', '/tongue')"
        >
          <div class="content-area">
            <div class="card-icon-wrap">
              <div class="card-icon bg-green">
                <img src="/sz.png" alt="舌诊图标" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover;">
              </div>
              <span class="badge-core">核心引擎</span>
            </div>
            <h3>AI舌诊与体质分析</h3>
            <p>基于千万级中医大模型的视觉影像分析技术。精准捕捉舌象、舌苔、齿痕微小特征，一秒钟判断当前体质与证型，洞见身体内在节律。</p>
            <div class="card-action">立即开启舌象扫描 <span>→</span></div>
          </div>
          <!-- 抽象装饰 -->
          
        </div>

        <!-- 核心功能2: 智能辨证问诊 (高屏卡片) -->
        <div 
          class="bento-card bento-consult" 
          data-aos="fade-left" data-aos-duration="1200"
          @click="emit('navigate', '/consultation')"
        >
          <div class="content-area">
            <div class="card-icon-wrap">
              <img src="/wz.png" alt="问诊图标" style="width: 68px; height: 68px; border-radius: 50%; object-fit: cover;">
              <span class="badge-pro">Pro</span>
            </div>
            <h3>AI 辨证问诊</h3>
            <p>复刻资深老中医交互问询逻辑，通过多轮智能对话，深度剖析病因并输出定制化调理方案。</p>
            <div class="card-action">进入专属诊疗室 <span>→</span></div>
          </div>
          <!-- 对话气泡特效 -->
          <div class="deco-chat">
            <div class="chat-bubble left">最近常感失眠、易醒...</div>
            <div class="chat-bubble right">伴有口苦或心烦吗？</div>
            <div class="chat-bubble left">是的，略感烦躁</div>
          </div>
        </div>

        <!-- 次核心: 中药智能识别 -->
        <div 
          class="bento-card bento-herb" 
          data-aos="fade-up" data-aos-duration="1000" data-aos-delay="100"
          @click="emit('navigate', '/herb')"
        >
          <div class="card-icon-wrap">
            <img src="/sb.png" alt="识别图标" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover;">
          </div>
          <h3>中药影像识别</h3>
          <p>手机随手拍，极速识别数百种常见中草药，查阅药典权威解读与日常食疗配伍。</p>
          <div class="card-action">拍照识药 <span>→</span></div>
          <div class="deco-bg-icon">☘️</div>
        </div>

        <!-- 次核心: 中医文化科普 -->
        <div 
          class="bento-card bento-science" 
          data-aos="fade-up" data-aos-duration="1000" data-aos-delay="200"
          @click="emit('navigate', '/science')"
        >
           <div class="card-icon-wrap">
            <img src="/kp.png" alt="科普图标" style="width: 56px; height: 56px; border-radius: 50%; object-fit: cover;">
          </div>
          <h3>节气与针砭科普</h3>
          <p>顺应四时变化，收录海量节气养生指南、经络穴位详解及古籍方剂，传承千年智慧。</p>
          <div class="card-action">探索典籍 <span>→</span></div>
          <div class="deco-bg-icon">☯️</div>
        </div>

      </div>
    </div>
  </section>
</template>

<script setup>
const emit = defineEmits(['navigate'])
</script>

<style scoped>
.section {
  padding: 100px 0;
  position: relative;
}

.bg-light {
  background-color: #ffffff;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

.section-header {
  text-align: center;
  margin-bottom: 60px;
}

.section-title {
  font-family: "Noto Serif SC", "Songti SC", "STSong", "Microsoft YaHei", serif;
  font-size: 36px;
  color: #1C2B26;
  margin-bottom: 16px;
  position: relative;
  display: inline-block;
}

.section-title::after {
  content: '';
  position: absolute;
  bottom: -10px;
  left: 50%;
  transform: translateX(-50%);
  width: 40px;
  height: 3px;
  background-color: #C2A878;
  border-radius: 2px;
}

.section-desc {
  font-size: 16px;
  color: #666666;
}

.bento-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  grid-auto-rows: minmax(180px, auto);
  gap: 24px;
}

.bento-card {
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.8);
  border-radius: 28px;
  padding: 40px;
  box-shadow: 0 10px 40px rgba(28, 43, 38, 0.04);
  transition: all 0.4s cubic-bezier(0.2, 0.8, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.bento-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 50px rgba(28, 43, 38, 0.08); /* 悬浮加深阴影 */
  border-color: #e5ded2; /* 轻微提亮边框 */
}

/* 分布占位：经典Bento（舌诊宽、问诊高、药材方、科普方） */
.bento-tongue {
  grid-column: span 8; /* 2/3 宽度 */
  grid-row: span 1;
  background: linear-gradient(135deg, #f2f9f6 0%, #ffffff 100%);
}
.bento-consult {
  grid-column: span 4;
  grid-row: span 2;  /* 占两行高度 */
  background: linear-gradient(135deg, #fffcf3 0%, #ffffff 100%);
}
.bento-herb {
  grid-column: span 4;
  grid-row: span 1;
}
.bento-science {
  grid-column: span 4;
  grid-row: span 1;
}

@media (max-width: 992px) {
  .bento-tongue, .bento-consult, .bento-herb, .bento-science {
    grid-column: span 12;
    grid-row: span 1;
  }
}

.card-icon-wrap {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
  z-index: 2;
}

.card-icon {
  width: 56px;
  height: 56px;
  background: rgba(194, 168, 120, 0.1);
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  box-shadow: inset 0 2px 4px rgba(255,255,255,0.5);
}

.bg-green {
  background: rgba(46, 139, 87, 0.1);
}

.bg-gold {
  background: rgba(212, 175, 55, 0.15);
}

.badge-core {
  background: linear-gradient(135deg, #1C2B26, #2a4039);
  color: white;
  font-size: 13px;
  font-weight: 500;
  padding: 6px 14px;
  border-radius: 20px;
  box-shadow: 0 4px 10px rgba(28, 43, 38, 0.2);
}

.badge-pro {
  background: linear-gradient(135deg, #C2A878, #A68D5D);
  color: white;
  font-size: 13px;
  font-weight: bold;
  padding: 6px 14px;
  border-radius: 20px;
}

.content-area {
  position: relative;
  z-index: 2;
  flex: 1;
  display: flex;
  flex-direction: column;
}

.bento-card h3 {
  font-size: 22px;
  font-weight: 600;
  color: #1C2B26;
  margin-bottom: 12px;
  z-index: 2;
  position: relative;
}

.bento-card p {
  color: #555555;
  font-size: 14.5px;
  line-height: 1.7;
  margin-bottom: 20px;
  position: relative;
  z-index: 2;
}

.card-action {
  font-weight: 600;
  color: #C2A878;
  font-size: 15px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  position: relative;
  z-index: 2;
  transition: gap 0.3s ease;
  margin-top: auto; /* 推到底部 */
}

.bento-card:hover .card-action {
  gap: 12px;
}

/* === 舌诊卡片：抽象图形装饰 === */
.bento-tongue .content-area {
  max-width: 65%;
}
.deco-circles {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
}
.circle-1 {
  position: absolute;
  width: 300px;
  height: 300px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(194, 168, 120, 0.1) 0%, transparent 70%);
  right: -50px;
  bottom: -80px;
}
.circle-2 {
  position: absolute;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  border: 1px solid rgba(46, 139, 87, 0.15);
  right: 50px;
  top: -20px;
}
.glass-orb {
  position: absolute;
  width: 140px;
  height: 140px;
  right: 60px;
  bottom: 40px;
  background: linear-gradient(135deg, rgba(255,255,255,0.6), rgba(255,255,255,0.1));
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255,255,255,0.5);
  border-radius: 30px;
  transform: rotate(15deg);
  box-shadow: 0 10px 30px rgba(0,0,0,0.05);
}

/* === 问诊卡片：对话气泡装饰 === */
.deco-chat {
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  position: relative;
  z-index: 2;
  font-size: 13px;
}
.chat-bubble {
  padding: 10px 16px;
  border-radius: 18px;
  max-width: 85%;
  line-height: 1.4;
  opacity: 0.9;
}
.chat-bubble.left {
  background: white;
  color: #555;
  align-self: flex-start;
  border-bottom-left-radius: 4px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.03);
  border: 1px solid #f0f0f0;
}
.chat-bubble.right {
  background: #1C2B26;
  color: #D4AF37;
  align-self: flex-end;
  border-bottom-right-radius: 4px;
  box-shadow: 0 4px 12px rgba(28,43,38,0.1);
}

/* === 背景大图标装饰 === */
.deco-bg-icon {
  position: absolute;
  font-size: 120px;
  right: -20px;
  bottom: -30px;
  opacity: 0.04;
  transform: rotate(-15deg);
  pointer-events: none;
  filter: grayscale(1);
}

.reveal-item {
  opacity: 0;
  transform: translateY(30px);
  animation: reveal 0.8s cubic-bezier(0.5, 0, 0, 1) forwards;
}

@keyframes reveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .section {
    padding: 60px 0;
  }
  .section-title {
    font-size: 28px;
  }
}

/* 舌诊卡片：渐变 + 背景图片 */
.bento-tongue {
  background: linear-gradient(135deg, rgba(242, 249, 246, 0.85), rgba(255, 255, 255, 0.85)), url('/sz2.jpg');
  background-size: cover, cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 问诊卡片：渐变 + 背景图片 */
.bento-consult {
  background: linear-gradient(135deg, rgba(255, 252, 243, 0.85), rgba(255, 255, 255, 0.85)), url('/wz2.jpg');
  background-size: cover, cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 中药识别卡片：添加渐变 + 背景图片（原有无渐变，现增加半透明白色渐变） */
.bento-herb {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url('/sb2.jpg');
  background-size: cover, cover;
  background-position: center;
  background-repeat: no-repeat;
}

/* 科普卡片：渐变 + 背景图片 */
.bento-science {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.85), rgba(255, 255, 255, 0.85)), url('/kp2.jpg');
  background-size: cover, cover;
  background-position: center;
  background-repeat: no-repeat;
}

</style>
