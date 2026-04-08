<template>
  <section class="diagnosis-section" id="diagnosis">
    <div class="section-header">
      <p class="section-kicker">Pulse Diagnostics</p>
      <h1>中医四诊 · 八脉图鉴</h1>
    </div>

    <div class="classic-header">
      <h2>中医四诊</h2>
      <p>望、闻、问、切 — 中医诊疗的四大基石</p>
    </div>

    <div class="diagnosis-slider">
      <button class="slider-arrow slider-arrow-left" type="button" @click="prevDiagnosis" aria-label="上一项">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><polyline points="15 18 9 12 15 6"></polyline></svg>
      </button>

      <div class="diagnosis-viewport">
        <div class="diagnosis-track">
          <div
            v-for="(item, idx) in diagnosisItems"
            :key="item.title"
            class="diagnosis-slide"
            :class="getDiagnosisPosition(idx)"
          >
            <div class="diagnosis-card glass-panel">
              <div class="card-header" :class="item.headerClass">
                <h3>{{ item.title }}</h3>
              </div>
              <div class="card-content">
                <p class="description">{{ item.desc }}</p>
                <div class="diagnosis-details">
                  <h4>核心要点</h4>
                  <ul>
                    <li v-for="point in item.points" :key="point.key">
                      <span class="tag">{{ point.key }}</span>
                      <span class="val">{{ point.value }}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="slider-arrow slider-arrow-right" type="button" @click="nextDiagnosis" aria-label="下一项">
        <svg viewBox="0 0 24 24" width="24" height="24" stroke="currentColor" stroke-width="2" fill="none"><polyline points="9 18 15 12 9 6"></polyline></svg>
      </button>
    </div>

    <div class="diagnosis-dots">
      <button
        v-for="index in diagnosisTotal"
        :key="index"
        class="dot-btn"
        :class="{ active: diagnosisIndex === index - 1 }"
        @click="setDiagnosis(index - 1)"
        :aria-label="`切换到第 ${index} 项`"
        type="button"
      ></button>
    </div>

    <div class="pulse-gallery">
      <div class="pulse-header">
        <h3>八大基础脉象体验区</h3>
        <p>点击下方脉象，查看对应的脉搏波动特征</p>
      </div>

      <div class="pulse-grid">
        <div
          v-for="pulse in eightPulses"
          :key="pulse.name"
          class="pulse-card glass-panel hover-lift"
          @click="openPulseModal(pulse)"
        >
          <div class="pulse-icon">〰️</div>
          <h4>{{ pulse.name }}</h4>
          <p class="pulse-brief">{{ pulse.brief }}</p>
        </div>
      </div>
    </div>

    <transition name="modal-fade">
      <div v-if="isModalOpen" class="pulse-modal-overlay" @click.self="closePulseModal">
        <div class="pulse-modal-content glass-panel">
          <button class="close-btn" type="button" @click="closePulseModal">×</button>

          <div class="modal-header">
            <h2 class="modal-pulse-name">{{ selectedPulse.name }}</h2>
            <p class="modal-pulse-desc">{{ selectedPulse.desc }}</p>
          </div>

          <div class="wave-monitor">
            <div class="wave-grid-bg"></div>
            <svg class="wave-svg" viewBox="0 0 500 100" preserveAspectRatio="none">
              <path
                class="wave-path"
                :d="selectedPulse.svgPath"
                fill="none"
                :stroke="selectedPulse.color || 'var(--jade)'"
                stroke-width="3"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <div class="scanner-line"></div>
          </div>

          <div class="modal-footer">
            <div class="feature-tag"><strong>波形特征：</strong>{{ selectedPulse.feature }}</div>
            <div class="feature-tag"><strong>临床主病：</strong>{{ selectedPulse.clinical }}</div>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup>
import { ref } from 'vue'

const diagnosisIndex = ref(0)

const diagnosisItems = [
  {
    title: '望诊 · 目视察色',
    desc: '通过观察患者的表情、神态、舌象、气色等外在表现来判断内在健康状况。',
    headerClass: 'diagnosis-1',
    points: [
      { key: '面色', value: '辨别气血的盛衰与运行' },
      { key: '舌象', value: '舌质与舌苔反映脏腑寒热' },
      { key: '眼神', value: '聚神或散神代表精气充盈度' },
      { key: '体态', value: '骨骼、肌肉反映先天与后天' }
    ]
  },
  {
    title: '闻诊 · 听声辨味',
    desc: '通过听辨声音的高低清浊，以及嗅闻气味的酸苦甘辛，来判断疾病的性质。',
    headerClass: 'diagnosis-2',
    points: [
      { key: '语声', value: '中气足与弱表现虚实' },
      { key: '气息', value: '喘息、哮鸣的病理特征' },
      { key: '咳声', value: '干咳与湿咳的不同含义' },
      { key: '气味', value: '体味、口气的清浊变化' }
    ]
  },
  {
    title: '问诊 · 详询病源',
    desc: '通过医患对话，详细了解疾病的发生、发展、治疗经过及生活习惯。',
    headerClass: 'diagnosis-3',
    points: [
      { key: '寒热', value: '辨别外感与内伤' },
      { key: '汗出', value: '判断营卫不和或气虚' },
      { key: '饮食', value: '脾胃运化功能的体现' },
      { key: '睡眠', value: '心神安宁与否的标志' }
    ]
  },
  {
    title: '切诊 · 探脉寻根',
    desc: '通过触摸按压患者的脉搏、皮肤、腧穴等部位，探查病情。',
    headerClass: 'diagnosis-4',
    points: [
      { key: '寸关尺', value: '对应全身不同脏腑' },
      { key: '脉象', value: '二十八脉辨别病理' },
      { key: '按压', value: '探查痛点与气血淤滞' },
      { key: '皮温', value: '感知局部的寒热虚实' }
    ]
  }
]

const diagnosisTotal = diagnosisItems.length

const prevDiagnosis = () => {
  diagnosisIndex.value = (diagnosisIndex.value - 1 + diagnosisTotal) % diagnosisTotal
}

const nextDiagnosis = () => {
  diagnosisIndex.value = (diagnosisIndex.value + 1) % diagnosisTotal
}

const setDiagnosis = (index) => {
  diagnosisIndex.value = index
}

const getDiagnosisPosition = (index) => {
  const total = diagnosisTotal
  const diff = (index - diagnosisIndex.value + total) % total
  if (diff === 0) return 'is-active'
  if (diff === 1) return 'is-right'
  if (diff === total - 1) return 'is-left'
  return 'is-hidden'
}

const eightPulses = [
  {
    name: '浮脉 (Floating)',
    brief: '轻取即得，如水漂木',
    desc: '按之不足，举之有余。手指轻轻放在皮肤上就能清晰感觉到脉搏。',
    feature: '主波位置偏高，波幅较大。',
    clinical: '主表证（如感冒、发热），也见于虚损。',
    color: '#8ba69b',
    svgPath: 'M0,30 Q20,10 40,30 T80,30 T120,30 T160,30 T200,30 T240,30 T280,30 T320,30 T360,30 T400,30 T440,30 T480,30 T520,30'
  },
  {
    name: '沉脉 (Deep)',
    brief: '重按乃得，如石沉水',
    desc: '轻取不应，重按始得。需要用力按压到筋骨才能感觉清楚。',
    feature: '主波位置较深（低），波幅偏小。',
    clinical: '主里证（如脏腑疾病），有力为里实，无力为里虚。',
    color: '#4f6960',
    svgPath: 'M0,70 Q20,50 40,70 T80,70 T120,70 T160,70 T200,70 T240,70 T280,70 T320,70 T360,70 T400,70 T440,70 T480,70 T520,70'
  },
  {
    name: '迟脉 (Slow)',
    brief: '一息不足四至',
    desc: '脉搏跳动缓慢，每分钟通常在60次以下。',
    feature: '波周期长，两个主波之间距离宽。',
    clinical: '主寒证，有力为冷痛，无力为虚寒。',
    color: '#657069',
    svgPath: 'M0,50 Q40,10 80,50 T160,50 T240,50 T320,50 T400,50 T480,50 T560,50'
  },
  {
    name: '数脉 (Rapid)',
    brief: '一息五至以上',
    desc: '脉搏跳动急促，每分钟通常在90次以上。',
    feature: '波周期短，波形密集。',
    clinical: '主热证，有力为实热，无力为虚热。',
    color: '#c25e5e',
    svgPath: 'M0,50 Q10,10 20,50 T40,50 T60,50 T80,50 T100,50 T120,50 T140,50 T160,50 T180,50 T200,50 T220,50 T240,50 T260,50 T280,50 T300,50 T320,50 T340,50 T360,50 T380,50 T400,50 T420,50 T440,50 T460,50 T480,50 T500,50 T520,50'
  },
  {
    name: '滑脉 (Slippery)',
    brief: '往来流利，如盘走珠',
    desc: '脉搏跳动极其流畅圆滑，像珠子在盘子里滚动。',
    feature: '波峰圆钝，降中峡变浅，重搏波明显。',
    clinical: '主痰饮、食滞、实热，亦为孕脉（喜脉）。',
    color: '#b7a17a',
    svgPath: 'M0,50 C20,10 30,10 40,50 S60,90 80,50 S100,10 120,50 S140,90 160,50 S180,10 200,50 S220,90 240,50 S260,10 280,50 S300,90 320,50 S340,10 360,50 S380,90 400,50 S420,10 440,50 S460,90 480,50 S500,10 520,50'
  },
  {
    name: '涩脉 (Choppy)',
    brief: '往来艰涩，如轻刀刮竹',
    desc: '脉搏跳动不畅，感觉有阻滞感，波形不规则。',
    feature: '波峰尖锐且常有切迹，波形高低不匀。',
    clinical: '主气滞血瘀、精血亏少。',
    color: '#1f2f2a',
    svgPath: 'M0,50 L15,30 L20,40 L30,10 L40,50 L60,45 L70,55 L80,50 L95,25 L105,35 L120,15 L130,50 L150,45 L160,50 L175,30 L185,40 L195,10 L210,50 L230,48 L240,50 L255,20 L265,30 L280,15 L290,50 L310,40 L320,50 L335,30 L340,40 L350,10 L370,50 L390,45 L400,50 L415,25 L425,35 L440,15 L450,50 L470,45 L480,50 L495,30 L505,40 L515,10 L530,50'
  },
  {
    name: '虚脉 (Empty)',
    brief: '三部举按皆无力',
    desc: '按之空虚软弱，脉管虽然大但毫无力量。',
    feature: '整体波幅低平，主波上升缓慢。',
    clinical: '主气血两虚。',
    color: '#a3b3a9',
    svgPath: 'M0,50 Q20,40 40,50 T80,50 T120,50 T160,50 T200,50 T240,50 T280,50 T320,50 T360,50 T400,50 T440,50 T480,50 T520,50'
  },
  {
    name: '实脉 (Full)',
    brief: '三部举按皆有力',
    desc: '脉搏跳动坚实有力，不论轻取重按都感觉充满力量。',
    feature: '波幅高大，主波升降迅速，整个波形饱满。',
    clinical: '主实证（邪气盛）。',
    color: '#20342d',
    svgPath: 'M0,50 Q20,-20 40,50 T80,50 T120,50 T160,50 T200,50 T240,50 T280,50 T320,50 T360,50 T400,50 T440,50 T480,50 T520,50'
  }
]

const isModalOpen = ref(false)
const selectedPulse = ref(eightPulses[0])

const openPulseModal = (pulse) => {
  selectedPulse.value = pulse
  isModalOpen.value = true
}

const closePulseModal = () => {
  isModalOpen.value = false
}
</script>

<style scoped>
.glass-panel {
  background: var(--home-surface);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--glass-border);
  box-shadow: var(--shadow-soft);
}

.hover-lift {
  transition: transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 36px rgba(42, 64, 57, 0.12);
}

.section-header {
  text-align: center;
  margin-bottom: 48px;
}

.section-kicker {
  color: var(--gold);
  font-size: 13px;
  letter-spacing: 3px;
  text-transform: uppercase;
  margin-bottom: 8px;
  font-family: sans-serif;
  font-weight: 600;
}

.section-header h1 {
  font-size: clamp(32px, 4vw, 48px);
  margin: 0 0 12px;
  font-weight: 700;
  letter-spacing: 2px;
}

.subtitle {
  font-size: 17px;
  color: var(--ink-muted);
  font-family: sans-serif;
}

.classic-header {
  text-align: center;
  margin: 8px 0 28px;
}

.classic-header h2 {
  margin: 0 0 8px;
  font-size: 28px;
  color: var(--jade);
  letter-spacing: 2px;
}

.classic-header p {
  margin: 0;
  color: var(--ink-muted);
}

.diagnosis-slider {
  position: relative;
  display: flex;
  align-items: center;
  gap: 18px;
}

.diagnosis-viewport {
  flex: 1;
  position: relative;
  height: 480px;
  perspective: 1200px;
}

.diagnosis-track {
  position: relative;
  width: 100%;
  height: 100%;
  transform-style: preserve-3d;
}

.diagnosis-slide {
  position: absolute;
  left: 50%;
  top: 20px;
  width: 600px;
  margin-left: -300px;
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.diagnosis-slide.is-active {
  transform: translate3d(0, 0, 0) scale(1);
  z-index: 3;
  opacity: 1;
}

.diagnosis-slide.is-left {
  transform: translate3d(-45%, 0, -100px) scale(0.85);
  z-index: 2;
  opacity: 0.6;
  cursor: pointer;
}

.diagnosis-slide.is-right {
  transform: translate3d(45%, 0, -100px) scale(0.85);
  z-index: 2;
  opacity: 0.6;
  cursor: pointer;
}

.diagnosis-slide.is-hidden {
  transform: translate3d(0, 0, -200px) scale(0.7);
  z-index: 1;
  opacity: 0;
}

.diagnosis-card {
  border-radius: 20px;
  overflow: hidden;
  height: 100%;
  background: #fcfaf4;
  border: 1px solid rgba(205, 196, 176, 0.82);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.card-header {
  padding: 24px;
  color: #fff;
  text-align: center;
}

.card-header h3 {
  margin: 0;
  font-size: 26px;
  letter-spacing: 2px;
}

.diagnosis-1 {
  background: linear-gradient(135deg, #3f5b50, #5c7a6e);
}

.diagnosis-2 {
  background: linear-gradient(135deg, #566f66, #78928a);
}

.diagnosis-3 {
  background: linear-gradient(135deg, #76866f, #97a78a);
}

.diagnosis-4 {
  background: linear-gradient(135deg, #7d786b, #9f9787);
}

.card-content {
  padding: 30px;
  text-align: center;
}

.card-content .description {
  font-size: 16px;
  color: var(--ink-main);
  line-height: 1.6;
  margin-bottom: 24px;
}

.diagnosis-details h4 {
  font-size: 15px;
  color: var(--jade);
  margin-bottom: 16px;
}

.diagnosis-details ul {
  list-style: none;
  padding: 0;
  margin: 0 auto;
  max-width: 400px;
}

.diagnosis-details li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.diagnosis-details .tag {
  font-weight: 600;
  color: var(--jade-light);
}

.diagnosis-details .val {
  color: var(--ink-muted);
  font-size: 14px;
  text-align: right;
  margin-left: 16px;
}

.slider-arrow {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: rgba(252, 250, 244, 0.9);
  border: 1px solid rgba(205, 196, 176, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  color: var(--jade);
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transition: all 0.3s;
  flex: 0 0 auto;
}

.slider-arrow:hover {
  background: var(--jade);
  color: #fff;
  transform: scale(1.05);
  border-color: var(--jade);
}

.diagnosis-dots {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 18px;
}

.dot-btn {
  width: 8px;
  height: 8px;
  border-radius: 4px;
  background: rgba(32, 52, 45, 0.22);
  border: none;
  cursor: pointer;
  transition: all 0.3s;
}

.dot-btn.active {
  width: 24px;
  background: var(--jade);
}

.pulse-gallery {
  margin-top: 60px;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
}

.pulse-header {
  text-align: center;
  margin-bottom: 32px;
}

.pulse-header h3 {
  font-size: 24px;
  color: var(--jade);
  margin: 0 0 8px;
}

.pulse-header p {
  color: var(--ink-muted);
  font-size: 15px;
}

.pulse-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

.pulse-card {
  background: rgba(252, 250, 244, 0.6);
  border: 1px solid rgba(205, 196, 176, 0.5);
  border-radius: 16px;
  padding: 24px 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(8px);
}

.pulse-card:hover {
  background: var(--jade);
  color: #fff;
  border-color: var(--jade);
}

.pulse-card:hover .pulse-icon,
.pulse-card:hover .pulse-brief {
  color: rgba(255, 255, 255, 0.8);
}

.pulse-icon {
  font-size: 28px;
  margin-bottom: 12px;
  color: var(--gold);
}

.pulse-card h4 {
  margin: 0 0 8px;
  font-size: 18px;
}

.pulse-brief {
  font-size: 13px;
  color: var(--ink-muted);
  margin: 0;
}

.pulse-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: rgba(17, 26, 23, 0.6);
  backdrop-filter: blur(8px);
  z-index: 100;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
}

.pulse-modal-content {
  width: min(700px, 100%);
  background: rgba(247, 244, 236, 0.95);
  border-radius: 24px;
  padding: 40px;
  position: relative;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
}

.close-btn {
  position: absolute;
  top: 20px;
  right: 24px;
  background: none;
  border: none;
  font-size: 32px;
  color: var(--ink-muted);
  cursor: pointer;
  transition: color 0.3s;
}

.close-btn:hover {
  color: var(--jade);
}

.modal-header {
  text-align: center;
  margin-bottom: 30px;
}

.modal-pulse-name {
  font-size: 32px;
  color: var(--jade);
  margin: 0 0 12px;
  letter-spacing: 2px;
}

.modal-pulse-desc {
  font-size: 16px;
  color: var(--ink-main);
  line-height: 1.6;
}

.wave-monitor {
  width: 100%;
  height: 200px;
  background: #111a17;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  margin-bottom: 30px;
  border: 2px solid var(--jade-light);
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5);
}

.wave-grid-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image:
    linear-gradient(rgba(79, 105, 96, 0.2) 1px, transparent 1px),
    linear-gradient(90deg, rgba(79, 105, 96, 0.2) 1px, transparent 1px);
  background-size: 20px 20px;
}

.wave-svg {
  position: absolute;
  top: 50%;
  left: 0;
  width: 200%;
  height: 100%;
  transform: translateY(-50%);
  animation: slideWave 5s linear infinite;
}

.wave-path {
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation: drawLine 2s ease-out forwards;
}

.scanner-line {
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 15px 5px rgba(255, 255, 255, 0.3);
  animation: scanWave 5s linear infinite;
}

.modal-footer {
  display: flex;
  flex-direction: column;
  gap: 12px;
  background: rgba(183, 161, 122, 0.1);
  padding: 20px;
  border-radius: 12px;
}

.feature-tag {
  font-size: 15px;
  color: var(--ink-main);
}

.feature-tag strong {
  color: var(--jade);
  margin-right: 8px;
}

.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.3s ease;
}

.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}

.modal-fade-enter-active .pulse-modal-content {
  animation: bounceIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

@keyframes drawLine {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes slideWave {
  0% {
    transform: translate(0, -50%);
  }

  100% {
    transform: translate(-50%, -50%);
  }
}

@keyframes scanWave {
  0% {
    left: 0;
    opacity: 1;
  }

  50% {
    left: 100%;
    opacity: 0;
  }

  50.1% {
    left: 0;
    opacity: 0;
  }

  100% {
    left: 0;
    opacity: 1;
  }
}

@keyframes bounceIn {
  0% {
    transform: scale(0.8);
    opacity: 0;
  }

  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@media (max-width: 1024px) {
  .pulse-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .pulse-grid {
    grid-template-columns: 1fr;
  }

  .pulse-modal-content {
    padding: 24px;
  }

  .modal-pulse-name {
    font-size: 24px;
  }
}
</style>
