<template>
  <div class="consultation-page bg-ancient-light font-chinese text-ancient-dark min-h-screen">
    <header class="page-nav-bar fixed top-0 left-0 right-0 bg-ancient-tan text-white text-center py-3 text-lg font-bold shadow-md z-30 flex items-center justify-center gap-4 md:gap-6">
      <span class="page-nav-title whitespace-nowrap">中医智能问诊</span>
      
      <div class="page-nav-items flex items-center gap-3 md:gap-4">
        <button @click="goToAiTongue" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
          <i class="fa-solid fa-face-smile text-base md:text-lg"></i>
          <span class="text-xs mt-0.5 hidden md:inline">AI舌诊</span>
        </button>
        
        <button @click="goToAiConsult" class="page-nav-item flex flex-col items-center transition-colors duration-200" :class="{ active: currentPage === 'aiConsult' }" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
          <i class="fa-solid fa-user-doctor text-base md:text-lg"></i>
          <span class="text-xs mt-0.5 hidden md:inline">AI问诊</span>
        </button>
        
        <button @click="goToHerbRecog" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
          <i class="fa-solid fa-leaf text-base md:text-lg"></i>
          <span class="text-xs mt-0.5 hidden md:inline">中药识别</span>
        </button>
        
        <button @click="goToTcmScience" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
          <i class="fa-solid fa-book-open text-base md:text-lg"></i>
          <span class="text-xs mt-0.5 hidden md:inline">中医科普</span>
        </button>
        
        <button @click="goToHome" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
          <i class="fa-solid fa-house text-base md:text-lg"></i>
          <span class="text-xs mt-0.5 hidden md:inline">返回首页</span>
        </button>
      </div>
    </header>

    <main class="pt-20 pb-6 flex flex-col md:flex-row gap-8 px-8 w-full h-screen">
      
      <aside class="w-full md:w-80 shrink-0 h-full bg-white rounded-lg shadow-lg flex flex-col p-4 border border-ancient-border/30 overflow-hidden">
        
        <button @click="startNewConsultation" class="w-full bg-ancient-tan hover:bg-ancient-dark text-white py-3 rounded-lg font-bold transition-colors mb-4 flex items-center justify-center gap-2 shadow-md shrink-0">
          <i class="fa-solid fa-plus"></i> 新建问诊
        </button>

        <h2 class="text-lg font-bold text-ancient-dark mb-3 border-b-2 border-ancient-border pb-2 flex items-center gap-2 shrink-0">
          <i class="fa-solid fa-clock-rotate-left text-ancient-tan"></i> 历史问诊
        </h2>

        <div class="flex-1 overflow-y-auto custom-scroll space-y-2 pr-1">
          <div v-for="(item, index) in historyList" :key="index"
               @click="loadHistory(item)"
               :class="['group flex justify-between items-center p-3 hover:bg-ancient-cream border rounded-lg cursor-pointer transition-all', 
                        currentId === item.id ? 'bg-ancient-cream border-ancient-tan shadow-sm' : 'bg-ancient-light border-transparent hover:border-ancient-border']">
            <div class="truncate w-4/5">
              <div class="font-bold text-ancient-dark truncate text-base">{{ item.title }}</div>
              <div class="text-sm text-ancient-tan mt-1 opacity-80">{{ item.date }}</div>
            </div>
            <button @click.stop="deleteHistory(index, item.id)" class="hidden group-hover:flex text-red-500 hover:text-red-700 w-6 h-6 items-center justify-center rounded-full hover:bg-red-100 transition-colors">
                <i class="fa-solid fa-trash-can text-sm"></i>
            </button>
          </div>

          <div v-if="historyList.length === 0" class="text-center text-gray-400 mt-10 text-sm">
            <i class="fa-solid fa-inbox text-3xl mb-2 opacity-50"></i>
            <p>暂无问诊记录</p>
          </div>
        </div>
      </aside>

      <section class="flex-1 h-full bg-white/90 rounded-lg shadow-lg overflow-hidden flex flex-col border border-ancient-border/30">
        
        <div class="bg-ancient-cream px-4 py-3 border-b border-ancient-border flex justify-between items-center shadow-sm z-10 shrink-0">
          <span class="text-ancient-dark font-bold text-sm flex items-center">
            <i class="fa-solid fa-user-doctor mr-2 text-ancient-tan"></i> 当前问诊：{{ currentTopic }}
          </span>
          <button @click="generateSyndrome" class="bg-ancient-tan hover:bg-ancient-dark text-white px-3 py-1.5 rounded-md text-sm transition-colors flex items-center shadow">
            <i class="fa-solid fa-scroll mr-1"></i> 结束问诊，生成报告
          </button>
        </div>

        <div ref="chatContainerRef" class="flex-1 p-4 overflow-y-auto custom-scroll space-y-5 bg-white">
          <div v-for="(msg, index) in chatMessages" :key="index">
            <div v-if="msg.type === 'ai'" class="flex items-start gap-3">
                <img src="/lzy.png" alt="古风医者" class="w-10 h-10 rounded-full border-2 border-ancient-border object-cover flex-shrink-0 mt-1">
               <div class="ai-bubble" v-html="renderMarkdown(msg.content)"></div>
            </div>
            <div v-else class="flex justify-end gap-3">
              <div class="user-bubble flex items-center gap-2">
                {{ msg.content }}
              </div>
              <div class="w-10 h-10 rounded-full bg-ancient-tan text-white flex items-center justify-center font-bold flex-shrink-0 mt-1 border-2 border-ancient-border">
                我
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white border-t border-ancient-border/50 p-4 shrink-0 z-10">
          <div class="flex gap-3">
            <input v-model="msgInput" @keypress.enter="sendMsg" type="text" placeholder="请输入症状，或点击麦克风语音描述..." 
                   class="flex-1 px-5 py-4 text-lg border border-ancient-border rounded-full outline-none focus:border-ancient-tan focus:ring-1 focus:ring-ancient-tan bg-ancient-light/30 transition-all">
            <button @click="startVoiceRecognition" :class="{'bg-red-500 animate-pulse': isRecording, 'bg-ancient-tan': !isRecording}" class="w-12 h-12 rounded-full text-white flex items-center justify-center hover:opacity-90 transition-all shadow shrink-0">
              <i class="fa-solid fa-microphone"></i>
            </button>
            <button @click="sendMsg" class="w-12 h-12 rounded-full bg-ancient-tan text-white flex items-center justify-center hover:bg-ancient-dark transition-all shadow shrink-0">
              <i class="fa-solid fa-paper-plane"></i>
            </button>
          </div>
        </div>
      </section>

    </main>

    <div class="bamboo-scroll flex items-center justify-center z-50" :class="{ 'show': isBambooModalVisible }">
      <div ref="reportContentRef" 
           class="scroll-content relative bg-[#F9F6EE] rounded-xl shadow-2xl w-[90%] max-w-3xl h-[85vh] flex flex-col overflow-hidden border border-[#D4B996]"
           :class="{'!h-auto !overflow-visible export-mode': isExporting}">
        
        <button v-show="!isExporting" @click="closeBamboo" class="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-[#D4B996]/20 text-[#8B4513] hover:bg-[#D4B996]/50 transition-colors">
          <i class="fa-solid fa-xmark text-lg"></i>
        </button>

        <div class="flex-1 overflow-y-auto custom-scroll p-6 md:p-10 pb-24 text-[#3C2A21]"
             :class="{'!overflow-visible !h-auto': isExporting}">
          
          <div class="flex flex-col items-center justify-center mb-8 border-b-2 border-[#D4B996]/30 pb-4">
            <h3 class="text-3xl font-bold font-chinese tracking-widest text-[#5C3A21] mb-3">养生建议报告</h3>
            <div class="w-16 h-1 bg-[#D4B996] rounded-full"></div>
          </div>

          <div class="flex flex-col md:flex-row justify-between bg-white/60 p-4 md:px-8 md:py-5 rounded-xl border border-[#D4B996]/50 mb-8 shadow-sm gap-4">
            
            <div class="flex items-center flex-1">
              <div class="w-10 h-10 rounded-full bg-[#D4B996]/20 flex items-center justify-center mr-4 shrink-0 shadow-inner icon-circle">
                <i class="fa-regular fa-clock text-[#8B4513] text-lg"></i>
              </div>
              <div class="flex flex-col">
                <span class="text-sm text-[#8B4513]/70 font-bold mb-0.5 tracking-wider">问诊时间</span>
                <span class="text-[#3C2A21] font-medium text-lg">{{ currentTime }}</span>
              </div>
            </div>

            <div class="hidden md:flex items-center justify-center">
              <div class="w-px h-12 bg-gradient-to-b from-transparent via-[#D4B996]/50 to-transparent"></div>
            </div>
            <div class="md:hidden w-full h-px bg-[#D4B996]/30 my-1"></div>

            <div class="flex items-center flex-1 md:ml-4">
              <div class="w-10 h-10 rounded-full bg-[#D4B996]/20 flex items-center justify-center mr-4 shrink-0 shadow-inner icon-circle">
                <i class="fa-solid fa-clipboard-list text-[#8B4513] text-lg"></i>
              </div>
              <div class="flex flex-col">
                <span class="text-sm text-[#8B4513]/70 font-bold mb-0.5 tracking-wider">问诊主题</span>
                <span class="text-[#3C2A21] font-medium text-lg break-words">{{ currentTopic }}</span>
              </div>
            </div>

          </div>
          
          <div class="bg-white/80 p-6 md:p-8 rounded-xl border border-[#D4B996]/40 shadow-inner">
            <div class="flex items-center mb-5 pb-3 border-b border-[#D4B996]/30">
              <i class="fa-solid fa-leaf text-[#8B4513] text-xl mr-2"></i>
              <strong class="text-[#8B4513] text-xl font-chinese tracking-wider">AI 医师详尽调理方案</strong>
            </div>
            
            <div class="report-markdown leading-relaxed" v-html="renderMarkdown(reportAdvice)"></div>
          </div>

          <p class="mt-10 text-sm opacity-50 text-center border-t border-[#D4B996]/30 pt-4">
            本报告基于大语言模型辅助生成，仅供日常养生参考，不可替代线下执业医师面诊。
          </p>
        </div>

        <div v-show="!isExporting" class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#F9F6EE] via-[#F9F6EE] to-transparent flex justify-center gap-6">
          <button @click="copyReport" class="bg-white border-2 border-[#D4B996] text-[#8B4513] hover:bg-[#D4B996]/20 px-6 py-2.5 rounded-full font-bold transition-all shadow-md flex items-center">
            <i class="fa-regular fa-copy mr-2"></i> 复制完整方案
          </button>
          <button @click="downloadReport" class="bg-[#D4B996] hover:bg-[#8B4513] text-white px-6 py-2.5 rounded-full font-bold transition-all shadow-md flex items-center">
            <i class="fa-solid fa-download mr-2"></i> 保存高清报告
          </button>
        </div>

      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { marked } from 'marked'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { postAiChat } from '@/api/chat'

const router = useRouter()
const route = useRoute()
const JAVA_API_BASE_URL = (import.meta.env.VITE_JAVA_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const TOKEN_KEY = 'tcm_token'
const currentId = ref(null) 
const reportAdvice = ref('')

const chatContainerRef = ref(null)
const msgInput = ref('')
const isReasonTreeVisible = ref(false)
const isBambooModalVisible = ref(false)
const isRecording = ref(false)
const currentTime = ref('')

const reportContentRef = ref(null)
const isExporting = ref(false)
const currentTopic = ref('新问诊')
const currentPage = ref('aiConsult')

const initialGreeting = { type: 'ai', content: '你好，我是智能中医医师。请告诉我你哪里不舒服，我会为你辨证问诊~' }
const chatMessages = ref([ {...initialGreeting} ])

const renderMarkdown = (text) => {
  if (!text) return ''
  return marked.parse(text)
}

const historyList = ref([])

const FOCUS_TOPIC_MAP = {
  heart: '心系统专项评测',
  spleen: '脾系统专项评测',
  lung: '肺系统专项评测',
  kidney: '肾系统专项评测',
  liver: '肝系统专项评测'
}

const getToken = () => localStorage.getItem(TOKEN_KEY) || ''

const buildHeaders = (withJson = true) => {
  const headers = {}
  if (withJson) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

const handleUnauthorized = () => {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem('tcm_user')
  alert('登录状态已过期，请重新登录')
  router.push('/login')
}

// ==========================================
// 1. 获取历史记录 (找 Java: 8080)
// ==========================================
const fetchHistory = async () => {
  try {
    const response = await fetch(`${JAVA_API_BASE_URL}/api/consultation/history`, {
      headers: buildHeaders(false)
    })
    if (response.status === 401) {
      handleUnauthorized()
      return
    }
    const result = await response.json()
    if (result.code === 200) {
      historyList.value = result.data.map(item => ({
        id: item.id,
        title: item.title,
        date: item.createTime,
        messages: item.messages 
      }))
    }
  } catch (error) {
    console.error('获取历史记录失败:', error)
  }
}

onMounted(async () => {
  if (!getToken()) {
    router.push('/login')
    return
  }
  await fetchHistory()

  // 如果从个人中心带着 id 跳转过来，尝试自动加载对应的历史记录
  const targetId = route.query.id
  if (targetId) {
    const targetItem = historyList.value.find(item => String(item.id) === String(targetId))
    if (targetItem) {
      loadHistory(targetItem)
      return
    }
  }

  await tryStartFocusedAssessment()
})

// ==========================================
// 2. 同步保存到数据库 (找 Java: 8080)
// ⚡️ 修复：恢复成保存数据的逻辑
// ==========================================
const syncToDb = async () => {
  try {
    const response = await fetch(`${JAVA_API_BASE_URL}/api/consultation/save`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify({
        id: currentId.value,
        title: currentTopic.value,
        messages: JSON.stringify(chatMessages.value)
      })
    })
    if (response.status === 401) {
      handleUnauthorized()
      return
    }
    const result = await response.json()
    if (result.code === 200) {
      if (!currentId.value) {
        currentId.value = result.data.id
      }
      fetchHistory()
    }
  } catch (error) {
    console.error('自动保存失败:', error)
  }
}

// ==========================================
// 3. 基础功能 (增删改查页面交互)
// ==========================================
const startNewConsultation = () => {
  currentId.value = null 
  chatMessages.value = [ {...initialGreeting} ]
  isReasonTreeVisible.value = false
  currentTopic.value = '新问诊'
  msgInput.value = ''
  setTimeout(scrollToBottom, 100)
}

const loadHistory = (item) => {
  currentId.value = item.id 
  currentTopic.value = item.title
  if (item.messages) {
    chatMessages.value = JSON.parse(item.messages)
  } else {
    chatMessages.value = [ { type: 'ai', content: '（这是一条没有聊天记录的老数据）' } ]
  }
  isReasonTreeVisible.value = false
  setTimeout(scrollToBottom, 100)
}

const deleteHistory = async (index, id) => {
  if(confirm('确认删除这条问诊记录吗？数据将永久丢失。')) {
    try {
      const response = await fetch(`${JAVA_API_BASE_URL}/api/consultation/delete/${id}`, {
        method: 'DELETE',
        headers: buildHeaders(false)
      })
      if (response.status === 401) {
        handleUnauthorized()
        return
      }
      const result = await response.json()
      if (result.code === 200) {
        historyList.value.splice(index, 1)
        if (historyList.value.length === 0 || currentId.value === id) {
           startNewConsultation()
        }
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  }
}

const scrollToBottom = async () => {
  await nextTick()
  if (chatContainerRef.value) {
    chatContainerRef.value.scrollTo({
      top: chatContainerRef.value.scrollHeight,
      behavior: 'smooth'
    })
  }
}

// ==========================================
// 🌟 4. 发送消息给 AI (找 Python: 5000)
// ⚡️ 修复：去 5000 端口找 AI 老中医
// ==========================================
const sendMsg = async (forcedText = '') => {
  const inputText = (typeof forcedText === 'string' && forcedText.trim() ? forcedText : msgInput.value).trim()
  if (!inputText) return
  
  if (currentTopic.value === '新问诊') {
    currentTopic.value = inputText.length > 10 ? inputText.substring(0, 10) + '...' : inputText
  }

  // 1. 用户消息上屏
  chatMessages.value.push({ type: 'user', content: inputText })
  msgInput.value = ''
  scrollToBottom()
  
  // 2. 先存一次数据库
  await syncToDb()

  // 3. 显示思考中
  const thinkingMsg = { type: 'ai', content: '<i class="fa-solid fa-spinner fa-spin mr-2"></i>老中医正在翻阅古籍知识库...' }
  chatMessages.value.push(thinkingMsg)
  const thinkingIndex = chatMessages.value.length - 1
  scrollToBottom()

  try {
    const result = await postAiChat({
      content: inputText,
      history: chatMessages.value.slice(0, -1).map(m => ({
        role: m.type === 'ai' ? 'assistant' : 'user',
        content: m.content
      }))
    })
    if (result.code === 200) {
      // 4. 获取回复，上屏，再存一次数据库
      chatMessages.value[thinkingIndex].content = result.data
      isReasonTreeVisible.value = true 
      scrollToBottom()
      await syncToDb() 
    } else {
      chatMessages.value[thinkingIndex].content = '请稍后再试。'
    }
  } catch (error) {
    if (error?.message === 'UNAUTHORIZED') {
      handleUnauthorized()
      return
    }
    chatMessages.value[thinkingIndex].content = '（网络信号不佳，未能连接到诊室）'
  }
}

// ==========================================
// 5. 其他辅助功能 (生成报告、下载等)
// ==========================================
const generateSyndrome = () => {
  const now = new Date()
  currentTime.value = `${now.getFullYear()}/${now.getMonth() + 1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}`
  
  const aiMsgs = chatMessages.value.filter(msg => msg.type === 'ai')
  if (aiMsgs.length > 0) {
    reportAdvice.value = aiMsgs[aiMsgs.length - 1].content
  } else {
    reportAdvice.value = "暂无详细建议，请先与 AI 医师描述您的症状。"
  }

  if (chatMessages.value.length > 0) {
    const firstUserMsg = chatMessages.value.find(m => m.type === 'user')?.content || ""
    if (firstUserMsg.includes('肚子') || firstUserMsg.includes('胃')) {
      currentTopic.value = "脾胃失调/腹部不适"
    } else if (firstUserMsg.includes('头') || firstUserMsg.includes('晕')) {
      currentTopic.value = "头痛头晕/清阳不升"
    } else if (firstUserMsg.includes('累') || firstUserMsg.includes('乏')) {
      currentTopic.value = "气虚倦怠/气血调理"
    } else if (firstUserMsg.length > 10) {
      currentTopic.value = firstUserMsg.substring(0, 8) + "..."
    } else {
      currentTopic.value = firstUserMsg || "常规养生咨询"
    }
  }

  isBambooModalVisible.value = true
}

const tryStartFocusedAssessment = async () => {
  const presetPrompt = typeof route.query.presetPrompt === 'string' ? route.query.presetPrompt.trim() : ''
  if (!presetPrompt) return

  const focus = typeof route.query.focus === 'string' ? route.query.focus : ''
  const autoSend = String(route.query.autoSend || '') === '1'

  startNewConsultation()
  currentTopic.value = FOCUS_TOPIC_MAP[focus] || '专项问诊评测'

  if (autoSend) {
    await sendMsg(presetPrompt)
  } else {
    msgInput.value = presetPrompt
    scrollToBottom()
  }

  router.replace({ path: '/consultation' })
}

const closeBamboo = () => {
  isBambooModalVisible.value = false
}

const copyReport = () => {
  const reportText = `
【养生建议报告】
------------------------------
问诊时间：${currentTime.value}
问诊主题：${currentTopic.value}
------------------------------
【AI 医师调理方案】：
${reportAdvice.value.replace(/[*#]/g, '')} 

注：本报告由 AI 辅助生成，仅供参考，不替代专业医疗诊断。
  `.trim();

  navigator.clipboard.writeText(reportText).then(() => {
    alert('报告已成功复制到剪贴板！');
  }).catch(err => {
    console.error('复制失败:', err);
  });
};

const downloadReport = async () => {
  if (!reportContentRef.value) return;

  try {
    isExporting.value = true;
    await nextTick(); 
    await new Promise(resolve => setTimeout(resolve, 300)); 

    const element = reportContentRef.value;
    
    const canvas = await html2canvas(element, {
      scale: 2, 
      useCORS: true, 
      backgroundColor: '#F9F6EE', 
      windowWidth: element.scrollWidth,
      windowHeight: element.scrollHeight,
      y: window.scrollY || window.pageYOffset 
    });

    isExporting.value = false; 

    const imgData = canvas.toDataURL('image/jpeg', 1.0);
    const pdfWidth = canvas.width;
    const pdfHeight = canvas.height;

    const pdf = new jsPDF({
      orientation: 'p', 
      unit: 'px',      
      format: [pdfWidth, pdfHeight] 
    });

    pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);

    const dateObj = new Date();
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const cleanDateStr = `${year}${month}${day}`;

    pdf.save(`中医养生卷轴_${currentTopic.value}_${cleanDateStr}.pdf`);
    
  } catch (error) {
    console.error('生成卷轴失败:', error);
    alert('报告生成失败，请稍后再试。');
    isExporting.value = false; 
  }
};

const goToHome = () => router.push({ name: 'home' })

const goToAiTongue = () => {
  router.push({ name: 'tongue' })
}

const goToAiConsult = () => {
  router.push({ name: 'consultation' })
}

const goToHerbRecog = () => {
  router.push({ name: 'herb' })
}

const goToTcmScience = () => {
  router.push({ name: 'science' })
}

const startVoiceRecognition = () => {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
  if (!SpeechRecognition) {
    alert('您的浏览器不支持语音输入，请手动输入')
    return
  }
  
  const recognition = new SpeechRecognition()
  recognition.lang = 'zh-CN'
  recognition.interimResults = false

  recognition.onstart = () => { isRecording.value = true }
  recognition.onresult = (e) => { msgInput.value = e.results[0][0].transcript }
  recognition.onend = () => { isRecording.value = false }
  recognition.start()
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Ma+Shan+Zheng&family=Noto+Serif+SC:wght@400;500;700&display=swap');

.consultation-page {
  min-height: 100vh;
  background:
    radial-gradient(circle at top left, rgba(194, 168, 120, 0.16), transparent 28%),
    radial-gradient(circle at bottom right, rgba(28, 43, 38, 0.08), transparent 24%),
    linear-gradient(180deg, #f7f2e8 0%, #efe4d2 100%);
  color: #1c2b26;
  font-family: "Noto Serif SC", "Songti SC", "STSong", "Microsoft YaHei", serif;
}

.font-chinese {
  font-family: "Noto Serif SC", "Songti SC", "STSong", "Microsoft YaHei", serif;
}

.bg-ancient-light {
  background-color: #f7f2e8;
}

.bg-ancient-cream {
  background-color: #ede4d3;
}

.bg-ancient-tan {
  background-color: #1c2b26;
}

.bg-ancient-dark {
  background-color: #13211d;
}

.text-ancient-dark {
  color: #1c2b26;
}

.border-ancient-border {
  border-color: rgba(194, 168, 120, 0.35);
}

.page-nav-item.active {
  color: #E8D8B0 !important;
  filter: drop-shadow(0 0 6px rgba(194, 168, 120, 0.8));
}

/* === 聊天区域样式 === */
.ai-bubble {
  background: linear-gradient(180deg, #fbf7ef 0%, #f2eadb 100%);
  border: 1px solid rgba(194, 168, 120, 0.55);
  border-radius: 0.5rem;
  padding: 1rem 1.25rem; 
  max-width: 85%;
  box-shadow: 0 10px 28px rgba(28, 43, 38, 0.08);
  line-height: 1.8; 
  font-size: 1.15rem; 
  color: #24352f;
}

.user-bubble {
  background: linear-gradient(180deg, #f4ebd8 0%, #eadbbf 100%);
  border: 1px solid rgba(194, 168, 120, 0.32);
  border-radius: 0.5rem;
  padding: 1rem 1.25rem;
  max-width: 85%;
  box-shadow: 0 10px 28px rgba(28, 43, 38, 0.08);
  line-height: 1.8;
  font-size: 1.15rem; 
  text-align: left;
  color: #24352f;
}

.ai-bubble :deep(p) { margin-bottom: 0.85rem; }
.ai-bubble :deep(p:last-child) { margin-bottom: 0; }
.ai-bubble :deep(strong) { font-weight: bold; color: #8a6b32; }
.ai-bubble :deep(ul) { list-style-type: disc; margin-left: 1.5rem; margin-bottom: 0.85rem; padding-left: 0.5rem; }
.ai-bubble :deep(ol) { list-style-type: decimal; margin-left: 1.5rem; margin-bottom: 0.85rem; padding-left: 0.5rem; }
.ai-bubble :deep(li) { margin-bottom: 0.4rem; }
.ai-bubble :deep(h1) { font-size: 1.5rem; font-weight: bold; margin-top: 1.2rem; margin-bottom: 0.6rem; color: #1c2b26; }
.ai-bubble :deep(h2) { font-size: 1.35rem; font-weight: bold; margin-top: 1.2rem; margin-bottom: 0.6rem; color: #1c2b26; }
.ai-bubble :deep(h3) { font-size: 1.25rem; font-weight: bold; margin-top: 1.2rem; margin-bottom: 0.6rem; color: #1c2b26; }

/* === 竹简弹窗样式 === */
.bamboo-scroll {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.7);
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.5s;
}

.bamboo-scroll.show {
  opacity: 1;
  pointer-events: auto;
}

.scroll-content {
  width: 95%;
  max-width: 48rem;
  height: 85vh;
  background-color: #f9f4e9; 
  background-image: url('https://www.transparenttextures.com/patterns/aged-paper.png');
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35), inset 0 0 40px rgba(194, 168, 120, 0.16);
  background-size: auto;
  background-position: center;
  padding: 4rem 3rem;
  transform: scale(0.9);
  transition: transform 0.7s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.custom-scroll::-webkit-scrollbar { width: 6px; }
.custom-scroll::-webkit-scrollbar-track { background: transparent; }
.custom-scroll::-webkit-scrollbar-thumb { background-color: #D4B996; border-radius: 9999px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background-color: #8B4513; }

/* === 报告单内部大字号排版 === */
.report-markdown {
  font-size: 1.25rem;
  line-height: 1.9;
  color: #24352f;
}
.report-markdown :deep(p) { margin-bottom: 1.25rem; }

.report-markdown :deep(strong) { 
  font-weight: bold !important; 
  color: #8a6b32 !important; 
  background-color: transparent !important; 
  padding: 0 !important;
  border: none !important;
  box-shadow: none !important;
}

.report-markdown :deep(ul),
.report-markdown :deep(ol) { 
  list-style-type: none !important; 
  padding-left: 0 !important;
  margin-left: 0 !important;
  margin-bottom: 1.25rem; 
  counter-reset: ol-counter; 
}

.report-markdown :deep(li) { 
  position: relative !important;
  padding-left: 1.8rem !important; 
  margin-bottom: 0.8rem; 
}

.report-markdown :deep(ul li::before) {
  content: "•";
  position: absolute;
  left: 0.5rem;
  top: 0;
  color: #8a6b32; 
  font-weight: bold;
}

.report-markdown :deep(ol li::before) {
  counter-increment: ol-counter; 
  content: counter(ol-counter) "."; 
  position: absolute;
  left: 0.2rem;
  top: 0;
  color: #8a6b32; 
  font-weight: bold;
}

.report-markdown :deep(h1) { font-size: 1.75rem; font-weight: bold; color: #1c2b26; margin-top: 1.8rem; margin-bottom: 1rem; }
.report-markdown :deep(h2) { font-size: 1.5rem; font-weight: bold; color: #1c2b26; margin-top: 1.6rem; margin-bottom: 0.8rem; border-bottom: 1px dashed rgba(194, 168, 120, 0.7); padding-bottom: 0.4rem; }
.report-markdown :deep(h3) { font-size: 1.35rem; font-weight: bold; color: #1c2b26; margin-top: 1.4rem; margin-bottom: 0.8rem; }

/* ⚡️ 导出 PDF 时专用的修复样式 */
.export-mode,
.export-mode * {
  box-shadow: none !important;
  text-shadow: none !important;
}

/* ⚡️ 彻底解决 FontAwesome 图标截图偏位：改用绝对定位暴力居中 */
.export-mode .icon-circle {
  position: relative !important;
  display: block !important;
}

.export-mode .icon-circle i {
  position: absolute !important;
  top: 50% !important;
  left: 0 !important;
  width: 100% !important;
  text-align: center !important;
  transform: translateY(-50%) !important;
  margin: 0 !important;
  padding: 0 !important;
  line-height: 1 !important;
}
</style>