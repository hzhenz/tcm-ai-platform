/**
 * OpenClaw 网关协议封装（前端侧）
 *
 * 说明：
 * 1) 本文件不再假设自定义 /tcm 协议
 * 2) 统一按网关 + JSON-RPC 风格对接
 * 3) 连接地址与鉴权均可配置
 */

// ============== 常量定义 ==============

/** OpenClaw 默认 HTTP 基地址 */
export const OPENCLAW_DEFAULT_HTTP_BASE = (import.meta.env.VITE_OPENCLAW_HTTP_BASE || 'http://127.0.0.1:18789').replace(/\/$/, '')

/** OpenClaw 健康检查候选地址 */
export const OPENCLAW_HEALTH_ENDPOINTS = [
  '/',
  '/health',
  '/api/v1/check'
]

/** OpenClaw WebSocket 候选路径（按优先级尝试） */
export const OPENCLAW_WS_PATH_CANDIDATES = ['/rpc', '/ws', '/socket', '/gateway', '/']

/** 心跳间隔 (毫秒) */
export const HEARTBEAT_INTERVAL_MS = 30000

/** 重连延迟 (毫秒) */
export const RECONNECT_DELAY_MS = 3000

/** 最大重连次数 */
export const MAX_RECONNECT_ATTEMPTS = 5

/** 获取默认 WebSocket 候选地址 */
export function getDefaultWsCandidates(httpBase = OPENCLAW_DEFAULT_HTTP_BASE) {
  const wsBase = httpBase.replace(/^http/i, 'ws')
  const list = OPENCLAW_WS_PATH_CANDIDATES.map((path) => {
    if (path === '/') return wsBase
    return `${wsBase}${path}`
  })
  // 兼容 token query 鉴权（你的网关 URL 显示为 #token=ollama）
  const token = (typeof window !== 'undefined' && (window.location.hash.match(/[#&]token=([^&]+)/)?.[1] || localStorage.getItem('openclaw_auth_token'))) || ''
  if (token) {
    return [...list, ...list.map((u) => `${u}?token=${encodeURIComponent(token)}`)]
  }
  return list
}

// ============== 任务类型枚举 ==============

/**
 * OpenClaw 可执行的任务类型
 */
export const ClawTaskType = {
  /** 医院挂号 - 使用本地浏览器自动填表 */
  HOSPITAL_BOOKING: 'HOSPITAL_BOOKING',
  
  /** 服药提醒 - 添加到系统日历 */
  MEDICATION_REMINDER: 'MEDICATION_REMINDER',
  
  /** 处方保存 - 保存到本地文件 */
  PRESCRIPTION_SAVE: 'PRESCRIPTION_SAVE',
  
  /** 舌象拍照 - 调用摄像头 */
  TONGUE_CAPTURE: 'TONGUE_CAPTURE',
  
  /** 打印处方 */
  PRINT_PRESCRIPTION: 'PRINT_PRESCRIPTION',
  
  /** 打开本地文件/目录 */
  OPEN_LOCAL_PATH: 'OPEN_LOCAL_PATH'
}

/**
 * 任务风险等级
 */
export const ClawRiskLevel = {
  /** 高风险 - 需要用户每次确认 (如挂号、支付) */
  HIGH: 'HIGH',
  
  /** 中风险 - 首次确认，可记住选择 (如日历、摄像头) */
  MEDIUM: 'MEDIUM',
  
  /** 低风险 - 自动执行 (如状态查询) */
  LOW: 'LOW'
}

/**
 * 任务类型对应的风险等级
 */
export const TaskRiskMapping = {
  [ClawTaskType.HOSPITAL_BOOKING]: ClawRiskLevel.HIGH,
  [ClawTaskType.MEDICATION_REMINDER]: ClawRiskLevel.MEDIUM,
  [ClawTaskType.PRESCRIPTION_SAVE]: ClawRiskLevel.MEDIUM,
  [ClawTaskType.TONGUE_CAPTURE]: ClawRiskLevel.MEDIUM,
  [ClawTaskType.PRINT_PRESCRIPTION]: ClawRiskLevel.MEDIUM,
  [ClawTaskType.OPEN_LOCAL_PATH]: ClawRiskLevel.LOW
}

// ============== 消息类型枚举 ==============

/**
 * 网站 → OpenClaw 的消息类型
 */
export const ClawCommandType = {
  /** 执行任务 */
  EXECUTE_TASK: 'EXECUTE_TASK',
  
  /** 查询任务状态 */
  QUERY_STATUS: 'QUERY_STATUS',
  
  /** 取消任务 */
  CANCEL_TASK: 'CANCEL_TASK',
  
  /** 心跳 */
  PING: 'PING',
  
  /** 认证 */
  AUTH: 'AUTH',
  
  /** 查询能力 */
  GET_CAPABILITIES: 'GET_CAPABILITIES'
}

/**
 * OpenClaw → 网站的消息类型
 */
export const ClawResponseType = {
  /** 任务状态更新 */
  TASK_STATUS: 'TASK_STATUS',
  
  /** 任务进度 */
  TASK_PROGRESS: 'TASK_PROGRESS',
  
  /** 任务完成 */
  TASK_COMPLETE: 'TASK_COMPLETE',
  
  /** 心跳响应 */
  PONG: 'PONG',
  
  /** 认证结果 */
  AUTH_RESULT: 'AUTH_RESULT',
  
  /** 能力列表 */
  CAPABILITIES: 'CAPABILITIES',
  
  /** 需要用户确认 */
  REQUIRE_CONFIRMATION: 'REQUIRE_CONFIRMATION',
  
  /** 错误 */
  ERROR: 'ERROR'
}

/**
 * 任务执行状态
 */
export const ClawTaskStatus = {
  /** 排队中 */
  QUEUED: 'QUEUED',
  
  /** 等待用户确认 */
  PENDING_CONFIRMATION: 'PENDING_CONFIRMATION',
  
  /** 执行中 */
  RUNNING: 'RUNNING',
  
  /** 成功 */
  SUCCESS: 'SUCCESS',
  
  /** 失败 */
  FAILED: 'FAILED',
  
  /** 已取消 */
  CANCELLED: 'CANCELLED',
  
  /** 超时 */
  TIMEOUT: 'TIMEOUT'
}

/**
 * 连接状态
 */
export const ClawConnectionState = {
  /** 未连接 */
  DISCONNECTED: 'DISCONNECTED',
  
  /** 连接中 */
  CONNECTING: 'CONNECTING',
  
  /** 已连接 */
  CONNECTED: 'CONNECTED',
  
  /** 认证中 */
  AUTHENTICATING: 'AUTHENTICATING',
  
  /** 已认证 */
  AUTHENTICATED: 'AUTHENTICATED',
  
  /** 重连中 */
  RECONNECTING: 'RECONNECTING',
  
  /** 连接失败 */
  FAILED: 'FAILED'
}

// ============== 消息构造器 ==============

/**
 * 生成唯一消息 ID
 */
export function generateMessageId() {
  return `tcm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 构造执行任务命令
 * @param {string} taskType - 任务类型 (ClawTaskType)
 * @param {object} params - 任务参数
 * @param {object} options - 可选配置
 * @returns {object} ClawCommand
 */
export function createExecuteCommand(taskType, params, options = {}) {
  return {
    id: generateMessageId(),
    type: ClawCommandType.EXECUTE_TASK,
    timestamp: Date.now(),
    task: {
      type: taskType,
      params: params,
      riskLevel: TaskRiskMapping[taskType] || ClawRiskLevel.MEDIUM
    },
    timeout: options.timeout || 60000,
    requireConfirmation: options.requireConfirmation !== false
  }
}

/**
 * 构造挂号任务命令
 */
export function createBookingCommand(params) {
  return createExecuteCommand(ClawTaskType.HOSPITAL_BOOKING, {
    hospitalUrl: params.hospitalUrl || 'https://www.cs4hospital.cn/',
    department: params.department,
    date: params.date,
    patientName: params.patientName || null,
    patientId: params.patientId || null,
    preferredDoctor: params.preferredDoctor || null,
    timeSlot: params.timeSlot || 'morning'
  }, {
    timeout: 120000,
    requireConfirmation: true
  })
}

/**
 * 构造服药提醒命令
 */
export function createReminderCommand(params) {
  return createExecuteCommand(ClawTaskType.MEDICATION_REMINDER, {
    medicineName: params.medicineName,
    dosage: params.dosage || '',
    frequency: params.frequency || '每日三次',
    times: params.times || ['08:00', '12:00', '18:00'],
    startDate: params.startDate || new Date().toISOString().split('T')[0],
    durationDays: params.durationDays || 7,
    notes: params.notes || ''
  }, {
    timeout: 30000,
    requireConfirmation: true
  })
}

/**
 * 构造处方保存命令
 */
export function createPrescriptionSaveCommand(params) {
  return createExecuteCommand(ClawTaskType.PRESCRIPTION_SAVE, {
    content: params.content,
    format: params.format || 'pdf',
    filename: params.filename || `处方_${new Date().toISOString().split('T')[0]}`,
    savePath: params.savePath || null // null 表示让用户选择
  }, {
    timeout: 30000,
    requireConfirmation: true
  })
}

/**
 * 构造舌象拍照命令
 */
export function createTongueCaptureCommand(params = {}) {
  return createExecuteCommand(ClawTaskType.TONGUE_CAPTURE, {
    cameraId: params.cameraId || null,
    resolution: params.resolution || '1280x720',
    guidanceEnabled: params.guidanceEnabled !== false
  }, {
    timeout: 60000,
    requireConfirmation: true
  })
}

/**
 * 构造心跳命令
 */
export function createPingCommand() {
  return {
    method: 'ping',
    params: {}
  }
}

/**
 * 构造认证命令
 */
export function createAuthCommand(auth) {
  return { method: 'connect', params: { auth } }
}

/**
 * 构造取消任务命令
 */
export function createCancelCommand(taskId) {
  return {
    id: generateMessageId(),
    type: ClawCommandType.CANCEL_TASK,
    timestamp: Date.now(),
    targetTaskId: taskId
  }
}

/**
 * 构造查询能力命令
 */
export function createGetCapabilitiesCommand() {
  return { method: 'tools.list', params: {} }
}

// ============== 消息解析器 ==============

/**
 * 解析 OpenClaw 响应消息
 * @param {string|object} rawMessage - WebSocket 消息
 * @returns {object} 解析后的消息对象
 */
export function parseClawResponse(rawMessage) {
  try {
    const message = typeof rawMessage === 'string' ? JSON.parse(rawMessage) : rawMessage

    return {
      id: message.id || null,
      type: message.type || null,
      timestamp: message.timestamp || Date.now(),
      requestId: message.requestId || null,
      jsonrpc: message.jsonrpc || null,
      method: message.method || null,
      result: message.result,
      data: message.data || message.result || {},
      error: message.error || null,
      raw: message
    }
  } catch (e) {
    console.error('[OpenClaw] Failed to parse message:', e)
    return {
      id: null,
      type: ClawResponseType.ERROR,
      timestamp: Date.now(),
      error: { code: 'PARSE_ERROR', message: e.message },
      raw: rawMessage
    }
  }
}

/**
 * 检查任务是否已完成（成功或失败）
 */
export function isTaskComplete(status) {
  return [
    ClawTaskStatus.SUCCESS,
    ClawTaskStatus.FAILED,
    ClawTaskStatus.CANCELLED,
    ClawTaskStatus.TIMEOUT
  ].includes(status)
}

/**
 * 检查任务是否成功
 */
export function isTaskSuccess(status) {
  return status === ClawTaskStatus.SUCCESS
}

/**
 * 获取任务类型的中文名称
 */
export function getTaskTypeName(taskType) {
  const names = {
    [ClawTaskType.HOSPITAL_BOOKING]: '医院挂号',
    [ClawTaskType.MEDICATION_REMINDER]: '服药提醒',
    [ClawTaskType.PRESCRIPTION_SAVE]: '处方保存',
    [ClawTaskType.TONGUE_CAPTURE]: '舌象拍照',
    [ClawTaskType.PRINT_PRESCRIPTION]: '打印处方',
    [ClawTaskType.OPEN_LOCAL_PATH]: '打开文件'
  }
  return names[taskType] || taskType
}

/**
 * 获取状态的中文名称
 */
export function getTaskStatusName(status) {
  const names = {
    [ClawTaskStatus.QUEUED]: '排队中',
    [ClawTaskStatus.PENDING_CONFIRMATION]: '等待确认',
    [ClawTaskStatus.RUNNING]: '执行中',
    [ClawTaskStatus.SUCCESS]: '已完成',
    [ClawTaskStatus.FAILED]: '执行失败',
    [ClawTaskStatus.CANCELLED]: '已取消',
    [ClawTaskStatus.TIMEOUT]: '执行超时'
  }
  return names[status] || status
}

/**
 * 获取连接状态的中文名称
 */
export function getConnectionStateName(state) {
  const names = {
    [ClawConnectionState.DISCONNECTED]: '未连接',
    [ClawConnectionState.CONNECTING]: '连接中...',
    [ClawConnectionState.CONNECTED]: '已连接',
    [ClawConnectionState.AUTHENTICATING]: '认证中...',
    [ClawConnectionState.AUTHENTICATED]: '已就绪',
    [ClawConnectionState.RECONNECTING]: '重连中...',
    [ClawConnectionState.FAILED]: '连接失败'
  }
  return names[state] || state
}

/** 任务类型 -> OpenClaw 工具名映射 */
export function getToolNameByTaskType(taskType) {
  const map = {
    [ClawTaskType.HOSPITAL_BOOKING]: 'book_hospital_appointment',
    [ClawTaskType.MEDICATION_REMINDER]: 'add_medication_reminder',
    [ClawTaskType.PRESCRIPTION_SAVE]: 'save_prescription',
    [ClawTaskType.TONGUE_CAPTURE]: 'capture_tongue_image',
    [ClawTaskType.PRINT_PRESCRIPTION]: 'print_document',
    [ClawTaskType.OPEN_LOCAL_PATH]: 'open_local_path'
  }
  return map[taskType] || null
}
