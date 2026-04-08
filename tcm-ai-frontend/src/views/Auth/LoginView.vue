<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const JAVA_API_BASE_URL = (import.meta.env.VITE_JAVA_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

// 古籍字符背景流特效
const matrixCanvas = ref(null)
let animationFrameId = null
let resizeHandler = null

onMounted(() => {
	const canvas = matrixCanvas.value
	if (!canvas) return
	const ctx = canvas.getContext('2d')
	
	const initCanvas = () => {
		canvas.width = window.innerWidth
		canvas.height = window.innerHeight
	}
	initCanvas()

	const chars = '阴阳五行金木水火土心肝脾肺肾气血津液寒热温凉表里虚实精气神经络穴位黄帝内经本草纲目伤寒杂病论望闻问切'.split('')
	const fontSize = 20 // 稍微放大字号
	let columns = Math.floor(canvas.width / fontSize)
	// 让字符在不同的高度开始流动，交错方向：偶数下落，奇数上升
	const drops = Array(columns).fill(0).map((_, i) => {
		return i % 2 === 0 ? -Math.random() * 100 : (canvas.height / fontSize) + Math.random() * 100
	})

	let lastDrawTime = 0

	const draw = (timestamp) => {
		animationFrameId = requestAnimationFrame(draw)
		// 节流控制渲染帧率（约 150ms 刷新一次），速度更慢
		if (timestamp - lastDrawTime < 150) return
		lastDrawTime = timestamp

		// 半透明底色：加大覆盖浓度（0.15），让旧残影消散得快一点，避免画面脏乱
		ctx.fillStyle = 'rgba(251, 251, 249, 0.15)'
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		// 字符颜色：调低不透明度到 25%，作为淡背景不喧宾夺主
		ctx.fillStyle = 'rgba(194, 168, 120, 0.25)'
		ctx.font = `${fontSize}px "Noto Serif SC", "Songti SC", serif`

		for (let i = 0; i < drops.length; i++) {
			const text = chars[Math.floor(Math.random() * chars.length)]
			const x = i * fontSize
			const y = drops[i] * fontSize
			ctx.fillText(text, x, y)

			// 随机重置，形成交错流动效果
			if (i % 2 === 0) {
				// 向下流动
				if (y > canvas.height && Math.random() > 0.98) {
					drops[i] = 0
				}
				drops[i] += 1 // 每次固定跳动一整个字符高度
			} else {
				// 向上流动
				if (y < 0 && Math.random() > 0.98) {
					drops[i] = canvas.height / fontSize
				}
				drops[i] -= 1 // 每次固定跳动一整个字符高度
			}
		}
	}

	requestAnimationFrame(draw)

	// 处理窗口大小改变
	resizeHandler = () => {
		initCanvas()
		const newColumns = Math.floor(canvas.width / fontSize)
		if (newColumns > drops.length) {
			const added = Array(newColumns - drops.length).fill(0).map((_, idx) => {
				const i = idx + drops.length
				return i % 2 === 0 ? -Math.random() * 50 : (canvas.height / fontSize) + Math.random() * 50
			})
			drops.push(...added)
		} else {
			drops.length = newColumns
		}
	}
	window.addEventListener('resize', resizeHandler)
})

onUnmounted(() => {
	if (animationFrameId) cancelAnimationFrame(animationFrameId)
	if (resizeHandler) window.removeEventListener('resize', resizeHandler)
})

const goHome = () => {
	router.push('/')
}

const submit = async () => {
	if (!username.value.trim() || !password.value.trim()) {
		alert('请输入用户名和密码')
		return
	}

	loading.value = true
	try {
		const response = await fetch(`${JAVA_API_BASE_URL}/api/auth/login`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				username: username.value.trim(),
				password: password.value
			})
		})
		const result = await response.json()

		if (result.code === 200 && result.data?.token) {
			localStorage.setItem('tcm_token', result.data.token)
			localStorage.setItem('tcm_user', JSON.stringify({
				userId: result.data.userId,
				username: result.data.username,
				createTime: result.data.createTime || null
			}))
			const redirect = router.currentRoute.value.query.redirect
			if (typeof redirect === 'string' && redirect.startsWith('/')) {
				router.push(redirect)
				return
			}

			router.push('/')
			return
		}

		alert(result.msg || '登录失败')
	} catch (e) {
		alert('登录失败，请检查后端是否已启动')
	} finally {
		loading.value = false
	}
}
</script>

<template>
	<div class="auth-page">
		<!-- 背景古籍字符流 -->
		<canvas ref="matrixCanvas" class="matrix-canvas"></canvas>

		<div class="auth-container">
			<!-- 左侧视觉区 -->
			<div class="auth-banner">
				<div class="banner-pattern"></div>
				<div class="banner-content">
					<svg class="logo-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
						<path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" stroke-width="2"/>
						<path d="M12 17C14.7614 17 17 14.7614 17 12C17 9.23858 14.7614 7 12 7C9.23858 7 7 9.23858 7 12C7 14.7614 9.23858 17 12 17Z" stroke="currentColor" stroke-width="2"/>
						<path d="M12 12L15.5 8.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
					</svg>
					<h2>AI上中医</h2>
					<p>传承千年智慧 · 数字赋能健康</p>
				</div>
			</div>
			<!-- 右侧表单区 -->
			<div class="auth-form-wrap">
				<div class="form-header">
					<h2>欢迎回来</h2>
					<p>请登录您的账号继续探索</p>
				</div>
				<div class="form-body">
					<div class="input-group">
						<input v-model="username" type="text" placeholder="用户名" />
					</div>
					<div class="input-group">
						<input v-model="password" type="password" placeholder="密码" @keyup.enter="submit" />
					</div>
					
					<button class="primary-btn" :disabled="loading" @click="submit">
						{{ loading ? '登录中...' : '登 录' }}
					</button>
					
					<div class="actions">
						<p class="tips">没有账号？<router-link to="/register" class="link">快速注册</router-link></p>
						<button type="button" class="ghost-btn" @click="goHome">随便逛逛</button>
					</div>
				</div>
			</div>
		</div>
	</div>
</template>

<style scoped>
.auth-page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #FBFBF9;
	background-image: radial-gradient(circle at 100% 0%, rgba(229, 213, 193, 0.4) 0%, transparent 40%), 
					  radial-gradient(circle at 0% 100%, rgba(229, 213, 193, 0.4) 0%, transparent 40%);
	padding: 20px;
	font-family: -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Helvetica Neue, Arial, sans-serif;
	position: relative;
	overflow: hidden;
	animation: fadeInPage 0.8s ease-out;
}

@keyframes fadeInPage {
	from { opacity: 0; }
	to { opacity: 1; }
}

.matrix-canvas {
	position: absolute;
	top: 0;
	left: 0;
	width: 100%;
	height: 100%;
	z-index: 0;
	pointer-events: none;
}

.auth-container {
	display: flex;
	width: 100%;
	max-width: 900px;
	min-height: 540px;
	background: #fff;
	border-radius: 20px;
	box-shadow: 0 20px 40px rgba(28, 43, 38, 0.08);
	overflow: hidden;
	position: relative;
	z-index: 1;
	animation: slideUpCard 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideUpCard {
	from {
		opacity: 0;
		transform: translateY(30px) scale(0.98);
	}
	to {
		opacity: 1;
		transform: translateY(0) scale(1);
	}
}

.auth-banner {
	flex: 1;
	background: #1C2B26;
	position: relative;
	display: flex;
	align-items: center;
	justify-content: center;
	overflow: hidden;
	color: #C2A878;
	text-align: center;
	padding: 40px;
}

.banner-pattern {
	position: absolute;
	top: -50%;
	left: -50%;
	width: 200%;
	height: 200%;
	background: radial-gradient(circle, rgba(194, 168, 120, 0.1) 10%, transparent 10%),
				radial-gradient(circle, rgba(194, 168, 120, 0.05) 10%, transparent 10%);
	background-size: 30px 30px;
	background-position: 0 0, 15px 15px;
	z-index: 1;
}

.banner-content {
	position: relative;
	z-index: 2;
}

.logo-icon {
	width: 64px;
	height: 64px;
	margin-bottom: 24px;
	color: #C2A878;
}

.banner-content h2 {
	font-family: "Noto Serif SC", "Songti SC", "STSong", serif;
	font-size: 36px;
	font-weight: 700;
	margin: 0 0 16px;
	letter-spacing: 4px;
	color: #C2A878;
}

.banner-content p {
	font-size: 16px;
	letter-spacing: 2px;
	opacity: 0.8;
	margin: 0;
}

.auth-form-wrap {
	width: 440px;
	padding: 60px 48px;
	display: flex;
	flex-direction: column;
	justify-content: center;
	background: #fff;
}

.form-header {
	margin-bottom: 40px;
	text-align: center;
}

.form-header h2 {
	font-family: "Noto Serif SC", "Songti SC", serif;
	font-size: 28px;
	color: #1C2B26;
	margin: 0 0 8px;
	font-weight: 600;
}

.form-header p {
	color: #666;
	font-size: 14px;
	margin: 0;
}

.input-group {
	margin-bottom: 24px;
}

.input-group input {
	width: 100%;
	height: 48px;
	border-radius: 8px;
	border: 1px solid rgba(28, 43, 38, 0.15);
	padding: 0 16px;
	font-size: 15px;
	outline: none;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	background: #FBFBF9;
	box-sizing: border-box;
	color: #2C2C2C;
}

.input-group input:focus {
	border-color: #1C2B26;
	background: #fff;
	box-shadow: 0 0 0 3px rgba(28, 43, 38, 0.05);
}

.primary-btn {
	width: 100%;
	height: 48px;
	background: #1C2B26;
	color: #fff;
	border: none;
	border-radius: 8px;
	font-size: 16px;
	font-weight: 600;
	cursor: pointer;
	transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	margin-bottom: 24px;
	display: flex;
	align-items: center;
	justify-content: center;
}

.primary-btn:hover:not(:disabled) {
	background: #2C3E35;
	box-shadow: 0 8px 20px rgba(28, 43, 38, 0.15);
	transform: translateY(-1px);
}

.primary-btn:active:not(:disabled) {
	transform: translateY(0);
}

.primary-btn:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.actions {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.tips {
	font-size: 14px;
	color: #666;
	margin: 0;
}

.link {
	color: #C2A878;
	text-decoration: none;
	font-weight: 600;
	transition: color 0.3s;
	margin-left: 4px;
}

.link:hover {
	color: #1C2B26;
}

.ghost-btn {
	background: transparent;
	border: 1px solid rgba(28, 43, 38, 0.15);
	color: #1C2B26;
	height: 36px;
	padding: 0 16px;
	border-radius: 8px;
	font-size: 14px;
	font-weight: 500;
	cursor: pointer;
	transition: all 0.3s;
}

.ghost-btn:hover {
	background: #FBFBF9;
	border-color: #1C2B26;
}

@media (max-width: 768px) {
	.auth-container {
		flex-direction: column;
		min-height: auto;
	}
	.auth-banner {
		padding: 40px 20px;
		flex: none;
	}
	.auth-form-wrap {
		width: 100%;
		padding: 40px 24px;
	}
}
</style>
