<template>
  <div class="openclaw-status" :class="statusClass" @click="handleClick">
    <!-- 状态图标 -->
    <div class="status-indicator">
      <div class="status-dot" :class="dotClass"></div>
      <svg v-if="isReady" class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z"/>
        <path d="M2 17l10 5 10-5"/>
        <path d="M2 12l10 5 10-5"/>
      </svg>
      <svg v-else class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
    </div>
    
    <!-- 悬浮提示 -->
    <transition name="tooltip-fade">
      <div v-if="showTooltip" class="status-tooltip">
        <div class="tooltip-header">
          <span class="tooltip-title">本地代理</span>
          <span class="tooltip-state" :class="stateClass">{{ connectionStateText }}</span>
        </div>
        
        <div class="tooltip-body">
          <template v-if="isReady">
            <p class="tooltip-desc">OpenClaw 已连接，可执行本地自动化任务</p>
            <div class="tooltip-capabilities" v-if="capabilities?.length">
              <span class="cap-label">可用能力：</span>
              <span class="cap-item" v-for="cap in displayCapabilities" :key="cap">{{ cap }}</span>
            </div>
          </template>
          
          <template v-else-if="isConnecting">
            <p class="tooltip-desc">正在连接本地 OpenClaw 服务...</p>
          </template>
          
          <template v-else>
            <p class="tooltip-desc">安装本地代理后可执行更多自动化任务：</p>
            <ul class="tooltip-features">
              <li>🏥 本地浏览器挂号</li>
              <li>📅 系统日历提醒</li>
              <li>✨ 更多能力...</li>
            </ul>
            <button class="tooltip-install-btn" @click.stop="goToInstall">
              安装本地代理
            </button>
          </template>
        </div>
        
        <!-- 底部操作 -->
        <div class="tooltip-footer" v-if="isConnected">
          <button class="tooltip-action" @click.stop="handleDisconnect">
            断开连接
          </button>
        </div>
      </div>
    </transition>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useOpenClaw } from '@/components/agent-butler/composables/useOpenClaw.js'
import { ClawConnectionState, ClawTaskType, getTaskTypeName } from '@/api/openclaw-protocol.js'

const router = useRouter()
const {
  connectionState,
  connectionStateText,
  isConnected,
  isAuthenticated,
  isReady,
  isEnabled,
  capabilities,
  lastError,
  connect,
  disconnect,
  checkHealth
} = useOpenClaw()

const showTooltip = ref(false)
let hideTimeout = null

// ============== 计算属性 ==============

const statusClass = computed(() => ({
  'status-ready': isReady.value,
  'status-connecting': isConnecting.value,
  'status-disconnected': !isConnected.value && !isConnecting.value
}))

const dotClass = computed(() => ({
  'dot-green': isReady.value,
  'dot-yellow': isConnecting.value,
  'dot-gray': !isConnected.value && !isConnecting.value,
  'dot-pulse': isConnecting.value
}))

const stateClass = computed(() => ({
  'state-ready': isReady.value,
  'state-connecting': isConnecting.value,
  'state-disconnected': !isConnected.value && !isConnecting.value
}))

const isConnecting = computed(() => 
  connectionState.value === ClawConnectionState.CONNECTING ||
  connectionState.value === ClawConnectionState.RECONNECTING ||
  connectionState.value === ClawConnectionState.AUTHENTICATING
)

const displayCapabilities = computed(() => {
  if (!capabilities.value) return []
  
  const taskTypes = [
    ClawTaskType.HOSPITAL_BOOKING,
    ClawTaskType.MEDICATION_REMINDER,
    ClawTaskType.PRESCRIPTION_SAVE,
    ClawTaskType.TONGUE_CAPTURE
  ]
  
  return taskTypes
    .filter(type => capabilities.value.some(cap => cap.type === type || cap.types?.includes(type)))
    .map(type => getTaskTypeName(type))
    .slice(0, 4)
})

// ============== 事件处理 ==============

function handleClick() {
  showTooltip.value = !showTooltip.value
}

function handleMouseEnter() {
  clearTimeout(hideTimeout)
  showTooltip.value = true
}

function handleMouseLeave() {
  hideTimeout = setTimeout(() => {
    showTooltip.value = false
  }, 300)
}

function handleDisconnect() {
  disconnect()
  showTooltip.value = false
}

function goToInstall() {
  showTooltip.value = false
  router.push('/settings/local-agent')
}

// ============== 生命周期 ==============

onMounted(() => {
  // 自动尝试连接
  if (isEnabled.value && !isConnected.value) {
    checkHealth().then(healthy => {
      if (healthy) connect()
    })
  }
})

onUnmounted(() => {
  clearTimeout(hideTimeout)
})
</script>

<style scoped>
.openclaw-status {
  position: relative;
  cursor: pointer;
  padding: 4px;
  border-radius: 8px;
  transition: background-color 0.2s;
}

.openclaw-status:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

/* 状态指示器 */
.status-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  transition: background-color 0.3s;
}

.dot-green {
  background-color: #22c55e;
  box-shadow: 0 0 6px rgba(34, 197, 94, 0.5);
}

.dot-yellow {
  background-color: #eab308;
}

.dot-gray {
  background-color: #6b7280;
}

.dot-pulse {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.status-icon {
  width: 18px;
  height: 18px;
  color: inherit;
}

.status-ready .status-icon {
  color: #22c55e;
}

.status-connecting .status-icon {
  color: #eab308;
}

.status-disconnected .status-icon {
  color: #6b7280;
}

/* 提示框 */
.status-tooltip {
  position: absolute;
  bottom: calc(100% + 8px);
  right: 0;
  width: 280px;
  background: #1f2937;
  border: 1px solid #374151;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
  z-index: 9999;
  overflow: hidden;
}

.tooltip-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #374151;
  background: #111827;
}

.tooltip-title {
  font-weight: 600;
  color: #f9fafb;
  font-size: 14px;
}

.tooltip-state {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 10px;
}

.state-ready {
  background: rgba(34, 197, 94, 0.2);
  color: #22c55e;
}

.state-connecting {
  background: rgba(234, 179, 8, 0.2);
  color: #eab308;
}

.state-disconnected {
  background: rgba(107, 114, 128, 0.2);
  color: #9ca3af;
}

.tooltip-body {
  padding: 12px 16px;
}

.tooltip-desc {
  color: #d1d5db;
  font-size: 13px;
  margin: 0 0 8px;
  line-height: 1.5;
}

.tooltip-capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 8px;
}

.cap-label {
  color: #9ca3af;
  font-size: 12px;
  width: 100%;
}

.cap-item {
  font-size: 11px;
  padding: 2px 8px;
  background: rgba(59, 130, 246, 0.2);
  color: #60a5fa;
  border-radius: 6px;
}

.tooltip-features {
  margin: 8px 0;
  padding-left: 0;
  list-style: none;
}

.tooltip-features li {
  color: #d1d5db;
  font-size: 13px;
  padding: 4px 0;
}

.tooltip-install-btn {
  width: 100%;
  margin-top: 12px;
  padding: 10px 16px;
  background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s, transform 0.2s;
}

.tooltip-install-btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

.tooltip-footer {
  padding: 8px 16px;
  border-top: 1px solid #374151;
  background: #111827;
}

.tooltip-action {
  width: 100%;
  padding: 8px;
  background: transparent;
  border: 1px solid #4b5563;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.tooltip-action:hover {
  border-color: #6b7280;
  color: #d1d5db;
}

/* 过渡动画 */
.tooltip-fade-enter-active,
.tooltip-fade-leave-active {
  transition: opacity 0.2s, transform 0.2s;
}

.tooltip-fade-enter-from,
.tooltip-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
