<template>
  <div class="app-container">
    <div class="header">智能望诊 · 望闻问切之"望"</div>

    <div class="container">
      <div class="main-row">
        <!-- 左侧 -->
        <div class="left-col card">
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
            <button @click="handleCameraClick" class="btn btn-tan">
              <i class="icon icon-video" style="margin-right:5px;"></i> 拍摄照片
            </button>
            <button @click="selectPhoto" class="btn btn-tan">
              <i class="icon icon-image" style="margin-right:5px;"></i> 从相册选择
            </button>
            <button @click="analyzeTongue" class="btn btn-green">
              <i class="icon icon-search" style="margin-right:5px;"></i> 开始分析
            </button>
          </div>
          <input type="file" ref="fileInputRef" accept="image/*" class="file-input" @change="loadPhoto">
        </div>

        <!-- 右侧 -->
        <div class="right-col card">
          <h2 class="card-title">📊 舌象分析结果</h2>

          <div class="result-thumb-wrap">
            <img v-if="thumbUrl" :src="thumbUrl" class="result-thumb" alt="舌象缩略图">
          </div>

          <div class="visual-area">
            <img v-if="visualUrl" :src="visualUrl" alt="舌象分析图">
            <p v-else style="color: #999;">请先上传舌象并分析</p>
          </div>

          <div v-if="showAnalysis" class="analysis-result">
            <p><strong>AI辨证：</strong><span style="color: #C62828;">{{ diagnosis }}</span></p>
            <div style="font-size: 14px; margin-top: 10px;">
              <p><strong>食疗方：</strong>{{ dietSuggestion }}</p>
              <p><strong>穴位按压：</strong>{{ acupointSuggestion }}</p>
            </div>
          </div>

          <button @click="generateReport" class="btn btn-tan btn-block">
            <i class="icon icon-file" style="margin-right:5px;"></i> 生成舌诊报告
          </button>

          <!-- 7日打卡 -->
          <div style="margin-top: 20px;">
            <div class="calendar-title">
              <span>📅 7日舌疗打卡</span>
              <span v-if="checkInDays.length >= 3" class="checkin-tip">连续3天打卡！改善效果增强✨</span>
              <button class="btn btn-tan" style="margin-left:12px;" @click="checkInToday">今日打卡</button>
            </div>
            <div class="calendar">
              <div v-for="day in 7" :key="day" class="calendar-day" :class="{ active: checkInDays.includes(day) }">
                {{ day }}
                <div class="day-tooltip" v-if="getRecordByDay(day)">
                  <img v-if="getRecordByDay(day).image" :src="getRecordByDay(day).image" alt="thumb" />
                  <div class="tt-text">{{ getRecordByDay(day).date || '—' }}<br>{{ formatTime(getRecordByDay(day).timestamp) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 报告模态框 -->
    <div v-if="showReportModal" class="modal-overlay" @click.self="closeReportModal">
      <div class="report-card">
        <div class="herb-decoration herb-tl">🌿</div>
        <div class="herb-decoration herb-tr">🍃</div>
        <div class="herb-decoration herb-bl">🌱</div>
        <div class="herb-decoration herb-br">🌾</div>
        
        <div class="report-header">
          <h2>🌿 智能舌诊报告 🌾</h2>
          <div class="herb-note">望闻问切 · 四诊合参</div>
          <div class="used-note" v-if="usedRecordForReport">
            使用的数据时间：{{ formatTimestamp(usedRecordForReport.timestamp) }}（以最后一次保存为准）
          </div>
        </div>

        <div class="report-body">
          <div class="tongue-thumb">
            <img :src="(usedRecordForReport && usedRecordForReport.image) || thumbUrl || uploadedImageUrl" alt="舌象缩略图">
          </div>
          <div class="report-details">
            <div class="detail-item">
              <span class="label">📋 辨证结果：</span>
              <span class="value">{{ diagnosis }}</span>
            </div>
            <div class="detail-item">
              <span class="label">🍵 食疗建议：</span>
              <span class="value">{{ dietSuggestion }}</span>
            </div>
            <div class="detail-item">
              <span class="label">📍 穴位按压：</span>
              <span class="value">{{ acupointSuggestion }}</span>
            </div>
            <div class="detail-item">
              <span class="label">💡 养生提醒：</span>
              <span class="value">少食肥甘厚味，适当运动，调畅情志。</span>
            </div>
          </div>
        </div>

        <div class="report-footer">
          <div class="herb-note">望闻问切 · 四诊合参</div>
          <div class="used-note" v-if="usedRecordForReport">
            使用的数据时间：{{ usedRecordForReport.date }} {{ formatTimestamp(usedRecordForReport.timestamp) }}（以最后一次保存为准）
          </div>
          <div class="report-actions">
            <button @click="copyReportText" class="btn-copy">📋 复制报告</button>
            <button @click="closeReportModal" class="btn-close">关闭</button>
          </div>
          <div class="disclaimer">* 本报告仅供参考，请勿作为诊疗依据，必要时请咨询中医师。</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted, computed } from 'vue'

// --- DOM 引用 ---
const videoRef = ref(null)
const fileInputRef = ref(null)

// --- 状态 ---
const uploadedImageUrl = ref('')
const isCameraActive = ref(false)
const cameraPermissionGranted = ref(false)   // 是否已获得用户许可
let mediaStream = null

const thumbUrl = ref('')
const visualUrl = ref('')
const showAnalysis = ref(false)
const diagnosis = ref('湿热证候 87%')
const dietSuggestion = ref('薏米红豆粥、冬瓜海带汤')
const acupointSuggestion = ref('足三里、阴陵泉（每日2次）')
const REPORT_HISTORY_KEY = 'tongueReportHistory'

// 打卡数据：存为数组 of { day: number, date: 'YYYY-MM-DD', timestamp: ISO string, image?: string }
const _stored = JSON.parse(localStorage.getItem('tongueCheckIn') || '[]')
const initialRecords = (Array.isArray(_stored) && _stored.length && typeof _stored[0] === 'number')
  ? _stored.map(d => ({ day: d, date: null, timestamp: new Date().toISOString(), image: null }))
  : (_stored || [])
const checkInRecords = ref(initialRecords)

const getDateOnly = (dt = new Date()) => dt.toISOString().slice(0, 10)

// 计算以今天为终点的连续打卡天数（按日期连续）
const computeConsecutiveStreak = (endDateStr = getDateOnly()) => {
  const dates = new Set(checkInRecords.value.map(r => r.date).filter(Boolean))
  let count = 0
  let cur = new Date(endDateStr)
  while (true) {
    const d = getDateOnly(cur)
    if (dates.has(d)) {
      count++
      // 前一天
      cur.setDate(cur.getDate() - 1)
    } else {
      break
    }
  }
  return count
}

// 兼容原模板：提供只含 day 数字的数组，便于模板使用 `checkInDays.includes(day)` 和 `checkInDays.length`
const checkInDays = computed(() => checkInRecords.value.map(r => r.day))

// 报告模态框
const showReportModal = ref(false)
const reportDate = ref('')
const usedRecordForReport = ref(null)

// 辅助：按 day 查找对应记录（若有）
const getRecordByDay = (day) => {
  return checkInRecords.value.find(r => r.day === day) || null
}

const formatTimestamp = (iso) => {
  if (!iso) return ''
  try { return new Date(iso).toLocaleString() } catch (e) { return iso }
}

const formatTime = (iso) => {
  if (!iso) return ''
  try { return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) } catch (e) { return iso }
}

// --- 打卡逻辑 ---
const saveCheckIn = () => {
  localStorage.setItem('tongueCheckIn', JSON.stringify(checkInRecords.value))
}

// 判断某天是否已打卡（按 day slot）
const isDayActive = (day) => {
  return checkInRecords.value.some(r => r.day === day)
}

// 今日打卡：按日期自动填充（用户不可手动指定保存到哪天）
const checkInToday = () => {
  const today = getDateOnly()
  const now = new Date().toISOString()
  const image = thumbUrl.value || uploadedImageUrl.value || null

  // 若当天已有记录则更新该记录（覆盖为最后一次保存）
  const todayIdx = checkInRecords.value.findIndex(r => r.date === today)
  if (todayIdx > -1) {
    checkInRecords.value[todayIdx].timestamp = now
    checkInRecords.value[todayIdx].image = image
    saveCheckIn()
    alert(`已更新今天打卡时间为 ${new Date(now).toLocaleString()}，将使用最后一次保存的数据`)
    // 检查连续并可能重置
    const streak = computeConsecutiveStreak()
    if (streak >= 7) {
      alert(`🎉 恭喜你已连续打卡 ${streak} 天，周期已完成并将重新开始！`)
      checkInRecords.value = []
      saveCheckIn()
    }
    return
  }

  // 否则按序填充第一个未占用的 day 插槽（若都已占用则提示已完成）
  for (let day = 1; day <= 7; day++) {
    if (!checkInRecords.value.some(r => r.day === day)) {
      checkInRecords.value.push({ day, date: today, timestamp: now, image })
      saveCheckIn()
      alert(`已完成第 ${day} 天打卡（${new Date(now).toLocaleString()}）`)
      const streak = computeConsecutiveStreak()
      if (streak >= 7) {
        alert(`🎉 恭喜你已连续打卡 ${streak} 天，周期已完成并将重新开始！`)
        checkInRecords.value = []
        saveCheckIn()
      }
      return
    }
  }

  alert('您已完成全部7天打卡！无需重复打卡。')
}

// 自动打卡：按顺序1-7，填充第一个未打卡的日期
const autoCheckIn = () => {
  const today = getDateOnly()
  const now = new Date().toISOString()
  const image = thumbUrl.value || uploadedImageUrl.value || null

  // 如果当天已有记录，则更新该记录（不再新增其它 slot）
  const todayIdx = checkInRecords.value.findIndex(r => r.date === today)
  if (todayIdx > -1) {
    checkInRecords.value[todayIdx].timestamp = now
    checkInRecords.value[todayIdx].image = image
    saveCheckIn()
    alert(`已更新今天的打卡时间为 ${new Date(now).toLocaleString()}，将使用最后一次保存的数据`)
    return true
  }

  // 否则找到第一个尚未占用的 day 插槽并新增记录
  for (let day = 1; day <= 7; day++) {
    if (!checkInRecords.value.some(r => r.day === day)) {
      checkInRecords.value.push({ day, date: today, timestamp: now, image })
      saveCheckIn()
      alert(`🎉 恭喜完成第 ${day} 天舌疗打卡！（${new Date(now).toLocaleString()}）继续坚持～`)
      return true
    }
  }
  // 全部已打卡
  alert('您已完成全部7天打卡！非常棒！')
  return null
}

// --- 摄像头控制 ---
const stopCamera = () => {
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => track.stop())
    mediaStream = null
  }
  if (videoRef.value) {
    videoRef.value.srcObject = null
  }
  isCameraActive.value = false
}

const requestCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
    mediaStream = stream
    if (videoRef.value) {
      videoRef.value.srcObject = stream
      isCameraActive.value = true
      // 清除之前的上传和分析状态
      uploadedImageUrl.value = ''
      thumbUrl.value = ''
      visualUrl.value = ''
      showAnalysis.value = false
    }
  } catch (err) {
    alert('摄像头调用失败，请检查权限或更换浏览器！\n错误信息：' + err.message)
    console.error('摄像头错误：', err)
    cameraPermissionGranted.value = false  // 失败则重置标记
  }
}

// 处理拍摄按钮点击
const handleCameraClick = () => {
  if (isCameraActive.value) {
    alert('摄像头已开启，请直接拍摄或点击“开始分析”使用当前画面')
    return
  }
  if (cameraPermissionGranted.value) {
    // 已有权限，直接启动摄像头
    requestCamera()
  } else {
    // 未获得许可，弹窗询问
    const userConfirmed = confirm('即将开启摄像头进行舌象拍摄，是否允许访问您的摄像头？')
    if (userConfirmed) {
      cameraPermissionGranted.value = true
      requestCamera()
    }
  }
}

// 从相册选择
const selectPhoto = () => {
  fileInputRef.value.click()
}

const loadPhoto = (event) => {
  const file = event.target.files[0]
  if (file) {
    const url = URL.createObjectURL(file)
    uploadedImageUrl.value = url
    thumbUrl.value = url
    if (isCameraActive.value) {
      stopCamera()
    }
    showAnalysis.value = false
    visualUrl.value = ''
  }
}

// 从摄像头捕获当前帧
const captureFromCamera = () => {
  return new Promise((resolve, reject) => {
    const video = videoRef.value
    if (!video || video.readyState < 2) {
      reject('摄像头未就绪，请稍后重试')
      return
    }
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    const ctx = canvas.getContext('2d')
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        resolve(url)
      } else {
        reject('截图失败')
      }
    }, 'image/png')
  })
}

// 分析舌象
const analyzeTongue = async () => {
  let imageUrl = ''
  if (isCameraActive.value) {
    try {
      imageUrl = await captureFromCamera()
      thumbUrl.value = imageUrl
      stopCamera()  // 分析完成后关闭摄像头，节省资源
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
  // 模拟AI结果（实际可接入后端）
  diagnosis.value = '湿热证候 87%'
  dietSuggestion.value = '薏米红豆粥、冬瓜海带汤'
  acupointSuggestion.value = '足三里、阴陵泉（每日2次）'
}

// 生成报告：自动打卡 + 弹出美化报告单
const generateReport = () => {
  if (!thumbUrl.value && !uploadedImageUrl.value) {
    alert('请先上传舌象并完成分析！')
    return
  }
  if (!showAnalysis.value) {
    alert('请先点击“开始分析”获取辨证结果！')
    return
  }

  // 自动打卡
  autoCheckIn()
  // 报告使用最近一次保存的打卡记录（若存在），并标注该时间，同时保存引用用于展示
  const latest = checkInRecords.value.slice().sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''))[0]
  if (latest) {
    reportDate.value = new Date(latest.timestamp).toLocaleString()
    usedRecordForReport.value = latest
  } else {
    reportDate.value = new Date().toLocaleString()
    usedRecordForReport.value = null
  }
  // 在报告中提示：使用的数据为最后一次保存的结果
  showReportModal.value = true
}

// 复制报告文本
const copyReportText = () => {
  const reportText = `=== 智能舌诊报告 ===
问诊时间：${reportDate.value}
（说明：报告使用的数据为您当天最后一次保存的打卡结果）
辨证结果：${diagnosis.value}
食疗建议：${dietSuggestion.value}
穴位建议：${acupointSuggestion.value}
养生提醒：少食肥甘厚味，适当运动，调畅情志。
——————————
提示：本报告仅供参考，请勿作为诊疗依据，建议前往正规中医机构就诊。`
  navigator.clipboard.writeText(reportText).then(() => {
    alert('报告内容已复制到剪贴板！')
  }).catch(() => {
    alert('复制失败，可手动选取文字复制。')
  })
}

const closeReportModal = () => {
  showReportModal.value = false
}

// 组件卸载时关闭摄像头
onUnmounted(() => {
  stopCamera()
})
</script>

<style>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Ma Shan Zheng", "SimSun", serif;
}
body {
  background-color: #F8F5E8;
  color: #5C3A21;
  min-height: 100vh;
  padding-top: 60px;
  padding-bottom: 20px;
}
.header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  background-color: #A67C52;
  color: white;
  text-align: center;
  padding: 10px 0;
  font-weight: bold;
  font-size: 18px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.1);
  z-index: 100;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 15px;
}
.card {
  background-color: white;
  border-radius: 12px;
  box-shadow: 0 3px 8px rgba(0,0,0,0.1);
  padding: 20px;
  margin-bottom: 20px;
}
@media (min-width: 992px) {
  .main-row {
    display: flex;
    gap: 20px;
  }
  .left-col, .right-col {
    flex: 1;
    width: 50%;
  }
}
.card-title {
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  color: #A67C52;
  margin-bottom: 20px;
}
.tongue-camera-box {
  width: 280px;
  height: 280px;
  margin: 0 auto;
  border-radius: 16px;
  border: 3px solid #D4B996;
  background-color: rgba(0,0,0,0.05);
  position: relative;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tongue-outline {
  position: absolute;
  width: 220px;
  height: 140px;
  opacity: 0.4;
  pointer-events: none;
}
.camera-tip {
  text-align: center;
  color: #5C3A21;
}
.camera-tip i {
  font-size: 40px;
  margin-bottom: 10px;
  display: block;
}
.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  justify-content: center;
  margin-top: 25px;
}
.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  color: white;
  cursor: pointer;
  font-size: 16px;
  transition: all 0.3s;
}
.btn-tan {
  background-color: #A67C52;
}
.btn-tan:hover {
  background-color: #5C3A21;
}
.btn-green {
  background: linear-gradient(to right, #2E7D32, #388E3C);
}
.btn-green:hover {
  opacity: 0.9;
}
.btn-block {
  display: block;
  width: 100%;
  margin-top: 10px;
}
.preview-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  position: absolute;
  top: 0;
  left: 0;
}
.result-thumb-wrap {
  text-align: center;
  margin-bottom: 20px;
}
.result-thumb {
  width: 80px;
  height: 80px;
  border: 2px solid #D4B996;
  border-radius: 8px;
  object-fit: cover;
}
.visual-area {
  width: 100%;
  height: 220px;
  border: 2px solid #D4B996;
  border-radius: 12px;
  background-color: #F8F5E8;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
  overflow: hidden;
  position: relative;
}
.visual-area img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.analysis-result {
  margin-bottom: 20px;
}
.analysis-result p {
  margin-bottom: 8px;
}
.analysis-result strong {
  color: #A67C52;
}
.calendar-title {
  font-weight: bold;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.checkin-tip {
  font-size: 12px;
  color: #2E7D32;
}
.calendar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: center;
}
.calendar-day {
  width: 32px;
  height: 32px;
  border: 1px solid #D4B996;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  transition: all 0.3s;
}
.calendar-day.active {
  background-color: #2E7D32;
  color: white;
  border-color: #2E7D32;
}
.file-input {
  display: none;
}
.icon {
  display: inline-block;
  width: 1em;
  height: 1em;
  background-size: contain;
  background-repeat: no-repeat;
  vertical-align: middle;
}
.icon-camera { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%235C3A21' d='M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0-6C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'%3E%3C/path%3E%3C/svg%3E"); }
.icon-video { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23FFFFFF' d='M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z'%3E%3C/path%3E%3C/svg%3E"); }
.icon-image { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23FFFFFF' d='M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z'%3E%3C/path%3E%3C/svg%3E"); }
.icon-search { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23FFFFFF' d='M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z'%3E%3C/path%3E%3C/svg%3E"); }
.icon-file { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='%23FFFFFF' d='M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zM6 20V4h7v5h5v11H6z'%3E%3C/path%3E%3C/svg%3E"); }

/* 美化报告单模态框样式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(3px);
}
.report-card {
  background: #FFFDF5;
  width: 90%;
  max-width: 500px;
  max-height: 85vh;
  overflow-y: auto;
  border-radius: 32px;
  border: 2px solid #D4B996;
  box-shadow: 0 15px 35px rgba(92, 58, 33, 0.2);
  position: relative;
  padding: 24px 20px 20px;
  font-family: inherit;
  transition: all 0.2s ease;
}
/* 草药装饰角 */
.herb-decoration {
  position: absolute;
  font-size: 28px;
  opacity: 0.6;
  z-index: 1;
  pointer-events: none;
}
.herb-tl { top: 8px; left: 12px; transform: rotate(-15deg); }
.herb-tr { top: 8px; right: 12px; transform: rotate(15deg); }
.herb-bl { bottom: 8px; left: 12px; transform: rotate(10deg); }
.herb-br { bottom: 8px; right: 12px; transform: rotate(-10deg); }
.report-header {
  text-align: center;
  border-bottom: 2px solid #E6D5B8;
  padding-bottom: 12px;
  margin-bottom: 20px;
}
.report-header h2 {
  color: #5C3A21;
  font-size: 1.8rem;
  letter-spacing: 2px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.report-date {
  font-size: 0.8rem;
  color: #8B6B42;
  margin-top: 6px;
}
.report-body {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 18px;
  margin-bottom: 24px;
}
.tongue-thumb {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  border: 3px solid #D4B996;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
  background: #F8F5E8;
}
.tongue-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.report-details {
  width: 100%;
  background: #FEF9E6;
  border-radius: 24px;
  padding: 16px;
  border: 1px solid #E6D5B8;
}
.detail-item {
  margin-bottom: 12px;
  font-size: 0.95rem;
  line-height: 1.4;
  border-left: 3px solid #A67C52;
  padding-left: 12px;
}
.detail-item .label {
  font-weight: bold;
  color: #A67C52;
  margin-right: 6px;
}
.detail-item .value {
  color: #4A2C1A;
}
.report-footer {
  text-align: center;
  margin-top: 12px;
}
.herb-note {
  font-size: 0.85rem;
  color: #8B6B42;
  background: #F4EDDF;
  display: inline-block;
  padding: 4px 16px;
  border-radius: 40px;
  margin-bottom: 16px;
}
.report-actions {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-bottom: 12px;
}
.btn-copy, .btn-close {
  padding: 8px 20px;
  border: none;
  border-radius: 40px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: 0.2s;
  background-color: #A67C52;
  color: white;
}
.btn-copy:hover, .btn-close:hover {
  background-color: #5C3A21;
}
.disclaimer {
  font-size: 0.7rem;
  color: #B2977A;
  margin-top: 10px;
}

/* 视觉与交互微调 */
:root{
  --primary: #A67C52;
  --accent: #2E7D32;
  --bg: #F8F5E8;
  --card: #FFFFFF;
  --muted: #8B6B42;
}
.btn{transition:transform .12s ease,box-shadow .12s ease}
.btn:active{transform:translateY(1px)}
.calendar-day{position:relative}
.day-tooltip{position:absolute;left:50%;transform:translateX(-50%) translateY(-8px);bottom:100%;background:rgba(0,0,0,0.8);color:#fff;padding:6px;border-radius:8px;min-width:120px;text-align:center;z-index:20;opacity:0;pointer-events:none;transition:opacity .15s}
.calendar-day:hover .day-tooltip{opacity:1;pointer-events:auto}
.day-tooltip img{width:48px;height:48px;object-fit:cover;border-radius:6px;display:block;margin:0 auto 6px}
.used-note{font-size:0.85rem;color:var(--muted);margin-top:8px}
.report-card{transition:transform .12s ease,opacity .12s ease}

/* 已打卡渐变样式 */
.calendar-day.active{background:linear-gradient(135deg,var(--accent),#4CAF50);box-shadow:0 6px 12px rgba(46,125,50,0.12)}
</style>