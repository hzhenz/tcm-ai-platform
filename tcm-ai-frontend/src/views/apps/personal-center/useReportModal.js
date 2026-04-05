import { ref } from 'vue'

const buildTongueReport = (item) => {
  const hasStructuredReport = Boolean(item?.diagnosis || item?.dietSuggestion || item?.acupointSuggestion)

  return {
    typeLabel: '舌诊报告',
    title: item?.title || '舌诊记录',
    date: item?.reportDate || item?.date,
    summary: hasStructuredReport
      ? `辨证结果：${item?.diagnosis || 'Null'}`
      : (item?.desc || '舌象数据已记录。'),
    highlights: hasStructuredReport
      ? [
          `报告时间：${item?.reportDate || 'Null'}`,
          `打卡天数：${Number.isFinite(Number(item?.day)) ? `第${item.day}天` : 'Null'}`,
          `食疗建议：${item?.dietSuggestion || 'Null'}`
        ]
      : [
          `记录节点：${item?.date || '--'}`,
          '当前为阶段性观察结果，适合持续追踪变化趋势。'
        ],
    advice: hasStructuredReport
      ? [
          `穴位按压：${item?.acupointSuggestion || 'Null'}`,
          '本报告仅供参考，请勿作为诊疗依据。'
        ]
      : [
          '建议保持同一时间段采集舌象，降低环境干扰。',
          '连续记录 7-14 天后再观察趋势变化更有意义。'
        ]
  }
}

const buildConsultReport = (item) => {
  return {
    typeLabel: '问诊报告',
    title: item?.title || '中医AI智能问诊',
    date: item?.date,
    summary: item?.reportText || item?.conclusion || '问诊报告已生成。',
    highlights: (item?.symptoms || []).length > 0 ? item.symptoms : ['暂无症状摘要'],
    advice: [
      '建议结合近三次问诊结果对比，观察症状是否缓解。',
      '如出现持续加重或急性不适，请及时线下就医。'
    ]
  }
}

const buildHerbReport = (item) => {
  return {
    typeLabel: '识草报告',
    title: item?.name || '本草识别记录',
    date: item?.date,
    summary: item?.effect || '本草识别结果已生成。',
    highlights: [
      '识别结果用于科普学习，不可替代专业处方。',
      '同名药材可能因产地与炮制方式存在差异。'
    ],
    advice: [
      '用药前建议核对药材来源与规格。',
      '如涉及配伍和剂量，请咨询执业中医师。'
    ]
  }
}

export const useReportModal = () => {
  const reportModalVisible = ref(false)
  const activeReport = ref(null)

  const closeReportModal = () => {
    reportModalVisible.value = false
  }

  const openRecordReport = (type, item) => {
    if (!item) return

    if (type === 'tongue') {
      activeReport.value = buildTongueReport(item)
    } else if (type === 'consult') {
      activeReport.value = buildConsultReport(item)
    } else {
      activeReport.value = buildHerbReport(item)
    }

    reportModalVisible.value = true
  }

  return {
    reportModalVisible,
    activeReport,
    closeReportModal,
    openRecordReport
  }
}
