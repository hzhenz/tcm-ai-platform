import { ref, computed } from 'vue'

const EXECUTION_TIMELINE_LIMIT = 28
const EXECUTION_QUEUE_INTERVAL_MS = 420

export function useAgentExecution() {
  const executionTitle = ref('执行可视化')
  const executionPhase = ref('idle')
  const executionProgress = ref(0)
  const executionTimeline = ref([])
  const executionActiveStepId = ref(null)
  const executionQueue = ref([])
  const executionQueueRunning = ref(false)

  let executionSeq = 1
  let lastExecutionStepAt = 0

  const executionPhaseText = computed(() => {
    const mapping = {
      idle: '待命',
      running: '执行中',
      success: '完成',
      failed: '失败'
    }
    return mapping[executionPhase.value] || '执行中'
  })

  function nextExecutionId() {
    executionSeq += 1
    return executionSeq
  }

  function nowTimeText() {
    const now = new Date()
    return now.toLocaleTimeString('zh-CN', { hour12: false })
  }

  function normalizeText(text) {
    return String(text || '').trim()
  }

  function waitFor(ms) {
    return new Promise((resolve) => {
      window.setTimeout(resolve, ms)
    })
  }

  function stageProgress(stage) {
    const mapping = {
      EMERGENCY: 100,
      ANALYZE: 12,
      TOOL_PLAN: 24,
      TOOL_SELECTED: 36,
      BOOKING_PARSE: 48,
      BOOKING_EXECUTE: 70,
      BOOKING_TASK_CREATED: 88,
      BOOKING_SUCCESS: 100,
      REMINDER_FILL: 62,
      REMINDER_CREATED: 100,
      ROUTE: 90,
      DONE: 100,
      REJECT: 100,
      FAILED: 100,
      BOOKING_FAILED: 100
    }
    return mapping[stage] || null
  }

  function stepStatusByStage(stage) {
    if (['FAILED', 'BOOKING_FAILED', 'REJECT', 'EMERGENCY'].includes(stage)) {
      return 'error'
    }
    if (['DONE', 'BOOKING_SUCCESS', 'BOOKING_TASK_CREATED', 'REMINDER_CREATED'].includes(stage)) {
      return 'done'
    }
    return 'running'
  }

  function resetExecutionVisual(title = '执行可视化') {
    executionTitle.value = title
    executionPhase.value = 'running'
    executionProgress.value = 5
    executionActiveStepId.value = null

    if (executionTimeline.value.length > 0) {
      executionTimeline.value = [
        ...executionTimeline.value,
        {
          id: nextExecutionId(),
          time: nowTimeText(),
          text: '--- 新一轮执行开始 ---',
          status: 'done',
          stage: 'SESSION',
          isSeparator: true
        }
      ].slice(-EXECUTION_TIMELINE_LIMIT)
    }
  }

  function pushExecutionStep(text, status = 'running', stage = '') {
    const content = normalizeText(text)
    if (!content) {
      return
    }

    const stepId = nextExecutionId()
    executionTimeline.value = [
      ...executionTimeline.value,
      {
        id: stepId,
        time: nowTimeText(),
        text: content,
        status,
        stage,
        isSeparator: false
      }
    ].slice(-EXECUTION_TIMELINE_LIMIT)

    if (status === 'running') {
      executionActiveStepId.value = stepId
    } else {
      executionActiveStepId.value = null
    }

    const progress = stageProgress(stage)
    if (Number.isFinite(progress)) {
      executionProgress.value = Math.max(executionProgress.value, progress)
    }

    if (status === 'error') {
      executionPhase.value = 'failed'
    } else if (status === 'done') {
      executionPhase.value = executionPhase.value === 'failed' ? 'failed' : 'success'
    } else {
      executionPhase.value = executionPhase.value === 'failed' ? 'failed' : 'running'
    }
  }

  function enqueueExecutionStep(text, status = 'running', stage = '') {
    const content = normalizeText(text)
    if (!content) {
      return
    }
    executionQueue.value.push({ text: content, status, stage })
    void runExecutionQueue()
  }

  async function runExecutionQueue() {
    if (executionQueueRunning.value) {
      return
    }

    executionQueueRunning.value = true
    try {
      while (executionQueue.value.length > 0) {
        const elapsed = Date.now() - lastExecutionStepAt
        if (elapsed < EXECUTION_QUEUE_INTERVAL_MS) {
          await waitFor(EXECUTION_QUEUE_INTERVAL_MS - elapsed)
        }

        const next = executionQueue.value.shift()
        if (!next) {
          continue
        }

        pushExecutionStep(next.text, next.status, next.stage)
        lastExecutionStepAt = Date.now()
      }
    } finally {
      executionQueueRunning.value = false
    }
  }

  function beginExecutionVisual(userText) {
    const brief = normalizeText(userText).slice(0, 18)
    const suffix = normalizeText(userText).length > 18 ? '...' : ''
    resetExecutionVisual(brief ? `执行中: ${brief}${suffix}` : '执行可视化')
    pushExecutionStep('收到指令，正在分析你的诉求。', 'running', 'ANALYZE')
  }

  function markExecutionDone(text = '执行链路已完成。') {
    if (executionPhase.value === 'failed') {
      return
    }
    enqueueExecutionStep(text, 'done', 'DONE')
  }

  function markExecutionFailed(text = '执行失败，请稍后重试。') {
    enqueueExecutionStep(text, 'error', 'FAILED')
  }

  return {
    executionTitle,
    executionPhase,
    executionProgress,
    executionTimeline,
    executionActiveStepId,
    executionPhaseText,
    resetExecutionVisual,
    pushExecutionStep,
    enqueueExecutionStep,
    beginExecutionVisual,
    markExecutionDone,
    markExecutionFailed,
    stepStatusByStage
  }
}
