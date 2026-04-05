<template>
  <div class="science-wrapper">
    <!-- 导航栏 -->
    <div class="science-header">
      <div class="header-content">
        <div class="logo">
          <span class="logo-icon">🏥</span>
          <span class="logo-text">中医科学</span>
        </div>
        <div class="header-nav">
          <button 
            class="nav-btn" 
            :class="{ active: activeTab === 'meridian' }" 
            @click="activeTab = 'meridian'"
          >脉络图</button>
          <button 
            class="nav-btn" 
            :class="{ active: activeTab === 'diagnosis' }" 
            @click="activeTab = 'diagnosis'"
          >四诊</button>
          <button class="nav-btn back-btn" @click="goBack">← 返回首页</button>
        </div>
      </div>
    </div>

    <!-- 内容区 -->
    <div class="science-content">
      <!-- 3D 脉络图部分 -->
      <section v-show="activeTab === 'meridian'" class="meridian-section" id="meridian">
        <div class="section-header">
          <h1>经络穴位系统</h1>
          <p class="subtitle">中医智慧的无形之路，连通全身气血运行</p>
        </div>

        <div class="meridian-container">
          <!-- 3D 人体模型 -->
          <div class="human-body-3d">
            <HumanBody3D />
          </div>

          <!-- 经络信息面板 -->
          <div class="meridian-info">
            <div class="info-card">
              <h3>十二正经</h3>
              <ul class="meridian-list">
                <li>
                  <strong>手三阴经</strong>
                  <p>肺经、心包经、心经</p>
                </li>
                <li>
                  <strong>手三阳经</strong>
                  <p>大肠经、三焦经、小肠经</p>
                </li>
                <li>
                  <strong>足三阴经</strong>
                  <p>脾经、肝经、肾经</p>
                </li>
                <li>
                  <strong>足三阳经</strong>
                  <p>胃经、胆经、膀胱经</p>
                </li>
              </ul>
            </div>

            <div class="info-card">
              <h3>任督二脉</h3>
              <div class="special-meridian">
                <p>
                  <strong>任脉</strong>：起于会阴，沿腹部正中线向上
                </p>
                <p>
                  <strong>督脉</strong>：起于会阴，沿脊柱向上至头顶
                </p>
                <p class="highlight">这两条经络是"阴阳气血"流通的主通道</p>
              </div>
            </div>

            <div class="info-card">
              <h3>常用穴位</h3>
              <ul class="acupoint-list">
                <li>🔴 足三里 - 强身健体的第一穴</li>
                <li>🔴 三阴交 - 女性养生的必选穴</li>
                <li>🔴 合谷穴 - 止痛效果显著</li>
                <li>🔴 涌泉穴 - 调理肾气的关键</li>
              </ul>
            </div>
          </div>
        </div>

        <div class="meridian-tips">
          <p>💡 <strong>小贴士</strong>：经络畅通才能气血充盈，经常按摩这些穴位可以改善身体状况。</p>
        </div>
      </section>

      <!-- 中医四诊部分 -->
      <section v-show="activeTab === 'diagnosis'" class="diagnosis-section" id="diagnosis">
        <div class="section-header">
          <h1>中医四诊</h1>
          <p class="subtitle">望、闻、问、切 - 中医诊疗的四大基石</p>
        </div>

        <div class="diagnosis-grid">
          <!-- 望诊 -->
          <div class="diagnosis-card">
            <div class="card-header diagnosis-1">
              <h2>望诊 👁️</h2>
            </div>
            <div class="card-content">
              <p class="description">通过观察患者的表情、舌象、气色等外在表现来判断健康状况。</p>
              <div class="diagnosis-details">
                <h4>诊断要点：</h4>
                <ul>
                  <li><strong>面色</strong>：苍白、潮红、晦暗的含义</li>
                  <li><strong>舌象</strong>：舌质、舌苔的变化反映体质</li>
                  <li><strong>眼神</strong>：有神或无神代表气血充盈程度</li>
                  <li><strong>步态</strong>：走路方式反映脾胃功能</li>
                  <li><strong>皮肤</strong>：润泽度反映水湿代谢</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 闻诊 -->
          <div class="diagnosis-card">
            <div class="card-header diagnosis-2">
              <h2>闻诊 👂</h2>
            </div>
            <div class="card-content">
              <p class="description">通过听声音和识别气味来判断疾病的性质和严重程度。</p>
              <div class="diagnosis-details">
                <h4>诊断要点：</h4>
                <ul>
                  <li><strong>声音</strong>：说话有力或虚弱表现</li>
                  <li><strong>咳嗽声</strong>：干咳、湿咳的不同含义</li>
                  <li><strong>呼吸</strong>：喘息、哮鸣的病理特征</li>
                  <li><strong>体味</strong>：腐臭、腥臭、焦臭等异味</li>
                  <li><strong>排泄物气味</strong>：反映消化道病变</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 问诊 -->
          <div class="diagnosis-card">
            <div class="card-header diagnosis-3">
              <h2>问诊 ❓</h2>
            </div>
            <div class="card-content">
              <p class="description">通过与患者的对话来了解病历、症状和生活习惯。</p>
              <div class="diagnosis-details">
                <h4>诊断要点：</h4>
                <ul>
                  <li><strong>十问歌</strong>：寒热、汗出、头身、二便等</li>
                  <li><strong>发病时间</strong>：急性还是慢性疾病</li>
                  <li><strong>病痛部位</strong>：准确定位问题所在</li>
                  <li><strong>生活起居</strong>：工作、睡眠、饮食规律</li>
                  <li><strong>情志因素</strong>：压力、情绪对健康的影响</li>
                </ul>
              </div>
            </div>
          </div>

          <!-- 切诊 -->
          <div class="diagnosis-card">
            <div class="card-header diagnosis-4">
              <h2>切诊 ✋</h2>
            </div>
            <div class="card-content">
              <p class="description">通过触摸患者的皮肤、穴位、脉搏来诊断疾病。</p>
              <div class="diagnosis-details">
                <h4>诊断要点：</h4>
                <ul>
                  <li><strong>把脉</strong>：28 种脉象的辨识</li>
                  <li><strong>按压</strong>：穴位按压的酸胀感</li>
                  <li><strong>皮温</strong>：体表温度差异</li>
                  <li><strong>淋巴结</strong>：肿大程度和硬度</li>
                  <li><strong>腹诊</strong>：腹部压痛点的定位</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- 脉象详解 -->
        <div class="pulse-detail">
          <h3>八大基本脉象</h3>
          <div class="pulse-grid">
            <div class="pulse-item">
              <span class="pulse-name">浮脉</span>
              <p>轻按即得，重按反而减弱</p>
            </div>
            <div class="pulse-item">
              <span class="pulse-name">沉脉</span>
              <p>按压较深才能感觉到</p>
            </div>
            <div class="pulse-item">
              <span class="pulse-name">迟脉</span>
              <p>脉搏来去缓慢，一息不足四至</p>
            </div>
            <div class="pulse-item">
              <span class="pulse-name">数脉</span>
              <p>脉搏来去急促，一息五至以上</p>
            </div>
            <div class="pulse-item">
              <span class="pulse-name">虚脉</span>
              <p>轻按无力，重按空大</p>
            </div>
            <div class="pulse-item">
              <span class="pulse-name">实脉</span>
              <p>脉来有力，按之充实</p>
            </div>
            <div class="pulse-item">
              <span class="pulse-name">弦脉</span>
              <p>脉象绷紧如琴弦</p>
            </div>
            <div class="pulse-item">
              <span class="pulse-name">细脉</span>
              <p>脉象如线，细小无力</p>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- 页脚 -->
    <div class="science-footer">
      <p>中医科学知识库 | 长沙中医 AI 平台</p>
      <p class="footer-info">致力于传承中医文化，普及中医知识</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import HumanBody3D from '@/components/HumanBody3D.vue'

const router = useRouter()
const activeTab = ref('meridian')

const STAT_KEY = 'scienceVisitCount'

const bumpVisitCount = () => {
  const current = parseInt(localStorage.getItem(STAT_KEY) || '0', 10)
  const next = Number.isFinite(current) ? current + 1 : 1
  localStorage.setItem(STAT_KEY, String(next))
}

const goBack = () => {
  router.push('/')
}

onMounted(() => {
  bumpVisitCount()
})
</script>

<style scoped>
.science-wrapper {
  min-height: 100vh;
  background-color: #FBFBF9;
  display: flex;
  flex-direction: column;
}

/* ===== 导航栏 ===== */
.science-header {
  background: linear-gradient(135deg, #1C2B26 0%, #2C3E35 100%);
  color: white;
  padding: 0;
  position: sticky;
  top: 0;
  z-index: 1000;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 20px;
  font-weight: bold;
}

.logo-icon {
  font-size: 28px;
}

.logo-text {
  color: #C2A878;
}

.header-nav {
  display: flex;
  gap: 16px;
}

.nav-btn {
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
}

.nav-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: #C2A878;
}

.nav-btn.active {
  background: #C2A878;
  border-color: #C2A878;
  color: #1C2B26;
}

.back-btn {
  margin-left: auto;
}

/* ===== 内容区 ===== */
.science-content {
  flex: 1;
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  padding: 40px 24px;
}

.section-header {
  text-align: center;
  margin-bottom: 40px;
}

.section-header h1 {
  font-size: 36px;
  color: #1C2B26;
  margin-bottom: 12px;
  font-weight: bold;
}

.subtitle {
  font-size: 16px;
  color: #666;
  margin: 0;
}

/* ===== 脉络图部分 ===== */
.meridian-section {
  animation: fadeIn 0.5s ease-out;
}

.meridian-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 36px;
  margin-bottom: 40px;
}

.human-body-3d {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  min-height: 600px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.meridian-info {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  border-left: 4px solid #C2A878;
}

.info-card h3 {
  color: #1C2B26;
  margin: 0 0 16px 0;
  font-size: 18px;
}

.meridian-list li {
  margin-bottom: 16px;
  list-style: none;
}

.meridian-list strong {
  color: #C2A878;
  display: block;
  margin-bottom: 4px;
}

.meridian-list p {
  color: #666;
  margin: 0;
  font-size: 14px;
}

.special-meridian p {
  margin-bottom: 12px;
  color: #333;
  line-height: 1.6;
}

.highlight {
  background: #FFF8DC;
  padding: 8px 12px;
  border-radius: 4px;
  color: #D2691E !important;
}

.acupoint-list {
  margin: 0;
  padding: 0;
  list-style: none;
}

.acupoint-list li {
  padding: 8px 0;
  color: #333;
  border-bottom: 1px solid #EEE;
}

.acupoint-list li:last-child {
  border-bottom: none;
}

.meridian-tips {
  text-align: center;
  background: #FFF8DC;
  border-radius: 8px;
  padding: 20px;
  color: #D2691E;
  border: 1px solid #C2A878;
}

/* ===== 四诊部分 ===== */
.diagnosis-section {
  animation: fadeIn 0.5s ease-out;
}

.diagnosis-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 24px;
  margin-bottom: 48px;
}

.diagnosis-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.diagnosis-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.card-header {
  padding: 20px;
  color: white;
}

.diagnosis-1 {
  background: linear-gradient(135deg, #FF6B6B, #FF8E8E);
}

.diagnosis-2 {
  background: linear-gradient(135deg, #4ECDC4, #6FE7D7);
}

.diagnosis-3 {
  background: linear-gradient(135deg, #FFD93D, #FFE66D);
}

.diagnosis-4 {
  background: linear-gradient(135deg, #95E1D3, #B8F3E8);
}

.card-header h2 {
  margin: 0;
  font-size: 22px;
}

.card-content {
  padding: 24px;
}

.description {
  color: #333;
  margin: 0 0 16px 0;
  line-height: 1.6;
}

.diagnosis-details h4 {
  color: #1C2B26;
  margin: 12px 0 12px 0;
  font-size: 14px;
}

.diagnosis-details ul {
  margin: 0;
  padding-left: 20px;
  list-style: disc;
}

.diagnosis-details li {
  color: #666;
  margin: 8px 0;
  line-height: 1.6;
  font-size: 14px;
}

/* ===== 脉象详解 ===== */
.pulse-detail {
  background: white;
  border-radius: 12px;
  padding: 36px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.pulse-detail h3 {
  color: #1C2B26;
  font-size: 24px;
  margin: 0 0 24px 0;
  text-align: center;
}

.pulse-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 16px;
}

.pulse-item {
  background: #F8F8F8;
  border: 2px solid #D4AF37;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
  transition: all 0.3s ease;
}

.pulse-item:hover {
  background: #FFF8DC;
  box-shadow: 0 4px 12px rgba(194, 168, 120, 0.2);
}

.pulse-name {
  display: block;
  color: #1C2B26;
  font-weight: bold;
  margin-bottom: 8px;
}

.pulse-item p {
  margin: 0;
  color: #666;
  font-size: 12px;
  line-height: 1.5;
}

/* ===== 页脚 ===== */
.science-footer {
  background: #1C2B26;
  color: white;
  text-align: center;
  padding: 32px 24px;
  margin-top: 40px;
}

.science-footer p {
  margin: 8px 0;
}

.footer-info {
  color: #AAA;
  font-size: 14px;
}

/* ===== 动画 ===== */
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* ===== 响应式 ===== */
@media (max-width: 900px) {
  .meridian-container {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
  }

  .header-nav {
    flex-direction: column;
    width: 100%;
  }

  .nav-btn,
  .back-btn {
    width: 100%;
  }

  .diagnosis-grid {
    grid-template-columns: 1fr;
  }

  .section-header h1 {
    font-size: 28px;
  }

  .pulse-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 600px) {
  .header-content {
    padding: 12px 16px;
  }

  .logo {
    font-size: 16px;
  }

  .logo-icon {
    font-size: 24px;
  }

  .science-content {
    padding: 24px 16px;
  }

  .section-header h1 {
    font-size: 24px;
  }

  .info-card,
  .pulse-detail {
    padding: 16px;
  }

  .pulse-grid {
    grid-template-columns: 1fr;
  }

  .diagnosis-grid {
    gap: 16px;
  }
}
</style>
