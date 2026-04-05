export const TOKEN_KEY = 'tcm_token'
export const SYNDROME_CACHE_PREFIX = 'tcm_syndrome_cache_'
export const USER_FIRST_SEEN_PREFIX = 'tcm_user_first_seen_'

export const ORGAN_LABELS = {
  heart: '心',
  spleen: '脾',
  lung: '肺',
  kidney: '肾',
  liver: '肝'
}

export const ORGAN_KEYS = ['heart', 'spleen', 'lung', 'kidney', 'liver']

export const createEmptySyndromeSummary = () => ({
  conclusion: 'Null',
  foodAdvice: 'Null',
  routineAdvice: 'Null',
  envAdvice: 'Null',
  organScores: {
    heart: null,
    spleen: null,
    lung: null,
    kidney: null,
    liver: null
  }
})
