<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const username = ref('')
const password = ref('')
const loading = ref(false)
const JAVA_API_BASE_URL = (import.meta.env.VITE_JAVA_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

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
				username: result.data.username
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
		<div class="auth-card">
			<h1>用户登录</h1>
			<input v-model="username" type="text" placeholder="用户名" />
			<input v-model="password" type="password" placeholder="密码" @keyup.enter="submit" />
			<button :disabled="loading" @click="submit">{{ loading ? '登录中...' : '登录' }}</button>
			<p class="tips">
				还没有账号？
				<a href="/register">去注册</a>
			</p>
			<button type="button" class="browse-btn" @click="goHome">随便逛逛</button>
		</div>
	</div>
</template>

<style scoped>
.auth-page {
	min-height: 100vh;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(120deg, #f7f1e6 0%, #fefaf4 100%);
}

.auth-card {
	width: 360px;
	padding: 28px;
	border-radius: 12px;
	background: #fff;
	box-shadow: 0 10px 30px rgba(92, 58, 33, 0.15);
	display: flex;
	flex-direction: column;
	gap: 12px;
}

h1 {
	margin: 0 0 8px;
	font-size: 24px;
	color: #5c3a21;
}

input {
	height: 42px;
	border-radius: 8px;
	border: 1px solid #d6c5ac;
	padding: 0 12px;
	outline: none;
}

button {
	height: 42px;
	border: none;
	border-radius: 8px;
	background: #8b5e34;
	color: #fff;
	cursor: pointer;
}

button:disabled {
	opacity: 0.7;
	cursor: not-allowed;
}

.tips {
	margin: 4px 0 0;
	font-size: 14px;
	color: #666;
}

a {
	color: #8b5e34;
}

.browse-btn {
	height: 40px;
	border: 1px solid #d6c5ac;
	border-radius: 8px;
	background: #fff;
	color: #8b5e34;
	cursor: pointer;
}

.browse-btn:hover {
	background: #f9f2e8;
}
</style>
