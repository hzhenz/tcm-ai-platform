<template>
  <div class="agent-butler-root" ref="rootRef" :style="rootStyle">
    <transition name="guide-fade">
      <div v-if="showGuide && !panelVisible" class="bubble-guide" :class="[`guide-${panelHorizontalDock}`]" @click="handleClick">
        <span class="guide-text">遇到困难啦？让小佗来帮您~</span>
        <button class="guide-close" @click.stop="dismissGuide">×</button>
        <div class="guide-arrow"></div>
      </div>
    </transition>

    <button
      class="butler-bubble"
      :class="{ 'is-breathing': !panelVisible }"
      type="button"
      :aria-expanded="panelVisible ? 'true' : 'false'"
      @pointerdown="startDrag($event, { allowWhenPanelVisible: true })"
      @click="handleClick"
    >
      <span class="bubble-icon">小佗</span>
      <span v-if="pendingCount > 0" class="bubble-badge">{{ pendingCount }}</span>
    </button>

    <transition name="butler-fade">
      <section v-if="panelVisible" ref="panelRef" class="butler-panel" :class="[panelDockClass, { 'is-panel-resizing': isPanelResizing }]" :style="panelInlineStyle">
        <header class="panel-header panel-drag-handle" @pointerdown="startDrag($event, { allowWhenPanelVisible: true })">
          <div>
            <h3>小佗</h3>
            <p>可对话、可执行、可引导全站操作</p>
          </div>
          <button class="close-btn" type="button" @pointerdown.stop @click="panelVisible = false">x</button>
        </header>

        <p v-if="viewportWidth > 768" class="panel-resize-tip">拖动四边或四角可调整窗口大小</p>

        <div class="panel-tabs">
          <button class="tab-btn" :class="{ active: activeTab === 'brain' }" type="button" @click="activeTab = 'brain'">对话大脑</button>
          <button class="tab-btn" :class="{ active: activeTab === 'tasks' }" type="button" @click="switchToTaskTab">任务中心</button>
        </div>

        <section v-if="activeTab === 'brain'" class="brain-section">
          <section v-if="executionTimeline.length" class="execution-shell">
            <button
              class="execution-toggle"
              type="button"
              :aria-expanded="executionPanelCollapsed ? 'false' : 'true'"
              @click="executionPanelCollapsed = !executionPanelCollapsed"
            >
              <strong>{{ executionTitle }}</strong>
              <span class="execution-phase" :class="`phase-${executionPhase}`">{{ executionPhaseText }}</span>
              <span class="execution-toggle-text">{{ executionPanelCollapsed ? '展开' : '收起' }}</span>
            </button>
            <div class="execution-progress-track">
              <span class="execution-progress-fill" :style="{ width: `${executionProgress}%` }"></span>
            </div>
            <ol v-if="!executionPanelCollapsed" class="execution-list">
              <li
                v-for="step in executionTimeline.slice(-6)"
                :key="step.id"
                class="execution-item"
                :class="[
                  `item-${step.status}`,
                  { 'is-active': executionActiveStepId === step.id, 'is-separator': step.isSeparator }
                ]"
              >
                <span class="item-time">{{ step.time }}</span>
                <span class="item-text">{{ step.text }}</span>
              </li>
            </ol>
          </section>

          <div ref="brainScrollRef" class="brain-messages">
            <div
              v-for="item in brainMessages"
              :key="item.id"
              class="brain-row"
              :class="item.role === 'user' ? 'is-user' : 'is-agent'"
            >
              <p class="brain-bubble">{{ item.content }}</p>
              <div v-if="item.suggestions?.length" class="suggestion-row">
                <button
                  v-for="suggestion in item.suggestions"
                  :key="suggestion.label"
                  class="suggestion-btn"
                  type="button"
                  @click="handleSuggestion(suggestion)"
                >
                  {{ suggestion.label }}
                </button>
              </div>
            </div>

            <div v-if="brainLoading" class="brain-row is-agent">
              <p class="brain-bubble thinking">正在思考并规划动作...</p>
            </div>
          </div>

          <div class="brain-toggle-row">
            <label class="llm-toggle">
              <input v-model="llmEnabled" type="checkbox" />
              接入大语言模型辅助回复
            </label>
          </div>

          <div class="brain-quick-row">
            <button class="quick-chip" type="button" @click="sendBrainMessage('我有点不舒服')">我有点不舒服</button>
            <button class="quick-chip" type="button" @click="sendBrainMessage('帮我去问诊')">帮我去问诊</button>
            <button class="quick-chip" type="button" @click="sendBrainMessage('去舌诊页面')">去舌诊</button>
            <button class="quick-chip" type="button" @click="sendBrainMessage('去识草页面')">去识草</button>
            <button class="quick-chip" type="button" @click="sendBrainMessage('去科普页面')">去科普</button>
            <button class="quick-chip" type="button" @click="sendBrainMessage('帮我预约最近医院')">帮我预约最近医院</button>
          </div>

          <div class="brain-input-row">
            <input
              v-model="brainInput"
              type="text"
              placeholder="告诉我你想做什么，例如：我不舒服，是否进入问诊？"
              @keydown.enter="sendBrainMessage()"
            />
            <button type="button" :disabled="brainLoading" @click="sendBrainMessage()">发送</button>
          </div>
        </section>

        <section v-else class="task-section">
          <div v-if="!loggedIn" class="panel-empty">
            <p>当前未登录，任务中心需要登录后使用。</p>
            <button class="link-btn" type="button" @click="goLogin">去登录</button>
          </div>

          <template v-else>
            <div class="quick-actions">
              <button
                class="action-btn"
                type="button"
                :disabled="actionLoadingType === 'wechat'"
                @click="createDemoTask('wechat')"
              >
                发送报告到微信（需审批）
              </button>
              <button
                class="action-btn"
                type="button"
                :disabled="actionLoadingType === 'booking'"
                @click="createDemoTask('booking')"
              >
                预约最近医院（需审批）
              </button>
              <button
                class="action-btn low-risk"
                type="button"
                :disabled="actionLoadingType === 'followup'"
                @click="createDemoTask('followup')"
              >
                创建随访提醒（低风险自动执行）
              </button>
            </div>

            <div class="task-tools">
              <button class="ghost-btn" type="button" :disabled="taskLoading" @click="refreshTasks">
                {{ taskLoading ? '刷新中...' : '刷新任务' }}
              </button>
            </div>

            <ul v-if="displayTasks.length" class="task-list">
              <li v-for="task in displayTasks" :key="task.id" class="task-item" :class="{ 'is-flow-open': expandedTaskFlowId === task.id }">
                <div class="task-head">
                  <strong>{{ task.title }}</strong>
                  <span class="status-pill" :class="statusClass(task.status)">{{ statusText(task.status) }}</span>
                </div>
                <p class="task-meta">{{ task.taskType }} · {{ task.riskLevel }} · {{ formatTime(task.createTime) }}</p>
                <p v-if="task.errorMessage" class="task-error">{{ task.errorMessage }}</p>

                <div class="task-tools-inline">
                  <button class="ghost-btn" type="button" @click="toggleTaskFlow(task.id)">
                    {{ expandedTaskFlowId === task.id ? '收起执行流' : '查看执行流' }}
                  </button>
                </div>

                <ol v-if="expandedTaskFlowId === task.id" class="task-flow-list">
                  <li v-for="step in taskFlowSteps(task)" :key="step.id" :class="`flow-${step.status}`">
                    <span class="flow-time">{{ step.time }}</span>
                    <span class="flow-text">{{ step.text }}</span>
                  </li>
                </ol>

                <div v-if="task.status === 'PENDING_APPROVAL'" class="task-actions">
                  <button
                    class="approve-btn"
                    type="button"
                    :disabled="approvingTaskId === task.id"
                    @click="approve(task.id, 'APPROVE')"
                  >
                    同意执行
                  </button>
                  <button
                    class="reject-btn"
                    type="button"
                    :disabled="approvingTaskId === task.id"
                    @click="approve(task.id, 'REJECT')"
                  >
                    拒绝
                  </button>
                </div>
              </li>
            </ul>

            <div v-else class="panel-empty">
              <p>暂无任务，可从上方快速创建，或从对话大脑里通过自然语言发起。</p>
            </div>
          </template>
        </section>

        <button class="panel-resize-edge edge-top" type="button" aria-label="向上调整大小" @pointerdown.stop.prevent="startPanelResize($event, 'n')"></button>
        <button class="panel-resize-edge edge-right" type="button" aria-label="向右调整大小" @pointerdown.stop.prevent="startPanelResize($event, 'e')"></button>
        <button class="panel-resize-edge edge-bottom" type="button" aria-label="向下调整大小" @pointerdown.stop.prevent="startPanelResize($event, 's')"></button>
        <button class="panel-resize-edge edge-left" type="button" aria-label="向左调整大小" @pointerdown.stop.prevent="startPanelResize($event, 'w')"></button>

        <button class="panel-resize-corner corner-top-left" type="button" aria-label="左上角调整大小" @pointerdown.stop.prevent="startPanelResize($event, 'nw')"></button>
        <button class="panel-resize-corner corner-top-right" type="button" aria-label="右上角调整大小" @pointerdown.stop.prevent="startPanelResize($event, 'ne')"></button>
        <button class="panel-resize-corner corner-bottom-left" type="button" aria-label="左下角调整大小" @pointerdown.stop.prevent="startPanelResize($event, 'sw')"></button>
        <button class="panel-resize-corner corner-bottom-right" type="button" aria-label="右下角调整大小" @pointerdown.stop.prevent="startPanelResize($event, 'se')"></button>
      </section>
    </transition>
  </div>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAgentDrag } from '@/components/agent-butler/composables/useAgentDrag'
import { useAgentExecution } from '@/components/agent-butler/composables/useAgentExecution'
import { useAgentTaskCenter } from '@/components/agent-butler/composables/useAgentTaskCenter'
import { useAgentReminder } from '@/components/agent-butler/composables/useAgentReminder'
import { useAgentBrain } from '@/components/agent-butler/composables/useAgentBrain'

const TOKEN_KEY = 'tcm_token'
const LOCAL_REMINDER_KEY = 'tcm_medication_reminders'
const BRAIN_SESSION_KEY = 'tcm_agent_brain_session_id'
const PANEL_SIZE_KEY = 'tcm_agent_butler_panel_size'
const PUBLIC_PATHS = new Set(['/', '/login', '/register'])
const DATE_TOKEN_PATTERN = '(今天|明天|后天|大后天|下周[一二三四五六日天]|\\d{4}-\\d{1,2}-\\d{1,2}|\\d{1,2}月\\d{1,2}日)'
const TASK_EXECUTION_POLL_INTERVAL_MS = 900
const TASK_EXECUTION_POLL_TIMEOUT_MS = 120000

const REMINDER_SLOT_LIBRARY = {
  morning: { key: 'morning', label: '早餐后', time: '08:30' },
  noon: { key: 'noon', label: '午餐后', time: '13:00' },
  evening: { key: 'evening', label: '晚餐后', time: '19:30' }
}

const PAGE_META = {
  '/': { label: '首页', autoMessage: '好的，带你回到首页。' },
  '/consultation': { label: '问诊页面', autoMessage: '好的，正在带你进入问诊页面。' },
  '/tongue': { label: '舌诊页面', autoMessage: '好的，正在带你进入舌诊页面。' },
  '/herb': { label: '识草页面', autoMessage: '好的，正在带你进入识草页面。' },
  '/science': { label: '科普页面', autoMessage: '好的，正在带你进入科普页面。' },
  '/map': { label: '地图页面', autoMessage: '好的，正在带你进入地图页面。' },
  '/profile': { label: '个人中心', autoMessage: '好的，正在带你进入个人中心。' }
}

const router = useRouter()
const route = useRoute()

const panelVisible = ref(false)
const showGuide = ref(true)
const activeTab = ref('brain')
const loggedIn = ref(false)
const brainInput = ref('')
const brainLoading = ref(false)
const brainScrollRef = ref(null)
const llmEnabled = ref(true)
const brainMessages = ref([])
const executionPanelCollapsed = ref(true)
const panelRef = ref(null)
const panelHorizontalDock = ref('right')
const panelVerticalDock = ref('above')
const viewportWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1440)
const viewportHeight = ref(typeof window !== 'undefined' ? window.innerHeight : 900)
const panelSize = ref(loadPanelSize())
const isPanelResizing = ref(false)
const panelResizePointerId = ref(null)
const panelResizeStartX = ref(0)
const panelResizeStartY = ref(0)
const panelResizeStartWidth = ref(380)
const panelResizeStartHeight = ref(680)
const panelResizeDirection = ref('se')

let messageSeq = 1

const {
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
} = useAgentExecution()

function normalizeText(text) {
  return String(text || '').trim()
}

function waitFor(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms)
  })
}

function parseResult(result) {
  if (!result || typeof result !== 'object') {
    throw new Error('服务响应异常')
  }
  if (result.code !== 200) {
    throw new Error(result.msg || '请求失败')
  }
  return result.data
}

function syncAuthState() {
  loggedIn.value = Boolean(localStorage.getItem(TOKEN_KEY))
}

function dismissGuide() {
  showGuide.value = false
}

function togglePanel() {
  panelVisible.value = !panelVisible.value
  if (panelVisible.value) {
    showGuide.value = false
  }
}

function switchToTaskTab() {
  activeTab.value = 'tasks'
  refreshTasks()
}

function goLogin() {
  panelVisible.value = false
  router.push('/login')
}

function nextMessageId() {
  messageSeq += 1
  return messageSeq
}

async function scrollBrainToBottom() {
  await nextTick()
  if (!brainScrollRef.value) {
    return
  }
  brainScrollRef.value.scrollTo({
    top: brainScrollRef.value.scrollHeight,
    behavior: 'smooth'
  })
}

function addBrainMessage(role, content, suggestions = []) {
  brainMessages.value.push({
    id: nextMessageId(),
    role,
    content,
    suggestions
  })
  scrollBrainToBottom()
}

function ensureBrainGreeting() {
  if (brainMessages.value.length > 0) {
    return
  }

  brainMessages.value.push({
    id: nextMessageId(),
    role: 'agent',
    content: '你好，我是全站管家。你可以让我全站跳转，也可以让我创建挂号和服药提醒任务。当前不支持的动作我会明确说明。',
    suggestions: [
      { label: '我不舒服', action: 'send', payload: { text: '我不舒服' } },
      { label: '进入问诊', action: 'route-consultation', payload: { prompt: '我最近感觉不舒服，请帮我先做问诊。' } },
      { label: '创建服药提醒', action: 'send', payload: { text: '帮我创建服药提醒' } },
      { label: '去舌诊', action: 'route-page', payload: { path: '/tongue', label: '舌诊页面' } },
      { label: '查看任务中心', action: 'switch-task-tab' }
    ]
  })
}

function isEmergencyRiskIntent(text) {
  const input = normalizeText(text)
  if (!input) {
    return false
  }

  const signalRules = [
    /(心脏疼|心口疼|心前区疼|胸痛|胸口痛|胸闷|压榨样疼痛|濒死感)/,
    /(呼吸不过来|呼吸困难|喘不上气|气短|憋气)/,
    /(眼前发黑|黑蒙|晕厥|昏厥|快晕倒|意识模糊)/,
    /(冷汗|大汗淋漓|左臂麻木|下颌痛|放射痛)/
  ]

  let hitCount = 0
  signalRules.forEach((rule) => {
    if (rule.test(input)) {
      hitCount += 1
    }
  })

  if (hitCount >= 2) {
    return true
  }

  return /(急救|急诊|心梗|心肌梗死|严重心律失常)/.test(input) && hitCount >= 1
}

function isAutoBookingIntent(text) {
  const input = normalizeText(text)
  return /(自动挂号|自动预约|立即挂号|马上挂号|直接挂号|帮我自动挂|帮我挂个.*号|帮我挂.*号)/.test(input)
}

function isBookingIntent(text) {
  const input = normalizeText(text)
  return /(挂号|预约|约号|门诊|号源|推拿科|针灸科|中医科|中医内科|骨科|妇科|儿科|皮肤科)/.test(input)
}

function detectLocalIntent(text) {
  const input = normalizeText(text)
  if (!input) {
    return { type: 'EMPTY' }
  }
  if (isEmergencyRiskIntent(input)) {
    return { type: 'EMERGENCY_RISK' }
  }
  if (/(服药提醒|用药提醒|吃药提醒|医嘱提醒|日历提醒|按时吃药|按时服药)/.test(input)) {
    return { type: 'CREATE_MEDICATION_REMINDER' }
  }
  if (/(代付|自动扣费|直接付款|帮我支付|帮我买药|打电话给医生|拨号|发短信)/.test(input)) {
    return { type: 'UNSUPPORTED_CAPABILITY' }
  }
  if (isAutoBookingIntent(input)) {
    return { type: 'AUTO_BOOKING' }
  }
  if (isBookingIntent(input)) {
    return { type: 'CREATE_BOOKING_TASK' }
  }
  if (/(去问诊|进入问诊|开始问诊|咨询医生|看诊)/.test(input)) {
    return { type: 'ROUTE_CONSULTATION' }
  }
  if (/(不舒服|难受|疼|痛|咳嗽|发烧|头晕|恶心|胸闷|乏力|失眠)/.test(input)) {
    return { type: 'SYMPTOM' }
  }
  if (/(舌诊|看舌|舌苔|舌象)/.test(input)) {
    return { type: 'ROUTE_TONGUE' }
  }
  if (/(识草|药材识别|识别药材|中药识别|识别草药)/.test(input)) {
    return { type: 'ROUTE_HERB' }
  }
  if (/(科普|中医知识|养生知识|知识库|学习一下)/.test(input)) {
    return { type: 'ROUTE_SCIENCE' }
  }
  if (/(地图|附近医院|附近医馆|附近门店|去哪看)/.test(input)) {
    return { type: 'ROUTE_MAP' }
  }
  if (/(首页|主页|回到首页)/.test(input)) {
    return { type: 'ROUTE_HOME' }
  }
  if (/(微信|发报告|发送报告|发给家人|联系人)/.test(input)) {
    return { type: 'CREATE_WECHAT_TASK' }
  }
  if (/(任务|审批|待办|执行状态)/.test(input)) {
    return { type: 'OPEN_TASK_CENTER' }
  }
  if (/(个人中心|我的报告|我的档案)/.test(input)) {
    return { type: 'ROUTE_PROFILE' }
  }
  if (/(你能做什么|帮助|怎么用|功能)/.test(input)) {
    return { type: 'HELP' }
  }
  return { type: 'UNKNOWN' }
}

const {
  taskLoading,
  actionLoadingType,
  approvingTaskId,
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
} = useAgentTaskCenter({
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
  setActiveTab: (tab) => {
    activeTab.value = tab
  },
  taskExecutionPollIntervalMs: TASK_EXECUTION_POLL_INTERVAL_MS,
  taskExecutionPollTimeoutMs: TASK_EXECUTION_POLL_TIMEOUT_MS
})

const { reminderDraft, tryHandleMedicationReminder } = useAgentReminder({
  localReminderKey: LOCAL_REMINDER_KEY,
  dateTokenPattern: DATE_TOKEN_PATTERN,
  reminderSlotLibrary: REMINDER_SLOT_LIBRARY,
  loggedIn,
  refreshTasks,
  normalizeText,
  parseResult,
  statusText,
  addBrainMessage,
  pushExecutionStep,
  markExecutionFailed
})

const { rootRef, rootStyle, startDrag, handleClick } = useAgentDrag(panelVisible, togglePanel, {
  onPositionChange: () => {
    updatePanelDockByBubble()
  }
})

const panelDockClass = computed(() => {
  return {
    'dock-left': panelHorizontalDock.value === 'left',
    'dock-right': panelHorizontalDock.value === 'right',
    'dock-above': panelVerticalDock.value === 'above',
    'dock-below': panelVerticalDock.value === 'below'
  }
})

const panelInlineStyle = computed(() => {
  const size = clampPanelSize(panelSize.value)
  return {
    width: `${size.width}px`,
    height: `${size.height}px`
  }
})

function loadPanelSize() {
  if (typeof window === 'undefined') {
    return { width: 380, height: 680 }
  }
  try {
    const raw = localStorage.getItem(PANEL_SIZE_KEY)
    if (!raw) {
      return { width: 380, height: 680 }
    }
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed !== 'object') {
      return { width: 380, height: 680 }
    }
    return {
      width: Number(parsed.width) || 380,
      height: Number(parsed.height) || 680
    }
  } catch (error) {
    return { width: 380, height: 680 }
  }
}

function panelSizeLimit() {
  const maxWidth = Math.max(300, Math.min(560, viewportWidth.value - 20))
  const minWidth = Math.min(320, maxWidth)
  const maxHeight = Math.max(420, Math.min(760, viewportHeight.value - 20))
  const minHeight = Math.min(420, maxHeight)
  return { minWidth, maxWidth, minHeight, maxHeight }
}

function clampPanelSize(size) {
  const limits = panelSizeLimit()
  const width = Math.max(limits.minWidth, Math.min(Number(size?.width) || 380, limits.maxWidth))
  const height = Math.max(limits.minHeight, Math.min(Number(size?.height) || 680, limits.maxHeight))
  return { width, height }
}

function syncPanelSizeToViewport() {
  panelSize.value = clampPanelSize(panelSize.value)
}

function savePanelSize() {
  if (typeof window === 'undefined') {
    return
  }
  const size = clampPanelSize(panelSize.value)
  localStorage.setItem(PANEL_SIZE_KEY, JSON.stringify(size))
}

function stopPanelResize() {
  if (!isPanelResizing.value) {
    return
  }
  isPanelResizing.value = false
  panelResizePointerId.value = null
  panelResizeDirection.value = 'se'
  syncPanelSizeToViewport()
  savePanelSize()
  window.removeEventListener('pointermove', onPanelResize)
  window.removeEventListener('pointerup', stopPanelResize)
  window.removeEventListener('pointercancel', stopPanelResize)
}

function onPanelResize(event) {
  if (!isPanelResizing.value) {
    return
  }
  if (panelResizePointerId.value !== null && event.pointerId !== undefined && event.pointerId !== panelResizePointerId.value) {
    return
  }

  event.preventDefault()
  const deltaX = event.clientX - panelResizeStartX.value
  const deltaY = event.clientY - panelResizeStartY.value
  const direction = panelResizeDirection.value
  let nextWidth = panelResizeStartWidth.value
  let nextHeight = panelResizeStartHeight.value

  if (direction.includes('e')) {
    nextWidth += deltaX
  }
  if (direction.includes('w')) {
    nextWidth -= deltaX
  }
  if (direction.includes('s')) {
    nextHeight += deltaY
  }
  if (direction.includes('n')) {
    nextHeight -= deltaY
  }

  const next = clampPanelSize({
    width: nextWidth,
    height: nextHeight
  })
  panelSize.value = next
}

function startPanelResize(event, direction = 'se') {
  if (viewportWidth.value <= 768) {
    return
  }
  if (event.button !== undefined && event.button !== 0) {
    return
  }

  const size = clampPanelSize(panelSize.value)
  panelResizeStartX.value = event.clientX
  panelResizeStartY.value = event.clientY
  panelResizeStartWidth.value = size.width
  panelResizeStartHeight.value = size.height
  panelResizePointerId.value = event.pointerId ?? null
  panelResizeDirection.value = String(direction || 'se')
  isPanelResizing.value = true

  window.addEventListener('pointermove', onPanelResize, { passive: false })
  window.addEventListener('pointerup', stopPanelResize)
  window.addEventListener('pointercancel', stopPanelResize)
}

function updatePanelDockByBubble() {
  const root = rootRef.value
  if (!root) {
    return
  }

  const rect = root.getBoundingClientRect()
  const viewportWidth = window.innerWidth || document.documentElement.clientWidth
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight

  const leftSpace = rect.left
  const rightSpace = viewportWidth - rect.right
  const topSpace = rect.top
  const bottomSpace = viewportHeight - rect.bottom

  panelHorizontalDock.value = rightSpace >= leftSpace ? 'left' : 'right'
  panelVerticalDock.value = topSpace >= bottomSpace ? 'above' : 'below'
}

function handleViewportChange() {
  viewportWidth.value = window.innerWidth || document.documentElement.clientWidth
  viewportHeight.value = window.innerHeight || document.documentElement.clientHeight
  if (!panelVisible.value) {
    syncPanelSizeToViewport()
    return
  }
  updatePanelDockByBubble()
  syncPanelSizeToViewport()
}

onMounted(() => {
  syncPanelSizeToViewport()
  window.addEventListener('resize', handleViewportChange)
})

onUnmounted(() => {
  stopPanelResize()
  window.removeEventListener('resize', handleViewportChange)
})

watch(panelVisible, async (visible) => {
  if (!visible) {
    return
  }
  await nextTick()
  updatePanelDockByBubble()
  syncPanelSizeToViewport()
  syncAuthState()
  ensureBrainGreeting()
  await refreshTasks()
  await scrollBrainToBottom()
})

async function sendBrainMessage(forcedText = '') {
  const userText = normalizeText(forcedText || brainInput.value)
  if (!userText || brainLoading.value) {
    return
  }

  syncAuthState()
  brainInput.value = ''
  addBrainMessage('user', userText)
  beginExecutionVisual(userText)
  brainLoading.value = true

  try {
    const localIntent = detectLocalIntent(userText)
    if (localIntent.type === 'EMERGENCY_RISK') {
      await handleLocalIntent(localIntent, userText)
      return
    }

    if (localIntent.type === 'SYMPTOM') {
      await handleLocalIntent(localIntent, userText)
      return
    }

    const reminderKeywordIntent = /(提醒|服药|用药|吃药|医嘱|日历|按时吃药|按时服药|每天三次|早中晚|早餐后|午餐后|晚餐后|阿司匹林|布洛芬|甲钴胺|维生素)/.test(userText)
    const bookingIntent = localIntent.type === 'AUTO_BOOKING' || localIntent.type === 'CREATE_BOOKING_TASK' || isBookingIntent(userText)

    if (reminderDraft.value && !['CREATE_MEDICATION_REMINDER', 'UNKNOWN', 'EMPTY'].includes(localIntent.type)) {
      reminderDraft.value = null
      pushExecutionStep('检测到你已切换意图，已结束未完成的服药提醒草稿。', 'running', 'ANALYZE')
    }

    const shouldTryReminderFirst = reminderKeywordIntent || (Boolean(reminderDraft.value) && !bookingIntent)
    if (shouldTryReminderFirst) {
      const localReminderHandled = await tryHandleMedicationReminder(userText)
      if (localReminderHandled) {
        if (executionPhase.value !== 'failed' && executionPhase.value !== 'success') {
          executionPhase.value = 'running'
        }
        return
      }
    }

    if (bookingIntent) {
      await handleLocalIntent(localIntent.type === 'UNKNOWN' ? { type: 'CREATE_BOOKING_TASK' } : localIntent, userText)
      return
    }

    if (localIntent.type !== 'UNKNOWN' && localIntent.type !== 'CREATE_MEDICATION_REMINDER') {
      await handleLocalIntent(localIntent, userText)
      return
    }

    const backendHandled = await tryHandleByBackend(userText)
    if (backendHandled) {
      return
    }

    const reminderHandled = await tryHandleMedicationReminder(userText)
    if (reminderHandled) {
      return
    }

    if (llmEnabled.value && loggedIn.value) {
      const reply = await askLLMForBrainReply(userText, brainMessages)
      addBrainMessage('agent', reply, [
        { label: '进入问诊', action: 'route-consultation', payload: { prompt: userText } },
        { label: '去舌诊', action: 'route-page', payload: { path: '/tongue', label: '舌诊页面' } },
        { label: '去科普', action: 'route-page', payload: { path: '/science', label: '科普页面' } },
        { label: '查看任务中心', action: 'switch-task-tab' }
      ])
      markExecutionDone('已生成建议并等待你下一步选择。')
      return
    }

    addBrainMessage(
      'agent',
      '我理解你的诉求。你可以让我直接跳到全站页面，也可以创建挂号、微信发送、服药提醒任务。若你要的功能当前不支持，我会明确告知“暂不支持”。',
      [
        { label: '进入问诊', action: 'route-consultation', payload: { prompt: userText } },
        { label: '创建服药提醒', action: 'send', payload: { text: '帮我创建服药提醒' } },
        { label: '去舌诊', action: 'route-page', payload: { path: '/tongue', label: '舌诊页面' } },
        { label: '去识草', action: 'route-page', payload: { path: '/herb', label: '识草页面' } },
        { label: '去科普', action: 'route-page', payload: { path: '/science', label: '科普页面' } }
      ]
    )
    markExecutionDone('已给出可执行选项。')
  } catch (error) {
    markExecutionFailed(error?.message || '处理失败，请稍后重试。')
    addBrainMessage('agent', error?.message || '处理失败，请稍后重试。')
  } finally {
    brainLoading.value = false
  }
}

async function handleLocalIntent(intent, userText) {
  switch (intent.type) {
    case 'EMERGENCY_RISK': {
      pushExecutionStep('识别到急症风险信号，请立即进行急诊处置。', 'error', 'EMERGENCY')
      const emergencyTask = await createEmergencyBookingTask(userText)
      const taskMessage = emergencyTask.created
        ? `已为你创建紧急就诊任务（状态：${statusText(emergencyTask.status)}）。`
        : `当前未自动创建紧急就诊任务：${emergencyTask.reason}。`

      addBrainMessage(
        'agent',
        `你描述的表现属于高危急症信号。请立刻前往最近医院急诊科，必要时立即拨打急救电话。${taskMessage} 说明：当前系统无法代拨急救电话。`,
        [
          { label: '前往附近医院（急诊）', action: 'route-page', payload: { path: '/map', label: '地图页面' } },
          { label: '查看紧急就诊任务', action: 'switch-task-tab' }
        ]
      )
      break
    }
    case 'AUTO_BOOKING':
      if (!loggedIn.value) {
        pushExecutionStep('自动挂号需要登录授权。', 'error', 'REJECT')
        addBrainMessage('agent', '已识别你是明确挂号诉求。请先登录，登录后我继续为你自动挂号。', [
          { label: '去登录', action: 'route-page', payload: { path: '/login', label: '登录页面' } },
          { label: '我已登录，继续自动挂号', action: 'send', payload: { text: userText } }
        ])
        break
      }
      await createBookingTaskFromUserText(userText, true)
      break
    case 'CREATE_MEDICATION_REMINDER':
      await tryHandleMedicationReminder(userText)
      break
    case 'UNSUPPORTED_CAPABILITY':
      pushExecutionStep('该能力暂不支持，已明确拒绝并提供替代方案。', 'error', 'REJECT')
      addBrainMessage('agent', '这个动作我目前不能直接执行（例如支付/代购/打电话/发短信）。我不会假装已完成。', [
        { label: '联系医生（附近医院）', action: 'route-page', payload: { path: '/map', label: '地图页面' } },
        { label: '进入问诊', action: 'route-consultation', payload: { prompt: userText } }
      ])
      break
    case 'SYMPTOM':
      markExecutionDone('已识别症状描述，等待你确认是否进入问诊。')
      addBrainMessage('agent', '听起来你有不适。是否现在进入问诊页面？我可以把你这句话一起带过去并自动发送。', [
        { label: '立即进入问诊', action: 'route-consultation', payload: { prompt: userText } },
        { label: '先做舌诊', action: 'route-page', payload: { path: '/tongue', label: '舌诊页面' } },
        { label: '先创建挂号任务', action: 'create-task', payload: { kind: 'booking' } }
      ])
      break
    case 'ROUTE_CONSULTATION':
      await goToConsultation(userText)
      break
    case 'ROUTE_TONGUE':
      await goToRoutePage('/tongue')
      break
    case 'ROUTE_HERB':
      await goToRoutePage('/herb')
      break
    case 'ROUTE_SCIENCE':
      await goToRoutePage('/science')
      break
    case 'ROUTE_MAP':
      await goToRoutePage('/map')
      break
    case 'ROUTE_HOME':
      await goToRoutePage('/')
      break
    case 'CREATE_BOOKING_TASK':
      if (!loggedIn.value) {
        pushExecutionStep('挂号任务需要登录后提交。', 'error', 'REJECT')
        addBrainMessage('agent', '已识别到挂号诉求。当前未登录，无法提交挂号任务。请先登录后我继续处理。', [
          { label: '去登录', action: 'route-page', payload: { path: '/login', label: '登录页面' } },
          { label: '登录后继续', action: 'send', payload: { text: userText } }
        ])
        break
      }
      await createBookingTaskFromUserText(userText, false)
      break
    case 'CREATE_WECHAT_TASK':
      addBrainMessage('agent', '我可以帮你创建“发送报告到微信联系人”任务。该任务是中风险，需要你审批后执行。', [
        { label: '创建发送任务', action: 'create-task', payload: { kind: 'wechat' } },
        { label: '查看任务中心', action: 'switch-task-tab' }
      ])
      break
    case 'OPEN_TASK_CENTER':
      activeTab.value = 'tasks'
      await refreshTasks()
      markExecutionDone('已切换到任务中心。')
      addBrainMessage('agent', '已为你切换到任务中心。')
      break
    case 'ROUTE_PROFILE':
      await goToRoutePage('/profile')
      break
    case 'HELP':
      markExecutionDone('已展示可执行能力范围。')
      addBrainMessage('agent', '我可以做四类事情：1) 识别你的诉求 2) 跳转全站页面 3) 创建和审批代理任务 4) 创建服药/医嘱提醒并导出日历文件。')
      break
    default:
      markExecutionDone('已接收输入，等待你进一步指令。')
      addBrainMessage('agent', '已收到。你可以直接告诉我目标，比如“进入问诊”或“创建微信发送任务”。')
      break
  }
}


async function handleSuggestion(suggestion) {
  if (!suggestion || typeof suggestion !== 'object') {
    return
  }

  if (suggestion.action === 'send') {
    await sendBrainMessage(suggestion.payload?.text || '')
    return
  }

  if (suggestion.action === 'route-consultation') {
    await goToConsultation(suggestion.payload?.prompt || '我最近不舒服，请帮我问诊。')
    return
  }

  if (suggestion.action === 'route-page') {
    await goToRoutePage(suggestion.payload?.path || '/', {
      label: suggestion.payload?.label
    })
    return
  }

  if (suggestion.action === 'switch-task-tab') {
    activeTab.value = 'tasks'
    await refreshTasks()
    return
  }

  if (suggestion.action === 'create-task') {
    await createDemoTask(suggestion.payload?.kind || 'followup')
  }
}

async function goToConsultation(prompt) {
  const safePrompt = normalizeText(prompt) || '我最近不舒服，请帮我问诊。'
  pushExecutionStep('准备跳转到问诊页面并携带症状描述。', 'running', 'ROUTE')
  addBrainMessage('agent', '好的，正在带你进入问诊页面并自动提交描述。')
  const ok = await pushWithAuthGuard({
    path: '/consultation',
    query: {
      autoSend: '1',
      presetPrompt: safePrompt
    }
  }, '问诊页面')
  if (ok) {
    pushExecutionStep('问诊页面跳转完成。', 'done', 'ROUTE')
  }
}

async function goToRoutePage(path, options = {}) {
  const meta = PAGE_META[path] || { label: options.label || '目标页面', autoMessage: '' }
  const label = options.label || meta.label
  const beforeMessage = options.beforeMessage || meta.autoMessage
  pushExecutionStep(`准备跳转到${label}。`, 'running', 'ROUTE')
  if (beforeMessage) {
    addBrainMessage('agent', beforeMessage)
  }
  const ok = await pushWithAuthGuard({ path }, label)
  if (ok) {
    pushExecutionStep(`已跳转到${label}。`, 'done', 'ROUTE')
  }
}

async function pushWithAuthGuard(target, pageLabel) {
  syncAuthState()
  const targetPath = target?.path || '/'
  const requiresAuth = !PUBLIC_PATHS.has(targetPath)

  if (requiresAuth && !loggedIn.value) {
    pushExecutionStep(`前往${pageLabel}前需要登录授权。`, 'error', 'REJECT')
    addBrainMessage('agent', `前往${pageLabel}前需要先登录，我先带你到登录页。`)
    const redirect = router.resolve(target).fullPath
    await router.push({
      path: '/login',
      query: { redirect }
    })
    panelVisible.value = false
    return false
  }

  await router.push(target)
  panelVisible.value = false
  return true
}

const { tryHandleByBackend, askLLMForBrainReply } = useAgentBrain({
  loggedIn,
  llmEnabled,
  route,
  brainSessionKey: BRAIN_SESSION_KEY,
  pageMeta: PAGE_META,
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
  setActiveTab: (tab) => {
    activeTab.value = tab
  },
  executionTimeline
})

watch(
  () => route.fullPath,
  () => {
    if (panelVisible.value) {
      syncAuthState()
    }
  }
)
</script>

<style scoped>
.agent-butler-root {
  position: fixed;
  right: 24px;
  top: 112px;
  z-index: 2200;
  font-family: "Noto Serif SC", "Songti SC", serif;
}

.bubble-guide {
  position: absolute;
  top: 50%;
  background: #d49b42;
  color: #fff;
  padding: 8px 32px 8px 16px;
  border-radius: 8px;
  font-size: 13px;
  white-space: nowrap;
  box-shadow: 0 4px 12px rgba(212, 155, 66, 0.3);
  cursor: pointer;
}

.bubble-guide.guide-right {
  right: 80px;
  animation: float-guide-right 2s ease-in-out infinite;
}

.bubble-guide.guide-left {
  left: 80px;
  padding: 8px 16px 8px 32px;
  animation: float-guide-left 2s ease-in-out infinite;
}

.guide-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 0;
  height: 0;
  border-style: solid;
}

.guide-right .guide-arrow {
  right: -6px;
  border-width: 6px 0 6px 6px;
  border-color: transparent transparent transparent #d49b42;
}

.guide-left .guide-arrow {
  left: -6px;
  border-width: 6px 6px 6px 0;
  border-color: transparent #d49b42 transparent transparent;
}

.guide-close {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: #fff;
  font-size: 16px;
  cursor: pointer;
  opacity: 0.8;
  padding: 0 4px;
}

.guide-right .guide-close {
  right: 6px;
}

.guide-left .guide-close {
  left: 6px;
}

.guide-close:hover {
  opacity: 1;
}

.guide-fade-enter-active,
.guide-fade-leave-active {
  transition: opacity 0.3s;
}
.guide-fade-enter-from,
.guide-fade-leave-to {
  opacity: 0;
}

@keyframes float-guide-right {
  0%, 100% { transform: translateY(-50%) translateX(0); }
  50% { transform: translateY(-50%) translateX(-6px); }
}

@keyframes float-guide-left {
  0%, 100% { transform: translateY(-50%) translateX(0); }
  50% { transform: translateY(-50%) translateX(6px); }
}

@keyframes bubble-breath {
  0% { box-shadow: 0 0 0 0 rgba(194, 168, 120, 0.4); }
  70% { box-shadow: 0 0 0 15px rgba(194, 168, 120, 0); }
  100% { box-shadow: 0 0 0 0 rgba(194, 168, 120, 0); }
}

.butler-bubble {
  width: 64px;
  height: 64px;
  border: 1px solid rgba(194, 168, 120, 0.5);
  border-radius: 50%;
  background: linear-gradient(135deg, #2a4039 0%, #1c2b26 100%);
  color: #c2a878;
  box-shadow: 0 12px 32px rgba(28, 43, 38, 0.2);
  cursor: pointer;
  position: relative;
  transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
}

.butler-bubble.is-breathing {
  animation: bubble-breath 2s infinite cubic-bezier(0.36, 0.11, 0.89, 0.32);
}

.butler-bubble:hover {
  transform: translateY(-6px) scale(1.02);
  box-shadow: 0 16px 40px rgba(28, 43, 38, 0.3);
  animation: none;
}

.bubble-icon {
  font-size: 20px;
  font-weight: 400;
  letter-spacing: 1px;
}

.bubble-badge {
  position: absolute;
  right: -2px;
  top: -2px;
  min-width: 22px;
  height: 22px;
  padding: 0 6px;
  border-radius: 11px;
  background: #d49b42;
  color: #fff;
  font-size: 11px;
  line-height: 21px;
  font-weight: 700;
}

.butler-panel {
  position: absolute;
  right: 0;
  bottom: 84px;
  width: min(92vw, 380px);
  height: min(80vh, 680px);
  min-width: 320px;
  min-height: 460px;
  max-width: min(96vw, 560px);
  max-height: min(90vh, 760px);
  display: flex;
  flex-direction: column;
  border-radius: 24px;
  background: rgba(251, 251, 249, 0.92);
  border: 1px solid rgba(255, 255, 255, 0.5);
  box-shadow: 0 24px 60px rgba(28, 43, 38, 0.1);
  overflow: hidden;
  resize: none;
}

.butler-panel.is-panel-resizing {
  user-select: none;
}

.panel-resize-tip {
  margin: 0;
  padding: 0 24px 8px;
  font-size: 11px;
  color: #8c7345;
}

.panel-resize-edge,
.panel-resize-corner {
  position: absolute;
  border: none;
  background: transparent;
  padding: 0;
  z-index: 4;
}

.panel-resize-edge {
  opacity: 0.55;
}

.panel-resize-edge:hover,
.panel-resize-corner:hover {
  opacity: 1;
}

.edge-top,
.edge-bottom {
  left: 14px;
  right: 14px;
  height: 8px;
}

.edge-top {
  top: 0;
  cursor: ns-resize;
}

.edge-bottom {
  bottom: 0;
  cursor: ns-resize;
}

.edge-left,
.edge-right {
  top: 14px;
  bottom: 14px;
  width: 8px;
}

.edge-left {
  left: 0;
  cursor: ew-resize;
}

.edge-right {
  right: 0;
  cursor: ew-resize;
}

.panel-resize-corner {
  width: 14px;
  height: 14px;
}

.corner-top-left {
  top: 0;
  left: 0;
  cursor: nwse-resize;
}

.corner-top-right {
  top: 0;
  right: 0;
  cursor: nesw-resize;
}

.corner-bottom-left {
  bottom: 0;
  left: 0;
  cursor: nesw-resize;
}

.corner-bottom-right {
  bottom: 0;
  right: 0;
  cursor: nwse-resize;
}

.butler-panel.dock-left {
  left: 0;
  right: auto;
}

.butler-panel.dock-right {
  right: 0;
  left: auto;
}

.butler-panel.dock-above {
  bottom: 84px;
  top: auto;
}

.butler-panel.dock-below {
  top: 84px;
  bottom: auto;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(194, 168, 120, 0.2);
}

.panel-drag-handle {
  cursor: grab;
  user-select: none;
}

.panel-drag-handle:active {
  cursor: grabbing;
}

.panel-header h3 {
  margin: 0;
  color: #1c2b26;
  font-size: 18px;
}

.panel-header p {
  margin: 4px 0 0;
  color: #666;
  font-size: 12px;
}

.close-btn {
  border: none;
  background: transparent;
  color: #c2a878;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 16px;
  cursor: pointer;
}

.panel-tabs {
  display: grid;
  grid-template-columns: 1fr 1fr;
  padding: 12px 24px 0;
  gap: 16px;
}

.tab-btn {
  border: none;
  background: transparent;
  color: #999;
  padding: 12px 0;
  cursor: pointer;
  font-size: 14px;
}

.tab-btn.active {
  color: #1c2b26;
  font-weight: 600;
}

.execution-shell {
  margin: 10px 20px 0;
  border: 1px solid rgba(194, 168, 120, 0.22);
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.9);
  padding: 8px 10px;
}

.execution-toggle {
  width: 100%;
  border: none;
  background: transparent;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  color: #2c2c2c;
  font-size: 12px;
}

.execution-toggle strong {
  font-size: 12px;
  font-weight: 600;
  max-width: 56%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.execution-toggle-text {
  font-size: 11px;
  color: #8c7345;
}

.execution-phase {
  border-radius: 10px;
  padding: 2px 6px;
  font-size: 11px;
  background: #f0f0f0;
  color: #666;
}

.phase-running {
  background: rgba(194, 168, 120, 0.15);
  color: #8c7345;
}

.phase-success {
  background: rgba(74, 122, 95, 0.1);
  color: #4a7a5f;
}

.phase-failed {
  background: rgba(193, 74, 74, 0.1);
  color: #c14a4a;
}

.execution-progress-track {
  margin-top: 6px;
  height: 5px;
  border-radius: 4px;
  background: rgba(28, 43, 38, 0.08);
  overflow: hidden;
}

.execution-progress-fill {
  display: block;
  height: 100%;
  border-radius: 4px;
  background: linear-gradient(90deg, #2a4039, #c2a878);
  transition: width 0.25s ease;
}

.execution-list {
  list-style: none;
  margin: 8px 0 0;
  padding: 0;
  max-height: 98px;
  overflow-y: auto;
  display: grid;
  gap: 6px;
}

.execution-item {
  display: grid;
  grid-template-columns: 46px 1fr;
  gap: 8px;
  font-size: 11px;
  line-height: 1.35;
}

.item-time {
  color: #999;
}

.item-text {
  color: #444;
}

.item-running .item-text {
  color: #8c7345;
}

.item-done .item-text {
  color: #4a7a5f;
}

.item-error .item-text {
  color: #c14a4a;
}

.execution-item.is-active {
  font-weight: 600;
}

.execution-item.is-separator .item-text {
  color: #999;
}

.brain-section,
.task-section {
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.brain-messages {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 16px 20px;
  display: grid;
  gap: 16px;
}

.brain-row {
  display: grid;
  gap: 6px;
}

.brain-row.is-user {
  justify-items: end;
}

.brain-row.is-agent {
  justify-items: start;
}

.brain-bubble {
  margin: 0;
  max-width: 88%;
  border-radius: 16px;
  padding: 12px 18px;
  font-size: 13px;
  line-height: 1.6;
  word-break: break-word;
}

.is-user .brain-bubble {
  background: linear-gradient(135deg, #2a4039, #1c2b26);
  color: #fff;
}

.is-agent .brain-bubble {
  background: #fff;
  color: #2c2c2c;
  border: 1px solid rgba(194, 168, 120, 0.2);
}

.thinking {
  color: #999;
  font-style: italic;
}

.suggestion-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.suggestion-btn,
.ghost-btn,
.link-btn {
  border: 1px solid rgba(194, 168, 120, 0.4);
  border-radius: 18px;
  background: #fff;
  color: #8c7345;
  padding: 6px 14px;
  font-size: 12px;
  cursor: pointer;
}

.brain-toggle-row {
  padding: 0 20px 8px;
}

.llm-toggle {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
  color: #666;
}

.brain-quick-row {
  padding: 0 20px 12px;
  display: flex;
  gap: 10px;
  overflow-x: auto;
}

.quick-chip {
  border: 1px solid rgba(194, 168, 120, 0.2);
  background: #fff;
  color: #666;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 12px;
  white-space: nowrap;
  cursor: pointer;
}

.brain-input-row {
  padding: 8px 20px 20px;
  display: flex;
  gap: 12px;
}

.brain-input-row input {
  flex: 1;
  border: 1px solid rgba(28, 43, 38, 0.15);
  border-radius: 24px;
  padding: 12px 18px;
  font-size: 13px;
  outline: none;
}

.brain-input-row button,
.approve-btn,
.reject-btn,
.action-btn {
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  cursor: pointer;
}

.brain-input-row button,
.approve-btn,
.action-btn {
  background: #1c2b26;
  color: #c2a878;
}

.reject-btn {
  background: #f3f3f3;
  color: #666;
}

.quick-actions {
  display: grid;
  gap: 10px;
  padding: 20px;
}

.task-tools {
  padding: 0 20px 12px;
  display: flex;
  justify-content: flex-end;
}

.task-list {
  list-style: none;
  margin: 0;
  padding: 0 20px 20px;
  overflow-y: auto;
  display: grid;
  gap: 14px;
}

.task-item {
  border: 1px solid rgba(194, 168, 120, 0.2);
  border-radius: 14px;
  padding: 12px;
  background: #fff;
}

.task-head {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.task-meta {
  margin: 8px 0 0;
  color: #999;
  font-size: 12px;
}

.task-error {
  margin: 8px 0 0;
  color: #c14a4a;
  font-size: 12px;
}

.task-tools-inline {
  margin-top: 10px;
}

.task-flow-list {
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  display: grid;
  gap: 6px;
}

.task-flow-list li {
  display: grid;
  grid-template-columns: 54px 1fr;
  gap: 8px;
  font-size: 12px;
}

.flow-time {
  color: #999;
}

.flow-running .flow-text {
  color: #8c7345;
}

.flow-done .flow-text {
  color: #4a7a5f;
}

.flow-error .flow-text {
  color: #c14a4a;
}

.task-actions {
  margin-top: 12px;
  display: flex;
  gap: 10px;
}

.status-pill {
  font-size: 11px;
  border-radius: 12px;
  padding: 3px 10px;
  background: #f0f0f0;
}

.status-pending_approval {
  background: rgba(194, 168, 120, 0.15);
  color: #8c7345;
}

.status-success {
  background: rgba(74, 122, 95, 0.1);
  color: #4a7a5f;
}

.status-failed,
.status-cancelled {
  background: rgba(193, 74, 74, 0.1);
  color: #c14a4a;
}

.panel-empty {
  padding: 40px 20px;
  color: #999;
  text-align: center;
}

.butler-fade-enter-active,
.butler-fade-leave-active {
  transition: opacity 0.25s ease, transform 0.25s ease;
}

.butler-fade-enter-from,
.butler-fade-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.98);
}

@media (max-width: 768px) {
  .agent-butler-root {
    right: 16px;
    top: 96px;
  }

  .butler-panel {
    bottom: 74px;
    width: min(94vw, 360px);
    height: min(82vh, 660px);
    min-width: min(92vw, 320px);
    min-height: 420px;
  }

  .panel-resize-tip,
  .panel-resize-edge,
  .panel-resize-corner {
    display: none;
  }
}
</style>