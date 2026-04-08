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

export async function createAgentTask(payload) {
  const response = await fetch(`${JAVA_API_BASE_URL}/api/agent/tasks/create`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  })

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED')
  }

  return response.json()
}

export async function getAgentTaskList() {
  const response = await fetch(`${JAVA_API_BASE_URL}/api/agent/tasks`, {
    method: 'GET',
    headers: buildHeaders()
  })

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED')
  }

  return response.json()
}

export async function getAgentTaskDetail(taskId) {
  const response = await fetch(`${JAVA_API_BASE_URL}/api/agent/tasks/${taskId}`, {
    method: 'GET',
    headers: buildHeaders()
  })

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED')
  }

  return response.json()
}

export async function approveAgentTask(taskId, payload) {
  const response = await fetch(`${JAVA_API_BASE_URL}/api/agent/tasks/${taskId}/approve`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  })

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED')
  }

  return response.json()
}

export async function agentBrainTurn(payload) {
  const response = await fetch(`${JAVA_API_BASE_URL}/api/agent/brain/turn`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(payload)
  })

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED')
  }

  return response.json()
}

export async function getAgentBrainProgress(sessionId, since = 0) {
  const params = new URLSearchParams({
    sessionId: String(sessionId || ''),
    since: String(since || 0)
  })

  const response = await fetch(`${JAVA_API_BASE_URL}/api/agent/brain/progress?${params.toString()}`, {
    method: 'GET',
    headers: buildHeaders()
  })

  if (response.status === 401) {
    throw new Error('UNAUTHORIZED')
  }

  return response.json()
}
