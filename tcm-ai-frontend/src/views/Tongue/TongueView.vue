<template>
  <div class="app-container">
    <header class="page-nav-bar fixed top-0 left-0 right-0 bg-ancient-tan text-white text-center py-3 text-lg font-bold shadow-md z-30 flex items-center justify-center gap-4 md:gap-6">
      <span class="page-nav-title whitespace-nowrap">中医智能望诊</span>
      <div class="page-nav-items flex items-center gap-3 md:gap-4">
        <button @click="goToAiTongue" class="page-nav-item flex flex-col items-center transition-colors duration-200" :class="{ active: currentPage === 'aiTongue' }" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
          <i class="fa-solid fa-face-smile text-base md:text-lg"></i>
          <span class="text-xs mt-0.5 hidden md:inline">AI舌诊</span>
        </button>
        <button @click="goToAiConsult" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
          <i class="fa-solid fa-user-doctor text-base md:text-lg"></i>
          <span class="text-xs mt-0.5 hidden md:inline">AI问诊</span>
        </button>
        <button @click="goToHerbRecog" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
          <i class="fa-solid fa-leaf text-base md:text-lg"></i>
          <span class="text-xs mt-0.5 hidden md:inline">中药识别</span>
        </button>
        <button @click="goToTcmScience" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
          <i class="fa-solid fa-book-open text-base md:text-lg"></i>
          <span class="text-xs mt-0.5 hidden md:inline">中医科普</span>
        </button>
        <button @click="goToHome" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
          <i class="fa-solid fa-house text-base md:text-lg"></i>
          <span class="text-xs mt-0.5 hidden md:inline">返回首页</span>
        </button>
      </div>
    </header>

    <div class="container">
      <div class="main-grid">
        <div class="card capture-card">
          <h2 class="card-title">📷 舌象采集</h2>
          <div class="tongue-camera-box">
            <video ref="videoRef" class="preview-img" autoplay muted playsinline></video>
            <img v-if="uploadedImageUrl" :src="uploadedImageUrl" class="preview-img" alt="舌象预览">
            <div v-if="!isCameraActive && !uploadedImageUrl" class="camera-tip">
              <i class="icon icon-camera"></i>
              <p>点击拍摄/上传舌象</p>
            </div>
            <svg class="tongue-outline" viewBox="0 0 100 60">
              <path d="M50 0 C70 0,90 20,90 40 C90 55,70 60,50 60 C30 60,10 55,10 40 C10 20,30 0,50 0 Z" fill="none" stroke="#A67C52" stroke-width="2"/>
            </svg>
          </div>
          <div class="btn-group">
            <button @click="handleCameraClick" class="btn btn-darkgreen"><i class="icon icon-video"></i> 拍摄照片</button>
            <button @click="selectPhoto" class="btn btn-darkgreen"><i class="icon icon-image"></i> 从相册选择</button>
            <button @click="analyzeTongue" class="btn btn-darkgreen"><i class="icon icon-search"></i> 开始分析</button>
          </div>
          <input type="file" ref="fileInputRef" accept="image/*" class="file-input" @change="loadPhoto">
          <div v-if="thumbUrl" class="mini-thumb">
            <img :src="thumbUrl" alt="当前舌象">
            <span>当前舌象</span>
          </div>
        </div>

        <div class="right-area">
          <div class="card result-card">
            <h2 class="card-title">📊 AI辨证结果</h2>
            <div v-if="showAnalysis" class="diagnosis-badge">
              <span class="badge">{{ diagnosis }}</span>
            </div>
            <div v-if="showAnalysis" class="suggestion-list">
              <div class="suggestion-item"><span class="label">🍵 食疗方：</span>{{ dietSuggestion }}</div>
              <div class="suggestion-item"><span class="label">📍 穴位按压：</span>{{ acupointSuggestion }}</div>
            </div>
            <div v-else class="empty-placeholder">请先上传舌象并点击“开始分析”</div>
          </div>

          <div class="card viz-card">
            <h2 class="card-title">📈 舌诊可视化分析</h2>
            <div class="viz-row">
              <div class="metrics-panel">
                <div v-for="metric in tongueMetrics" :key="metric.name" class="metric-item">
                  <div class="metric-label">{{ metric.name }}</div>
                  <div class="progress-bar-bg">
                    <div class="progress-bar-fill" :style="{ width: metric.score + '%', backgroundColor: metric.color }"></div>
                  </div>
                  <div class="metric-score">{{ metric.score }}分</div>
                </div>
              </div>
              <div class="trend-panel">
                <div class="trend-title">近7次舌诊湿热指数趋势</div>
                <canvas ref="trendCanvas" width="300" height="160" style="width:100%; height:auto; max-width:300px; background:#FEF9E6; border-radius:12px;"></canvas>
                <div v-if="trendDataPoints.length === 0" class="trend-tip">暂无历史数据，生成报告后将显示趋势</div>
              </div>
            </div>
          </div>

          <div class="card action-card">
            <div class="action-row">
              <button @click="generateReport" class="btn btn-darkgreen btn-generate"><i class="icon icon-file"></i> 生成舌诊报告</button>
              <div class="calendar-section">
                <div class="calendar-title">
                  <span>📅 7日舌疗打卡</span>
                  <span v-if="checkInDays.length >= 3" class="checkin-tip">连续3天打卡！改善效果增强✨</span>
                </div>
                <div class="calendar">
                  <div v-for="day in 7" :key="day" class="calendar-day" :class="{ active: checkInDays.includes(day) }" @click="toggleCheckIn(day)">
                    {{ day }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-if="showReportModal" class="modal-overlay" @click.self="closeReportModal">
      <div class="report-card">
        <div class="herb-decoration herb-tl">🌿</div><div class="herb-decoration herb-tr">🍃</div>
        <div class="herb-decoration herb-bl">🌱</div><div class="herb-decoration herb-br">🌾</div>
        <div class="report-header"><h2>🌿 智能舌诊报告 🌾</h2><p class="report-date">{{ reportDate }}</p></div>
        <div class="report-body">
          <div class="tongue-thumb"><img :src="thumbUrl || uploadedImageUrl" alt="舌象缩略图"></div>
          <div class="report-details">
            <div class="detail-item"><span class="label">📋 辨证结果：</span><span class="value">{{ diagnosis }}</span></div>
            <div class="detail-item"><span class="label">🍵 食疗建议：</span><span class="value">{{ dietSuggestion }}</span></div>
            <div class="detail-item"><span class="label">📍 穴位按压：</span><span class="value">{{ acupointSuggestion }}</span></div>
            <div class="detail-item"><span class="label">💡 养生提醒：</span><span class="value">少食肥甘厚味，适当运动，调畅情志。</span></div>
          </div>
        </div>
        <div class="report-footer">
          <div class="herb-note">望闻问切 · 四诊合参</div>
          <div class="report-actions"><button @click="copyReportText" class="btn-copy">📋 复制报告</button><button @click="closeReportModal" class="btn-close">关闭</button></div>
          <div class="disclaimer">* 本报告仅供参考，请勿作为诊疗依据，必要时请咨询中医师。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const currentPage = ref('aiTongue')

const goToHome = () => router.push({ name: 'home' })
const goToAiTongue = () => router.push({ name: 'tongue' })
const goToAiConsult = () => router.push({ name: 'consultation' })
const goToHerbRecog = () => router.push({ name: 'herb' })
const goToTcmScience = () => router.push({ name: 'science' })

const videoRef = ref(null)
const fileInputRef = ref(null)
const trendCanvas = ref(null)

const uploadedImageUrl = ref('')
const isCameraActive = ref(false)
const cameraPermissionGranted = ref(false)
let mediaStream = null

const thumbUrl = ref('')
const visualUrl = ref('')
const showAnalysis = ref(false)
const diagnosis = ref('湿热证候 87%')
const dietSuggestion = ref('薏米红豆粥、冬瓜海带汤')
const acupointSuggestion = ref('足三里、阴陵泉（每日2次）')
const REPORT_HISTORY_KEY = 'tongueReportHistory'

const checkInDays = ref(JSON.parse(localStorage.getItem('tongueCheckIn') || '[]'))
const reportHistory = ref(JSON.parse(localStorage.getItem(REPORT_HISTORY_KEY) || '[]'))

const showReportModal = ref(false)
const reportDate = ref('')

const tongueMetrics = ref([
  { name: '舌色淡红', score: 85, color: '#E57373' },
  { name: '舌苔薄白', score: 70, color: '#FFB74D' },
  { name: '舌形适中', score: 80, color: '#81C784' },
  { name: '齿痕指数', score: 65, color: '#64B5F6' },
  { name: '裂纹/腻苔', score: 60, color: '#9575CD' }
])

const trendDataPoints = ref([])

const extractHeatScore = (diagStr) => {
  const match = diagStr.match(/(\d+)%/)
  if (match) return parseInt(match[1], 10)
  return 70
}

const updateMetricsByDiagnosis = (heatPercent) => {
  tongueMetrics.value = [
    { name: '舌色淡红', score: Math.min(95, Math.max(40, 85 - (heatPercent - 70) * 0.5)), color: '#E57373' },
    { name: '舌苔质地', score: Math.min(95, Math.max(30, 80 - (heatPercent - 60) * 1.2)), color: '#FFB74D' },
    { name: '舌形适中', score: Math.min(95, Math.max(50, 80 - (heatPercent - 70) * 0.8)), color: '#81C784' },
    { name: '齿痕/胖大', score: Math.min(90, Math.max(40, 70 - (heatPercent - 65) * 1.0)), color: '#64B5F6' },
    { name: '腻苔/裂纹', score: Math.min(90, Math.max(30, 65 - (heatPercent - 60) * 1.3)), color: '#9575CD' }
  ]
  tongueMetrics.value.forEach(m => { m.score = Math.round(m.score) })
}

const drawTrendChart = () => {
  if (!trendCanvas.value) return
  const canvas = trendCanvas.value
  const ctx = canvas.getContext('2d')
  const width = canvas.clientWidth
  const height = canvas.clientHeight
  canvas.width = width
  canvas.height = height

  const scores = reportHistory.value.slice(0, 7).map(entry => extractHeatScore(entry.diagnosis || '湿热证候 70%')).reverse()
  if (scores.length === 0) {
    ctx.clearRect(0, 0, width, height)
    ctx.fillStyle = '#B2977A'
    ctx.font = '12px "Noto Serif SC"'
    ctx.fillText('暂无数据', width / 2 - 30, height / 2)
    trendDataPoints.value = []
    return
  }

  trendDataPoints.value = scores
  const padding = { top: 20, right: 20, bottom: 20, left: 30 }
  const graphWidth = width - padding.left - padding.right
  const graphHeight = height - padding.top - padding.bottom
  const maxScore = Math.max(100, ...scores)
  const minScore = Math.min(40, ...scores)

  ctx.clearRect(0, 0, width, height)
  ctx.save()
  ctx.translate(padding.left, padding.top)

  ctx.beginPath()
  ctx.strokeStyle = '#A67C52'
  ctx.lineWidth = 1
  ctx.moveTo(0, 0)
  ctx.lineTo(0, graphHeight)
  ctx.lineTo(graphWidth, graphHeight)
  ctx.stroke()

  for (let i = 0; i <= 4; i++) {
    const y = (i / 4) * graphHeight
    ctx.beginPath()
    ctx.strokeStyle = '#E6D5B8'
    ctx.moveTo(0, y)
    ctx.lineTo(graphWidth, y)
    ctx.stroke()
    ctx.fillStyle = '#8B6B42'
    ctx.font = '10px sans-serif'
    ctx.fillText(Math.round(maxScore - (i / 4) * (maxScore - minScore)), -25, y + 3)
  }

  if (scores.length === 1) {
    const x = graphWidth / 2
    const y = graphHeight - (scores[0] - minScore) / (maxScore - minScore) * graphHeight
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, 2 * Math.PI)
    ctx.fillStyle = '#1C3B2F'
    ctx.fill()
  } else {
    const stepX = graphWidth / (scores.length - 1)
    const points = scores.map((score, idx) => ({
      x: idx * stepX,
      y: graphHeight - (score - minScore) / (maxScore - minScore) * graphHeight
    }))
    ctx.beginPath()
    ctx.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y)
    }
    ctx.strokeStyle = '#1C3B2F'
    ctx.lineWidth = 2.5
    ctx.stroke()
    points.forEach((point, index) => {
      ctx.beginPath()
      ctx.arc(point.x, point.y, 3, 0, 2 * Math.PI)
      ctx.fillStyle = '#C62828'
      ctx.fill()
      ctx.fillStyle = '#5C3A21'
      ctx.font = '10px sans-serif'
      ctx.fillText(scores[index] + '%', point.x - 8, point.y - 5)
    })
  }
  ctx.restore()
}

watch(reportHistory, () => {
  drawTrendChart()
}, { deep: true })

const saveCheckIn = () => localStorage.setItem('tongueCheckIn', JSON.stringify(checkInDays.value))
const saveReportHistory = () => localStorage.setItem(REPORT_HISTORY_KEY, JSON.stringify(reportHistory.value))

const toggleCheckIn = (day) => {
  const index = checkInDays.value.indexOf(day)
  if (index > -1) checkInDays.value.splice(index, 1)
  else checkInDays.value.push(day)
  saveCheckIn()
}

const autoCheckIn = () => {
  for (let day = 1; day <= 7; day++) {
    if (!checkInDays.value.includes(day)) {
      checkInDays.value.push(day)
      saveCheckIn()
      alert(`🎉 恭喜完成第 ${day} 天舌疗打卡！继续坚持～`)
      return day
    }
  }
  alert('您已完成全部7天打卡！非常棒！')
  return null
}

const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  if (videoRef.value) videoRef.value.srcObject = null
  isCameraActive.value = false
}

const requestCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    mediaStream = stream
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      isCameraActive.value = true
      uploadedImageUrl.value = ''
      thumbUrl.value = ''
      showAnalysis.value = false
    }
  } catch (err) {
    alert('摄像头调用失败，请检查权限！')
    cameraPermissionGranted.value = false
  }
}

const handleCameraClick = () => {
  if (isCameraActive.value) {
    alert('摄像头已开启，请直接拍摄或点击“开始分析”')
    return
  }
  if (cameraPermissionGranted.value) requestCamera()
  else if (confirm('即将开启摄像头进行舌象拍摄，是否允许访问您的摄像头？')) {
    cameraPermissionGranted.value = true
    requestCamera()
  }
}

const selectPhoto = () => fileInputRef.value.click()

const loadPhoto = (event) => {
  const file = event.target.files[0]
  if (file) {
    const url = URL.createObjectURL(file)
    uploadedImageUrl.value = url
    thumbUrl.value = url
    if (isCameraActive.value) stopCamera()
    showAnalysis.value = false
    visualUrl.value = ''
  }
}

const captureFromCamera = () => new Promise((resolve, reject) => {
  const video = videoRef.value
  if (!video || video.readyState < 2) reject('摄像头未就绪')
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  canvas.toBlob(blob => blob ? resolve(URL.createObjectURL(blob)) : reject('截图失败'), 'image/png')
})

const analyzeTongue = async () => {
  let imageUrl = ''
  if (isCameraActive.value) {
    try {
      imageUrl = await captureFromCamera()
      thumbUrl.value = imageUrl
      stopCamera()
    } catch (err) {
      alert(err)
      return
    }
  } else if (uploadedImageUrl.value) {
    imageUrl = uploadedImageUrl.value
  } else {
    alert('请先拍摄或上传舌象！')
    return
  }

  visualUrl.value = imageUrl
  showAnalysis.value = true
  diagnosis.value = '湿热证候 87%'
  dietSuggestion.value = '薏米红豆粥、冬瓜海带汤'
  acupointSuggestion.value = '足三里、阴陵泉（每日2次）'
  updateMetricsByDiagnosis(extractHeatScore(diagnosis.value))
}

const generateReport = () => {
  if (!thumbUrl.value && !uploadedImageUrl.value) {
    alert('请先上传舌象并完成分析！')
    return
  }
  if (!showAnalysis.value) {
    alert('请先点击“开始分析”获取辨证结果！')
    return
  }

  autoCheckIn()
  const nowText = new Date().toLocaleString()
  reportDate.value = nowText
  const entry = {
    id: Date.now(),
    reportDate: nowText,
    diagnosis: diagnosis.value,
    dietSuggestion: dietSuggestion.value,
    acupointSuggestion: acupointSuggestion.value,
    summary: `${diagnosis.value}；食疗建议：${dietSuggestion.value}`
  }
  reportHistory.value = [entry, ...reportHistory.value].slice(0, 30)
  saveReportHistory()
  showReportModal.value = true
  drawTrendChart()
}

const copyReportText = () => {
  const reportText = `=== 智能舌诊报告 ===\n问诊时间：${reportDate.value}\n辨证结果：${diagnosis.value}\n食疗建议：${dietSuggestion.value}\n穴位建议：${acupointSuggestion.value}\n养生提醒：少食肥甘厚味，适当运动，调畅情志。\n——————————\n提示：本报告仅供参考，请勿作为诊疗依据。`
  navigator.clipboard.writeText(reportText).then(() => alert('报告内容已复制！')).catch(() => alert('复制失败'))
}

const closeReportModal = () => { showReportModal.value = false }

onMounted(() => {
  drawTrendChart()
  if (reportHistory.value.length > 0) {
    updateMetricsByDiagnosis(extractHeatScore(reportHistory.value[0].diagnosis || '湿热证候 70%'))
  }
})

onUnmounted(() => { stopCamera() })
</script>

<style scoped>
.page-nav-item.active {
  color: #E8D8B0 !important;
  filter: drop-shadow(0 0 6px rgba(194, 168, 120, 0.8));
}

.app-container {
  background-color: #F9F3E3;
  min-height: 100vh;
  padding-top: 150px;
  padding-bottom: 30px;
  font-family: 'Noto Serif SC', 'Ma Shan Zheng', serif;
}

.container {
  max-width: 1300px;
  margin: 0 auto;
  padding: 0 20px;
}

.main-grid {
  display: grid;
  grid-template-columns: 1fr 1.2fr;
  gap: 24px;
}

@media (max-width: 900px) {
  .main-grid {
    grid-template-columns: 1fr;
  }
}

.card {
  background: #FFFFFFE6;
  backdrop-filter: blur(2px);
  border-radius: 28px;
  box-shadow: 0 10px 20px rgba(92, 58, 33, 0.08);
  padding: 24px 20px;
  transition: transform 0.2s, box-shadow 0.2s;
  border: 1px solid #EFE2CF;
}

.card-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #5C3A21;
  border-left: 6px solid #A67C52;
  padding-left: 16px;
  margin-bottom: 20px;
}

.tongue-camera-box {
  width: 260px;
  height: 260px;
  margin: 0 auto;
  border-radius: 24px;
  border: 3px solid #D4B996;
  background: #F4EDE0;
  position: relative;
  overflow: hidden;
}

.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}

.tongue-outline {
  position: absolute;
  width: 200px;
  height: 120px;
  opacity: 0.35;
  pointer-events: none;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
}

.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-top: 20px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 48px;
  font-weight: 500;
  cursor: pointer;
  background-color: #1C3B2F;
  color: white;
  transition: all 0.2s;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-darkgreen {
  background-color: #1C3B2F;
}

.btn-darkgreen:hover {
  background-color: #0F2A20;
  transform: translateY(-2px);
}

.file-input {
  display: none;
}

.mini-thumb {
  margin-top: 16px;
  text-align: center;
  font-size: 12px;
  color: #8B6B42;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.mini-thumb img {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 1px solid #D4B996;
}

.right-area {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.result-card {
  background: #FFFBF5;
}

.diagnosis-badge {
  text-align: center;
  margin-bottom: 16px;
}

.badge {
  background: #E8D8B0;
  color: #5C3A21;
  padding: 8px 24px;
  border-radius: 48px;
  font-size: 1.4rem;
  font-weight: bold;
}

.suggestion-list {
  background: #FEF8EC;
  border-radius: 24px;
  padding: 16px;
}

.suggestion-item {
  margin-bottom: 12px;
  font-size: 0.95rem;
}

.label {
  font-weight: bold;
  color: #A67C52;
  margin-right: 6px;
}

.empty-placeholder {
  padding: 20px;
  text-align: center;
  color: #8B6B42;
  background: #FEF8EC;
  border-radius: 20px;
}

.viz-row {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  justify-content: space-between;
}

.metrics-panel {
  flex: 1;
  min-width: 180px;
}

.metric-item {
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.metric-label {
  width: 85px;
  font-size: 0.85rem;
  color: #5C3A21;
}

.progress-bar-bg {
  flex: 1;
  height: 12px;
  background: #E6D5B8;
  border-radius: 12px;
  overflow: hidden;
}

.progress-bar-fill {
  height: 100%;
  border-radius: 12px;
  transition: width 0.3s;
}

.metric-score {
  width: 40px;
  font-size: 0.8rem;
  color: #5C3A21;
  text-align: right;
}

.trend-panel {
  flex: 1;
  text-align: center;
  background: #FEF9E6;
  border-radius: 20px;
  padding: 12px;
}

.trend-title {
  font-size: 0.9rem;
  font-weight: bold;
  margin-bottom: 12px;
  color: #5C3A21;
}

.trend-tip {
  font-size: 12px;
  color: #B2977A;
  margin-top: 10px;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  align-items: center;
  justify-content: space-between;
}

.btn-generate {
  background: #A67C52;
  padding: 12px 28px;
  font-size: 1rem;
}

.calendar-section {
  background: #FDF7EA;
  border-radius: 28px;
  padding: 12px 16px;
  flex: 1;
}

.calendar-title {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 10px;
}

.checkin-tip {
  color: #2E7D32;
  font-size: 12px;
}

.calendar {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.calendar-day {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #F4EDDF;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: 0.2s;
  border: 1px solid #D4B996;
}

.calendar-day.active {
  background: #2E7D32;
  color: white;
  border-color: #2E7D32;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.report-card {
  background: #FFFDF5;
  max-width: 500px;
  width: 90%;
  border-radius: 40px;
  padding: 24px;
  position: relative;
  border: 2px solid #D4B996;
}

.herb-decoration {
  position: absolute;
  font-size: 28px;
  opacity: 0.5;
}

.herb-tl { top: 8px; left: 12px; }
.herb-tr { top: 8px; right: 12px; }
.herb-bl { bottom: 8px; left: 12px; }
.herb-br { bottom: 8px; right: 12px; }

.report-header {
  text-align: center;
  border-bottom: 2px solid #E6D5B8;
  margin-bottom: 16px;
}

.report-date {
  font-size: 0.85rem;
  color: #8B6B42;
  margin-top: 6px;
}

.report-body {
  display: flex;
  gap: 20px;
  align-items: center;
  flex-wrap: wrap;
  justify-content: center;
}

.tongue-thumb {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  border: 3px solid #D4B996;
}

.tongue-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.report-details {
  flex: 1;
  background: #FEF9E6;
  border-radius: 24px;
  padding: 12px;
}

.detail-item {
  margin-bottom: 8px;
  border-left: 3px solid #A67C52;
  padding-left: 10px;
}

.btn-copy,
.btn-close {
  background: #A67C52;
  color: white;
  border: none;
  padding: 6px 20px;
  border-radius: 30px;
  margin: 8px 4px;
  cursor: pointer;
}

.disclaimer {
  font-size: 10px;
  text-align: center;
  margin-top: 12px;
  color: #B2977A;
}

.icon {
  display: inline-block;
  width: 1.2em;
  height: 1.2em;
  background-size: contain;
  background-repeat: no-repeat;
  vertical-align: middle;
}

.icon-video { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z'%3E%3C/path%3E%3C/svg%3E"); }
.icon-image { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'%3E%3C/path%3E%3C/svg%3E"); }
.icon-search { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'%3E%3C/path%3E%3C/svg%3E"); }
.icon-file { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='white' d='M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z'%3E%3C/path%3E%3C/svg%3E"); }
.icon-camera { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%235C3A21' d='M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'%3E%3C/path%3E%3C/svg%3E"); }

.bg-ancient-tan {
  background-color: #1C2B26;
}
</style>