<template>
  <section class="banner" id="home">
    <canvas ref="particleCanvas" class="hero-canvas"></canvas>
    <div class="banner-bg"></div>
    <div class="banner-content reveal-item">
      <div class="subtitle">AI辅助中医平台</div>
      <h1>中医四诊 · 辨证调理</h1>
      <p>望闻问切，四诊合参，由表及里。<br>结合现代人工智能，察知全身气血阴阳变化，为您提供精准的中医调理思路。</p>
      <div class="btn-group">
        <button class="btn btn-primary" @click="emit('navigate', '/tongue')">
          <span>AI舌诊分析</span>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
        </button>
        <button class="btn btn-outline" @click="emit('navigate', '/herb')">中药智能识别</button>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'

const particleCanvas = ref(null)
let ctx, width, height, particles = [], animationId

const emit = defineEmits(['navigate'])

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

onMounted(() => {
  setTimeout(() => {
    initCanvas()
  }, 100)
})

onBeforeUnmount(() => {
  if (animationId) cancelAnimationFrame(animationId)
})
</script>

<style scoped>
.banner {
  position: relative;
  min-height: 85vh;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 80px 20px;
  overflow: hidden;
  background-color: #FBFBF9;
}

.hero-canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  pointer-events: none;
}

.banner-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at 80% 20%, rgba(194, 168, 120, 0.1) 0%, transparent 40%),
              radial-gradient(circle at 20% 80%, rgba(28, 43, 38, 0.05) 0%, transparent 50%);
  background-color: #FBFBF9;
  z-index: 0;
}

.banner-bg::after {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.03'/%3E%3C/svg%3E");
}

.banner-content {
  position: relative;
  z-index: 2;
  max-width: 800px;
}

.banner .subtitle {
  color: #C2A878;
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
  color: #1C2B26;
  margin-bottom: 24px;
  line-height: 1.2;
}

.banner p {
  font-size: 18px;
  color: #666666;
  margin-bottom: 40px;
  line-height: 1.8;
  max-width: 600px;
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

.btn-primary:hover {
  background: #2A4039;
  transform: translateY(-2px);
  box-shadow: 0 8px 20px rgba(28, 43, 38, 0.2);
}

.btn-outline {
  background: transparent;
  color: #1C2B26;
  border: 1px solid #1C2B26;
}

.btn-outline:hover {
  background: rgba(28, 43, 38, 0.05);
}

.reveal-item {
  opacity: 0;
  transform: translateY(30px);
  animation: reveal 0.8s cubic-bezier(0.5, 0, 0, 1) forwards;
}

@keyframes reveal {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .banner h1 {
    font-size: 38px;
  }
  .banner .btn-group {
    flex-direction: column;
  }
}
</style>
