import { ref } from 'vue'
import { createAgentTask } from '@/api/agent'

export function useAgentReminder(options) {
  const {
    localReminderKey,
    dateTokenPattern,
    reminderSlotLibrary,
    loggedIn,
    refreshTasks,
    normalizeText,
    parseResult,
    statusText,
    addBrainMessage,
    pushExecutionStep,
    markExecutionFailed
  } = options

  const reminderDraft = ref(null)

  function createEmptyReminderDraft() {
    return {
      medicationName: '',
      startDate: null,
      endDate: null,
      slots: []
    }
  }

  function cloneDate(date) {
    const cloned = new Date(date)
    cloned.setHours(0, 0, 0, 0)
    return cloned
  }

  function parseDateToken(token) {
    const value = normalizeText(token)
    if (!value) {
      return null
    }

    const today = cloneDate(new Date())
    if (value === '今天') return today
    if (value === '明天') {
      const date = cloneDate(today)
      date.setDate(date.getDate() + 1)
      return date
    }
    if (value === '后天') {
      const date = cloneDate(today)
      date.setDate(date.getDate() + 2)
      return date
    }
    if (value === '大后天') {
      const date = cloneDate(today)
      date.setDate(date.getDate() + 3)
      return date
    }

    const nextWeekMatch = value.match(/^下周([一二三四五六日天])$/)
    if (nextWeekMatch) {
      const weekMap = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 日: 0, 天: 0 }
      const targetWeekDay = weekMap[nextWeekMatch[1]]
      const currentWeekDay = today.getDay()
      let delta = (targetWeekDay - currentWeekDay + 7) % 7
      if (delta === 0) {
        delta = 7
      }
      const date = cloneDate(today)
      date.setDate(date.getDate() + delta)
      return date
    }

    const fullDateMatch = value.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/)
    if (fullDateMatch) {
      const year = Number(fullDateMatch[1])
      const month = Number(fullDateMatch[2])
      const day = Number(fullDateMatch[3])
      const date = new Date(year, month - 1, day)
      if (Number.isNaN(date.getTime())) return null
      return cloneDate(date)
    }

    const monthDayMatch = value.match(/^(\d{1,2})月(\d{1,2})日$/)
    if (monthDayMatch) {
      const month = Number(monthDayMatch[1])
      const day = Number(monthDayMatch[2])
      const year = today.getFullYear()
      let date = new Date(year, month - 1, day)
      if (Number.isNaN(date.getTime())) return null
      if (date < today) {
        date = new Date(year + 1, month - 1, day)
      }
      return cloneDate(date)
    }

    return null
  }

  function extractMedicationName(text) {
    const normalized = normalizeText(text)
    if (!normalized) {
      return ''
    }

    const knownMatch = normalized.match(/(阿司匹林|布洛芬|对乙酰氨基酚|甲钴胺|头孢[\u4e00-\u9fa5A-Za-z0-9]*|维生素[\w]*)/)
    if (knownMatch?.[1]) {
      return knownMatch[1]
    }

    const explicitMatch = normalized.match(/(?:药是|要是|是|服用|吃|用)([\u4e00-\u9fa5A-Za-z0-9·\-]{2,30})/)
    if (!explicitMatch?.[1]) {
      return ''
    }

    const cleaned = explicitMatch[1]
      .replace(/具体.*$/, '')
      .replace(/每天.*$/, '')
      .replace(/从.*$/, '')
      .replace(/到.*$/, '')
      .replace(/[，。,.；;！!？?].*$/, '')
      .trim()

    if (!cleaned || /(今天|明天|后天|下周|提醒|日期)/.test(cleaned)) {
      return ''
    }

    return cleaned
  }

  function extractReminderSlots(text) {
    const normalized = normalizeText(text)
    const slots = []

    if (/(早中晚|三次|3次|三顿|一天三次|每日三次|每天三次)/.test(normalized)) {
      slots.push(reminderSlotLibrary.morning, reminderSlotLibrary.noon, reminderSlotLibrary.evening)
    } else {
      if (/(早饭后|早餐后|早上饭后)/.test(normalized)) {
        slots.push(reminderSlotLibrary.morning)
      }
      if (/(午饭后|午餐后|中饭后|中餐后)/.test(normalized)) {
        slots.push(reminderSlotLibrary.noon)
      }
      if (/(晚饭后|晚餐后|晚上饭后)/.test(normalized)) {
        slots.push(reminderSlotLibrary.evening)
      }
    }

    const deduplicated = []
    slots.forEach((slot) => {
      if (!deduplicated.some((item) => item.key === slot.key)) {
        deduplicated.push(slot)
      }
    })
    return deduplicated
  }

  function extractReminderFields(text) {
    const normalized = normalizeText(text)
    const result = {
      medicationName: extractMedicationName(normalized),
      startDate: null,
      endDate: null,
      slots: extractReminderSlots(normalized)
    }

    const rangeReg = new RegExp(`${dateTokenPattern}\\s*(?:到|至|-|~|～)\\s*${dateTokenPattern}`)
    const rangeMatch = normalized.match(rangeReg)
    if (rangeMatch?.[1] && rangeMatch?.[2]) {
      result.startDate = parseDateToken(rangeMatch[1])
      result.endDate = parseDateToken(rangeMatch[2])
    } else {
      const singleReg = new RegExp(dateTokenPattern)
      const singleMatch = normalized.match(singleReg)
      if (singleMatch?.[1]) {
        const date = parseDateToken(singleMatch[1])
        result.startDate = date
        result.endDate = date
      }
    }

    return result
  }

  function mergeReminderDraft(extracted) {
    if (!reminderDraft.value) {
      reminderDraft.value = createEmptyReminderDraft()
    }
    if (extracted.medicationName) {
      reminderDraft.value.medicationName = extracted.medicationName
    }
    if (extracted.startDate) {
      reminderDraft.value.startDate = extracted.startDate
    }
    if (extracted.endDate) {
      reminderDraft.value.endDate = extracted.endDate
    }
    if (Array.isArray(extracted.slots) && extracted.slots.length) {
      reminderDraft.value.slots = extracted.slots
    }

    if (reminderDraft.value.startDate && reminderDraft.value.endDate && reminderDraft.value.startDate > reminderDraft.value.endDate) {
      const swappedStart = reminderDraft.value.endDate
      const swappedEnd = reminderDraft.value.startDate
      reminderDraft.value.startDate = swappedStart
      reminderDraft.value.endDate = swappedEnd
    }
  }

  function getReminderMissingFields() {
    if (!reminderDraft.value) {
      return ['medicationName', 'dateRange', 'slots']
    }
    const missing = []
    if (!reminderDraft.value.medicationName) {
      missing.push('medicationName')
    }
    if (!reminderDraft.value.startDate || !reminderDraft.value.endDate) {
      missing.push('dateRange')
    }
    if (!Array.isArray(reminderDraft.value.slots) || reminderDraft.value.slots.length === 0) {
      missing.push('slots')
    }
    return missing
  }

  function formatDateLabel(date) {
    if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
      return '--'
    }
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  }

  function formatIcsDate(date, time) {
    const [hours, minutes] = time.split(':').map(Number)
    const dt = new Date(date)
    dt.setHours(hours, minutes, 0, 0)
    const yyyy = dt.getFullYear()
    const mm = String(dt.getMonth() + 1).padStart(2, '0')
    const dd = String(dt.getDate()).padStart(2, '0')
    const HH = String(dt.getHours()).padStart(2, '0')
    const MM = String(dt.getMinutes()).padStart(2, '0')
    const SS = String(dt.getSeconds()).padStart(2, '0')
    return `${yyyy}${mm}${dd}T${HH}${MM}${SS}`
  }

  function buildReminderSummary(reminder) {
    const slotText = reminder.slots.map((slot) => `${slot.label}${slot.time}`).join('、')
    return `${reminder.medicationName}：${formatDateLabel(reminder.startDate)} 到 ${formatDateLabel(reminder.endDate)}，每天 ${slotText}`
  }

  function saveReminderToLocal(reminder) {
    const raw = localStorage.getItem(localReminderKey) || '[]'
    let list = []
    try {
      const parsed = JSON.parse(raw)
      list = Array.isArray(parsed) ? parsed : []
    } catch (error) {
      // Repair corrupted local data to avoid blocking reminder creation.
      localStorage.setItem(localReminderKey, '[]')
      list = []
    }
    const nextList = [
      {
        id: `med-${Date.now()}`,
        medicationName: reminder.medicationName,
        startDate: formatDateLabel(reminder.startDate),
        endDate: formatDateLabel(reminder.endDate),
        slots: reminder.slots,
        createdAt: new Date().toISOString()
      },
      ...(Array.isArray(list) ? list : [])
    ].slice(0, 100)
    localStorage.setItem(localReminderKey, JSON.stringify(nextList))
  }

  function downloadReminderIcs(reminder) {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      return false
    }

    const start = cloneDate(reminder.startDate)
    const end = cloneDate(reminder.endDate)
    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//TCM-AI//Medication Reminder//ZH'
    ]

    const current = cloneDate(start)
    while (current <= end) {
      reminder.slots.forEach((slot) => {
        const dtStart = formatIcsDate(current, slot.time)
        lines.push('BEGIN:VEVENT')
        lines.push(`UID:${Date.now()}-${Math.random().toString(16).slice(2)}@tcm-ai`)
        lines.push(`DTSTAMP:${dtStart}Z`)
        lines.push(`DTSTART:${dtStart}`)
        lines.push(`DTEND:${dtStart}`)
        lines.push(`SUMMARY:服药提醒-${reminder.medicationName}`)
        lines.push(`DESCRIPTION:${reminder.medicationName} ${slot.label} 服用`)
        lines.push('BEGIN:VALARM')
        lines.push('TRIGGER:-PT10M')
        lines.push('ACTION:DISPLAY')
        lines.push(`DESCRIPTION:即将服用 ${reminder.medicationName}`)
        lines.push('END:VALARM')
        lines.push('END:VEVENT')
      })
      current.setDate(current.getDate() + 1)
    }

    lines.push('END:VCALENDAR')

    const blob = new Blob([`${lines.join('\r\n')}\r\n`], { type: 'text/calendar;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `${reminder.medicationName}-服药提醒.ics`
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    URL.revokeObjectURL(url)
    return true
  }

  async function tryCreateReminderTaskRecord(reminder) {
    if (!loggedIn.value) {
      return { created: false, reason: '未登录，无法同步到任务中心' }
    }

    try {
      const payload = {
        taskType: 'MEDICATION_REMINDER',
        title: `服药提醒：${reminder.medicationName}`,
        riskLevel: 'LOW',
        provider: 'INTERNAL_REMINDER',
        requestPayload: JSON.stringify({
          medicationName: reminder.medicationName,
          startDate: formatDateLabel(reminder.startDate),
          endDate: formatDateLabel(reminder.endDate),
          slots: reminder.slots
        })
      }

      const result = await createAgentTask(payload)
      const task = parseResult(result)
      await refreshTasks()
      return { created: true, taskStatus: task?.status || '' }
    } catch (error) {
      return { created: false, reason: error?.message || '任务中心写入失败' }
    }
  }

  async function tryHandleMedicationReminder(userText) {
    const text = normalizeText(userText)
    const maybeReminderIntent = /(提醒|服药|用药|吃药|医嘱|日历|按时吃药|按时服药)/.test(text)
    const hasCreateVerb = /(创建|新建|设置|设个|加个|安排|生成)/.test(text)
    const hasMedicationContext = /(药|片|胶囊|颗粒|冲剂|阿司匹林|布洛芬|甲钴胺|维生素)/.test(text)
    const hasDateToken = new RegExp(dateTokenPattern).test(text)
    const hasFrequencyContext = /(早中晚|早餐后|午餐后|晚餐后|每天|每日|每晚|三次|两次|一次)/.test(text)
    const createWithContext = hasCreateVerb && (hasMedicationContext || hasDateToken || hasFrequencyContext)
    const hasDraft = Boolean(reminderDraft.value)
    if (!maybeReminderIntent && !hasDraft && !createWithContext) {
      return false
    }

    pushExecutionStep('识别到服药提醒需求，正在提取关键信息。', 'running', 'REMINDER_FILL')

    const extracted = extractReminderFields(text)
    mergeReminderDraft(extracted)
    const missing = getReminderMissingFields()

    if (missing.includes('medicationName')) {
      pushExecutionStep('缺少药品名称，等待补充。', 'running', 'REMINDER_FILL')
      addBrainMessage('agent', '可以创建提醒，但我还缺少药品名称。请告诉我药名，例如“阿司匹林”。')
      return true
    }

    if (missing.includes('dateRange')) {
      pushExecutionStep('缺少提醒日期范围，等待补充。', 'running', 'REMINDER_FILL')
      addBrainMessage('agent', `已记录药名：${reminderDraft.value.medicationName}。还需要提醒日期范围，例如“今天到下周一”。`)
      return true
    }

    if (missing.includes('slots')) {
      pushExecutionStep('缺少每日提醒时段，等待补充。', 'running', 'REMINDER_FILL')
      addBrainMessage(
        'agent',
        '已记录药名和日期。还需要每日提醒时段，例如“每天三次（早中晚饭后）”或“每天晚饭后一次”。',
        [
          { label: '每天三次（早中晚）', action: 'send', payload: { text: '每天三次，早中晚饭后提醒' } },
          { label: '每天晚饭后一次', action: 'send', payload: { text: '每天晚饭后提醒一次' } }
        ]
      )
      return true
    }

    const finalReminder = {
      medicationName: reminderDraft.value.medicationName,
      startDate: reminderDraft.value.startDate,
      endDate: reminderDraft.value.endDate,
      slots: reminderDraft.value.slots
    }

    try {
      saveReminderToLocal(finalReminder)
      pushExecutionStep('站内提醒已保存，正在生成日历文件并同步任务中心。', 'running', 'REMINDER_FILL')
      const downloaded = downloadReminderIcs(finalReminder)
      const taskRecord = await tryCreateReminderTaskRecord(finalReminder)
      const summary = buildReminderSummary(finalReminder)

      let extraInfo = downloaded ? '已生成日历文件下载。' : '当前环境未自动下载日历文件，但提醒已保存在站内。'
      if (taskRecord.created) {
        extraInfo += ` 任务中心状态：${statusText(taskRecord.taskStatus)}。`
      } else if (taskRecord.reason) {
        extraInfo += ` ${taskRecord.reason}。`
      }

      addBrainMessage(
        'agent',
        `提醒已真实创建：${summary}。${extraInfo}`,
        [
          { label: '联系医生（附近医院）', action: 'route-page', payload: { path: '/map', label: '地图页面' } },
          { label: '进入问诊', action: 'route-consultation', payload: { prompt: `我正在服用${finalReminder.medicationName}，请结合目前症状给我评估。` } },
          { label: '查看任务中心', action: 'switch-task-tab' }
        ]
      )
      pushExecutionStep('提醒创建完成。', 'done', 'REMINDER_CREATED')
    } catch (error) {
      markExecutionFailed(error?.message || '提醒创建失败。')
      addBrainMessage(
        'agent',
        `这次我没有成功创建提醒，原因是：${error?.message || '未知错误'}。我不会假装已创建。你可以重试，或让我带你进入问诊页面。`,
        [
          { label: '重试创建提醒', action: 'send', payload: { text: userText } },
          { label: '进入问诊', action: 'route-consultation', payload: { prompt: userText } }
        ]
      )
    } finally {
      reminderDraft.value = null
    }

    return true
  }

  return {
    reminderDraft,
    tryHandleMedicationReminder
  }
}
