<template>
  <div class="local-agent-page">
    <header class="page-header">
      <button class="back-btn" @click="$router.back()">← 返回</button>
      <h1>本地代理设置</h1>
    </header>

    <main class="page-content">
      <!-- 介绍卡片 -->
      <section class="intro-card">
        <div class="intro-icon">🤖</div>
        <h2>什么是本地代理？</h2>
        <p>
          本地代理是运行在您电脑上的 AI 助手程序（<a href="https://openclaw.ai" target="_blank">OpenClaw</a>），
          它可以帮助小佗执行更多<strong>本地自动化任务</strong>：
        </p>
        <ul class="feature-list">
          <li>
            <span class="feature-icon">🏥</span>
            <span><strong>本地浏览器挂号</strong> - 自动打开浏览器填写挂号表单，您可全程监督</span>
          </li>
          <li>
            <span class="feature-icon">📅</span>
            <span><strong>系统日历提醒</strong> - 直接添加到您的系统日历，不再错过服药时间</span>
          </li>
          <li>
            <span class="feature-icon">✨</span>
            <span><strong>更多能力</strong> - 告诉小佗您想做什么，它会尝试理解并执行</span>
          </li>
        </ul>
      </section>

      <!-- 隐私安全说明 -->
      <section class="security-card">
        <h3>🔒 隐私与安全</h3>
        <ul>
          <li><strong>本地运行</strong>：所有自动化操作在您电脑上执行，敏感数据不经云端</li>
          <li><strong>开源透明</strong>：OpenClaw 是 MIT 协议开源项目，代码完全公开</li>
          <li><strong>用户可控</strong>：所有操作您都可以看到，随时可以中断</li>
          <li><strong>授权确认</strong>：高风险操作需要您明确确认后才会执行</li>
        </ul>
      </section>

      <!-- 连接状态 -->
      <section class="status-card" :class="statusCardClass">
        <div class="status-header">
          <div class="status-indicator">
            <div class="status-dot" :class="dotClass"></div>
            <span class="status-text">{{ connectionStateText }}</span>
          </div>
        </div>

        <!-- 已连接状态 -->
        <div v-if="isAuthenticated" class="status-connected">
          <p>✅ 本地代理已就绪，小佗现在可以执行本地自动化任务了！</p>
          <div v-if="capabilities?.length" class="capabilities">
            <span class="cap-label">可用能力：</span>
            <span class="cap-tag" v-for="cap in displayCapabilities" :key="cap">{{ cap }}</span>
          </div>
          <button class="disconnect-btn" @click="handleDisconnect">断开连接</button>
        </div>

        <!-- 未认证（无论当前是否已连通） -->
        <div v-else class="status-pairing">
          <p v-if="isConnected">已检测到本地代理，请输入 Gateway Token 或 Password：</p>
          <p v-else>未检测到本地代理也可先输入 Token/Password，随后点“重新检测”：</p>
          <div class="pairing-form">
            <input 
              v-model="pairingCode" 
              type="text" 
              placeholder="请输入 token 或密码"
              class="pairing-input"
            />
            <button 
              class="pair-btn" 
              :disabled="!pairingCode || pairing"
              @click="handlePair"
            >
              {{ pairing ? '验证中...' : '确认连接' }}
            </button>
          </div>
          <p v-if="pairError" class="error-text">{{ pairError }}</p>
          <button class="retry-btn" @click="checkAndConnect" :disabled="checking">
            {{ checking ? '检测中...' : '重新检测' }}
          </button>
        </div>
      </section>

      <!-- 安装指引 -->
      <section v-if="!isConnected" class="install-card">
        <h3>📦 安装本地代理</h3>
        
        <div class="install-steps">
          <div class="step">
            <div class="step-number">1</div>
            <div class="step-content">
              <h4>安装 Node.js</h4>
              <p>OpenClaw 需要 Node.js 22 或更高版本</p>
              <a href="https://nodejs.org/" target="_blank" class="link-btn">下载 Node.js →</a>
            </div>
          </div>

          <div class="step">
            <div class="step-number">2</div>
            <div class="step-content">
              <h4>安装 OpenClaw</h4>
              <p>在终端运行以下命令：</p>
              <div class="code-block">
                <code>npx openclaw init</code>
                <button class="copy-btn" @click="copyCommand('npx openclaw init')">复制</button>
              </div>
            </div>
          </div>

          <div class="step">
            <div class="step-number">3</div>
            <div class="step-content">
              <h4>安装 TCM 技能包</h4>
              <p>下载并安装中医平台专用技能：</p>
              <div class="code-block">
                <code>openclaw skill install {{ skillUrl }}</code>
                <button class="copy-btn" @click="copyCommand(`openclaw skill install ${skillUrl}`)">复制</button>
              </div>
            </div>
          </div>

          <div class="step">
            <div class="step-number">4</div>
            <div class="step-content">
              <h4>启动并鉴权</h4>
              <p>启动 OpenClaw 后，从控制台或配置获取 Gateway Token/Password，粘贴到上方完成连接</p>
              <div class="code-block">
                <code>openclaw start</code>
                <button class="copy-btn" @click="copyCommand('openclaw start')">复制</button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 常见问题 -->
      <section class="faq-card">
        <h3>❓ 常见问题</h3>
        <details>
          <summary>OpenClaw 会收集我的数据吗？</summary>
          <p>不会。OpenClaw 是开源软件，完全运行在您的电脑上。您的数据只存储在本地，不会上传到任何服务器。</p>
        </details>
        <details>
          <summary>为什么需要鉴权？</summary>
          <p>这是安全机制，确保只有您授权的网站才能向本地代理发送任务指令，防止恶意网站滥用。</p>
        </details>
        <details>
          <summary>自动挂号安全吗？</summary>
          <p>自动挂号会在您的电脑上打开一个可见的浏览器窗口，您可以全程观看自动化过程。最终提交需要您手动确认。</p>
        </details>
        <details>
          <summary>我可以随时关闭本地代理吗？</summary>
          <p>当然可以。关闭后，小佗会自动回退到使用服务端任务（需审批后执行）。</p>
        </details>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useOpenClaw } from '@/components/agent-butler/composables/useOpenClaw'
import { 
  ClawConnectionState, 
  ClawTaskType, 
  getConnectionStateName,
  getTaskTypeName 
} from '@/api/openclaw-protocol.js'

const {
  connectionState,
  isConnected,
  isAuthenticated,
  isReady,
  capabilities,
  lastError,
  connect,
  disconnect,
  checkHealth,
  pair
} = useOpenClaw()

const checking = ref(false)
const pairingCode = ref('')
const pairing = ref(false)
const pairError = ref('')

// 技能包下载地址（指向 public 目录）
const skillUrl = computed(() => {
  const origin = window.location.origin
  return `${origin}/tcm-skill.json`
})

const connectionStateText = computed(() => getConnectionStateName(connectionState.value))

const statusCardClass = computed(() => ({
  'status-ready': isAuthenticated.value,
  'status-connecting': connectionState.value === ClawConnectionState.CONNECTING,
  'status-pairing': isConnected.value && !isAuthenticated.value,
  'status-offline': !isConnected.value
}))

const dotClass = computed(() => ({
  'dot-green': isAuthenticated.value,
  'dot-yellow': isConnected.value && !isAuthenticated.value,
  'dot-gray': !isConnected.value
}))

const displayCapabilities = computed(() => {
  if (!capabilities.value) return []
  const types = [
    ClawTaskType.HOSPITAL_BOOKING,
    ClawTaskType.MEDICATION_REMINDER,
    ClawTaskType.PRESCRIPTION_SAVE,
    ClawTaskType.TONGUE_CAPTURE
  ]
  return types
    .filter(t => capabilities.value.some(c => c.type === t || c.types?.includes(t)))
    .map(t => getTaskTypeName(t))
})

async function checkAndConnect() {
  checking.value = true
  pairError.value = ''
  
  try {
    await connect()
  } finally {
    checking.value = false
  }
}

async function handlePair() {
  if (!pairingCode.value) return
  
  pairing.value = true
  pairError.value = ''
  
  try {
    const result = await pair(pairingCode.value.trim())
    if (!result.success) {
      pairError.value = result.error || '连接失败，请检查 token 或密码是否正确'
    }
  } catch (e) {
    pairError.value = e.message || '连接失败'
  } finally {
    pairing.value = false
  }
}

function handleDisconnect() {
  disconnect()
}

function copyCommand(cmd) {
  navigator.clipboard.writeText(cmd).catch(() => {})
}

onMounted(() => {
  checkAndConnect()
})
</script>

<style scoped>
.local-agent-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8ec 100%);
  padding-bottom: 40px;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 20px 24px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.back-btn {
  background: none;
  border: none;
  color: #666;
  font-size: 16px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 8px;
  transition: background 0.2s;
}

.back-btn:hover {
  background: #f0f0f0;
}

.page-header h1 {
  margin: 0;
  font-size: 20px;
  color: #1a1a1a;
}

.page-content {
  max-width: 720px;
  margin: 0 auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* 卡片通用样式 */
.intro-card,
.security-card,
.status-card,
.install-card,
.faq-card {
  background: white;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
}

/* 介绍卡片 */
.intro-card {
  text-align: center;
}

.intro-icon {
  font-size: 48px;
  margin-bottom: 12px;
}

.intro-card h2 {
  margin: 0 0 12px;
  color: #1a1a1a;
  font-size: 22px;
}

.intro-card > p {
  color: #666;
  line-height: 1.6;
  margin-bottom: 20px;
}

.feature-list {
  list-style: none;
  padding: 0;
  margin: 0;
  text-align: left;
}

.feature-list li {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid #f0f0f0;
}

.feature-list li:last-child {
  border-bottom: none;
}

.feature-icon {
  font-size: 24px;
  flex-shrink: 0;
}

/* 安全卡片 */
.security-card {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border: 1px solid #a5d6a7;
}

.security-card h3 {
  margin: 0 0 12px;
  color: #2e7d32;
}

.security-card ul {
  margin: 0;
  padding-left: 20px;
}

.security-card li {
  color: #1b5e20;
  padding: 6px 0;
  line-height: 1.5;
}

/* 状态卡片 */
.status-card {
  border: 2px solid #e0e0e0;
  transition: border-color 0.3s;
}

.status-card.status-ready {
  border-color: #4caf50;
  background: linear-gradient(135deg, #f1f8e9 0%, #dcedc8 100%);
}

.status-card.status-pairing {
  border-color: #ff9800;
  background: linear-gradient(135deg, #fff8e1 0%, #ffecb3 100%);
}

.status-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.status-indicator {
  display: flex;
  align-items: center;
  gap: 10px;
}

.status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.dot-green {
  background: #4caf50;
  box-shadow: 0 0 8px rgba(76, 175, 80, 0.5);
}

.dot-yellow {
  background: #ff9800;
  animation: pulse 1.5s infinite;
}

.dot-gray {
  background: #9e9e9e;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.status-text {
  font-weight: 600;
  color: #333;
}

.status-connected p {
  color: #2e7d32;
  margin: 0 0 12px;
}

.capabilities {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.cap-label {
  color: #666;
  font-size: 13px;
}

.cap-tag {
  background: #e8f5e9;
  color: #2e7d32;
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 13px;
}

.disconnect-btn,
.retry-btn,
.pair-btn {
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.disconnect-btn {
  background: #ffebee;
  border: 1px solid #ef5350;
  color: #c62828;
}

.disconnect-btn:hover {
  background: #ffcdd2;
}

.retry-btn {
  background: #e3f2fd;
  border: 1px solid #2196f3;
  color: #1565c0;
}

.retry-btn:hover {
  background: #bbdefb;
}

.pair-btn {
  background: #ff9800;
  border: none;
  color: white;
}

.pair-btn:hover:not(:disabled) {
  background: #f57c00;
}

.pair-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.pairing-form {
  display: flex;
  gap: 12px;
  margin: 16px 0;
}

.pairing-input {
  flex: 1;
  padding: 12px 16px;
  border: 2px solid #ffcc80;
  border-radius: 8px;
  font-size: 16px;
  outline: none;
}

.pairing-input:focus {
  border-color: #ff9800;
}

.error-text {
  color: #c62828;
  font-size: 14px;
  margin: 8px 0 0;
}

/* 安装步骤 */
.install-card h3 {
  margin: 0 0 20px;
  color: #1a1a1a;
}

.install-steps {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.step {
  display: flex;
  gap: 16px;
}

.step-number {
  width: 32px;
  height: 32px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  flex-shrink: 0;
}

.step-content h4 {
  margin: 0 0 6px;
  color: #1a1a1a;
}

.step-content p {
  margin: 0 0 10px;
  color: #666;
  font-size: 14px;
}

.code-block {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #263238;
  padding: 12px 16px;
  border-radius: 8px;
}

.code-block code {
  flex: 1;
  color: #80cbc4;
  font-family: 'Monaco', 'Menlo', monospace;
  font-size: 14px;
}

.copy-btn {
  background: #37474f;
  border: none;
  color: #90a4ae;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;
}

.copy-btn:hover {
  background: #455a64;
  color: white;
}

.link-btn {
  display: inline-block;
  color: #1976d2;
  text-decoration: none;
  font-size: 14px;
}

.link-btn:hover {
  text-decoration: underline;
}

/* FAQ */
.faq-card h3 {
  margin: 0 0 16px;
  color: #1a1a1a;
}

.faq-card details {
  border-bottom: 1px solid #f0f0f0;
  padding: 12px 0;
}

.faq-card details:last-child {
  border-bottom: none;
}

.faq-card summary {
  cursor: pointer;
  font-weight: 500;
  color: #333;
  padding: 4px 0;
}

.faq-card details p {
  margin: 12px 0 0;
  color: #666;
  line-height: 1.6;
  padding-left: 16px;
}

/* 响应式 */
@media (max-width: 640px) {
  .page-content {
    padding: 16px;
  }
  
  .intro-card,
  .security-card,
  .status-card,
  .install-card,
  .faq-card {
    padding: 16px;
  }
  
  .pairing-form {
    flex-direction: column;
  }
}
</style>
