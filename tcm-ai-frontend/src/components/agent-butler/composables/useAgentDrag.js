import { ref, computed, onMounted, onUnmounted, watch } from 'vue'

export function useAgentDrag(panelVisible, togglePanel, options = {}) {
  const onPositionChange = typeof options?.onPositionChange === 'function' ? options.onPositionChange : null
  const rootRef = ref(null)
  const isDragging = ref(false)
  const hasMoved = ref(false)
  const activePointerId = ref(null)
  
  // 累积拖拽位移
  const translateX = ref(0)
  const translateY = ref(0)
  
  // 暂存的起始状态
  const startMouseX = ref(0)
  const startMouseY = ref(0)
  const initTransX = ref(0)
  const initTransY = ref(0)
  const baseRect = ref({ left: 0, top: 0, width: 64, height: 64 })

  const rootStyle = computed(() => {
    return {
      transform: `translate3d(${translateX.value}px, ${translateY.value}px, 0)`,
      transition: isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      willChange: 'transform'
    }
  })

  const applyRootTransform = () => {
    const el = rootRef.value || document.querySelector('.agent-butler-root')
    if (!el) {
      return
    }
    el.style.setProperty('transform', `translate3d(${translateX.value}px, ${translateY.value}px, 0)`, 'important')
    el.style.setProperty(
      'transition',
      isDragging.value ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
      'important'
    )
    el.style.setProperty('will-change', 'transform')
  }

  const emitPositionChange = () => {
    if (!onPositionChange) {
      return
    }
    onPositionChange({
      x: translateX.value,
      y: translateY.value,
      dragging: isDragging.value
    })
  }

  function startDrag(e, options = {}) {
    const allowWhenPanelVisible = Boolean(options?.allowWhenPanelVisible)
    if (isDragging.value) return
    if (panelVisible.value && !allowWhenPanelVisible) return
    if (e.button !== undefined && e.button !== 0) return

    isDragging.value = true
    hasMoved.value = false
    activePointerId.value = e.pointerId ?? null

    if (e.cancelable) {
      e.preventDefault()
    }
    
    const evt = e
    startMouseX.value = evt.clientX
    startMouseY.value = evt.clientY
    initTransX.value = translateX.value
    initTransY.value = translateY.value
    
    // 获取组件的基础物理边界，剥离当前的 translate 影响
    const el = rootRef.value || document.querySelector('.agent-butler-root')
    if (el) {
      const rect = el.getBoundingClientRect()
      baseRect.value = {
        left: rect.left - translateX.value,
        top: rect.top - translateY.value,
        width: rect.width,
        height: rect.height
      }
    }
    
    window.addEventListener('pointermove', onDrag, { passive: false })
    window.addEventListener('pointerup', stopDrag)
    window.addEventListener('pointercancel', stopDrag)
  }

  function onDrag(e) {
    if (!isDragging.value) return
    if (activePointerId.value !== null && e.pointerId !== undefined && e.pointerId !== activePointerId.value) return
    const evt = e
    
    const dx = evt.clientX - startMouseX.value
    const dy = evt.clientY - startMouseY.value
    
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      hasMoved.value = true
      if (e.cancelable) e.preventDefault()
    }
    
    if (hasMoved.value) {
      let nx = initTransX.value + dx
      let ny = initTransY.value + dy
      
      // Bounds check 边界碰撞检测
      const w = document.documentElement.clientWidth
      const h = window.innerHeight || document.documentElement.clientHeight
      
      // 左边界: base + nx = 0 => nx = -base
      const minNx = -baseRect.value.left
      // 右边界: base + nx + width = w => nx = w - width - base
      const maxNx = w - baseRect.value.width - baseRect.value.left
      
      // 上边界: base + ny = 0 => ny = -base
      const minNy = -baseRect.value.top
      // 下边界: base + ny + height = h => ny = h - height - base
      const maxNy = h - baseRect.value.height - baseRect.value.top
      
      nx = Math.max(minNx, Math.min(nx, maxNx))
      ny = Math.max(minNy, Math.min(ny, maxNy))
      
      translateX.value = nx
      translateY.value = ny
      applyRootTransform()
      emitPositionChange()
    }
  }

  function stopDrag() {
    if (!isDragging.value) return
    isDragging.value = false
    activePointerId.value = null
    applyRootTransform()
    emitPositionChange()
    
    window.removeEventListener('pointermove', onDrag)
    window.removeEventListener('pointerup', stopDrag)
    window.removeEventListener('pointercancel', stopDrag)
  }

  function handleClick(e) {
    if (hasMoved.value) {
      e.stopPropagation()
      e.preventDefault()
      return
    }
    togglePanel()
  }

  const checkBounds = () => {
    // 窗口缩放时重置位置，防止元素被挤出屏幕
    translateX.value = 0
    translateY.value = 0
    emitPositionChange()
  }

  onMounted(() => {
    applyRootTransform()
    emitPositionChange()
    window.addEventListener('resize', checkBounds)
  })

  watch([translateX, translateY, isDragging], () => {
    applyRootTransform()
  })

  onUnmounted(() => {
    window.removeEventListener('resize', checkBounds)
    stopDrag()
  })

  return {
    rootRef,
    rootStyle,
    startDrag,
    handleClick
  }
}
