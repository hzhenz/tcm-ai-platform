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

export async function identifyHerbByImage(file) {
	const formData = new FormData()
	formData.append('image', file)

	const response = await fetch(`${JAVA_API_BASE_URL}/api/herb/identify`, {
		method: 'POST',
		headers: buildHeaders(),
		body: formData
	})

	if (response.status === 401) {
		throw new Error('UNAUTHORIZED')
	}

	return response.json()
}
