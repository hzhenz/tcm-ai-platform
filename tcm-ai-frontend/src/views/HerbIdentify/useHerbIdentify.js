import { computed, reactive, ref } from 'vue'

import { identifyHerbByImage } from '@/api/herb'

import { HERB_PROFILE_MAP, LOCAL_PRICE_ROWS } from './herb-meta'

const STAT_KEY = 'herbIdentifyCount'

function formatConfidence(value) {
	const confidence = Number(value)
	return Number.isFinite(confidence) ? `${(confidence * 100).toFixed(1)}%` : '--'
}

function resolveHerbProfile(herbName) {
	const profile = HERB_PROFILE_MAP[herbName] || {}
	return {
		marketPrice: profile.marketPrice ?? '--',
		property: profile.property ?? '--',
		meridian: profile.meridian ?? '--',
		function: profile.function ?? '--',
		localPrice: profile.localPrice ?? '--',
	}
}

function buildDetections(data) {
	if (Array.isArray(data?.detections) && data.detections.length) {
		return data.detections.map((item, idx) => ({
			id: item?.id || `${item?.name || 'det'}-${idx}`,
			name: item?.name || '未知',
			confidence: Number(item?.confidence),
			bbox: Array.isArray(item?.bbox) ? item.bbox.slice(0, 4) : null,
			isToxic: Boolean(item?.isToxic),
			detectorLabel: item?.detectorLabel || '--',
			detectorConfidence: Number(item?.detectorConfidence),
			topk: Array.isArray(item?.topk) ? item.topk : [],
		}))
	}

	if (Array.isArray(data?.topk) && data.topk.length) {
		return data.topk.map((item, idx) => ({
			id: item?.id || `${item?.name || 'topk'}-${idx}`,
			name: item?.name || '未知',
			confidence: Number(item?.confidence),
			bbox: null,
			isToxic: Boolean(item?.isToxic),
			detectorLabel: '--',
			detectorConfidence: Number.NaN,
			topk: Array.isArray(data.topk) ? data.topk : [],
		}))
	}

	if (data?.herbName) {
		return [{
			id: `${data.herbName}-0`,
			name: data.herbName,
			confidence: Number(data.confidence),
			bbox: null,
			isToxic: Boolean(data.isToxic),
			detectorLabel: '--',
			detectorConfidence: Number.NaN,
			topk: Array.isArray(data.topk) ? data.topk : [],
		}]
	}

	return []
}

export function useHerbIdentify() {
	const fileInput = ref(null)
	const previewImg = ref(null)
	const previewUrl = ref('')
	const loading = ref(false)
	const selectedIndex = ref(-1)
	const detections = ref([])
	const localPrices = ref(LOCAL_PRICE_ROWS)
	const errorText = ref('')

	const imageSize = reactive({ width: 0, height: 0 })
	const runtime = reactive({
		fusionMode: '--',
		detectorEnabled: false,
		detectionCount: 0,
		detectorMessage: '',
		detectorWeight: '',
		detectorConfig: null,
		model: '--',
	})

	const result = reactive({
		name: '',
		marketPrice: '--',
		property: '--',
		meridian: '--',
		function: '--',
		localPrice: '--',
		confidenceText: '',
	})

	const hasImage = computed(() => Boolean(previewUrl.value))
	const hasResult = computed(() => detections.value.length > 0)

	const detectionsWithBbox = computed(() => detections.value
		.map((item, idx) => ({ ...item, rawIndex: idx }))
		.filter((item) => Array.isArray(item.bbox) && item.bbox.length === 4))

	const orderedHerbFeatures = computed(() => {
		if (!detections.value.length) return []

		return detections.value.map((item, idx) => ({
			id: item.id || `det-${idx}`,
			rawIndex: idx,
			index: idx + 1,
			name: item.name || '未知',
			confidenceRate: Number.isFinite(Number(item.confidence)) ? Math.max(0, Math.min(1, Number(item.confidence))) : 0,
			confidenceText: formatConfidence(item.confidence),
			detectorConfidenceRate: Number.isFinite(Number(item.detectorConfidence)) ? Math.max(0, Math.min(1, Number(item.detectorConfidence))) : 0,
			detectorConfidenceText: formatConfidence(item.detectorConfidence),
			topk: Array.isArray(item.topk) ? item.topk.slice(0, 3) : [],
			isToxic: Boolean(item.isToxic),
			detectorLabel: item.detectorLabel || '--',
			...resolveHerbProfile(item.name),
		}))
	})

	const runtimePills = computed(() => {
		const fusionLabel = runtime.fusionMode === 'detect+classify' ? '多目标融合' : '分类回退'
		const detectorLabel = runtime.detectorEnabled ? '检测器在线' : '检测器离线'
		const countLabel = runtime.detectionCount > 0 ? `目标 ${runtime.detectionCount}` : '无目标框'
		return [fusionLabel, detectorLabel, countLabel]
	})

	const runtimeSummary = computed(() => {
		if (!hasImage.value) return '等待上传药材图像'
		if (loading.value) return '正在进行检测与分类融合分析...'
		if (runtime.fusionMode === 'detect+classify') {
			return `已完成多目标识别，共定位 ${runtime.detectionCount} 个目标`
		}
		if (runtime.detectorMessage) {
			return `未启用检测分支：${runtime.detectorMessage}`
		}
		return '当前使用单图分类结果（未返回目标框）'
	})

	const activeDetection = computed(() => {
		if (selectedIndex.value < 0) return null
		return orderedHerbFeatures.value[selectedIndex.value] || null
	})

	const bumpIdentifyCount = () => {
		const current = parseInt(localStorage.getItem(STAT_KEY) || '0', 10)
		const next = Number.isFinite(current) ? current + 1 : 1
		localStorage.setItem(STAT_KEY, String(next))
	}

	function resetResult() {
		result.name = ''
		result.marketPrice = '--'
		result.property = '--'
		result.meridian = '--'
		result.function = '--'
		result.localPrice = '--'
		result.confidenceText = ''
	}

	function resetRuntime() {
		runtime.fusionMode = '--'
		runtime.detectorEnabled = false
		runtime.detectionCount = 0
		runtime.detectorMessage = ''
		runtime.detectorWeight = ''
		runtime.detectorConfig = null
		runtime.model = '--'
	}

	function triggerFile() {
		if (fileInput.value) fileInput.value.click()
	}

	function clear() {
		if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
		previewUrl.value = ''
		if (fileInput.value) fileInput.value.value = ''
		selectedIndex.value = -1
		detections.value = []
		imageSize.width = 0
		imageSize.height = 0
		errorText.value = ''
		resetResult()
		resetRuntime()
	}

	function onImageLoad() {
		const img = previewImg.value
		if (!img) return
		imageSize.width = img.naturalWidth || 0
		imageSize.height = img.naturalHeight || 0
	}

	function applyProfile(herbName, confidence) {
		const profile = resolveHerbProfile(herbName)
		result.name = herbName || '--'
		result.marketPrice = profile.marketPrice
		result.property = profile.property
		result.meridian = profile.meridian
		result.function = profile.function
		result.localPrice = profile.localPrice
		result.confidenceText = formatConfidence(confidence)
	}

	function selectDetection(index) {
		const item = detections.value[index]
		if (!item) return
		selectedIndex.value = index
		applyProfile(item.name, item.confidence)
	}

	function applyRuntimePayload(data) {
		runtime.fusionMode = data?.fusionMode || 'classify-only'
		runtime.detectorEnabled = Boolean(data?.detectorEnabled)
		runtime.detectionCount = Number(data?.detectionCount || 0)
		runtime.detectorMessage = data?.detectorMessage || ''
		runtime.detectorWeight = data?.detectorWeight || ''
		runtime.detectorConfig = data?.detectorConfig || null
		runtime.model = data?.model || data?.classifierModel || '--'
	}

	function applyPrediction(data) {
		applyRuntimePayload(data)
		detections.value = buildDetections(data)

		if (detections.value.length) {
			selectedIndex.value = 0
			selectDetection(0)
			return
		}

		selectedIndex.value = -1
		resetResult()
	}

	function bboxStyle(bbox) {
		if (!Array.isArray(bbox) || bbox.length !== 4) return {}

		const [x1Raw, y1Raw, x2Raw, y2Raw] = bbox.map((value) => Number(value))
		if (![x1Raw, y1Raw, x2Raw, y2Raw].every((value) => Number.isFinite(value))) return {}

		const normalized = Math.max(Math.abs(x1Raw), Math.abs(y1Raw), Math.abs(x2Raw), Math.abs(y2Raw)) <= 1
		let left = x1Raw
		let top = y1Raw
		let width = x2Raw - x1Raw
		let height = y2Raw - y1Raw

		if (!normalized) {
			if (!imageSize.width || !imageSize.height) return {}
			left = (x1Raw / imageSize.width) * 100
			top = (y1Raw / imageSize.height) * 100
			width = ((x2Raw - x1Raw) / imageSize.width) * 100
			height = ((y2Raw - y1Raw) / imageSize.height) * 100
		} else {
			left *= 100
			top *= 100
			width *= 100
			height *= 100
		}

		return {
			left: `${Math.max(left, 0)}%`,
			top: `${Math.max(top, 0)}%`,
			width: `${Math.max(width, 0)}%`,
			height: `${Math.max(height, 0)}%`,
		}
	}

	async function onFileChange(event) {
		const file = event.target.files && event.target.files[0]
		if (!file) return

		if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
		previewUrl.value = URL.createObjectURL(file)
		selectedIndex.value = -1
		detections.value = []
		errorText.value = ''
		resetResult()

		loading.value = true
		try {
			const response = await identifyHerbByImage(file)
			if (response.code !== 200 || !response.data) {
				throw new Error(response.msg || '识别失败')
			}

			applyPrediction(response.data)
			bumpIdentifyCount()
		} catch (error) {
			console.error('识别失败:', error)
			errorText.value = error?.message === 'UNAUTHORIZED'
				? '登录状态已过期，请重新登录'
				: (error?.message || '识别失败，请稍后重试')
			resetResult()
			resetRuntime()
		} finally {
			loading.value = false
		}
	}

	return {
		fileInput,
		previewImg,
		previewUrl,
		loading,
		selectedIndex,
		detections,
		localPrices,
		errorText,
		result,
		runtime,
		hasImage,
		hasResult,
		runtimePills,
		runtimeSummary,
		activeDetection,
		detectionsWithBbox,
		orderedHerbFeatures,
		triggerFile,
		clear,
		onImageLoad,
		onFileChange,
		selectDetection,
		bboxStyle,
	}
}
