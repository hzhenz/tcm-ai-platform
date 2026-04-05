export const safeJsonParse = (raw, fallback = null) => {
  try {
    return JSON.parse(raw)
  } catch {
    return fallback
  }
}

export const formatNullable = (value) => (value === null || value === undefined || value === '' ? 'Null' : String(value))

export const normalizeScore = (value) => {
  if (value === null || value === undefined || value === '') return null
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return Math.max(0, Math.min(100, Math.round(num)))
}

export const parseAiJson = (text) => {
  const raw = String(text || '').trim()
  if (!raw) return null

  let body = raw
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim()

  const start = body.indexOf('{')
  const end = body.lastIndexOf('}')
  if (start !== -1 && end !== -1 && end > start) {
    body = body.slice(start, end + 1)
  }

  return safeJsonParse(body, null)
}

export const parseDateLike = (value) => {
  if (!value) return null

  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null
  }

  if (typeof value === 'number') {
    const fromNumber = new Date(value)
    return Number.isFinite(fromNumber.getTime()) ? fromNumber : null
  }

  const text = String(value).trim()
  if (!text) return null

  if (/^\d+$/.test(text)) {
    const fromTimestamp = new Date(Number(text))
    if (Number.isFinite(fromTimestamp.getTime())) return fromTimestamp
  }

  const withT = text.includes(' ') ? text.replace(' ', 'T') : text
  const maybeFull = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(withT) ? `${withT}:00` : withT

  const parsedDirect = new Date(maybeFull)
  if (Number.isFinite(parsedDirect.getTime())) return parsedDirect

  const parsedSlash = new Date(text.replace(/-/g, '/'))
  if (Number.isFinite(parsedSlash.getTime())) return parsedSlash

  return null
}

export const toMonthDayText = (value) => {
  const date = parseDateLike(value)
  if (!date) return String(value || '暂无')
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${month}.${day}`
}
