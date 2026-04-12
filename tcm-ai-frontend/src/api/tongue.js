const JAVA_API_BASE_URL = (import.meta.env.VITE_JAVA_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const TOKEN_KEY = 'tcm_token'

function buildHeaders() {
	const headers = {}
	const token = localStorage.getItem(TOKEN_KEY) || ''
	if (token) {
		headers.Authorization = `Bearer ${token}`
	}
	return headers
}

function buildFormData(file, options = {}) {
	const formData = new FormData()
	formData.append('image', file)

	if (options.customPrompt) {
		formData.append('customPrompt', options.customPrompt)
	}
	if (typeof options.simple === 'boolean') {
		formData.append('simple', String(options.simple))
	}

	return formData
}

function isAbortLikeError(err) {
	if (!err) return false
	const name = String(err.name || '')
	const code = String(err.code || '')
	const message = String(err.message || '')
	return (
		name === 'AbortError' ||
		name === 'TimeoutError' ||
		code === 'ABORT_ERR' ||
		/aborted without reason/i.test(message) ||
		/signal is aborted/i.test(message)
	)
}

async function requestTongueAnalyze(file, options = {}, timeoutMs = 120000) {
	const controller = new AbortController()
	const timer = setTimeout(() => controller.abort('timeout'), timeoutMs)

	try {
		return await fetch(`${JAVA_API_BASE_URL}/api/tongue/analyze`, {
			method: 'POST',
			headers: buildHeaders(),
			body: buildFormData(file, options),
			signal: controller.signal
		})
	} finally {
		clearTimeout(timer)
	}
}

export async function analyzeTongueByImage(file, options = {}) {
	const defaultTimeoutMs = options.simple === true ? 150000 : 240000
	const retryTimeoutMs = Number.isFinite(options.retryTimeoutMs) ? options.retryTimeoutMs : 300000
	const retryOnTimeout = options.retryOnTimeout !== false
	const timeoutMs = Number.isFinite(options.timeoutMs) ? options.timeoutMs : defaultTimeoutMs

	let response
	try {
		response = await requestTongueAnalyze(file, options, timeoutMs)
	} catch (err) {
		if (isAbortLikeError(err) && retryOnTimeout) {
			if (typeof options.onRetry === 'function') {
				options.onRetry()
			}
			try {
				response = await requestTongueAnalyze(file, options, retryTimeoutMs)
			} catch (retryErr) {
				if (isAbortLikeError(retryErr)) {
					throw new Error('舌诊请求超时。模型首次加载通常较慢，请稍后重试或检查 AI 服务是否已启动。')
				}
				throw retryErr
			}
		} else if (isAbortLikeError(err)) {
			throw new Error('舌诊请求超时，请稍后重试')
		}
		if (err && err.name === 'TypeError' && /Failed to fetch/i.test(String(err.message || ''))) {
			throw new Error('无法连接后端服务。请确认前端环境变量中的后端地址以及 5000/8080(或8081) 服务均已启动。')
		}
		throw err
	}

	if (response.status === 401) {
		const unauthorizedError = new Error('登录状态已过期，请重新登录')
		unauthorizedError.code = 'UNAUTHORIZED'
		throw unauthorizedError
	}

	return response.json()
}
