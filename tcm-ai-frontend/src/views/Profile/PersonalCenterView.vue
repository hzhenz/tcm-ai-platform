<template>
  <div class="dashboard-container">
    <!-- 极简宣纸噪点背景 -->
    <div class="bg-noise"></div>

    <!-- 顶部导航与个人名片 -->
    <header class="dash-header">
      <div class="header-content">
        <button class="back-btn" @click="goBack">
          <svg class="icon-back" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
          返回
        </button>

        <div class="user-profile">
          <div class="avatar-wrapper">
            <img :src="avatarUrl" alt="avatar" class="avatar" />
          </div>
          <div class="user-info">
            <h1 class="user-name">{{ displayName }}</h1>
            <div class="user-badges">
              <span class="badge days">{{ cultivationDaysText }}</span>
              <span class="badge status">当前状态：调理中</span>
            </div>
          </div>
        </div>
      </div>
    </header>

    <main class="dash-layout">
      
      <!-- 左侧：AI 核心仪表盘 (即看即用) -->
      <aside class="health-overview">
        <div class="card premium-card">
          <div class="card-header">
            <h2 class="card-title">综合体质辨证</h2>
            <button 
              class="refresh-btn" 
              :class="{ 'is-loading': isRefreshing }"
              @click="refreshAnalysis"
              :disabled="isRefreshing"
            >
              <svg v-if="!isRefreshing" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-refresh"><path stroke-linecap="round" stroke-linejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/></svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="icon-loading"><path stroke-linecap="round" stroke-linejoin="round" d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48l2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48l2.83-2.83"/></svg>
              {{ isRefreshing ? 'AI 重新推演中...' : '重新辨证' }}
            </button>
          </div>

          <div class="overview-body" :class="{ 'blur-state': isRefreshing }">
            <!-- 核心结论 -->
            <div class="syndrome-badge clickable" @click="goToAssessment" title="进入专门问诊评测">
              <span class="label">AI 诊断结论</span>
              <h3 class="result-text">{{ syndromeSummary.conclusion }}</h3>
              <p class="assessment-tip">点击进入专门问诊评测</p>
            </div>
            
            <!-- 雷达图 -->
            <div class="radar-wrapper">
              <div ref="radarRef" class="radar-chart"></div>
            </div>

            <!-- 智能建议 -->
            <div class="advice-section">
              <h4 class="advice-title">调摄指南</h4>
              <ul class="advice-list">
                <li><span class="dot"></span><strong>食疗：</strong>{{ syndromeSummary.foodAdvice }}</li>
                <li><span class="dot"></span><strong>起居：</strong>{{ syndromeSummary.routineAdvice }}</li>
                <li><span class="dot"></span><strong>环境：</strong>{{ syndromeSummary.envAdvice }}</li>
              </ul>
              <div class="organ-score-row">
                <button class="organ-score-btn" :class="{ missing: isOrganMissing('heart') }" @click="goToOrganAssessment('heart')">
                  <span class="organ-score-label">心</span>
                  <span class="organ-score-value">{{ formatNullable(syndromeSummary.organScores.heart) }}</span>
                </button>

                <button class="organ-score-btn" :class="{ missing: isOrganMissing('spleen') }" @click="goToOrganAssessment('spleen')">
                  <span class="organ-score-label">脾</span>
                  <span class="organ-score-value">{{ formatNullable(syndromeSummary.organScores.spleen) }}</span>
                </button>

                <button class="organ-score-btn" :class="{ missing: isOrganMissing('lung') }" @click="goToOrganAssessment('lung')">
                  <span class="organ-score-label">肺</span>
                  <span class="organ-score-value">{{ formatNullable(syndromeSummary.organScores.lung) }}</span>
                </button>

                <button class="organ-score-btn" :class="{ missing: isOrganMissing('kidney') }" @click="goToOrganAssessment('kidney')">
                  <span class="organ-score-label">肾</span>
                  <span class="organ-score-value">{{ formatNullable(syndromeSummary.organScores.kidney) }}</span>
                </button>

                <button class="organ-score-btn" :class="{ missing: isOrganMissing('liver') }" @click="goToOrganAssessment('liver')">
                  <span class="organ-score-label">肝</span>
                  <span class="organ-score-value">{{ formatNullable(syndromeSummary.organScores.liver) }}</span>
                </button>
              </div>

              <div class="assessment-guide-box">
                <p class="guide-text">点击上方脏腑字即可进入专项评测；推荐先评测：{{ ORGAN_LABELS[getRecommendedOrganKey()] }}</p>
                <button class="assessment-guide-btn" @click="goToOrganAssessment(getRecommendedOrganKey())">
                  一键去做{{ ORGAN_LABELS[getRecommendedOrganKey()] }}专项评测
                </button>
              </div>
              <button class="assessment-entry-btn" @click="goToAssessment">进入问诊评测</button>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧：四诊记录时间轴 -->
      <section class="records-section">
        <div class="card standard-card">
          <div class="card-header sticky-header">
            <h2 class="card-title">四诊历史库</h2>
            <!-- 现代化的胶囊 Tabs -->
            <div class="pill-tabs">
              <button class="pill" :class="{ active: activeTab === 'tongue' }" @click="activeTab = 'tongue'">舌诊</button>
              <button class="pill" :class="{ active: activeTab === 'consult' }" @click="activeTab = 'consult'">问诊</button>
              <button class="pill" :class="{ active: activeTab === 'herb' }" @click="activeTab = 'herb'">识草</button>
            </div>
          </div>

          <div class="records-content">
            <transition name="fade-slide" mode="out-in">
              <!-- 舌诊记录 -->
              <div v-if="activeTab === 'tongue'" class="timeline" key="tongue">
                <div class="timeline-item clickable" v-for="item in tongueRecords" :key="item.id" @click="openRecordReport('tongue', item)">
                  <div class="time-marker">{{ item.date }}</div>
                  <div class="record-bubble">
                    <h4>{{ item.title }}</h4>
                    <p>{{ item.desc }}</p>
                  </div>
                </div>
              </div>

              <!-- 问诊记录 -->
              <div v-else-if="activeTab === 'consult'" class="timeline" key="consult">
                <div class="timeline-item clickable" v-for="item in consultRecords" :key="item.id" @click="openRecordReport('consult', item)">
                  <div class="time-marker">{{ item.date }}</div>
                  <div class="record-bubble consult-bubble">
                    <h4>{{ item.title }}</h4>
                    <div class="tags">
                      <span v-for="s in item.symptoms" :key="s">{{ s }}</span>
                    </div>
                    <p class="conclusion-text"><strong>初筛：</strong>{{ item.conclusion }}</p>
                  </div>
                </div>
              </div>

              <!-- 草药记录 -->
              <div v-else-if="activeTab === 'herb'" class="timeline" key="herb">
                <div class="timeline-item clickable" v-for="item in herbRecords" :key="item.id" @click="openRecordReport('herb', item)">
                  <div class="time-marker">{{ item.date }}</div>
                  <div class="record-bubble herb-bubble">
                    <div class="herb-header">
                      <span class="herb-avatar">{{ item.name.charAt(0) }}</span>
                      <h4>{{ item.name }}</h4>
                    </div>
                    <p>{{ item.effect }}</p>
                  </div>
                </div>
              </div>
            </transition>
          </div>
        </div>
      </section>

    </main>

    <!-- 报告弹窗：点击记录后页内展示，不跳转 -->
    <div v-if="reportModalVisible" class="report-modal-mask" @click.self="closeReportModal">
      <article class="report-modal-card">
        <header class="report-modal-header">
          <div class="report-head-main">
            <p class="report-type">{{ activeReport?.typeLabel }}</p>
            <h3 class="report-title">{{ activeReport?.title }}</h3>
            <p class="report-date">记录时间：{{ activeReport?.date || '--' }}</p>
          </div>
          <button class="report-close" @click="closeReportModal" aria-label="关闭报告">×</button>
        </header>

        <div class="report-modal-body">
          <section class="report-block">
            <h4>核心判断</h4>
            <p>{{ activeReport?.summary }}</p>
          </section>

          <section v-if="activeReport?.highlights?.length" class="report-block">
            <h4>关键要点</h4>
            <ul class="report-list">
              <li v-for="point in activeReport.highlights" :key="point">{{ point }}</li>
            </ul>
          </section>

          <section v-if="activeReport?.advice?.length" class="report-block">
            <h4>调养建议</h4>
            <ul class="report-list advice-list-in-modal">
              <li v-for="tip in activeReport.advice" :key="tip">{{ tip }}</li>
            </ul>
          </section>
        </div>
      </article>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import * as echarts from 'echarts'
import { TOKEN_KEY, ORGAN_LABELS } from './personal-center/constants'
import { formatNullable } from './personal-center/utils'
import { useProfileMeta } from './personal-center/useProfileMeta'
import { useReportModal } from './personal-center/useReportModal'
import { useRecordsData } from './personal-center/useRecordsData'
import { useSyndromeAnalysis } from './personal-center/useSyndromeAnalysis'

const router = useRouter()
const JAVA_API_BASE_URL = (import.meta.env.VITE_JAVA_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

const activeTab = ref('tongue')
const isRefreshing = ref(false)
const radarRef = ref(null)
let chartInstance = null

const {
  displayName,
  cultivationDaysText,
  avatarUrl,
  loadCurrentUser,
  getUserIdentity
} = useProfileMeta()

const {
  reportModalVisible,
  activeReport,
  closeReportModal,
  openRecordReport
} = useReportModal()

const {
  rawTongueData,
  rawConsultData,
  tongueRecords,
  consultRecords,
  herbRecords,
  loadAllRecords
} = useRecordsData({
  javaApiBaseUrl: JAVA_API_BASE_URL,
  tokenKey: TOKEN_KEY
})

const {
  syndromeSummary,
  isOrganMissing,
  getRecommendedOrganKey,
  hydrateSyndromeFromCache,
  runSyndromeAnalysis,
  buildOrganAssessmentPrompt
} = useSyndromeAnalysis({
  aiApiBaseUrl: JAVA_API_BASE_URL,
  rawTongueData,
  rawConsultData,
  getUserIdentity,
  tokenKey: TOKEN_KEY
})

const goToAssessment = () => {
  router.push('/consultation')
}

const goToOrganAssessment = (organKey) => {
  const prompt = buildOrganAssessmentPrompt(organKey)
  router.push({
    path: '/consultation',
    query: {
      focus: organKey,
      autoSend: '1',
      presetPrompt: prompt
    }
  })
}

// 返回逻辑
const goBack = () => {
  if (router) {
    router.push('/')
  } else {
    window.history.back()
  }
}

// 页面加载时执行数据获取
onMounted(async () => {
  loadCurrentUser()
  hydrateSyndromeFromCache()
  initRadarChart()
  await loadAllRecords()
  await runSyndromeAnalysis()
  initRadarChart()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (chartInstance) {
    chartInstance.dispose()
    chartInstance = null
  }
})

const handleResize = () => {
  chartInstance?.resize()
}

// 重新推演交互
const refreshAnalysis = () => {
  if (isRefreshing.value) return
  isRefreshing.value = true

  ;(async () => {
    try {
      await loadAllRecords()
      await runSyndromeAnalysis({ force: true })
      initRadarChart()
    } finally {
      isRefreshing.value = false
    }
  })()
}

// Echarts 配置 (现代化、清爽的翡翠绿/青绿配色)
const initRadarChart = () => {
  if (!radarRef.value) return
  if (chartInstance) {
    chartInstance.dispose()
  }

  const radarValues = [
    syndromeSummary.value.organScores.heart ?? 0,
    syndromeSummary.value.organScores.spleen ?? 0,
    syndromeSummary.value.organScores.lung ?? 0,
    syndromeSummary.value.organScores.kidney ?? 0,
    syndromeSummary.value.organScores.liver ?? 0
  ]
  
  chartInstance = echarts.init(radarRef.value)
  
  const option = {
    animationDuration: 1000,
    animationEasing: 'cubicOut',
    radar: {
      alignTicks: false,
      indicator: [
        { name: '心', max: 100 },
        { name: '脾', max: 100 },
        { name: '肺', max: 100 },
        { name: '肾', max: 100 },
        { name: '肝', max: 100 }
      ],
      shape: 'circle',
      radius: '65%',
      axisName: {
        color: '#4A5568',
        fontSize: 14,
        fontWeight: 600,
        fontFamily: 'system-ui, sans-serif'
      },
      splitNumber: 4,
      splitLine: {
        lineStyle: { color: 'rgba(59, 110, 90, 0.15)', type: 'dashed' }
      },
      splitArea: { 
        show: true,
        areaStyle: { color: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.4)'] }
      },
      axisLine: { lineStyle: { color: 'rgba(59, 110, 90, 0.2)' } }
    },
    series: [
      {
        type: 'radar',
        data: [
          {
            value: radarValues,
            name: '当前状态',
            areaStyle: { 
              color: new echarts.graphic.RadialGradient(0.5, 0.5, 1, [
                { offset: 0, color: 'rgba(59, 110, 90, 0.6)' },
                { offset: 1, color: 'rgba(59, 110, 90, 0.1)' }
              ])
            },
            lineStyle: { color: '#3B6E5A', width: 2 },
            itemStyle: { 
              color: '#3B6E5A',
              borderColor: '#FFF',
              borderWidth: 2,
            }
          }
        ]
      }
    ]
  }
  
  chartInstance.setOption(option)
}
</script>

<style scoped>
/* 现代医疗级 新中式配色体系 */
.dashboard-container {
  --page-max-width: 1480px;
  --bg-main: #F9F9F8; /* 极浅的暖白 */
  --card-bg: #FFFFFF;
  --text-primary: #1A202C;
  --text-regular: #4A5568;
  --text-light: #A0AEC0;
  
  /* 主色调：青绿/石绿 (象征健康、草本) */
  --jade-primary: #3B6E5A;
  --jade-light: #EBF1EF;
  --jade-hover: #2D5445;
  
  /* 点缀色：朱砂红 */
  --cinnabar: #C25746;
  
  --border-color: #EDF2F7;
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.02);
  --shadow-md: 0 8px 30px rgba(0, 0, 0, 0.04);
  --shadow-lg: 0 20px 40px rgba(59, 110, 90, 0.08);

  min-height: 100vh;
  background-color: var(--bg-main);
  color: var(--text-primary);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  position: relative;
  padding-bottom: 60px;
}

/* 极弱的背景噪点，增加一点点纸张质感，但不抢眼 */
.bg-noise {
  position: fixed;
  inset: 0;
  background-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" opacity="0.015"><filter id="n"><feTurbulence type="fractalNoise" baseFrequency="0.7" stitchTiles="stitch"/></filter><rect width="100" height="100" filter="url(%23n)"/></svg>');
  pointer-events: none;
  z-index: 0;
}

/* === 顶部导航 === */
.dash-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(249, 249, 248, 0.8);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-color);
  padding: 16px 0;
}

.header-content {
  max-width: var(--page-max-width);
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.back-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: var(--text-regular);
  font-size: 15px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: all 0.2s;
}

.back-btn:hover {
  background: var(--jade-light);
  color: var(--jade-primary);
}

.icon-back {
  width: 18px;
  height: 18px;
}

.user-profile {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-wrapper {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid #FFF;
  box-shadow: var(--shadow-sm);
  background: var(--jade-light);
}

.avatar { width: 100%; height: 100%; }

.user-name {
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 4px 0;
}

.user-badges {
  display: flex;
  gap: 8px;
}

.badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

.badge.days { background: var(--jade-primary); color: #FFF; }
.badge.status { background: #EDF2F7; color: var(--text-regular); }

/* === 主内容区 === */
.dash-layout {
  max-width: var(--page-max-width);
  margin: 32px auto 0;
  padding: 0 24px;
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 32px;
  position: relative;
  z-index: 10;
}

/* 通用卡片样式 */
.card {
  background: var(--card-bg);
  border-radius: 20px;
  box-shadow: var(--shadow-md);
  overflow: hidden;
}

.card-header {
  padding: 24px 24px 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--border-color);
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
  color: var(--text-primary);
}

/* === 左侧：综合辨证卡片 === */
.premium-card {
  box-shadow: var(--shadow-lg);
  border: 1px solid rgba(59, 110, 90, 0.1);
  position: sticky;
  top: 100px; /* 滚动时停留在屏幕上 */
}

/* 刷新按钮 */
.refresh-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  background: var(--jade-light);
  color: var(--jade-primary);
  border: none;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.refresh-btn:hover:not(:disabled) {
  background: var(--jade-primary);
  color: #FFF;
}

.refresh-btn:disabled {
  opacity: 0.7;
  cursor: wait;
}

.icon-refresh { width: 14px; height: 14px; }
.icon-loading { width: 14px; height: 14px; animation: spin 1s linear infinite; }

@keyframes spin { 100% { transform: rotate(360deg); } }

.overview-body {
  padding: 32px 24px;
  transition: filter 0.3s;
}

.overview-body.blur-state {
  filter: blur(4px) opacity(0.6);
}

/* 结论标签 */
.syndrome-badge {
  text-align: center;
  margin-bottom: 24px;
}

.syndrome-badge.clickable {
  cursor: pointer;
}

.syndrome-badge.clickable:hover .result-text {
  color: var(--jade-hover);
}

.syndrome-badge .label {
  font-size: 12px;
  color: var(--text-light);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.result-text {
  font-size: 32px;
  font-weight: 700;
  color: var(--jade-primary);
  margin: 4px 0 0;
  font-family: "Noto Serif SC", serif; /* 仅核心结论使用衬线体保留中式韵味 */
}

.assessment-tip {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--text-light);
}

/* 雷达图 */
.radar-wrapper {
  width: 100%;
  height: 280px;
  margin-bottom: 24px;
}

.radar-chart { width: 100%; height: 100%; }

/* 建议列表 */
.advice-section {
  background: #FAFAFA;
  border-radius: 12px;
  padding: 20px;
  border: 1px solid var(--border-color);
}

.advice-title {
  font-size: 15px;
  font-weight: 600;
  margin: 0 0 16px 0;
  color: var(--text-primary);
}

.advice-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.advice-list li {
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-regular);
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.dot {
  width: 6px;
  height: 6px;
  background: var(--jade-primary);
  border-radius: 50%;
  margin-top: 8px;
  flex-shrink: 0;
}

.advice-list strong { color: var(--text-primary); }

.organ-score-row {
  margin-top: 14px;
  padding-top: 12px;
  border-top: 1px dashed var(--border-color);
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 6px;
  font-size: 12px;
  color: var(--text-regular);
}

.organ-score-btn {
  border: 1px solid var(--border-color);
  background: #fff;
  color: var(--text-regular);
  border-radius: 10px;
  font-size: 12px;
  line-height: 1;
  padding: 8px 8px;
  cursor: pointer;
  text-align: left;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.organ-score-btn:hover {
  border-color: rgba(59, 110, 90, 0.35);
  background: var(--jade-light);
}

.organ-score-btn.missing {
  border-color: rgba(194, 87, 70, 0.3);
  background: rgba(194, 87, 70, 0.08);
  color: var(--cinnabar);
}

.organ-score-label {
  font-weight: 600;
}

.organ-score-value {
  opacity: 0.9;
}

.assessment-guide-box {
  margin-top: 10px;
  padding: 10px;
  border: 1px dashed rgba(59, 110, 90, 0.25);
  border-radius: 10px;
  background: #fcfefd;
}

.guide-text {
  margin: 0 0 8px;
  font-size: 12px;
  color: var(--text-regular);
}

.assessment-guide-btn {
  width: 100%;
  border: none;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  background: #2f5b4c;
  cursor: pointer;
}

.assessment-guide-btn:hover {
  background: var(--jade-hover);
}

.assessment-entry-btn {
  margin-top: 14px;
  width: 100%;
  border: none;
  border-radius: 10px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 600;
  color: #FFF;
  background: var(--jade-primary);
  cursor: pointer;
  transition: background 0.2s;
}

.assessment-entry-btn:hover {
  background: var(--jade-hover);
}

/* === 右侧：四诊记录时间轴 === */
.standard-card {
  min-height: 600px;
}

.sticky-header {
  position: sticky;
  top: 0;
  background: var(--card-bg);
  z-index: 10;
}

/* 胶囊 Tabs */
.pill-tabs {
  display: flex;
  background: #F1F5F9;
  border-radius: 24px;
  padding: 4px;
}

.pill {
  background: transparent;
  border: none;
  padding: 6px 20px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-regular);
  cursor: pointer;
  transition: all 0.2s;
}

.pill:hover { color: var(--text-primary); }

.pill.active {
  background: #FFF;
  color: var(--jade-primary);
  box-shadow: 0 2px 4px rgba(0,0,0,0.05);
}

.records-content {
  padding: 32px 40px;
}

/* 列表切换动画 */
.fade-slide-enter-active,
.fade-slide-leave-active { transition: all 0.3s ease; }
.fade-slide-enter-from { opacity: 0; transform: translateY(10px); }
.fade-slide-leave-to { opacity: 0; transform: translateY(-10px); }

/* 时间轴样式 */
.timeline {
  display: flex;
  flex-direction: column;
  gap: 32px;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 36px;
  top: 8px;
  bottom: 0;
  width: 2px;
  background: var(--border-color);
  z-index: 0;
}

.timeline-item {
  display: flex;
  gap: 24px;
  position: relative;
  z-index: 1;
}

.timeline-item.clickable {
  cursor: pointer;
}

.timeline-item.clickable:hover .record-bubble {
  border-color: rgba(59, 110, 90, 0.35);
}

.time-marker {
  width: 48px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-light);
  padding-top: 12px;
  text-align: right;
  flex-shrink: 0;
  position: relative;
}

/* 时间轴圆点 */
.time-marker::after {
  content: '';
  position: absolute;
  right: -29px; /* 精确定位到线上 */
  top: 16px;
  width: 10px;
  height: 10px;
  background: var(--card-bg);
  border: 2px solid var(--jade-primary);
  border-radius: 50%;
}

.record-bubble {
  flex: 1;
  background: #F8FAFC;
  border: 1px solid var(--border-color);
  padding: 20px;
  border-radius: 16px;
  border-top-left-radius: 4px; /* 气泡尾巴感 */
  transition: transform 0.2s, box-shadow 0.2s;
}

.record-bubble:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
  border-color: rgba(59, 110, 90, 0.2);
}

.record-bubble h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  color: var(--text-primary);
}

.record-bubble p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--text-regular);
}

/* 问诊气泡特殊样式 */
.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 12px;
}
.tags span {
  font-size: 12px;
  background: #EDF2F7;
  color: var(--text-regular);
  padding: 2px 8px;
  border-radius: 4px;
}
.conclusion-text strong { color: var(--cinnabar); }

/* 草药气泡特殊样式 */
.herb-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}
.herb-avatar {
  width: 32px;
  height: 32px;
  background: var(--jade-light);
  color: var(--jade-primary);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 14px;
}
.herb-header h4 { margin: 0; }

/* 记录报告弹窗 */
.report-modal-mask {
  position: fixed;
  inset: 0;
  z-index: 100;
  background: rgba(15, 23, 42, 0.38);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.report-modal-card {
  width: min(760px, 100%);
  max-height: 85vh;
  overflow: hidden;
  background: #FFF;
  border-radius: 18px;
  border: 1px solid var(--border-color);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.2);
  display: flex;
  flex-direction: column;
}

.report-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  padding: 22px 24px 16px;
  border-bottom: 1px solid var(--border-color);
}

.report-head-main {
  min-width: 0;
}

.report-type {
  margin: 0 0 6px;
  color: var(--jade-primary);
  font-weight: 700;
  font-size: 12px;
  letter-spacing: 0.6px;
}

.report-title {
  margin: 0;
  font-size: 22px;
  color: var(--text-primary);
}

.report-date {
  margin: 8px 0 0;
  font-size: 13px;
  color: var(--text-light);
}

.report-close {
  border: none;
  background: var(--jade-light);
  color: var(--jade-primary);
  width: 32px;
  height: 32px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 22px;
  line-height: 1;
}

.report-modal-body {
  overflow-y: auto;
  padding: 20px 24px 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.report-block {
  background: #FAFAFA;
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 14px 16px;
}

.report-block h4 {
  margin: 0 0 8px;
  font-size: 15px;
  color: var(--text-primary);
}

.report-block p {
  margin: 0;
  font-size: 14px;
  line-height: 1.75;
  color: var(--text-regular);
  white-space: pre-wrap;
}

.report-list {
  margin: 0;
  padding-left: 18px;
  color: var(--text-regular);
  font-size: 14px;
  line-height: 1.7;
}

.advice-list-in-modal li {
  color: #2F5B4C;
}


/* 响应式布局：手机端堆叠 */
@media (max-width: 900px) {
  .dash-layout {
    grid-template-columns: 1fr;
    gap: 24px;
    margin-top: 16px;
  }
  
  .premium-card {
    position: static; /* 取消手机端的 sticky */
  }

  .timeline::before { left: 24px; }
  .time-marker { width: auto; padding-top: 0; text-align: left; margin-bottom: 8px;}
  .time-marker::after { display: none; }
  
  .timeline-item { flex-direction: column; gap: 8px; }
  .record-bubble { border-radius: 12px; }
  
  .card-header { flex-direction: column; gap: 16px; align-items: flex-start;}
  .pill-tabs { width: 100%; justify-content: space-between;}
  .pill { flex: 1; text-align: center; }
  
  .records-content { padding: 24px 20px; }

  .organ-score-row {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .report-modal-card {
    max-height: 88vh;
  }

  .report-title {
    font-size: 18px;
  }
}
</style>