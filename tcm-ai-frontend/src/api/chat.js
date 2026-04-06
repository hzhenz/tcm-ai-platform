const JAVA_API_BASE_URL = (import.meta.env.VITE_JAVA_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
const TOKEN_KEY = 'tcm_token'

function buildHeaders() {
	const headers = { 'Content-Type': 'application/json' }
	const token = localStorage.getItem(TOKEN_KEY) || ''
	if (token) {
		headers.Authorization = `Bearer ${token}`
	}
	return headers
}

export async function postAiChat({ content, history = [] }) {
	const response = await fetch(`${JAVA_API_BASE_URL}/api/ai/chat`, {
		method: 'POST',
		headers: buildHeaders(),
		body: JSON.stringify({ content, history })
	})

	if (response.status === 401) {
		throw new Error('UNAUTHORIZED')
	}

	return response.json()
}
