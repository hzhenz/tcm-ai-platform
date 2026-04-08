import { agentBrainTurn, getAgentBrainProgress } from '@/api/agent'
import { postAiChat } from '@/api/chat'

export function useAgentBrain(options) {
  const {
    loggedIn,
    llmEnabled,
    route,
    brainSessionKey,
    pageMeta,
    parseResult,
    normalizeText,
    addBrainMessage,
    pushExecutionStep,
    enqueueExecutionStep,
    stepStatusByStage,
    markExecutionDone,
    markExecutionFailed,
    refreshTasks,
    pushWithAuthGuard,
    setActiveTab,
    executionTimeline
  } = options

  function getBrainSessionId() {
    const current = localStorage.getItem(brainSessionKey)
    if (current) {
      return current
    }

    const next = `brain-${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
    localStorage.setItem(brainSessionKey, next)
    return next
  }

  function startBrainProgressPolling(sessionId) {
    let active = true
    let cursor = 0
    let timer = null
    let polling = false
    let failureCount = 0
    let warned = false
    const seen = new Set()

    const pollOnce = async (force = false) => {
      if ((!active && !force) || polling || !loggedIn.value) {
        return
      }

      polling = true
      try {
        const result = await getAgentBrainProgress(sessionId, cursor)
        const data = parseResult(result)
        const events = Array.isArray(data?.events) ? data.events : []

        events.forEach((event) => {
          const key = `${event?.index || 0}|${event?.stage || ''}|${event?.message || ''}`
          if (seen.has(key)) {
            return
          }
          seen.add(key)

          const stage = normalizeText(event?.stage) || 'ANALYZE'
          const stepMessage = normalizeText(event?.message)
          if (stepMessage) {
            enqueueExecutionStep(stepMessage, stepStatusByStage(stage), stage)
          }
        })

        const nextCursor = Number(data?.nextCursor)
        if (Number.isFinite(nextCursor)) {
          cursor = nextCursor
        }
        failureCount = 0
      } catch (error) {
        failureCount += 1
        if (error?.message === 'UNAUTHORIZED') {
          loggedIn.value = false
          active = false
          if (timer) {
            clearInterval(timer)
            timer = null
          }
          if (!warned) {
            warned = true
            addBrainMessage('agent', '执行进度读取失败：登录状态已过期，请重新登录后继续。')
            enqueueExecutionStep('执行进度读取失败：登录状态过期。', 'error', 'REJECT')
          }
          return
        }

        if (failureCount >= 3 && !warned) {
          warned = true
          addBrainMessage('agent', '执行进度暂时不可用，已降级处理。你仍可在任务中心查看最终结果。')
          enqueueExecutionStep('执行进度流暂时不可用，请在任务中心查看最终状态。', 'error', 'FAILED')
        }
      } finally {
        polling = false
      }
    }

    pollOnce()
    timer = setInterval(() => {
      pollOnce()
    }, 600)

    return async () => {
      active = false
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      await pollOnce(true)
    }
  }

  async function executeSingleBrainAction(action, userText) {
    if (!action || typeof action !== 'object') {
      return
    }

    if (action.type === 'ROUTE') {
      const path = action.targetPath || '/'
      pushExecutionStep(`准备跳转到${pageMeta[path]?.label || '目标页面'}。`, 'running', 'ROUTE')
      if (path === '/consultation') {
        const presetPrompt = normalizeText(action?.query?.presetPrompt || userText)
        const ok = await pushWithAuthGuard({
          path: '/consultation',
          query: {
            autoSend: '1',
            presetPrompt: presetPrompt || '我最近不舒服，请帮我问诊。'
          }
        }, '问诊页面')
        if (ok) {
          pushExecutionStep('问诊页面跳转完成。', 'done', 'ROUTE')
        }
        return
      }

      const query = action.query && typeof action.query === 'object' ? action.query : undefined
      const ok = await pushWithAuthGuard({ path, query }, pageMeta[path]?.label || '目标页面')
      if (ok) {
        pushExecutionStep(`已跳转到${pageMeta[path]?.label || '目标页面'}。`, 'done', 'ROUTE')
      }
      return
    }

    if (action.type === 'OPEN_TASK_CENTER') {
      setActiveTab('tasks')
      pushExecutionStep('已打开任务中心。', 'done', 'DONE')
      return
    }

    if (action.type === 'REFRESH_TASKS') {
      pushExecutionStep('正在刷新任务列表。', 'running', 'TOOL_SELECTED')
      await refreshTasks()
      pushExecutionStep('任务列表刷新完成。', 'done', 'DONE')
      return
    }

    if (action.type === 'TASK_CREATED') {
      await refreshTasks()
      pushExecutionStep('任务已同步到任务中心。', 'done', 'DONE')
      return
    }
  }

  async function executeBrainActions(actions, userText) {
    if (!Array.isArray(actions) || actions.length === 0) {
      return
    }

    for (const action of actions) {
      await executeSingleBrainAction(action, userText)
    }
  }

  async function tryHandleByBackend(userText) {
    if (!loggedIn.value) {
      return false
    }

    const sessionId = getBrainSessionId()
    const stopProgressPolling = startBrainProgressPolling(sessionId)

    try {
      const result = await agentBrainTurn({
        userText,
        sessionId,
        currentPath: route.path,
        context: {
          llmEnabled: llmEnabled.value
        }
      })

      const data = parseResult(result)
      if (!data || !data.handled) {
        pushExecutionStep('后端未接管，已回退到本地流程。', 'running', 'TOOL_SELECTED')
        return false
      }

      addBrainMessage('agent', String(data.reply || '已处理。'))
      await executeBrainActions(data.actions, userText)
      if (!executionTimeline.value.some((item) => item.stage === 'DONE' || item.stage === 'BOOKING_SUCCESS' || item.status === 'error')) {
        markExecutionDone('动作计划执行完成。')
      }
      return true
    } catch (error) {
      if (error?.message === 'UNAUTHORIZED') {
        loggedIn.value = false
        pushExecutionStep('后端执行授权已失效。', 'error', 'REJECT')
      } else {
        markExecutionFailed(error?.message || '后端执行链路失败。')
      }
      return false
    } finally {
      await stopProgressPolling()
    }
  }

  async function askLLMForBrainReply(userText, brainMessages) {
    const history = brainMessages.value
      .slice(-6)
      .map((item) => ({
        role: item.role === 'user' ? 'user' : 'assistant',
        content: item.content
      }))

    const prompt = `你是站内中医智能助手。请用简洁、温和的中文回复，并给出下一步建议。\n用户输入：${userText}\n要求：1）回复 2-4 句。2）若用户表达不适，优先建议进入问诊页面。3）不要使用 Markdown。`

    const result = await postAiChat({
      content: prompt,
      history
    })

    if (!result || result.code !== 200 || !result.data) {
      throw new Error(result?.msg || 'LLM 回复失败，请稍后重试')
    }
    return String(result.data).trim()
  }

  return {
    getBrainSessionId,
    tryHandleByBackend,
    askLLMForBrainReply
  }
}
