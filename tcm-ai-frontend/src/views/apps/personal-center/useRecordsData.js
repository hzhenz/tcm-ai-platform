import { ref } from 'vue'
import { safeJsonParse, toMonthDayText } from './utils'

export const useRecordsData = ({ javaApiBaseUrl, tokenKey }) => {
  const rawTongueData = ref([])
  const rawConsultData = ref([])

  const tongueRecords = ref([])
  const consultRecords = ref([])
  const herbRecords = ref([])

  const loadTongueRecords = () => {
    try {
      const checkInDays = safeJsonParse(localStorage.getItem('tongueCheckIn') || '[]', [])
      const reportHistory = safeJsonParse(localStorage.getItem('tongueReportHistory') || '[]', [])
      const normalizedDays = Array.isArray(checkInDays) ? checkInDays : []
      const normalizedReportHistory = Array.isArray(reportHistory) ? reportHistory : []
      rawTongueData.value = normalizedDays

      if (normalizedReportHistory.length > 0) {
        tongueRecords.value = normalizedReportHistory.map((item, index) => {
          const dayLabel = Number.isFinite(Number(item?.day)) ? `第${item.day}天` : '补充检测'
          return {
            id: item?.id || `tongue-report-${index + 1}`,
            date: item?.reportDate || dayLabel,
            title: item?.diagnosis || '舌诊报告',
            desc: item?.summary || `食疗建议：${item?.dietSuggestion || 'Null'}`,
            reportDate: item?.reportDate || 'Null',
            day: item?.day ?? null,
            diagnosis: item?.diagnosis || 'Null',
            dietSuggestion: item?.dietSuggestion || 'Null',
            acupointSuggestion: item?.acupointSuggestion || 'Null'
          }
        })
        return
      }

      if (normalizedDays.length > 0) {
        tongueRecords.value = normalizedDays.map((item, index) => {
          let displayDate = ''
          if (typeof item === 'number') {
            displayDate = `第${item}天`
          } else if (typeof item === 'string' && item.includes('-')) {
            displayDate = toMonthDayText(item)
          } else {
            displayDate = String(item)
          }

          return {
            id: index + 1,
            date: displayDate,
            title: '日常舌象打卡',
            desc: '按时记录舌象变化，跟踪健康状况。'
          }
        }).reverse()
      } else {
        tongueRecords.value = [
          { id: 1, date: '暂无', title: '暂无记录', desc: '您还未进行过舌诊打卡，开启健康追踪吧。' }
        ]
      }
    } catch (error) {
      console.error('Failed to load tongue records:', error)
      rawTongueData.value = []
      tongueRecords.value = [
        { id: 1, date: '读取失败', title: '舌诊记录读取失败', desc: '请稍后刷新页面重试。' }
      ]
    }
  }

  const loadConsultRecords = async () => {
    try {
      const token = localStorage.getItem(tokenKey)
      const headers = { 'Content-Type': 'application/json' }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }
      const response = await fetch(`${javaApiBaseUrl}/api/consultation/history`, { headers })
      if (response.status === 401) {
        rawConsultData.value = []
        consultRecords.value = [
          { id: 0, date: '未登录', title: '登录已过期', symptoms: [], conclusion: '请重新登录后查看问诊记录。' }
        ]
        return
      }

      const resData = await response.json()
      if (resData.code === 200 && Array.isArray(resData.data) && resData.data.length > 0) {
        rawConsultData.value = resData.data.map(item => {
          const parsedMessages = safeJsonParse(item.messages || '[]', [])
          return {
            title: item.title,
            createTime: item.createTime,
            messages: Array.isArray(parsedMessages) ? parsedMessages : []
          }
        })

        consultRecords.value = resData.data.map(item => {
          const displayDate = item.createTime && String(item.createTime).includes('-')
            ? toMonthDayText(String(item.createTime).split(' ')[0])
            : item.createTime

          let symptoms = ['智能问诊', '体质推演']
          let conclusion = '已完成对话，系统已记录您的健康状况。'
          let reportText = ''

          const messages = safeJsonParse(item.messages || '[]', [])
          const userMessages = Array.isArray(messages)
            ? messages.filter(m => m?.type === 'user' && typeof m?.content === 'string').map(m => m.content.trim()).filter(Boolean)
            : []
          const aiMessages = Array.isArray(messages)
            ? messages.filter(m => m?.type === 'ai' && typeof m?.content === 'string').map(m => m.content.trim()).filter(Boolean)
            : []

          if (userMessages.length > 0) {
            symptoms = userMessages.slice(-3)
          }
          if (aiMessages.length > 0) {
            reportText = aiMessages[aiMessages.length - 1]
            conclusion = reportText.slice(0, 48)
          }

          return {
            id: item.id,
            date: displayDate,
            title: item.title || '中医AI智能问诊',
            symptoms,
            conclusion,
            reportText
          }
        }).reverse()
      } else {
        rawConsultData.value = []
        consultRecords.value = [
          { id: 0, date: '暂无', title: '暂无记录', symptoms: [], conclusion: '您还没有中医问诊记录。' }
        ]
      }
    } catch (error) {
      console.error('Failed to load consult records:', error)
      rawConsultData.value = []
      consultRecords.value = [
        { id: 0, date: '获取失败', title: '无法获取记录', symptoms: [], conclusion: '请检查网络或稍后重试。' }
      ]
    }
  }

  const loadHerbRecords = () => {
    try {
      const herbCount = parseInt(localStorage.getItem('herbIdentifyCount') || '0', 10)
      if (herbCount > 0) {
        const today = new Date()
        const month = String(today.getMonth() + 1).padStart(2, '0')
        const day = String(today.getDate()).padStart(2, '0')
        herbRecords.value = [
          { id: 1, date: `${month}.${day}`, name: 'AI识草达人', effect: `您已使用识草功能成功识别了 ${herbCount} 次中药材。继续积累您的本草知识库吧！` }
        ]
      } else {
        herbRecords.value = [
          { id: 1, date: '暂无', name: '暂无记录', effect: '去体验由AI驱动的本草识别功能，了解百草之效！' }
        ]
      }
    } catch (error) {
      console.error('Failed to load herb records:', error)
      herbRecords.value = [
        { id: 1, date: '读取失败', name: '识草记录读取失败', effect: '请稍后刷新页面重试。' }
      ]
    }
  }

  const loadAllRecords = async () => {
    loadTongueRecords()
    loadHerbRecords()
    await loadConsultRecords()
  }

  return {
    rawTongueData,
    rawConsultData,
    tongueRecords,
    consultRecords,
    herbRecords,
    loadTongueRecords,
    loadConsultRecords,
    loadHerbRecords,
    loadAllRecords
  }
}
