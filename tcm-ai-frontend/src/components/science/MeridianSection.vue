<template>
  <section class="meridian-section" id="meridian">
    <div class="section-header">
      <p class="section-kicker">Meridian Intelligence</p>
      <h1>经络穴位系统</h1>
      <p class="subtitle">中医智慧的无形之路，连通全身气血运行</p>
    </div>

    <div class="meridian-container">
      <div class="human-body-3d glass-panel">
        <div class="human-body-title-wrap">
          <div class="meridian-title">三维经络明堂图</div>
          <div class="meridian-title-sub">DIGITAL MINGTANG · 气血流注推演系统</div>
        </div>
        <div class="model-placeholder">
          <HumanBody3D />
        </div>
      </div>

      <aside class="meridian-info">
        <div class="info-card hover-lift">
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

        <div class="info-card hover-lift">
          <h3>任督二脉</h3>
          <div class="special-meridian">
            <p><strong>任脉</strong>：起于会阴，沿腹部正中线向上</p>
            <p><strong>督脉</strong>：起于会阴，沿脊柱向上至头顶</p>
            <p class="highlight">💡 这两条经络是“阴阳气血”流通的主通道</p>
          </div>
        </div>

        <div class="info-card hover-lift">
          <h3>常用穴位</h3>
          <ul class="acupoint-list">
            <li><span class="point-name">足三里</span> <span class="point-desc">强身健体第一穴</span></li>
            <li><span class="point-name">三阴交</span> <span class="point-desc">女性养生必选穴</span></li>
            <li><span class="point-name">合谷穴</span> <span class="point-desc">止痛效果显著</span></li>
            <li><span class="point-name">涌泉穴</span> <span class="point-desc">调理肾气的关键</span></li>
          </ul>
        </div>
      </aside>
    </div>
  </section>
</template>

<script setup>
import HumanBody3D from '@/components/HumanBody3D.vue'
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

.section-header { text-align: center; margin-bottom: 48px; }
.section-kicker { color: var(--gold); font-size: 13px; letter-spacing: 3px; text-transform: uppercase; margin-bottom: 8px; font-family: sans-serif; font-weight: 600;}
.section-header h1 { font-size: clamp(32px, 4vw, 48px); margin: 0 0 12px; font-weight: 700; letter-spacing: 2px; }
.subtitle { font-size: 17px; color: var(--ink-muted); font-family: sans-serif; }

.meridian-container {
  display: grid;
  grid-template-columns: 1.2fr 0.8fr;
  gap: 32px;
  max-width: 1280px;
  margin: 0 auto;
  align-items: stretch;
}

.human-body-3d {
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 600px;
  height: 100%;
}

.human-body-title-wrap {
  padding: 16px 14px;
  text-align: center;
  background: linear-gradient(180deg, rgba(32, 52, 45, 0.94), rgba(24, 39, 34, 0.96));
  border-bottom: 1px solid rgba(195, 167, 125, 0.24);
}

.meridian-title {
  font-size: clamp(20px, 2vw, 22px);
  font-weight: 700;
  letter-spacing: 3px;
  color: #e8dcc3;
  line-height: 1.25;
}

.meridian-title-sub {
  font-size: 10px;
  color: rgba(232, 220, 195, 0.76);
  letter-spacing: 1.6px;
  margin-top: 4px;
  font-family: sans-serif;
  max-width: 100%;
  white-space: normal;
  word-break: break-word;
}

.model-placeholder { flex: 1; background: radial-gradient(circle at center, #2a3a34 0%, #111a17 100%); }

.meridian-info {
  display: grid;
  grid-template-rows: repeat(3, minmax(0, 1fr));
  gap: 20px;
  height: 100%;
}

.info-card {
  height: 100%;
  padding: 24px;
  border-radius: 16px;
  position: relative;
  overflow: hidden;
  background: rgba(252, 250, 244, 0.78);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(225, 217, 198, 0.8);
}

.info-card::before {
  content: "";
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  background: linear-gradient(to bottom, var(--gold), var(--jade));
}

.info-card h3 { font-size: 20px; margin: 0 0 16px; color: var(--jade); }

.meridian-list { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.meridian-list strong { color: var(--jade-light); font-size: 15px; }
.meridian-list p { font-size: 13px; color: var(--ink-muted); margin: 4px 0 0; }

.special-meridian p { font-size: 15px; margin-bottom: 8px; line-height: 1.6; }

.highlight {
  display: inline-block;
  background: rgba(183, 161, 122, 0.14);
  padding: 12px 16px;
  border-radius: 8px;
  color: var(--jade);
  font-weight: 500;
  font-size: 14px;
  margin-top: 8px;
}

.acupoint-list { list-style: none; padding: 0; margin: 0; }
.acupoint-list li { padding: 12px 0; border-bottom: 1px dashed rgba(0,0,0,0.1); display: flex; justify-content: space-between; }
.acupoint-list li:last-child { border-bottom: none; }
.point-name { font-weight: 600; color: var(--jade); }
.point-desc { color: var(--ink-muted); font-size: 14px; }

@media (max-width: 1024px) {
  .meridian-container { grid-template-columns: 1fr; }
}

@media (max-width: 768px) {
  .meridian-title { letter-spacing: 2px; font-size: 18px; }
  .meridian-title-sub { letter-spacing: 1.2px; font-size: 9px; }
}
</style>
