<template>
  <footer class="footer">
    <div class="container footer-grid">
      <div class="footer-col">
        <div class="logo">AI上中医</div>
        <p class="slogan">AI赋能传统中医，让中医智慧触手可及。</p>
      </div>
      <div class="footer-col">
        <h4>快速链接</h4>
        <a href="#">关于我们</a>
        <a href="#">服务条款</a>
        <a href="#">隐私政策</a>
      </div>
      <div class="footer-col">
        <h4>联系我们</h4>
        <p>Email: zhihuiqihuang@163.com</p>
        <p>合作: 长沙中医协会</p>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© 2026 AI上中医 - AI赋能中医传承平台 保留所有权利</p>
    </div>
  </footer>
</template>

<style scoped>
.footer {
  background: #111A17;
  color: rgba(255,255,255,0.6);
  padding: 60px 0 20px;
}

.container {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
}

.footer-grid {
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 40px;
  margin-bottom: 40px;
}

.logo {
  font-family: "Noto Serif SC", "Songti SC", "STSong", "Microsoft YaHei", serif;
  font-size: 22px;
  font-weight: 700;
  color: #C2A878;
  margin-bottom: 12px;
  letter-spacing: 1px;
}

.slogan {
  font-size: 14px;
}

.footer-col h4 {
  color: #fff;
  font-size: 16px;
  margin-bottom: 20px;
  font-weight: 500;
}

.footer-col a, .footer-col p {
  display: block;
  font-size: 14px;
  margin-bottom: 10px;
  transition: color 0.3s ease;
}

.footer-col a {
  cursor: pointer;
}

.footer-col a:hover {
  color: #C2A878;
}

.footer-bottom {
  text-align: center;
  padding-top: 20px;
  border-top: 1px solid rgba(255,255,255,0.1);
  font-size: 12px;
}

@media (max-width: 768px) {
  .footer-grid {
    grid-template-columns: 1fr;
    text-align: center;
  }
}
</style>
