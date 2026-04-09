/**
 * OpenClaw 本地代理连接管理
 * 
 * 提供与用户本地 OpenClaw Gateway 的 WebSocket 连接管理
 */

import { ref, computed } from 'vue'
import {
  OPENCLAW_DEFAULT_HTTP_BASE,
  OPENCLAW_HEALTH_ENDPOINTS,
  HEARTBEAT_INTERVAL_MS,
  RECONNECT_DELAY_MS,
  MAX_RECONNECT_ATTEMPTS,
  getDefaultWsCandidates,
  ClawConnectionState,
  ClawTaskStatus,
  createPingCommand,
  createAuthCommand,
  createGetCapabilitiesCommand,
  getToolNameByTaskType,
  parseClawResponse,
  isTaskComplete,
  getConnectionStateName
} from '@/api/openclaw-protocol.js'

// ============== 存储键 ==============
const STORAGE_KEY_TOKEN = 'openclaw_auth_token'
const STORAGE_KEY_PASSWORD = 'openclaw_auth_password'
const STORAGE_KEY_ENABLED = 'openclaw_enabled'
const STORAGE_KEY_HTTP_BASE = 'openclaw_http_base'

// ============== 全局单例状态 ==============
const globalState = {
  ws: null,
  wsUrl: null,
  rpcId: 1,
  connectPending: null,
  connectionState: ref(ClawConnectionState.DISCONNECTED),
  reconnectAttempts: 0,
  heartbeatTimer: null,
  reconnectTimer: null,
  pendingRequests: new Map(), // id -> { resolve, reject, timeout }
  taskCallbacks: new Map(),   // taskId -> { onProgress, onComplete }
  capabilities: ref(null),
  lastError: ref(null),
  isEnabled: ref(localStorage.getItem(STORAGE_KEY_ENABLED) !== 'false')
}

/**
 * OpenClaw 连接管理 Composable
 */
export function useOpenClaw() {
  // ============== 响应式状态 ==============
  const connectionState = globalState.connectionState
  const capabilities = globalState.capabilities
  const lastError = globalState.lastError
  const isEnabled = globalState.isEnabled
  
  const isConnected = computed(() => 
    connectionState.value === ClawConnectionState.CONNECTED ||
    connectionState.value === ClawConnectionState.AUTHENTICATED
  )
  
  const isAuthenticated = computed(() => 
    connectionState.value === ClawConnectionState.AUTHENTICATED
  )
  
  const isReady = computed(() => 
    isEnabled.value && isAuthenticated.value
  )
  
  const connectionStateText = computed(() => 
    getConnectionStateName(connectionState.value)
  )

  // ============== 健康检查 ==============
  
  /**
   * 检查本地 OpenClaw 是否运行
   */
  async function checkHealth(httpBase) {
    const base = resolveHttpBase(httpBase)
    for (const endpoint of OPENCLAW_HEALTH_ENDPOINTS) {
      const url = `${base}${endpoint}`
      try {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 3000)
        const response = await fetch(url, { method: 'GET', signal: controller.signal })
        clearTimeout(timeout)
        if (response.ok) return true
      } catch (_) {
        // continue checking next endpoint
      }
    }
    return false
  }

  // ============== 连接管理 ==============
  
  /**
   * 连接到本地 OpenClaw
   */
  function resolveHttpBase(inputBase) {
    const saved = localStorage.getItem(STORAGE_KEY_HTTP_BASE)
    return (inputBase || saved || OPENCLAW_DEFAULT_HTTP_BASE).replace(/\/$/, '')
  }

  function buildAuthFromStorage() {
    const token = localStorage.getItem(STORAGE_KEY_TOKEN)
    const password = localStorage.getItem(STORAGE_KEY_PASSWORD)
    const candidates = []
    if (token) candidates.push({ token })
    if (password) candidates.push({ password })
    return candidates
  }

  async function connect(options = {}) {
    if (globalState.ws && globalState.ws.readyState === WebSocket.OPEN) {
      console.log('[OpenClaw] Already connected')
      return true
    }

    const httpBase = resolveHttpBase(options.httpBase)
    if (options.httpBase) {
      localStorage.setItem(STORAGE_KEY_HTTP_BASE, httpBase)
    }

    // 健康检查仅作参考，不作为硬门槛（浏览器可能因 CORS 拦截 health 请求）
    const isHealthy = await checkHealth(httpBase)
    if (!isHealthy) {
      console.warn('[OpenClaw] health check failed, continue trying websocket candidates')
    }

    connectionState.value = ClawConnectionState.CONNECTING

    const candidates = options.wsCandidates?.length
      ? options.wsCandidates
      : getDefaultWsCandidates(httpBase)

    for (const wsUrl of candidates) {
      const ok = await tryConnectOnce(wsUrl)
      if (ok) {
        globalState.wsUrl = wsUrl
        return true
      }
    }

    connectionState.value = ClawConnectionState.FAILED
    lastError.value = { code: 'WS_ERROR', message: 'WebSocket 连接失败，请检查 OpenClaw 网关地址或鉴权方式' }
    return false
  }

  async function tryConnectOnce(wsUrl) {
    return new Promise((resolve) => {
      try {
        globalState.ws = new WebSocket(wsUrl)
        const timer = setTimeout(() => {
          if (globalState.ws && globalState.ws.readyState !== WebSocket.OPEN) {
            try { globalState.ws.close() } catch (_) {}
            globalState.ws = null
            resolve(false)
          }
        }, 3500)

        globalState.ws.onopen = async () => {
          clearTimeout(timer)
          console.log('[OpenClaw] WebSocket connected:', wsUrl)
          connectionState.value = ClawConnectionState.CONNECTED
          globalState.reconnectAttempts = 0
          lastError.value = null
          startHeartbeat()
          await authenticate()
          resolve(true)
        }

        globalState.ws.onclose = () => {
          clearTimeout(timer)
          handleDisconnect()
          resolve(false)
        }

        globalState.ws.onerror = () => {
          clearTimeout(timer)
          try { globalState.ws.close() } catch (_) {}
          globalState.ws = null
          resolve(false)
        }

        globalState.ws.onmessage = (event) => {
          handleMessage(event.data)
        }
      } catch (_) {
        resolve(false)
      }
    })
  }
  
  /**
   * 断开连接
   */
  function disconnect() {
    stopHeartbeat()
    stopReconnect()
    
    if (globalState.ws) {
      globalState.ws.close(1000, 'User disconnect')
      globalState.ws = null
    }
    
    connectionState.value = ClawConnectionState.DISCONNECTED
    
    // 清理所有待处理请求
    for (const [id, pending] of globalState.pendingRequests) {
      clearTimeout(pending.timeout)
      pending.reject(new Error('Connection closed'))
    }
    globalState.pendingRequests.clear()
    globalState.taskCallbacks.clear()
  }
  
  /**
   * 处理断开连接
   */
  function handleDisconnect() {
    stopHeartbeat()
    globalState.ws = null
    
    if (isEnabled.value && globalState.reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      connectionState.value = ClawConnectionState.RECONNECTING
      scheduleReconnect()
    } else {
      connectionState.value = ClawConnectionState.DISCONNECTED
    }
  }

  // ============== 心跳 ==============
  
  function startHeartbeat() {
    stopHeartbeat()
    globalState.heartbeatTimer = setInterval(() => {
      if (globalState.ws && globalState.ws.readyState === WebSocket.OPEN) {
        sendRpc(createPingCommand()).catch(() => {
          console.warn('[OpenClaw] Heartbeat failed')
        })
      }
    }, HEARTBEAT_INTERVAL_MS)
  }
  
  function stopHeartbeat() {
    if (globalState.heartbeatTimer) {
      clearInterval(globalState.heartbeatTimer)
      globalState.heartbeatTimer = null
    }
  }

  // ============== 重连 ==============
  
  function scheduleReconnect() {
    stopReconnect()
    
      const delay = RECONNECT_DELAY_MS * Math.pow(1.5, globalState.reconnectAttempts)
    console.log(`[OpenClaw] Reconnecting in ${delay}ms (attempt ${globalState.reconnectAttempts + 1})`)
    
    globalState.reconnectTimer = setTimeout(() => {
      globalState.reconnectAttempts++
      connect()
    }, delay)
  }
  
  function stopReconnect() {
    if (globalState.reconnectTimer) {
      clearTimeout(globalState.reconnectTimer)
      globalState.reconnectTimer = null
    }
  }

  // ============== 认证 ==============
  
  async function authenticate() {
    const authCandidates = buildAuthFromStorage()

    if (!authCandidates.length) {
      // 未配置鉴权，视为已连接未认证状态（允许用户输入 token/password）
      connectionState.value = ClawConnectionState.CONNECTED
      console.log('[OpenClaw] No auth configured, waiting for user input')
      return false
    }

    connectionState.value = ClawConnectionState.AUTHENTICATING

    for (const auth of authCandidates) {
      try {
        const response = await sendConnectAuth(auth, 10000)
        const ok = response?.result?.ok ?? response?.data?.success ?? response?.ok
        if (!ok) {
          continue
        }

        connectionState.value = ClawConnectionState.AUTHENTICATED
        console.log('[OpenClaw] Authenticated successfully')
        queryCapabilities()
        return true
      } catch (_) {
        // try next credential candidate
      }
    }

    connectionState.value = ClawConnectionState.CONNECTED
    lastError.value = { code: 'AUTH_FAILED', message: '认证失败，请检查 token/password' }
    return false
  }
  
  /**
   * 配对认证（首次连接）
   */
  async function pair(pairingInput) {
    connectionState.value = ClawConnectionState.AUTHENTICATING

    try {
      // 先确保 WebSocket 已连接，避免“状态显示已连接但底层已断开”的情况
      if (!globalState.ws || globalState.ws.readyState !== WebSocket.OPEN) {
        const connected = await connect()
        if (!connected || !globalState.ws || globalState.ws.readyState !== WebSocket.OPEN) {
          connectionState.value = ClawConnectionState.FAILED
          return { success: false, error: '无法连接 OpenClaw 网关，请先点击“重新检测”并确认网关在运行' }
        }
      }

      const authCandidates = normalizePairingInput(pairingInput)

      for (const auth of authCandidates) {
        try {
          const response = await sendConnectAuth(auth, 15000)
          const ok = response?.result?.ok ?? response?.data?.success ?? response?.ok
          const token = response?.result?.token ?? response?.data?.token
          if (!ok) {
            continue
          }

          // 成功后双写：token/password 都记住，避免模式判断误差
          if (token) localStorage.setItem(STORAGE_KEY_TOKEN, token)
          if (auth.token) localStorage.setItem(STORAGE_KEY_TOKEN, auth.token)
          if (auth.password) localStorage.setItem(STORAGE_KEY_PASSWORD, auth.password)
          connectionState.value = ClawConnectionState.AUTHENTICATED
          console.log('[OpenClaw] Paired successfully')
          queryCapabilities()
          return { success: true }
        } catch (_) {
          // 当前候选鉴权方式超时/失败，继续尝试下一个
          continue
        }
      }

      // 兜底：部分网关使用 URL token 鉴权，connect 可能不会返回 success
      // 若能成功调用 status，视为已就绪。
      try {
        const status = await sendRpc({ method: 'status', params: {} }, 5000)
        if (status && !status.error) {
          localStorage.setItem(STORAGE_KEY_TOKEN, String(pairingInput || '').trim())
          connectionState.value = ClawConnectionState.AUTHENTICATED
          queryCapabilities()
          return { success: true }
        }
      } catch (_) {
        // keep falling through
      }

      connectionState.value = ClawConnectionState.CONNECTED
      return { success: false, error: '鉴权失败，请确认 token/password 正确' }
    } catch (e) {
      connectionState.value = ClawConnectionState.CONNECTED
      return { success: false, error: e.message }
    }
  }

  function normalizePairingInput(input) {
    const text = String(input || '').trim()
    if (!text) return []
    // 同一个输入同时尝试 token 和 password，避免误判
    return [{ token: text }, { password: text }]
  }

  async function sendConnectAuth(auth, timeoutMs = 10000) {
    const payload = createAuthCommand(auth)
    try {
      return await sendRpc(payload, timeoutMs)
    } catch (_) {
      // 某些网关 connect 不是 JSON-RPC，改用原生 connect 消息
      return await sendConnectRaw(payload, timeoutMs)
    }
  }

  function sendConnectRaw(payload, timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
      if (!globalState.ws || globalState.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const timeout = setTimeout(() => {
        if (globalState.connectPending) {
          globalState.connectPending = null
        }
        reject(new Error('Request timeout'))
      }, timeoutMs)

      globalState.connectPending = {
        resolve: (msg) => {
          clearTimeout(timeout)
          globalState.connectPending = null
          resolve(msg)
        },
        reject: (err) => {
          clearTimeout(timeout)
          globalState.connectPending = null
          reject(err)
        }
      }

      try {
        globalState.ws.send(JSON.stringify(payload))
      } catch (e) {
        clearTimeout(timeout)
        globalState.connectPending = null
        reject(e)
      }
    })
  }

  // ============== 能力查询 ==============
  
  async function queryCapabilities() {
    try {
      const response = await sendRpc(createGetCapabilitiesCommand(), 5000)
      const tools = response?.result?.tools || response?.data?.capabilities || []
      capabilities.value = normalizeCapabilities(tools)
      console.log('[OpenClaw] Capabilities:', capabilities.value)
    } catch (e) {
      console.warn('[OpenClaw] Failed to get capabilities:', e)
    }
  }
  
  /**
   * 检查是否支持指定任务类型
   */
  function supportsTask(taskType) {
    if (!capabilities.value || capabilities.value.length === 0) {
      // 部分网关不会公开 tools.list，连通后放行尝试执行
      return isAuthenticated.value
    }
    const toolName = getToolNameByTaskType(taskType)
    if (!toolName) return false
    return capabilities.value.some(cap => cap.type === taskType || cap.name === toolName || cap.types?.includes(taskType))
  }

  function normalizeCapabilities(tools) {
    const arr = Array.isArray(tools) ? tools : []
    return arr.map((tool) => {
      if (typeof tool === 'string') {
        return { name: tool, type: mapToolToTaskType(tool) }
      }
      return {
        ...tool,
        name: tool.name || tool.id || '',
        type: tool.type || mapToolToTaskType(tool.name || tool.id || '')
      }
    })
  }

  function mapToolToTaskType(toolName) {
    const mapping = {
      book_hospital_appointment: 'HOSPITAL_BOOKING',
      add_medication_reminder: 'MEDICATION_REMINDER',
      save_prescription: 'PRESCRIPTION_SAVE',
      capture_tongue_image: 'TONGUE_CAPTURE',
      print_document: 'PRINT_PRESCRIPTION',
      open_local_path: 'OPEN_LOCAL_PATH'
    }
    return mapping[toolName] || null
  }

  // ============== 消息发送 ==============
  
  /**
   * 发送命令并等待响应
   */
  function sendRpc(payload, timeoutMs = 30000) {
    return new Promise((resolve, reject) => {
      if (!globalState.ws || globalState.ws.readyState !== WebSocket.OPEN) {
        reject(new Error('WebSocket not connected'))
        return
      }

      const rpcId = globalState.rpcId++
      const command = {
        jsonrpc: '2.0',
        id: rpcId,
        ...payload
      }

      const timeoutHandle = setTimeout(() => {
        globalState.pendingRequests.delete(rpcId)
        reject(new Error('Request timeout'))
      }, timeoutMs)

      globalState.pendingRequests.set(rpcId, {
        resolve,
        reject,
        timeout: timeoutHandle,
        command
      })
      
      try {
        globalState.ws.send(JSON.stringify(command))
      } catch (e) {
        globalState.pendingRequests.delete(command.id)
        clearTimeout(timeoutHandle)
        reject(e)
      }
    })
  }
  
  /**
   * 发送命令但不等待响应
   */
  function sendCommandAsync(command) {
    if (!globalState.ws || globalState.ws.readyState !== WebSocket.OPEN) {
      console.warn('[OpenClaw] Cannot send: not connected')
      return false
    }
    
    try {
      globalState.ws.send(JSON.stringify(command))
      return true
    } catch (e) {
      console.error('[OpenClaw] Send failed:', e)
      return false
    }
  }

  // ============== 消息处理 ==============
  
  function handleMessage(rawData) {
    const message = parseClawResponse(rawData)

    if (globalState.connectPending) {
      if (message?.error) {
        globalState.connectPending.reject(new Error(message.error?.message || 'Auth failed'))
        return
      }
      const connectedSignals = [
        message?.result?.ok === true,
        message?.data?.success === true,
        message?.data?.authenticated === true,
        message?.method === 'connected',
        message?.method === 'ready',
        message?.type === 'connected'
      ]
      if (connectedSignals.some(Boolean)) {
        globalState.connectPending.resolve({ ok: true, ...message })
        return
      }
      const deniedSignals = [
        message?.result?.ok === false,
        message?.data?.success === false,
        message?.type === 'auth_failed'
      ]
      if (deniedSignals.some(Boolean)) {
        globalState.connectPending.reject(new Error('Auth failed'))
        return
      }
    }
    
    // JSON-RPC 响应
    if (message.id != null && globalState.pendingRequests.has(message.id)) {
      const pending = globalState.pendingRequests.get(message.id)
      globalState.pendingRequests.delete(message.id)
      clearTimeout(pending.timeout)

      if (message.error) {
        pending.reject(new Error(message.error?.message || 'Unknown error'))
      } else {
        pending.resolve(message)
      }
      return
    }
    
    // JSON-RPC 事件推送
    if (message.method === 'task.progress' || message.method === 'task.status') {
      const taskId = message.data?.taskId || message.data?.id
      if (taskId && globalState.taskCallbacks.has(taskId)) {
        const callbacks = globalState.taskCallbacks.get(taskId)
        callbacks.onProgress?.(message.data)
      }
      return
    }

    if (message.method === 'task.complete') {
      const taskId = message.data?.taskId || message.data?.id
      if (taskId && globalState.taskCallbacks.has(taskId)) {
        const callbacks = globalState.taskCallbacks.get(taskId)
        callbacks.onComplete?.(message.data)
        globalState.taskCallbacks.delete(taskId)
      }
      return
    }
    
    if (message.method === 'task.confirmation_required') {
      window.dispatchEvent(new CustomEvent('openclaw:confirmation-required', {
        detail: message.data
      }))
      return
    }
    
    console.log('[OpenClaw] Unhandled message:', message)
  }

  // ============== 任务执行 ==============
  
  /**
   * 执行任务
   * @param {object} command - 任务命令 (使用 protocol 中的构造函数创建)
   * @param {object} callbacks - { onProgress, onComplete }
   * @returns {Promise} 任务结果
   */
  async function executeTask(command, callbacks = {}) {
    if (!isReady.value) {
      throw new Error('OpenClaw not ready')
    }
    
    // 注册回调
    const taskId = command.id
    globalState.taskCallbacks.set(taskId, {
      onProgress: callbacks.onProgress,
      onComplete: callbacks.onComplete
    })
    
    try {
      const toolName = getToolNameByTaskType(command.task?.type)
      if (!toolName) {
        throw new Error(`Unsupported task type: ${command.task?.type}`)
      }

      // 转成 JSON-RPC 工具调用
      const response = await sendRpc({
        method: 'tools.invoke',
        params: {
          name: toolName,
          args: command.task?.params || {},
          requestId: taskId
        }
      }, command.timeout || 60000)

      const immediate = response?.result || response?.data
      if (immediate?.status && isTaskComplete(immediate.status)) {
        globalState.taskCallbacks.delete(taskId)
        return immediate
      }
      if (typeof immediate?.success === 'boolean') {
        globalState.taskCallbacks.delete(taskId)
        return immediate
      }

      return new Promise((resolve, reject) => {
        const existingCallbacks = globalState.taskCallbacks.get(taskId)
        globalState.taskCallbacks.set(taskId, {
          ...existingCallbacks,
          onComplete: (result) => {
            existingCallbacks?.onComplete?.(result)
            if (result.status === ClawTaskStatus.SUCCESS) {
              resolve(result)
            } else {
              reject(new Error(result.error || `Task ${result.status}`))
            }
          }
        })
        
        // 设置总超时
        setTimeout(() => {
          if (globalState.taskCallbacks.has(taskId)) {
            globalState.taskCallbacks.delete(taskId)
            reject(new Error('Task execution timeout'))
          }
        }, (command.timeout || 60000) + 5000)
      })
      
    } catch (e) {
      globalState.taskCallbacks.delete(taskId)
      throw e
    }
  }
  
  /**
   * 取消任务
   */
  async function cancelTask(taskId) {
    return sendRpc({ method: 'tasks.cancel', params: { taskId } }, 5000)
  }

  // ============== 启用/禁用 ==============
  
  function enable() {
    isEnabled.value = true
    localStorage.setItem(STORAGE_KEY_ENABLED, 'true')
    connect()
  }
  
  function disable() {
    isEnabled.value = false
    localStorage.setItem(STORAGE_KEY_ENABLED, 'false')
    disconnect()
  }
  
  function toggle() {
    if (isEnabled.value) {
      disable()
    } else {
      enable()
    }
  }

  // ============== 生命周期 ==============
  
  // 自动连接（如果启用）
  if (isEnabled.value && connectionState.value === ClawConnectionState.DISCONNECTED) {
    // 延迟连接，避免页面加载时阻塞
    setTimeout(() => {
      if (isEnabled.value) {
        connect()
      }
    }, 1000)
  }

  // ============== 返回接口 ==============
  
  return {
    // 状态
    connectionState,
    connectionStateText,
    isConnected,
    isAuthenticated,
    isReady,
    isEnabled,
    capabilities,
    lastError,
    
    // 连接管理
    connect,
    disconnect,
    checkHealth,
    
    // 认证
    pair,
    
    // 能力查询
    supportsTask,
    
    // 任务执行
    executeTask,
    cancelTask,
    
    // 启用/禁用
    enable,
    disable,
    toggle
  }
}

/**
 * 提供全局单例访问（用于非组件代码）
 */
export function getOpenClawInstance() {
  return {
    get connectionState() { return globalState.connectionState.value },
    get isConnected() { 
      return globalState.connectionState.value === ClawConnectionState.CONNECTED ||
             globalState.connectionState.value === ClawConnectionState.AUTHENTICATED
    },
    get isReady() {
      return globalState.isEnabled.value && 
             globalState.connectionState.value === ClawConnectionState.AUTHENTICATED
    }
  }
}
