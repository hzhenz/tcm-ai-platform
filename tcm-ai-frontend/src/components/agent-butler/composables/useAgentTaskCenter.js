import { computed, ref } from 'vue'
import { ElMessage } from 'element-plus'
import { approveAgentTask, createAgentTask, getAgentTaskDetail, getAgentTaskList } from '@/api/agent'

export function useAgentTaskCenter(options) {
  const {
    loggedIn,
    syncAuthState,
    normalizeText,
    isAutoBookingIntent,
    parseResult,
    waitFor,
    addBrainMessage,
    pushExecutionStep,
    enqueueExecutionStep,
    resetExecutionVisual,
    markExecutionDone,
    markExecutionFailed,
    setActiveTab,
    taskExecutionPollIntervalMs,
    taskExecutionPollTimeoutMs
  } = options

  const taskLoading = ref(false)
  const actionLoadingType = ref('')
  const approvingTaskId = ref(null)
  const tasks = ref([])
  const expandedTaskFlowId = ref(null)
  const taskWatchdogs = new Map()

  const pendingCount = computed(() => tasks.value.filter((item) => item.status === 'PENDING_APPROVAL').length)
  const displayTasks = computed(() => tasks.value.slice(0, 6))

  function statusText(status) {
    const mapping = {
      PENDING_APPROVAL: '待审批',
      APPROVED: '已审批',
      RUNNING: '执行中',
      SUCCESS: '执行成功',
      FAILED: '执行失败',
      CANCELLED: '已拒绝'
    }
    return mapping[status] || status
  }

  function statusClass(status) {
    return `status-${String(status || '').toLowerCase()}`
  }

  function compactTime(value) {
    if (!value) {
      return '--'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '--'
    }
    return date.toLocaleTimeString('zh-CN', { hour12: false })
  }

  function toggleTaskFlow(taskId) {
    expandedTaskFlowId.value = expandedTaskFlowId.value === taskId ? null : taskId
  }

  function taskFlowSteps(task) {
    const status = String(task?.status || '').toUpperCase()
    const steps = []
    const createTime = compactTime(task?.createTime)
    const updateTime = compactTime(task?.updateTime)

    steps.push({
      id: `${task?.id}-created`,
      time: createTime,
      text: `任务已创建（${task?.taskType || 'UNKNOWN'}）。`,
      status: 'done'
    })

    if (status === 'PENDING_APPROVAL') {
      steps.push({
        id: `${task?.id}-approval-pending`,
        time: updateTime === '--' ? createTime : updateTime,
        text: '等待人工审批通过。',
        status: 'running'
      })
      return steps
    }

    if (status === 'CANCELLED') {
      steps.push({
        id: `${task?.id}-approval-rejected`,
        time: updateTime === '--' ? createTime : updateTime,
        text: '审批未通过，任务结束。',
        status: 'error'
      })
      return steps
    }

    steps.push({
      id: `${task?.id}-approval-done`,
      time: updateTime === '--' ? createTime : updateTime,
      text: '审批通过，进入执行链路。',
      status: 'done'
    })

    const terminal = buildTaskTerminalStep(task)
    steps.push({
      id: `${task?.id}-execution`,
      time: updateTime === '--' ? createTime : updateTime,
      text: terminal.text,
      status: terminal.stepStatus
    })

    return steps
  }

  function formatTime(value) {
    if (!value) {
      return '--'
    }
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return '--'
    }
    return date.toLocaleString('zh-CN', { hour12: false })
  }

  function patchTaskInList(taskId, patch = {}) {
    const index = tasks.value.findIndex((item) => item?.id === taskId)
    if (index < 0) {
      return
    }

    const current = tasks.value[index] || {}
    tasks.value[index] = {
      ...current,
      ...patch,
      updateTime: patch.updateTime || new Date().toISOString()
    }
    tasks.value = [...tasks.value]
  }

  function clearTaskWatchdog(taskId) {
    const timers = taskWatchdogs.get(taskId)
    if (!timers) {
      return
    }
    if (timers.slowTimer) {
      window.clearTimeout(timers.slowTimer)
    }
    if (timers.hardTimer) {
      window.clearTimeout(timers.hardTimer)
    }
    taskWatchdogs.delete(taskId)
  }

  function scheduleTaskWatchdog(taskId) {
    clearTaskWatchdog(taskId)

    const checkStatusAndRefresh = async () => {
      try {
        const result = await getAgentTaskDetail(taskId)
        const latestTask = parseResult(result)
        const status = String(latestTask?.status || '').toUpperCase()
        if (['SUCCESS', 'FAILED', 'CANCELLED'].includes(status)) {
          await refreshTasks()
          clearTaskWatchdog(taskId)
          return status
        }
        return status
      } catch (error) {
        enqueueExecutionStep('执行状态获取失败，请在任务中心刷新查看。', 'error', 'FAILED')
        clearTaskWatchdog(taskId)
        return 'UNKNOWN'
      }
    }

    const slowTimer = window.setTimeout(async () => {
      const status = await checkStatusAndRefresh()
      if (status === 'RUNNING') {
        enqueueExecutionStep('执行超过 35 秒仍未完成，可能被拦截或窗口已关闭，正在继续确认。', 'error', 'BOOKING_FAILED')
      }
    }, 35000)

    const hardTimer = window.setTimeout(async () => {
      const status = await checkStatusAndRefresh()
      if (status === 'RUNNING' || status === 'APPROVED') {
        enqueueExecutionStep('长时间未收到执行结果，可能已被拦截或窗口已关闭。请在任务中心刷新查看最终状态。', 'error', 'FAILED')
      }
      clearTaskWatchdog(taskId)
    }, 130000)

    taskWatchdogs.set(taskId, { slowTimer, hardTimer })
  }

  function safeParseJson(text, fallback = {}) {
    const raw = String(text || '').trim()
    if (!raw) {
      return fallback
    }
    try {
      const parsed = JSON.parse(raw)
      return parsed && typeof parsed === 'object' ? parsed : fallback
    } catch (error) {
      return fallback
    }
  }

  function resolveBookingTargetUrl(task, payload = {}) {
    const payloadUrl = normalizeText(payload?.targetUrl || payload?.bookingUrl)
    if (payloadUrl) {
      return payloadUrl
    }

    const requestPayload = safeParseJson(task?.requestPayload)
    const requestUrl = normalizeText(requestPayload?.targetUrl || requestPayload?.bookingUrl)
    if (requestUrl) {
      return requestUrl
    }

    return 'https://www.cs4hospital.cn/'
  }

  function buildBookingFailureText(task) {
    const resultPayload = safeParseJson(task?.resultPayload)
    const reason = normalizeText(task?.errorMessage || resultPayload?.message) || '挂号任务执行失败。'
    const targetUrl = resolveBookingTargetUrl(task, resultPayload)
    return `${reason} 解决方案：请访问 ${targetUrl} 手动挂号，完成登录/验证码后再提交。`
  }

  function ageMs(timeValue) {
    if (!timeValue) {
      return 0
    }
    const ts = new Date(timeValue).getTime()
    if (!Number.isFinite(ts)) {
      return 0
    }
    return Math.max(0, Date.now() - ts)
  }

  function buildTaskTerminalStep(task) {
    const status = String(task?.status || '').toUpperCase()
    const taskType = String(task?.taskType || '').toUpperCase()

    if (status === 'SUCCESS' && taskType === 'HOSPITAL_BOOKING') {
      const payload = safeParseJson(task?.resultPayload)
      const bookingNo = normalizeText(payload?.bookingNo)
      const queueNo = payload?.queueNo
      const provider = normalizeText(payload?.provider || task?.provider)
      const message = normalizeText(payload?.message)

      const chunks = ['挂号流程执行完成，已提交请求']
      if (bookingNo) {
        chunks.push(`单号：${bookingNo}`)
      }
      if (queueNo !== undefined && queueNo !== null && String(queueNo).trim() !== '') {
        chunks.push(`排队号：${queueNo}`)
      }
      if (provider) {
        chunks.push(`平台：${provider}`)
      }
      if (message) {
        chunks.push(message)
      }

      return {
        text: chunks.join('；') + '。',
        stepStatus: 'done',
        stage: 'BOOKING_SUCCESS',
        terminal: true
      }
    }

    if (status === 'SUCCESS') {
      return {
        text: `任务执行成功，状态：${statusText(task.status)}。`,
        stepStatus: 'done',
        stage: 'DONE',
        terminal: true
      }
    }

    if (status === 'FAILED') {
      return {
        text: taskType === 'HOSPITAL_BOOKING'
          ? buildBookingFailureText(task)
          : (task?.errorMessage || '任务执行失败，请稍后重试。'),
        stepStatus: 'error',
        stage: taskType === 'HOSPITAL_BOOKING' ? 'BOOKING_FAILED' : 'FAILED',
        terminal: true
      }
    }

    if (status === 'CANCELLED') {
      return {
        text: '任务已取消，不会继续执行。',
        stepStatus: 'error',
        stage: 'REJECT',
        terminal: true
      }
    }

    if (status === 'RUNNING') {
      const runningAge = ageMs(task?.updateTime || task?.approvedAt)
      const maybeBlocked = taskType === 'HOSPITAL_BOOKING' && runningAge >= 45000
      return {
        text: maybeBlocked
          ? '挂号执行耗时较长，可能已被拦截或窗口已关闭，系统正在获取最终结果。'
          : taskType === 'HOSPITAL_BOOKING'
            ? '挂号任务执行中：正在打开挂号页面并提交表单。'
          : '任务执行中，请稍候。',
        stepStatus: maybeBlocked ? 'error' : 'running',
        stage: taskType === 'HOSPITAL_BOOKING' ? 'BOOKING_EXECUTE' : 'TOOL_SELECTED',
        terminal: false
      }
    }

    if (status === 'APPROVED') {
      return {
        text: taskType === 'HOSPITAL_BOOKING'
          ? '审批通过，准备执行挂号动作。'
          : '审批通过，任务即将进入执行。',
        stepStatus: 'running',
        stage: taskType === 'HOSPITAL_BOOKING' ? 'BOOKING_EXECUTE' : 'TOOL_SELECTED',
        terminal: false
      }
    }

    return {
      text: `任务状态更新：${statusText(task?.status)}。`,
      stepStatus: 'running',
      stage: 'TOOL_SELECTED',
      terminal: false
    }
  }

  async function monitorTaskExecution(taskId, seedTask = null) {
    let lastStatus = ''
    let currentTask = seedTask
    let remindedLongRunning = false
    let remindedPossibleBlock = false
    let runningSince = 0

    const emitIfChanged = (task) => {
      const status = String(task?.status || '').toUpperCase()
      if (!status || status === lastStatus) {
        return false
      }

      lastStatus = status
      if (status === 'RUNNING' && !runningSince) {
        runningSince = Date.now()
      }
      if (status !== 'RUNNING') {
        runningSince = 0
      }
      const descriptor = buildTaskTerminalStep(task)
      enqueueExecutionStep(descriptor.text, descriptor.stepStatus, descriptor.stage)
      return descriptor.terminal
    }

    if (currentTask && emitIfChanged(currentTask)) {
      clearTaskWatchdog(taskId)
      return currentTask
    }

    const softDeadline = Date.now() + taskExecutionPollTimeoutMs
    const hardDeadline = Date.now() + Math.max(taskExecutionPollTimeoutMs + 180000, 300000)
    while (Date.now() < hardDeadline) {
      try {
        const result = await getAgentTaskDetail(taskId)
        currentTask = parseResult(result)
      } catch (error) {
        if (error?.message === 'UNAUTHORIZED') {
          loggedIn.value = false
        }
        enqueueExecutionStep('执行状态追踪中断，请在任务中心查看最终结果。', 'error', 'FAILED')
        clearTaskWatchdog(taskId)
        return currentTask
      }

      if (emitIfChanged(currentTask)) {
        clearTaskWatchdog(taskId)
        return currentTask
      }

      if (!remindedPossibleBlock && runningSince && Date.now() - runningSince >= 30000) {
        remindedPossibleBlock = true
        enqueueExecutionStep('执行超过 30 秒仍未完成，可能被拦截或窗口已关闭，正在继续确认。', 'error', 'BOOKING_FAILED')
      }

      if (!remindedLongRunning && Date.now() >= softDeadline) {
        remindedLongRunning = true
        enqueueExecutionStep('执行耗时较长，正在持续追踪结果。若浏览器已关闭或被拦截，稍后会反馈失败原因。', 'running', 'TOOL_SELECTED')
      }

      const nextWait = remindedLongRunning
        ? Math.max(taskExecutionPollIntervalMs * 3, 2500)
        : taskExecutionPollIntervalMs
      await waitFor(nextWait)
    }

    enqueueExecutionStep('长时间未收到执行结果，可能已被拦截或窗口已关闭。请在任务中心刷新查看最终状态。', 'error', 'FAILED')
    clearTaskWatchdog(taskId)
    return currentTask
  }

  async function refreshTasks() {
    syncAuthState()
    if (!loggedIn.value) {
      tasks.value = []
      return
    }

    taskLoading.value = true
    try {
      const result = await getAgentTaskList()
      const list = parseResult(result)
      tasks.value = Array.isArray(list) ? list : []
    } catch (error) {
      if (error?.message === 'UNAUTHORIZED') {
        ElMessage.warning('登录状态已过期，请重新登录')
        tasks.value = []
        loggedIn.value = false
        return
      }
      ElMessage.error(error?.message || '加载任务失败')
    } finally {
      taskLoading.value = false
    }
  }

  function buildPayloadByKind(kind) {
    if (kind === 'wechat') {
      return {
        taskType: 'WECHAT_SEND_REPORT',
        title: '发送最新问诊报告到微信联系人',
        riskLevel: 'MEDIUM',
        provider: 'WECHAT_DEMO',
        requestPayload: JSON.stringify({
          reportType: 'consult_latest',
          receiver: 'family_demo'
        })
      }
    }

    if (kind === 'booking') {
      return {
        taskType: 'HOSPITAL_BOOKING',
        title: '预约最近医院中医科（演示）',
        riskLevel: 'HIGH',
        provider: 'XLX_DEMO',
        requestPayload: JSON.stringify({
          city: '长沙',
          department: '中医科',
          preferredDate: '最近3天'
        })
      }
    }

    return {
      taskType: 'FOLLOWUP_REMINDER',
      title: '创建7天随访提醒（演示）',
      riskLevel: 'LOW',
      provider: 'INTERNAL_DEMO',
      requestPayload: JSON.stringify({
        cycleDays: 7,
        reminderAt: '20:30'
      })
    }
  }

  function parseBookingDepartmentFromText(text) {
    const input = normalizeText(text)
    if (/推拿/.test(input)) return '推拿科'
    if (/针灸/.test(input)) return '针灸科'
    if (/骨科/.test(input)) return '骨科'
    if (/妇科/.test(input)) return '妇科'
    if (/儿科/.test(input)) return '儿科'
    if (/皮肤/.test(input)) return '皮肤科'
    if (/中医内科/.test(input)) return '中医内科'
    return '中医科'
  }

  function parseBookingDateFromText(text) {
    const input = normalizeText(text)
    if (/明天下午/.test(input)) return '明天下午'
    if (/明天上午/.test(input)) return '明天上午'
    if (/明天/.test(input)) return '明天'
    if (/今天下午/.test(input)) return '今天下午'
    if (/今天/.test(input)) return '今天'
    if (/后天/.test(input)) return '后天'
    const dateMatch = input.match(/\d{4}-\d{1,2}-\d{1,2}(?:上午|下午|晚上)?/)
    if (dateMatch?.[0]) {
      return dateMatch[0]
    }
    return '最近3天'
  }

  function buildBookingPayloadFromText(userText) {
    const department = parseBookingDepartmentFromText(userText)
    const preferredDate = parseBookingDateFromText(userText)

    return {
      taskType: 'HOSPITAL_BOOKING',
      title: `预约${preferredDate}${department}（智能识别）`,
      riskLevel: 'HIGH',
      provider: 'XLX_DEMO',
      requestPayload: JSON.stringify({
        city: '长沙',
        department,
        preferredDate,
        rawText: normalizeText(userText),
        autoExecute: isAutoBookingIntent(userText)
      })
    }
  }

  function buildEmergencyBookingPayload(userText) {
    return {
      taskType: 'HOSPITAL_BOOKING',
      title: '紧急就诊任务：急诊/心内科（风险识别）',
      riskLevel: 'HIGH',
      provider: 'XLX_DEMO',
      requestPayload: JSON.stringify({
        city: '长沙',
        department: '急诊科',
        preferredDate: '立即',
        rawText: normalizeText(userText),
        emergency: true,
        triageLevel: 'HIGH'
      })
    }
  }

  async function createEmergencyBookingTask(userText) {
    syncAuthState()
    if (!loggedIn.value) {
      return { created: false, reason: '未登录，请先登录后创建任务' }
    }

    try {
      const payload = buildEmergencyBookingPayload(userText)
      const result = await createAgentTask(payload)
      const task = parseResult(result)
      await refreshTasks()
      return { created: true, status: task?.status || 'PENDING_APPROVAL' }
    } catch (error) {
      if (error?.message === 'UNAUTHORIZED') {
        loggedIn.value = false
        return { created: false, reason: '登录状态已过期，请重新登录' }
      }
      return { created: false, reason: error?.message || '任务创建失败' }
    }
  }

  async function createBookingTaskFromUserText(userText, fromAutoIntent) {
    syncAuthState()
    if (!loggedIn.value) {
      pushExecutionStep('挂号能力需要登录授权。', 'error', 'REJECT')
      ElMessage.warning('请先登录后再使用挂号能力')
      return
    }

    pushExecutionStep('正在解析挂号科室和日期。', 'running', 'BOOKING_PARSE')
    actionLoadingType.value = 'booking'
    try {
      const payload = buildBookingPayloadFromText(userText)
      pushExecutionStep('挂号任务参数已生成，正在写入任务中心。', 'running', 'BOOKING_EXECUTE')
      const result = await createAgentTask(payload)
      const task = parseResult(result)
      const status = statusText(task.status)

      if (fromAutoIntent) {
        addBrainMessage(
          'agent',
          `已识别你要自动挂号。当前先为你创建挂号任务（${payload.title}），状态：${status}。请在任务中心审批后执行。`,
          [{ label: '查看任务中心', action: 'switch-task-tab' }]
        )
      } else {
        addBrainMessage(
          'agent',
          `挂号任务已创建：${payload.title}，状态：${status}。`,
          [{ label: '查看任务中心', action: 'switch-task-tab' }]
        )
      }

      pushExecutionStep(`挂号任务已创建，当前状态：${status}。`, 'done', 'BOOKING_TASK_CREATED')

      await refreshTasks()
      setActiveTab('tasks')
    } catch (error) {
      if (error?.message === 'UNAUTHORIZED') {
        ElMessage.warning('登录状态已过期，请重新登录')
        loggedIn.value = false
        return
      }
      ElMessage.error(error?.message || '创建挂号任务失败')
      markExecutionFailed(error?.message || '挂号任务创建失败。')
      addBrainMessage('agent', '挂号任务创建失败。我不会假装已完成，请稍后重试。')
    } finally {
      actionLoadingType.value = ''
    }
  }

  async function createDemoTask(kind) {
    const labelByKind = {
      wechat: '微信发送任务',
      booking: '挂号任务',
      followup: '随访提醒任务'
    }
    resetExecutionVisual(`执行中: ${labelByKind[kind] || '任务创建'}`)
    pushExecutionStep(`开始创建${labelByKind[kind] || '任务'}。`, 'running', 'TOOL_SELECTED')

    syncAuthState()
    if (!loggedIn.value) {
      pushExecutionStep('任务创建需要先登录。', 'error', 'REJECT')
      ElMessage.warning('请先登录后再使用管家任务')
      return
    }

    actionLoadingType.value = kind
    try {
      const payload = buildPayloadByKind(kind)
      const result = await createAgentTask(payload)
      const task = parseResult(result)
      ElMessage.success(`任务已创建：${statusText(task.status)}`)
      markExecutionDone(`任务创建成功，状态：${statusText(task.status)}。`)
      addBrainMessage('agent', `任务“${payload.title}”已创建，当前状态：${statusText(task.status)}。`, [
        { label: '查看任务中心', action: 'switch-task-tab' }
      ])
      await refreshTasks()
    } catch (error) {
      if (error?.message === 'UNAUTHORIZED') {
        ElMessage.warning('登录状态已过期，请重新登录')
        loggedIn.value = false
        return
      }
      ElMessage.error(error?.message || '创建任务失败')
      markExecutionFailed(error?.message || '任务创建失败。')
    } finally {
      actionLoadingType.value = ''
    }
  }

  async function approve(taskId, action) {
    resetExecutionVisual(`执行中: ${action === 'APPROVE' ? '任务审批同意' : '任务审批拒绝'}`)
    pushExecutionStep(action === 'APPROVE' ? '正在提交审批同意。' : '正在提交审批拒绝。', 'running', 'TOOL_SELECTED')
    clearTaskWatchdog(taskId)
    approvingTaskId.value = taskId
    try {
      const result = await approveAgentTask(taskId, {
        action,
        note: action === 'REJECT' ? '全站管家拒绝执行' : '全站管家同意执行'
      })
      const approvedTask = parseResult(result)
      ElMessage.success(action === 'APPROVE' ? '已同意执行' : '已拒绝任务')

      if (action === 'REJECT') {
        patchTaskInList(taskId, {
          ...(approvedTask && typeof approvedTask === 'object' ? approvedTask : {}),
          status: approvedTask?.status || 'CANCELLED'
        })
        enqueueExecutionStep('任务已拒绝，不会执行。', 'error', 'REJECT')
        await refreshTasks()
        clearTaskWatchdog(taskId)
        return
      }

      patchTaskInList(taskId, {
        ...(approvedTask && typeof approvedTask === 'object' ? approvedTask : {}),
        status: approvedTask?.status || 'APPROVED'
      })
      enqueueExecutionStep('审批通过，任务进入执行链路，开始追踪执行状态。', 'running', 'TOOL_SELECTED')
      await refreshTasks()
      scheduleTaskWatchdog(taskId)

      monitorTaskExecution(taskId, approvedTask)
        .then(() => {
          clearTaskWatchdog(taskId)
          return refreshTasks()
        })
        .catch((pollError) => {
          clearTaskWatchdog(taskId)
          enqueueExecutionStep(pollError?.message || '执行状态追踪失败，请在任务中心稍后刷新查看。', 'error', 'FAILED')
        })
    } catch (error) {
      if (error?.message === 'UNAUTHORIZED') {
        ElMessage.warning('登录状态已过期，请重新登录')
        loggedIn.value = false
        return
      }
      ElMessage.error(error?.message || '审批失败')
      markExecutionFailed(error?.message || '审批失败。')
    } finally {
      approvingTaskId.value = null
    }
  }

  return {
    taskLoading,
    actionLoadingType,
    approvingTaskId,
    tasks,
    expandedTaskFlowId,
    pendingCount,
    displayTasks,
    statusText,
    statusClass,
    formatTime,
    toggleTaskFlow,
    taskFlowSteps,
    refreshTasks,
    createEmergencyBookingTask,
    createBookingTaskFromUserText,
    createDemoTask,
    approve
  }
}
