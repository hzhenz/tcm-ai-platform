<template>
  <div class="app-container">
    <!-- 全局背景层：半透明图片 + 粒子Canvas -->
    <div class="bg-image-layer"></div>
    <canvas ref="particleCanvas" class="hero-canvas"></canvas>
    <div class="banner-bg"></div>

    <!-- 动画阶段：阴阳鱼画卷（初始显示） -->
    <div 
      v-if="showAnimationStage" 
      ref="animationStageRef"
      class="animation-stage"
      @click="triggerUniteAnimation"
    >
      <div class="scroll-wrapper">
        <div class="scroll-container">
          <!-- 左轴：阴鱼 -->
          <div class="scroll-axis axis-left" ref="leftAxis">
            <div class="fish-axis" ref="leftFishAxis"></div>
            <div class="axis-label">⚡ 太阴 · 归藏</div>
          </div>

          <!-- 中间画卷 -->
          <div class="scroll-paper" ref="scrollPaper">
            <div class="tassel-top"></div>
            <div class="paper-content">
              <div class="main-title">"AI"上中医</div>
              <div class="sub-slogan">✦ 智贯千年 · 数承岐黄 ✦</div>
              <div class="inscription">
                阴阳为轴，道法自然<br>
                人工智能携手传统中医，焕发无界智慧。<br>
                （点击任意处，开启合抱之势）
              </div>
            </div>
          </div>

          <!-- 右轴：阳鱼 -->
          <div class="scroll-axis axis-right" ref="rightAxis">
            <div class="fish-axis" ref="rightFishAxis"></div>
            <div class="axis-label">☀ 太阳 · 启明</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 主内容阶段：原首页 Banner（动画结束后显示） -->
    <div v-if="showMainContent" class="main-stage">
      <section class="banner" id="home">
        <div class="banner-content reveal-item">
          <!-- 永久存在的太极背景层 -->
          <div 
            ref="taichiBgRef"
            class="taichi-bg"
            :class="{ 'taichi-spin': isTaichiSpinning }"
            @animationend="onSpinEnd"
            @click="handleStartClick"
          ></div>
          
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

// ---------- 全局粒子 Canvas 逻辑 ----------
const particleCanvas = ref(null)
let ctx, width, height, particles = [], animationId

const initCanvas = () => {
  const canvas = particleCanvas.value
  if (!canvas) return
  ctx = canvas.getContext('2d')
  
  const resize = () => {
    width = canvas.width = window.innerWidth
    height = canvas.height = window.innerHeight
  }
  window.addEventListener('resize', resize)
  resize()

  // 初始化粒子
  particles = []
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      size: Math.random() * 2 + 1,
      opacity: Math.random() * 0.5 + 0.1
    })
  }

  const animate = () => {
    if (!ctx) return
    ctx.clearRect(0, 0, width, height)
    
    ctx.lineWidth = 0.6
    for (let i = 0; i < particles.length; i++) {
      let p = particles[i]
      p.x += p.vx
      p.y += p.vy

      if (p.x < 0 || p.x > width) p.vx *= -1
      if (p.y < 0 || p.y > height) p.vy *= -1

      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(194, 168, 120, ${p.opacity})` 
      ctx.fill()

      for (let j = i + 1; j < particles.length; j++) {
        let p2 = particles[j]
        let dist = Math.sqrt((p.x - p2.x)**2 + (p.y - p2.y)**2)
        if (dist < 150) {
          ctx.beginPath()
          ctx.moveTo(p.x, p.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = `rgba(194, 168, 120, ${0.15 - dist/1000})`
          ctx.stroke()
        }
      }
    }
    animationId = requestAnimationFrame(animate)
  }
  animate()
}

// ---------- 动画阶段控制 ----------
const showAnimationStage = ref(true)
const showMainContent = ref(false)
const animationTriggered = ref(false)

// DOM 元素引用
const animationStageRef = ref(null)
const leftAxis = ref(null)
const rightAxis = ref(null)
const leftFishAxis = ref(null)
const rightFishAxis = ref(null)
const scrollPaper = ref(null)

// 太极融合体相关
let mergerElement = null
let timeouts = []

// 阴阳鱼 SVG
const yinFishSVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' class='fish-svg'>
  <path d='M100 0 A50 50 0 0 1 100 100 A50 50 0 0 0 100 200 A100 100 0 0 1 100 0' fill='#1C3B2F'/>
  <circle cx='100' cy='50' r='16' fill='#E8D8B0'/>
</svg>`
const yangFishSVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' class='fish-svg'>
  <path d='M100 0 A50 50 0 0 1 100 100 A50 50 0 0 0 100 200 A100 100 0 0 0 100 0' fill='#E8D8B0'/>
  <circle cx='100' cy='150' r='16' fill='#1C3B2F'/>
</svg>`
const fullTaichiSVG = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200' style="width:100%; height:100%; display:block;">
  <circle cx='100' cy='100' r='100' fill='#E8D8B0'/>
  <path d='M100 0 A50 50 0 0 1 100 100 A50 50 0 0 0 100 200 A100 100 0 0 1 100 0' fill='#1C3B2F'/>
  <circle cx='100' cy='50' r='16' fill='#E8D8B0'/>
  <circle cx='100' cy='150' r='16' fill='#1C3B2F'/>
</svg>`

// 渲染阴阳鱼 SVG
const renderFish = () => {
  if (leftFishAxis.value) leftFishAxis.value.innerHTML = yinFishSVG
  if (rightFishAxis.value) rightFishAxis.value.innerHTML = yangFishSVG
  // 调整 SVG 样式
  const styleSvg = (svg) => {
    if (svg) {
      svg.style.width = '100%'
      svg.style.height = '100%'
      svg.style.display = 'block'
      svg.setAttribute('preserveAspectRatio', 'xMidYMid meet')
      svg.style.filter = 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.2))'
    }
  }
  const leftSvg = leftFishAxis.value?.querySelector('svg')
  const rightSvg = rightFishAxis.value?.querySelector('svg')
  styleSvg(leftSvg)
  styleSvg(rightSvg)
}

// 隐藏画卷和文字
const hidePaperAndText = () => {
  if (scrollPaper.value) {
    scrollPaper.value.style.transition = 'opacity 0.45s ease-out, transform 0.3s'
    scrollPaper.value.classList.add('paper-hidden')
    const paperContent = scrollPaper.value.querySelector('.paper-content')
    if (paperContent) {
      paperContent.style.transition = 'opacity 0.4s ease'
      paperContent.style.opacity = '0'
    }
    const tassel = scrollPaper.value.querySelector('.tassel-top')
    if (tassel) tassel.style.opacity = '0'
  }
}

// 创建太极融合体
const createTaichiMerger = () => {
  if (mergerElement) mergerElement.remove()
  mergerElement = document.createElement('div')
  mergerElement.className = 'taichi-merger'
  mergerElement.innerHTML = fullTaichiSVG
  document.body.appendChild(mergerElement)
  return mergerElement
}

// 清理所有定时器
const clearAllTimeouts = () => {
  timeouts.forEach(timeout => clearTimeout(timeout))
  timeouts = []
}

// 执行合抱动画
const startUniteAnimation = () => {
  if (animationTriggered.value) return
  animationTriggered.value = true

  // 1. 隐藏画卷
  hidePaperAndText()

  // 2. 获取左右轴位置并计算移动距离
  const leftRect = leftAxis.value.getBoundingClientRect()
  const rightRect = rightAxis.value.getBoundingClientRect()
  const centerX = window.innerWidth / 2
  const leftCenterX = leftRect.left + leftRect.width / 2
  const rightCenterX = rightRect.left + rightRect.width / 2
  const deltaLeft = centerX - leftCenterX
  const deltaRight = centerX - rightCenterX

  // 3. 移动画轴
  leftAxis.value.style.transition = 'transform 1.4s cubic-bezier(0.2, 0.9, 0.3, 1.2)'
  rightAxis.value.style.transition = 'transform 1.4s cubic-bezier(0.2, 0.9, 0.3, 1.2)'
  leftAxis.value.style.transform = `translateX(${deltaLeft}px)`
  rightAxis.value.style.transform = `translateX(${deltaRight}px)`

  // 标签淡出
  const leftLabel = leftAxis.value.querySelector('.axis-label')
  const rightLabel = rightAxis.value.querySelector('.axis-label')
  if (leftLabel) { leftLabel.style.transition = 'opacity 0.3s'; leftLabel.style.opacity = '0' }
  if (rightLabel) { rightLabel.style.transition = 'opacity 0.3s'; rightLabel.style.opacity = '0' }

  // 鱼形放大
  if (leftFishAxis.value) { leftFishAxis.value.style.transition = 'transform 0.5s'; leftFishAxis.value.style.transform = 'scale(1.08)' }
  if (rightFishAxis.value) { rightFishAxis.value.style.transition = 'transform 0.5s'; rightFishAxis.value.style.transform = 'scale(1.08)' }

  // 等待移动完成大半，显示太极融合体
  const t1 = setTimeout(() => {
    const merger = createTaichiMerger()
    setTimeout(() => {
      merger.classList.add('active')
      if (leftFishAxis.value) { leftFishAxis.value.style.transition = 'opacity 0.2s'; leftFishAxis.value.style.opacity = '0' }
      if (rightFishAxis.value) { rightFishAxis.value.style.transition = 'opacity 0.2s'; rightFishAxis.value.style.opacity = '0' }
      if (leftAxis.value) leftAxis.value.style.opacity = '0.2'
      if (rightAxis.value) rightAxis.value.style.opacity = '0.2'
    }, 30)

    // 太极完全显现后，执行放大消散效果
    const t2 = setTimeout(() => {
      merger.classList.add('fade-out')
      const t3 = setTimeout(() => {
        if (merger && merger.parentNode) merger.remove()
        // 动画彻底结束，切换到主内容
        showAnimationStage.value = false
        showMainContent.value = true
        // 清理残留的样式和定时器
        clearAllTimeouts()
      }, 700)
      timeouts.push(t3)
    }, 1000)
    timeouts.push(t2)
  }, 500)
  timeouts.push(t1)
}

// 触发动画（用户点击）
const triggerUniteAnimation = () => {
  if (!animationTriggered.value) {
    startUniteAnimation()
  }
}

// ---------- 主内容原有逻辑 ----------
const taichiBgRef = ref(null)
const isTaichiSpinning = ref(false)
let spinInProgress = false

const scrollToNext = () => {
  const functionSection = document.getElementById('function')
  if (functionSection) {
    const headerOffset = 80
    const elementPosition = functionSection.getBoundingClientRect().top
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset
    window.scrollTo({
      top: offsetPosition,
      behavior: 'smooth'
    })
  }
}

const onSpinEnd = () => {
  if (!isTaichiSpinning.value) return
  isTaichiSpinning.value = false
  spinInProgress = false
  scrollToNext()
}

const handleStartClick = () => {
  if (spinInProgress) return
  spinInProgress = true
  isTaichiSpinning.value = true
}

// 生命周期
onMounted(() => {
  // 初始化粒子 Canvas
  initCanvas()
  // 渲染阴阳鱼 SVG
  renderFish()
  // 给画卷添加光晕效果（可选）
  const addGlow = () => {
    const leftDiv = leftFishAxis.value
    const rightDiv = rightFishAxis.value
    if (leftDiv && !leftDiv.querySelector('.aura')) {
      const aura = document.createElement('div')
      aura.className = 'aura'
      aura.style.position = 'absolute'
      aura.style.width = 'calc(100% + 16px)'
      aura.style.height = 'calc(100% + 16px)'
      aura.style.borderRadius = '50%'
      aura.style.background = 'radial-gradient(circle, rgba(28,59,47,0.2), transparent 70%)'
      aura.style.top = '-8px'
      aura.style.left = '-8px'
      aura.style.zIndex = '-1'
      aura.style.pointerEvents = 'none'
      leftDiv.style.position = 'relative'
      leftDiv.appendChild(aura)
    }
    if (rightDiv && !rightDiv.querySelector('.aura')) {
      const aura2 = document.createElement('div')
      aura2.className = 'aura'
      aura2.style.position = 'absolute'
      aura2.style.width = 'calc(100% + 16px)'
      aura2.style.height = 'calc(100% + 16px)'
      aura2.style.borderRadius = '50%'
      aura2.style.background = 'radial-gradient(circle, rgba(232,216,176,0.2), transparent 70%)'
      aura2.style.top = '-8px'
      aura2.style.left = '-8px'
      aura2.style.zIndex = '-1'
      aura2.style.pointerEvents = 'none'
      rightDiv.style.position = 'relative'
      rightDiv.appendChild(aura2)
    }
  }
  addGlow()
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
  clearAllTimeouts()
  if (mergerElement) mergerElement.remove()
})
</script>

<style scoped>
/* 全局容器 */
.app-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  overflow-x: hidden;
}

/* 背景层（半透明图片 + 粒子Canvas + 渐变/噪点） */
.bg-image-layer {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url('/2.jpg');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  opacity: 0.5;
  z-index: 0;
  pointer-events: none;
}

.hero-canvas {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.banner-bg {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 80% 20%, rgba(194, 168, 120, 0.1) 0%, transparent 40%),
              radial-gradient(circle at 20% 80%, rgba(28, 43, 38, 0.05) 0%, transparent 50%);
  z-index: 0;
  pointer-events: none;
}

.banner-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
  pointer-events: none;
}

/* 动画阶段样式（基于 fish.html 移植，背景透明） */
.animation-stage {
  position: relative;
  z-index: 10;
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  background: transparent; /* 透明以透出底层背景 */
}

.scroll-wrapper {
  max-width: 1400px;
  width: 100%;
  margin: 0 auto;
  perspective: 1000px;
}

.scroll-container {
  display: flex;
  justify-content: center;
  align-items: stretch;
  gap: 0;
  background: transparent;
  flex-wrap: nowrap;
  animation: floatIn 0.9s cubic-bezier(0.2, 0.85, 0.4, 1) forwards;
}

.scroll-axis {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 170px;
  transition: all 0.3s ease;
  background: transparent;
  position: relative;
  z-index: 5;
}

.fish-axis {
  width: 170px;
  height: 170px;
  background: transparent;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.35s cubic-bezier(0.2, 0.9, 0.4, 1.1), filter 0.3s;
  filter: drop-shadow(0 12px 20px rgba(0, 0, 0, 0.4));
}

.axis-left .fish-axis {
  transform: rotate(-2deg);
  animation: yinFloat 4.6s ease-in-out infinite;
}
.axis-right .fish-axis {
  transform: rotate(2deg);
  animation: yangFloat 4.6s ease-in-out infinite;
}

.axis-label {
  margin-top: 20px;
  font-size: 0.85rem;
  letter-spacing: 3px;
  background: rgba(30, 25, 20, 0.5);
  backdrop-filter: blur(4px);
  padding: 4px 14px;
  border-radius: 40px;
  color: #e9d6aa;
  font-weight: 300;
  font-family: monospace;
  border: 0.5px solid rgba(232, 216, 176, 0.3);
}

.scroll-paper {
  flex: 1;
  min-width: 280px;
  background: linear-gradient(135deg, rgba(250, 240, 215, 0.85), rgba(235, 215, 175, 0.85)),
              url('/3.jpg') center/cover no-repeat;
  border-radius: 32px 18px 18px 32px;
  box-shadow: 0 30px 45px -12px rgba(0, 0, 0, 0.6), inset 0 1px 3px rgba(255, 245, 210, 0.9);
  margin: 0 -8px;
  z-index: 10;
  position: relative;
  backdrop-filter: blur(0.5px);
  animation: paperUnfold 0.8s ease-out forwards;
  transition: opacity 0.5s ease, transform 0.4s ease;
}

.scroll-paper.paper-hidden {
  opacity: 0 !important;
  pointer-events: none;

}

.paper-content {
  padding: 2rem 2.2rem 3rem 2.2rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 460px;
  text-align: center;
  position: relative;
  z-index: 2;
  transition: opacity 0.4s ease;
}


.main-title {
  font-size: 6rem;
  font-weight: 700;
  background: linear-gradient(135deg, #2A4039, #1C3B2F, #3a5c50) !important;
  background-clip: text !important;
  -webkit-background-clip: text !important;
  color: transparent !important;
  letter-spacing: 12px;
  margin-bottom: 1rem;
  text-shadow: none;
  animation: gentlePulse 2.4s infinite alternate; /* 恢复动画 */
}

.sub-slogan {
  font-size: 1.8rem;
  color: #1C3B2F;
  margin-top: 0.2rem;
  border-top: 1px solid #e2caa0;
  border-bottom: 1px solid #e2caa0;
  display: inline-block;
  padding: 0.5rem 1.6rem;
  font-style: italic;
  letter-spacing: 3px;
  background: rgba(250, 240, 215, 0.4);
  border-radius: 60px;
}

.inscription {
  margin-top: 1rem;
  font-size: 1rem;
  color: #1C3B2F;
  max-width: 85%;
  line-height: 1.7;
  background: rgba(235, 220, 185, 0.5);
  padding: 12px 24px;
  border-radius: 60px;
}

.tassel-top {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  width: 36px;
  height: 28px;
  background: #bc874a;
  border-radius: 0 0 20px 20px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.2);
  opacity: 0.8;
}
.tassel-top::after {
  content: "✨";
  position: absolute;
  bottom: -26px;
  left: 8px;
  font-size: 20px;
  opacity: 0.65;
}

/* 动画定义 */
@keyframes floatIn {
  0% { opacity: 0; transform: translateY(35px) scale(0.94); filter: blur(5px);}
  70% { opacity: 1; transform: translateY(-2px) scale(1.01);}
  100% { opacity: 1; transform: translateY(0) scale(1); filter: blur(0);}
}
@keyframes paperUnfold {
  0% { transform: scaleX(0.2); opacity: 0;}
  40% { transform: scaleX(1.02); opacity: 1;}
  100% { transform: scaleX(1); opacity: 1;}
}
@keyframes gentlePulse {
  0% { text-shadow: 0 0 1px #2A4039; letter-spacing: 10px; }
  100% { text-shadow: 0 0 6px #3a5c50, 0 0 2px #1C2B26; letter-spacing: 12px; }
}

@keyframes yinFloat {
  0% { transform: translateY(0px) rotate(-1deg); }
  50% { transform: translateY(-4px) rotate(0.5deg); }
  100% { transform: translateY(0px) rotate(-1deg); }
}
@keyframes yangFloat {
  0% { transform: translateY(0px) rotate(1deg); }
  50% { transform: translateY(-4px) rotate(-0.5deg); }
  100% { transform: translateY(0px) rotate(1deg); }
}

/* 主内容阶段样式（原首页，移除了自身的 canvas，背景透明） */
.main-stage {
  position: relative;
  z-index: 20;
}

.banner {
  position: relative;
  height: 0;
  padding-bottom: 56.25%;
  min-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  overflow: hidden;
  background-color: transparent;
}

.banner-content {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

@keyframes breathGlow {
  0% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 20px 35px rgba(0, 0, 0, 0.15), 0 0 5px rgba(232, 216, 176, 0.3);
    filter: drop-shadow(0 0 2px rgba(200, 60, 50, 0.4));
  }
  50% {
    transform: translate(-50%, -50%) scale(1.05);
    box-shadow: 0 20px 35px rgba(0, 0, 0, 0.15), 0 0 25px rgba(232, 216, 176, 0.8), 0 0 40px rgba(232, 216, 176, 0.5);
    filter: drop-shadow(0 0 12px rgba(200, 60, 50， 0.8));
  }
  100% {
    transform: translate(-50%, -50%) scale(1);
    box-shadow: 0 20px 35px rgba(0, 0, 0, 0.15), 0 0 5px rgba(232, 216, 176, 0.3);
    filter: drop-shadow(0 0 2px rgba(200, 60, 50, 0.4));
  }
}



.taichi-bg {
  position: absolute;
  top: 50%;
  left: 50%;
  width: min(500px, 85vw);
  aspect-ratio: 1 / 1;
  background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 200'%3E%3Ccircle cx='100' cy='100' r='100' fill='%23E8D8B0'/%3E%3Cpath d='M100 0 A50 50 0 0 1 100 100 A50 50 0 0 0 100 200 A100 100 0 0 1 100 0' fill='%231C3B2F'/%3E%3Ccircle cx='100' cy='50' r='16' fill='%23E8D8B0'/%3E%3Ccircle cx='100' cy='150' r='16' fill='%231C3B2F'/%3E%3C/svg%3E") center/contain no-repeat;
  border-radius: 50%;
  box-shadow: 0 20px 35px rgba(0, 0, 0, 0.15);
  z-index: 1;
  cursor: pointer;
  animation: breathGlow 2.5s ease-in-out infinite;
}


.taichi-spin {
  animation: spin 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

@keyframes spin {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.text-container {
  position: relative;
  z-index: 2;
  width: min(520px, 80vw);
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: transparent;
  pointer-events: auto;
}

.banner .subtitle,
.banner h1,
.banner p,
.btn-start span {
  color: #FFFFFF;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.btn-start {
  background: rgba(28, 43, 38, 0.85) !important;
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-start:hover {
  background: rgba(42, 64, 57, 0.95) !important;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
}

.banner .subtitle {
  font-weight: 600;
  letter-spacing: 4px;
  font-size: 14px;
  margin-bottom: 20px;
  text-transform: uppercase;
}

.banner h1 {
  font-family: "Noto Serif SC", "Songti SC", "STSong", "Microsoft YaHei", serif;
  font-size: 56px;
  font-weight: 700;
  margin-bottom: 24px;
  line-height: 1.2;
}

.banner p {
  font-size: 18px;
  margin-bottom: 40px;
  line-height: 1.8;
  max-width: 500px;
  margin-left: auto;
  margin-right: auto;
}

.banner .btn-group {
  display: flex;
  gap: 20px;
  justify-content: center;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 14px 32px;
  border-radius: 40px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
}

.btn-primary {
  background: #1C2B26;
  color: #fff;
}

.reveal-item {
  opacity: 0;
  transform: translateY(30px);
  animation: reveal 0.8s cubic-bezier(0.5, 0, 0, 1) forwards;
}

@keyframes reveal {
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式 */
@media (max-width: 768px) {
  .banner h1 { font-size: 38px; }
  .banner .btn-group { flex-direction: column; }
  .banner { min-height: 400px; }
  .taichi-bg { width: min(450px, 85vw); }
  .text-container { width: min(420px, 80vw); }
  .banner p { font-size: 16px; }
}
@media (max-width: 480px) {
  .banner h1 { font-size: 28px; }
  .banner p { font-size: 14px; }
  .btn-start { padding: 12px 24px; font-size: 14px; }
  .taichi-bg { width: min(340px, 85vw); }
  .text-container { width: min(300px, 80vw); }
}

/* 画卷响应式 */
@media (max-width: 880px) {
  .scroll-axis { width: 130px; }
  .fish-axis { width: 110px; height: 110px; }
  .main-title { font-size: 3rem; letter-spacing: 6px; }
  .paper-content { padding: 2rem 1.5rem; min-height: 380px; }
}
@media (max-width: 680px) {
  .scroll-container { flex-wrap: wrap; justify-content: center; gap: 20px; }
  .scroll-axis { width: auto; margin: 0 15px; }
  .fish-axis { width: 100px; height: 100px; }
  .scroll-paper { order: 2; width: 100%; margin: 15px 0; }
  .main-title { font-size: 2.5rem; letter-spacing: 5px; }
}
@media (max-width: 480px) {
  .fish-axis { width: 85px; height: 85px; }
  .main-title { font-size: 2rem; letter-spacing: 3px; }
}
</style>

<style>
/* 全局样式：太极融合体动画（不受 scoped 限制） */
.taichi-merger {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(0);
  width: 200px;
  height: 200px;
  z-index: 10000;
  pointer-events: none;
  filter: drop-shadow(0 0 20px rgba(232, 216, 176, 0.6));
  transition: transform 0.7s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.6s;
  opacity: 0;
}
.taichi-merger.active {
  transform: translate(-50%, -50%) scale(1);
  opacity: 1;
}
.taichi-merger.fade-out {
  transform: translate(-50%, -50%) scale(2.5);
  opacity: 0;
  transition: transform 0.6s ease-out, opacity 0.5s ease-out;
}



</style>