import { computed, ref } from 'vue'
import { USER_FIRST_SEEN_PREFIX } from './constants'
import { parseDateLike } from './utils'

export const useProfileMeta = () => {
  const displayName = ref('访客')
  const cultivationDaysText = ref('修行中')
  const userIdentity = ref('guest')

  const avatarUrl = computed(() => {
    const name = String(displayName.value || '').trim()
    const initial = name ? name.charAt(0) : 'U'
    return `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initial)}&backgroundColor=3B6E5A`
  })

  const loadCurrentUser = () => {
    try {
      const rawUser = localStorage.getItem('tcm_user')
      if (!rawUser) return

      const parsed = JSON.parse(rawUser)
      if (parsed?.username) {
        displayName.value = parsed.username
      }

      userIdentity.value = String(parsed?.userId || parsed?.username || 'guest')
      const firstSeenKey = `${USER_FIRST_SEEN_PREFIX}${userIdentity.value}`

      let baseDate = parseDateLike(parsed?.createTime)
      if (!baseDate) {
        const seenRaw = localStorage.getItem(firstSeenKey)
        baseDate = parseDateLike(seenRaw)
        if (!baseDate) {
          baseDate = new Date()
          localStorage.setItem(firstSeenKey, baseDate.toISOString())
        }
      }

      const today = new Date()
      const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
      const baseStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate()).getTime()
      const days = Math.max(1, Math.floor((todayStart - baseStart) / (24 * 60 * 60 * 1000)) + 1)
      cultivationDaysText.value = `修行 ${days} 天`
    } catch (error) {
      console.error('Failed to parse tcm_user:', error)
      cultivationDaysText.value = '修行中'
    }
  }

  const getUserIdentity = () => userIdentity.value || 'guest'

  return {
    displayName,
    cultivationDaysText,
    avatarUrl,
    loadCurrentUser,
    getUserIdentity
  }
}
