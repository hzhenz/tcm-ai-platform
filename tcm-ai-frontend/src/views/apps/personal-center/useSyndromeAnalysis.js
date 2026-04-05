import { ref } from 'vue'
import { ORGAN_KEYS, ORGAN_LABELS, SYNDROME_CACHE_PREFIX, createEmptySyndromeSummary } from './constants'
import { formatNullable, normalizeScore, parseAiJson } from './utils'

export const useSyndromeAnalysis = ({ pythonAiBaseUrl, rawTongueData, rawConsultData, getUserIdentity }) => {
  const syndromeSummary = ref(createEmptySyndromeSummary())

  const isOrganMissing = (organKey) => syndromeSummary.value.organScores?.[organKey] === null

  const getRecommendedOrganKey = () => {
    const missing = ORGAN_KEYS.find((key) => isOrganMissing(key))
    if (missing) return missing

    let recommended = 'heart'
    let lowest = Number.POSITIVE_INFINITY

    ORGAN_KEYS.forEach((key) => {
      const score = normalizeScore(syndromeSummary.value.organScores?.[key])
      if (score !== null && score < lowest) {
        lowest = score
        recommended = key
      }
    })

    return recommended
  }

  const applySyndromeSummary = (source = {}) => {
    syndromeSummary.value = {
      conclusion: source.conclusion && String(source.conclusion).trim() ? String(source.conclusion).trim() : 'Null',
      foodAdvice: source.foodAdvice && String(source.foodAdvice).trim() ? String(source.foodAdvice).trim() : 'Null',
      routineAdvice: source.routineAdvice && String(source.routineAdvice).trim() ? String(source.routineAdvice).trim() : 'Null',
      envAdvice: source.envAdvice && String(source.envAdvice).trim() ? String(source.envAdvice).trim() : 'Null',
      organScores: {
        heart: normalizeScore(source?.organScores?.heart),
        spleen: normalizeScore(source?.organScores?.spleen),
        lung: normalizeScore(source?.organScores?.lung),
        kidney: normalizeScore(source?.organScores?.kidney),
        liver: normalizeScore(source?.organScores?.liver)
      }
    }
  }

  const resetSyndromeSummary = () => {
    applySyndromeSummary(createEmptySyndromeSummary())
  }

  const getSyndromeCacheKey = () => `${SYNDROME_CACHE_PREFIX}${getUserIdentity() || 'guest'}`

  const buildSyndromeFingerprint = () => {
    const digest = {
      tongue: rawTongueData.value,
      consult: rawConsultData.value.map((item) => ({
        title: item.title || null,
        createTime: item.createTime || null,
        messages: Array.isArray(item.messages) ? item.messages : []
      }))
    }
    return JSON.stringify(digest)
  }

  const readSyndromeCache = () => {
    try {
      const raw = localStorage.getItem(getSyndromeCacheKey())
      if (!raw) return null
      const parsed = JSON.parse(raw)
      if (!parsed || typeof parsed !== 'object') return null
      return {
        fingerprint: typeof parsed.fingerprint === 'string' ? parsed.fingerprint : '',
        summary: parsed.summary && typeof parsed.summary === 'object' ? parsed.summary : null
      }
    } catch (error) {
      console.warn('Failed to read syndrome cache:', error)
      return null
    }
  }

  const saveSyndromeCache = (fingerprint, summary) => {
    try {
      localStorage.setItem(getSyndromeCacheKey(), JSON.stringify({
        fingerprint,
        summary,
        updatedAt: Date.now()
      }))
    } catch (error) {
      console.warn('Failed to save syndrome cache:', error)
    }
  }

  const hydrateSyndromeFromCache = () => {
    const cached = readSyndromeCache()
    if (cached?.summary) {
      applySyndromeSummary(cached.summary)
      return true
    }
    return false
  }

  const buildAssessPrompt = () => {
    const consultDigest = rawConsultData.value.slice(0, 5).map((item, index) => {
      const userTexts = Array.isArray(item.messages)
        ? item.messages.filter(m => m?.type === 'user' && typeof m?.content === 'string').map(m => m.content.trim()).filter(Boolean)
        : []

      const aiTexts = Array.isArray(item.messages)
        ? item.messages.filter(m => m?.type === 'ai' && typeof m?.content === 'string').map(m => m.content.trim()).filter(Boolean)
        : []

      return {
        index: index + 1,
        title: item.title || null,
        userSymptoms: userTexts.slice(0, 4),
        aiConclusion: aiTexts.length > 0 ? aiTexts[aiTexts.length - 1] : null
      }
    })

    return `你是资深中医辨证专家。请根据用户已有的问诊记录和舌诊记录，输出“综合体质辨证结果”。\n\n规则：\n1) 只允许输出JSON，不要输出任何解释或markdown。\n2) 字段必须完整，缺失数据必须用null（JSON null，不是字符串）。\n3) organScores 每项取 0-100 的数字或 null。\n4) 结论和建议必须是简短中文句子。\n\n输出格式：\n{\n  "conclusion": "string|null",\n  "foodAdvice": "string|null",\n  "routineAdvice": "string|null",\n  "envAdvice": "string|null",\n  "organScores": {\n    "heart": "number|null",\n    "spleen": "number|null",\n    "lung": "number|null",\n    "kidney": "number|null",\n    "liver": "number|null"\n  }\n}\n\n用户数据：\n${JSON.stringify({
      consultCount: rawConsultData.value.length,
      tongueCount: rawTongueData.value.length,
      tongueRecords: rawTongueData.value,
      consultDigest
    }, null, 2)}\n\n请开始输出JSON：`
  }

  const runSyndromeAnalysis = async ({ force = false } = {}) => {
    if (rawConsultData.value.length === 0 && rawTongueData.value.length === 0) {
      resetSyndromeSummary()
      return
    }

    const fingerprint = buildSyndromeFingerprint()
    const cached = readSyndromeCache()
    if (!force && cached?.summary && cached.fingerprint === fingerprint) {
      applySyndromeSummary(cached.summary)
      return
    }

    try {
      const response = await fetch(`${pythonAiBaseUrl}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: buildAssessPrompt(),
          history: []
        })
      })

      const result = await response.json()
      if (result.code !== 200 || !result.data) {
        if (!cached?.summary) {
          resetSyndromeSummary()
        }
        return
      }

      const parsed = parseAiJson(result.data)
      if (!parsed || typeof parsed !== 'object') {
        if (!cached?.summary) {
          resetSyndromeSummary()
        }
        return
      }

      applySyndromeSummary(parsed)
      saveSyndromeCache(fingerprint, syndromeSummary.value)
    } catch (error) {
      console.error('Failed to run syndrome analysis:', error)
      if (!cached?.summary) {
        resetSyndromeSummary()
      }
    }
  }

  const buildOrganAssessmentPrompt = (organKey) => {
    const organLabel = ORGAN_LABELS[organKey] || organKey
    const scores = syndromeSummary.value.organScores
    const knownScores = `心:${formatNullable(scores.heart)}, 脾:${formatNullable(scores.spleen)}, 肺:${formatNullable(scores.lung)}, 肾:${formatNullable(scores.kidney)}, 肝:${formatNullable(scores.liver)}`

    return `请为我做“${organLabel}系统专项问诊评测”。背景信息：我的综合体质结论是“${syndromeSummary.value.conclusion}”，当前五脏指标为 ${knownScores}，其中“${organLabel}”维度为 Null。请你按中医思路先提出 3-5 个关键追问（症状细节、诱因、昼夜节律、伴随表现），再给出初步辨证方向和日常调养建议。`
  }

  return {
    syndromeSummary,
    isOrganMissing,
    getRecommendedOrganKey,
    hydrateSyndromeFromCache,
    runSyndromeAnalysis,
    buildOrganAssessmentPrompt
  }
}
