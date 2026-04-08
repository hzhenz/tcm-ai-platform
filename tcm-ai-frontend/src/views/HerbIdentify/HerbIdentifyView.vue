<template>
	<header class="header">
		<div class="container nav">
			<div class="logo">🌿 智汇岐黄</div>
			<div class="nav-menu">
				<a href="#">首页</a>
				<a href="#">药材识别</a>
				<a href="#">舌诊AI</a>
				<a href="#">中医科普</a>
			</div>
			<a href="/" class="back-btn">返回首页</a>
		</div>
	</header>

	<div class="container">
		<div class="hero-card">
			<h1 class="page-title">药材智能识别 · 实时价格查询</h1>
			<p class="desc">上传药材图片 → AI自动识别 → 查看全国价格 + 长沙本地医馆实时报价</p>
		</div>

		<div class="recognize-section">
			<div class="left-panel">
				<div class="upload-box">
					<input ref="fileInput" type="file" id="upload" accept="image/*" @change="onFileChange" />

					<div v-if="!previewUrl" class="upload-placeholder">
						<div class="icon-box">🌿</div>
						<h3>上传药材图片</h3>
						<p>支持 JPG / PNG 格式，多目标识别会返回多个标注</p>
						<label for="upload" @click.prevent="triggerFile" class="primary-btn">选择图片并识别</label>
					</div>

					<div v-else class="full-image image-area" ref="imageArea">
						<img :src="previewUrl" alt="preview" ref="previewImg" @load="onImageLoad" />

						<div
							v-for="d in detectionsWithBbox"
							:key="d.id"
							class="bbox"
							:class="{ active: selectedIndex === d.rawIndex }"
							:style="bboxStyle(d.bbox)"
							@click.stop="selectDetection(d.rawIndex)"
						>
							<div class="badge">{{ d.rawIndex + 1 }}</div>
						</div>

						<div class="full-image-actions">
							<button class="secondary-btn" @click.prevent="triggerFile">重选图片</button>
							<button class="danger-btn" @click="clear">清除</button>
						</div>
					</div>
				</div>
			</div>

			<div class="result-box">
				<h3>识别结果列表</h3>
				<div v-if="loading" class="hint">识别中...</div>
				<div v-else-if="orderedHerbFeatures.length" class="ordered-feature-list">
					<div
						v-for="item in orderedHerbFeatures"
						:key="item.id"
						class="feature-card"
						:class="{ active: selectedIndex === item.rawIndex }"
						@click="item.rawIndex >= 0 && selectDetection(item.rawIndex)"
					>
						<div class="feature-head">
							<span class="feature-num">{{ item.index }}</span>
							<span class="feature-name">{{ item.name }}</span>
							<span class="feature-conf">精准度：{{ item.confidenceText || '--' }}</span>
						</div>
						<div class="feature-row"><span>性味：</span>{{ item.property }}</div>
						<div class="feature-row"><span>归经：</span>{{ item.meridian }}</div>
						<div class="feature-row"><span>功效：</span>{{ item.function }}</div>
						<div class="feature-row"><span>市场价：</span>{{ item.marketPrice }} 元/公斤</div>
						<div class="feature-row"><span>长沙均价：</span>{{ item.localPrice }} 元/公斤</div>
					</div>
				</div>
				<div v-else class="hint">{{ previewUrl ? '暂未识别到草药，请更换图片重试' : '请上传图片开始识别' }}</div>
			</div>
		</div>

		<div class="local-price-section">
			<h3 class="section-subtitle">长沙本地诊所/药房 · 实时中药价格</h3>
			<table class="table">
				<tr>
					<th>医馆 / 药房</th>
					<th>所在区域</th>
					<th>甘草价格</th>
					<th>当归价格</th>
					<th>黄芪价格</th>
					<th>更新时间</th>
				</tr>
				<tr v-for="(row, idx) in localPrices" :key="idx">
					<td>{{ row.name }}</td>
					<td>{{ row.area }}</td>
					<td :class="row.hot ? 'hot' : ''">{{ row.gancao }}</td>
					<td>{{ row.danggui }}</td>
					<td>{{ row.huangqi }}</td>
					<td>{{ row.update }}</td>
				</tr>
			</table>
		</div>
	</div>

	<footer class="footer">
		<div class="container">
			<p>© 2026 智汇岐黄 AI中医平台 | 长沙本地医馆实时价格同步更新</p>
		</div>
	</footer>
</template>

<script setup>
import { computed, reactive, ref } from 'vue'
import { identifyHerbByImage } from '@/api/herb'

const fileInput = ref(null)
const previewImg = ref(null)
const previewUrl = ref('')
const loading = ref(false)
const selectedIndex = ref(-1)
const detections = ref([])
const imageSize = reactive({ width: 0, height: 0 })

const result = reactive({
	name: '',
	marketPrice: '--',
	property: '--',
	meridian: '--',
	function: '--',
	localPrice: '--',
	confidenceText: '',
	topk: [],
})

const HERB_PROFILE_MAP = {
	甘草: {
		marketPrice: 32,
		property: '甘，平',
		meridian: '心、肺、脾、胃经',
		function: '益气补中，清热解毒，调和诸药',
		localPrice: 35,
	},
	当归: {
		marketPrice: 68,
		property: '甘、辛，温',
		meridian: '肝、心、脾经',
		function: '补血活血，调经止痛，润燥滑肠',
		localPrice: 66,
	},
	黄芪: {
		marketPrice: 55,
		property: '甘，微温',
		meridian: '脾、肺经',
		function: '补气升阳，固表止汗，利水消肿',
		localPrice: 53,
	},
}

const detectionsWithBbox = computed(() => detections.value
	.map((item, idx) => ({ ...item, rawIndex: idx }))
	.filter((item) => Array.isArray(item.bbox) && item.bbox.length === 4))
const orderedHerbFeatures = computed(() => {
	if (detections.value.length) {
		return detections.value.map((item, idx) => ({
			id: item.id || `det-${idx}`,
			rawIndex: idx,
			index: idx + 1,
			name: item.name || '未知',
			confidenceText: formatConfidence(item.confidence),
			...resolveHerbProfile(item.name),
		}))
	}

	return []
})

const STAT_KEY = 'herbIdentifyCount'

const bumpIdentifyCount = () => {
	const current = parseInt(localStorage.getItem(STAT_KEY) || '0', 10)
	const next = Number.isFinite(current) ? current + 1 : 1
	localStorage.setItem(STAT_KEY, String(next))
}

const localPrices = ref([
	{ name: '长沙市中医医院', area: '天心区', gancao: '34元/公斤', danggui: '68元/公斤', huangqi: '55元/公斤', update: '今日 09:20' },
	{ name: '百草堂大药房', area: '岳麓区', gancao: '33元/公斤', danggui: '65元/公斤', huangqi: '52元/公斤', update: '今日 10:10' },
	{ name: '德顺堂中医馆', area: '雨花区', gancao: '31元/公斤', danggui: '62元/公斤', huangqi: '50元/公斤', update: '今日 08:50', hot: true },
	{ name: '养天和药房', area: '开福区', gancao: '36元/公斤', danggui: '70元/公斤', huangqi: '58元/公斤', update: '今日 09:00' },
	{ name: '桐君阁中医馆', area: '芙蓉区', gancao: '35元/公斤', danggui: '66元/公斤', huangqi: '53元/公斤', update: '今日 11:30' },
])

function triggerFile() {
	fileInput.value && fileInput.value.click()
}

function resetResult() {
	result.name = ''
	result.marketPrice = '--'
	result.property = '--'
	result.meridian = '--'
	result.function = '--'
	result.localPrice = '--'
	result.confidenceText = ''
	result.topk = []
}

function clear() {
	previewUrl.value && URL.revokeObjectURL(previewUrl.value)
	previewUrl.value = ''
	if (fileInput.value) {
		fileInput.value.value = ''
	}
	selectedIndex.value = -1
	detections.value = []
	imageSize.width = 0
	imageSize.height = 0
	resetResult()
}

function onImageLoad() {
	const img = previewImg.value
	if (!img) return
	imageSize.width = img.naturalWidth || 0
	imageSize.height = img.naturalHeight || 0
}

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

function buildDetections(data) {
	if (Array.isArray(data.detections) && data.detections.length) {
		return data.detections.map((item, idx) => ({
			id: `${item?.name || 'det'}-${idx}`,
			name: item?.name || '未知',
			confidence: Number(item?.confidence),
			bbox: Array.isArray(item?.bbox) ? item.bbox.slice(0, 4) : null,
		}))
	}

	if (Array.isArray(data.topk) && data.topk.length) {
		return data.topk.map((item, idx) => ({
			id: `${item?.name || 'topk'}-${idx}`,
			name: item?.name || '未知',
			confidence: Number(item?.confidence),
			bbox: null,
		}))
	}

	if (data.herbName) {
		return [{
			id: `${data.herbName}-0`,
			name: data.herbName,
			confidence: Number(data.confidence),
			bbox: null,
		}]
	}

	return []
}

async function onFileChange(e) {
	const file = e.target.files && e.target.files[0]
	if (!file) return

	previewUrl.value && URL.revokeObjectURL(previewUrl.value)
	previewUrl.value = URL.createObjectURL(file)
	selectedIndex.value = -1
	detections.value = []

	loading.value = true
	try {
		const response = await identifyHerbByImage(file)
		if (response.code !== 200 || !response.data) {
			throw new Error(response.msg || '识别失败')
		}

		applyPrediction(response.data)
		bumpIdentifyCount()
	} catch (err) {
		console.error('识别失败:', err)
		alert(err?.message === 'UNAUTHORIZED' ? '登录状态已过期，请重新登录' : '识别失败，请稍后重试')
		resetResult()
	} finally {
		loading.value = false
	}
}

function applyPrediction(data) {
	const allDetections = buildDetections(data)
	detections.value = allDetections
	if (detections.value.length) {
		selectedIndex.value = 0
		selectDetection(0)
	} else {
		selectedIndex.value = -1
		resetResult()
	}
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
</script>

<style scoped>
*{box-sizing:border-box}
.container{width:90%;max-width:1200px;margin:0 auto}
.header{background:#F5EFE0;box-shadow:0 2px 8px rgba(128,66,29,.1);position:sticky;top:0;z-index:999}
.nav{display:flex;justify-content:space-between;align-items:center;padding:12px 0}
.logo{font-size:26px;font-weight:700;color:#80421D}
.nav-menu{display:flex;gap:30px}
.nav-menu a{font-weight:500;transition:.3s;padding:5px 0;border-bottom:2px solid transparent}
.nav-menu a:hover{color:#80421D;border-color:#D9B38C}
.back-btn{padding:8px 20px;border:2px solid #80421D;color:#80421D;border-radius:30px}
.back-btn:hover{background:#80421D;color:#fff}

.hero-card{background:#fff;border-radius:12px;padding:20px 28px;margin:20px auto 28px;max-width:1100px;box-shadow:0 6px 18px rgba(56,40,30,.06)}
.page-title{text-align:center;padding:18px 0 6px;font-size:32px;color:#80421D;position:relative;margin:0}
.page-title::after{content:'';width:70px;height:4px;background:#D9B38C;position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);border-radius:3px}
.desc{text-align:center;color:#666;margin:14px 0 0}

.recognize-section{display:flex;flex-wrap:wrap;gap:30px;margin-bottom:50px;align-items:stretch}
.left-panel{flex:1 1 0;min-width:360px;display:flex;flex-direction:column}

.upload-box{flex:1;min-height:560px;height:560px;background:#fff;border:2px dashed #D9B38C;border-radius:12px;padding:18px;transition:.3s;display:flex;flex-direction:column;justify-content:center}
.upload-box:hover{border-color:#80421D}
.upload-box input{display:none}

.upload-placeholder{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center}
.icon-box{font-size:50px;color:#80421D}
.primary-btn{display:inline-block;padding:12px 26px;background:#80421D;color:#fff;border-radius:8px;cursor:pointer}
.primary-btn:hover{background:#66331A}

.image-area{position:relative;background:#fff;padding:12px;border-radius:8px;display:flex;flex-direction:column;min-height:420px}
.image-area img{display:block;width:100%;height:100%;max-height:420px;border-radius:8px;object-fit:contain;background:#f8f8f8}
.full-image{position:relative;flex:1;display:flex;flex-direction:column}

.bbox{position:absolute;border:2px solid rgba(128,66,29,.9);box-shadow:0 2px 6px rgba(128,66,29,.12);border-radius:6px;cursor:pointer;overflow:hidden}
.bbox .badge{position:absolute;top:-10px;left:-10px;background:#E65100;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,.12)}
.bbox.active{border-color:#E65100}

.full-image-actions{display:flex;gap:10px;justify-content:center;padding:12px 0}
.secondary-btn{background:#D9B38C;border-radius:6px;padding:8px 14px;border:none;cursor:pointer}
.secondary-btn:hover{background:#cbb28f}
.danger-btn{background:#E65100;color:#fff;border-radius:6px;padding:8px 14px;border:none;cursor:pointer}
.danger-btn:hover{opacity:.9}

.result-box{flex:1 1 0;min-width:360px;height:560px;overflow-y:auto;background:#fff;border-radius:12px;padding:30px;box-shadow:0 3px 10px rgba(0,0,0,.05)}
.result-box h3{color:#80421D;font-size:24px;margin-bottom:10px}
.price-tag{display:inline-block;background:#FFF3E0;color:#E65100;padding:5px 12px;border-radius:20px;font-weight:700;margin:10px 0}
.info-item{margin:8px 0}
.info-item span{color:#80421D;font-weight:700}
.hint{color:#888;margin-top:10px}

.ordered-feature-list{display:flex;flex-direction:column;gap:10px}
.feature-card{border:1px solid #F0E4D7;background:#FFFCF8;border-radius:10px;padding:10px;cursor:pointer;transition:.2s}
.feature-card:hover{border-color:#D9B38C;box-shadow:0 2px 8px rgba(128,66,29,.08)}
.feature-card.active{border-color:#E65100;background:#FFF4E8}
.feature-head{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.feature-num{width:24px;height:24px;border-radius:6px;background:#80421D;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-weight:700;font-size:13px}
.feature-name{font-weight:700;color:#4B2A18;flex:1}
.feature-conf{font-size:12px;color:#888}
.feature-row{font-size:13px;line-height:1.6;color:#5c4d42}
.feature-row span{color:#80421D;font-weight:700}

.local-price-section{background:#fff;border-radius:12px;padding:30px;margin-bottom:60px;box-shadow:0 3px 10px rgba(0,0,0,.05)}
.section-subtitle{font-size:22px;color:#80421D;margin-bottom:20px;padding-left:10px;border-left:4px solid #D9B38C}
.table{width:100%;border-collapse:collapse}
.table th,.table td{padding:12px 15px;text-align:left;border-bottom:1px solid #eee}
.table th{background:#F9F6F0;color:#80421D}
.table tr:hover{background:#fafafa}
.hot{color:#E65100;font-weight:700}

.footer{background:#38281E;color:#F5EFE0;padding:30px 0;text-align:center;margin-top:30px}

@media (max-width:768px){
	.nav-menu{display:none}
	.recognize-section{flex-direction:column}
	.upload-box,.result-box{min-width:100%;height:auto;min-height:unset}
	.table{font-size:14px}
}
</style>
