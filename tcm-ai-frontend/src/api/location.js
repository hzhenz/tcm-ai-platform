const JAVA_API_BASE_URL = (import.meta.env.VITE_JAVA_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')

export async function nearby(lat, lng, radius = 5, type) {
  const params = new URLSearchParams({ lat: String(lat), lng: String(lng), radius: String(radius) })
  if (type) params.append('type', type)
  const response = await fetch(`${JAVA_API_BASE_URL}/api/locations/nearby?${params.toString()}`)
  if (response.status === 401) throw new Error('UNAUTHORIZED')
  return response.json()
}

export async function getById(id) {
  const response = await fetch(`${JAVA_API_BASE_URL}/api/locations/${id}`)
  if (response.status === 401) throw new Error('UNAUTHORIZED')
  return response.json()
}
