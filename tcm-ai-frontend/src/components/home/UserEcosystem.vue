<template>
  <section class="section" id="user">
    <div class="container">
      <div class="user-box reveal-item">
        <div class="user-bg-pattern"></div>
        <div class="user-content">
          <h2>关于我们</h2>
          <p>我们致力于探索中医与人工智能的深度融合，通过AI技术为中医诊断、辨识、养生提供科学工具。平台不仅传承中医千年的智慧结晶，还以数字化形式推广中医文化，让更多人体验到传统与现代科技结合的健康生活。</p >
          <button class="btn btn-outline light" @click="emit('action', { type: 'about' })">了解更多</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
const emit = defineEmits(['action'])
</script>

<style scoped>
.section {
  padding: 100px 0;
  position: relative;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

.user-box {
  position: relative;
  background: #1C2B26;
  border-radius: 32px;
  padding: 80px 40px;
  text-align: center;
  color: #fff;
  overflow: hidden;
}

.user-bg-pattern {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(194, 168, 120, 0.1) 10%, transparent 10%),
              radial-gradient(circle, rgba(194, 168, 120, 0.05) 10%, transparent 10%);
  background-size: 30px 30px;
  background-position: 0 0, 15px 15px;
  z-index: 0;
  opacity: 0.5;
}

.user-content {
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
}

.user-content h2 {
  font-family: "Noto Serif SC", "Songti SC", "STSong", "Microsoft YaHei", serif;
  font-size: 32px;
  margin-bottom: 20px;
  color: #C2A878;
}

.user-content p {
  font-size: 16px;
  line-height: 1.8;
  margin-bottom: 30px;
  color: rgba(255,255,255,0.8);
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

.btn-outline.light {
  border: 1px solid #fff;
  color: #fff;
  background: transparent;
}

.btn-outline.light:hover {
  background: #fff;
  color: #1C2B26;
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
  .section {
    padding: 60px 0;
  }
  
  .user-box {
    padding: 60px 30px;
  }
  
  .user-content h2 {
    font-size: 24px;
  }
}

.section {
  background-color: #F7F4E8;  /* 添加这行来设置页面背景 */
}

</style>