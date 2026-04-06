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
		<h1 class="page-title">药材智能识别 · 实时价格查询</h1>
		<p class="desc">上传药材图片 → AI自动识别 → 查看全国价格 + 长沙本地医馆实时报价</p>

		<div class="recognize-section">
			<div class="upload-box">
				<div class="icon-box">🌿</div>
				<h3>上传药材图片</h3>
				<p>支持 JPG / PNG 格式</p>
				<input ref="fileInput" type="file" id="upload" accept="image/*" @change="onFileChange" />
				<label for="upload" @click.prevent="triggerFile">选择图片并识别</label>

				<div v-if="previewUrl" class="preview">
					<img :src="previewUrl" alt="preview" />
					<div class="preview-actions">
						<button @click="clear">清除</button>
					</div>
				</div>
			</div>

			<div class="result-box">
				<h3>识别结果：<span v-if="!loading">{{ result.name || '---' }}</span><span v-else>识别中...</span></h3>
				<div v-if="result.name" class="price-tag">当前市场价：{{ result.marketPrice || '--' }} 元/公斤</div>
				<div class="info-item"><span>置信度：</span>{{ result.confidenceText || '—' }}</div>

				<div class="info-item"><span>性味：</span>{{ result.property || '—' }}</div>
				<div class="info-item"><span>归经：</span>{{ result.meridian || '—' }}</div>
				<div class="info-item"><span>功效：</span>{{ result.function || '—' }}</div>
				<div class="info-item"><span>长沙本地均价：</span>{{ result.localPrice || '--' }} 元/公斤</div>
				<div v-if="result.topk.length" class="info-item"><span>Top3 预测：</span>{{ result.topk.join(' / ') }}</div>

				<div v-if="!result.name && !loading" class="hint">请上传图片开始识别</div>
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
import { ref, reactive } from 'vue'
import { identifyHerbByImage } from '@/api/herb'

const fileInput = ref(null)
const previewUrl = ref('')
const loading = ref(false)

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

function clear() {
	previewUrl.value && URL.revokeObjectURL(previewUrl.value)
	previewUrl.value = ''
	result.name = ''
	result.marketPrice = '--'
	result.property = '--'
	result.meridian = '--'
	result.function = '--'
	result.localPrice = '--'
	result.confidenceText = ''
	result.topk = []
}

async function onFileChange(e) {
	const file = e.target.files && e.target.files[0]
	if (!file) return
	previewUrl.value && URL.revokeObjectURL(previewUrl.value)
	previewUrl.value = URL.createObjectURL(file)

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
	} finally {
		loading.value = false
	}
}

function applyPrediction(data) {
	const herbName = data.herbName || '--'
	const profile = HERB_PROFILE_MAP[herbName] || {}
	result.name = herbName
	result.marketPrice = profile.marketPrice ?? '--'
	result.property = profile.property ?? '--'
	result.meridian = profile.meridian ?? '--'
	result.function = profile.function ?? '--'
	result.localPrice = profile.localPrice ?? '--'

	const confidence = Number(data.confidence)
	result.confidenceText = Number.isFinite(confidence) ? `${(confidence * 100).toFixed(2)}%` : '--'
	result.topk = Array.isArray(data.topk)
		? data.topk.map((item) => {
			const score = Number(item?.confidence)
			const percent = Number.isFinite(score) ? `${(score * 100).toFixed(1)}%` : '--'
			return `${item?.name || '未知'}(${percent})`
		})
		: []
}
</script>

<style scoped>
*{box-sizing:border-box}
.container{width:90%;max-width:1200px;margin:0 auto}
.header{background:#F5EFE0;box-shadow:0 2px 8px rgba(128,66,29,0.1);position:sticky;top:0;z-index:999}
.nav{display:flex;justify-content:space-between;align-items:center;padding:12px 0}
.logo{font-size:26px;font-weight:bold;color:#80421D}
.nav-menu{display:flex;gap:30px}
.nav-menu a{font-weight:500;transition:.3s;padding:5px 0;border-bottom:2px solid transparent}
.nav-menu a:hover{color:#80421D;border-color:#D9B38C}
.back-btn{Padding:8px 20px;border:2px solid #80421D;color:#80421D;border-radius:30px}
.back-btn:hover{background:#80421D;color:#fff}
.page-title{text-align:center;padding:40px 0 20px;font-size:32px;color:#80421D;position:relative}
.page-title::after{content:'';width:70px;height:3px;background:#D9B38C;position:absolute;bottom:-10px;left:50%;transform:translateX(-50%);border-radius:2px}
.desc{text-align:center;color:#666;margin-bottom:40px}
.recognize-section{display:flex;flex-wrap:wrap;gap:30px;margin-bottom:50px;align-items:center}
.upload-box{flex:1;min-width:300px;background:#fff;border:2px dashed #D9B38C;border-radius:12px;padding:40px 20px;text-align:center;transition:.3s}
.upload-box:hover{border-color:#80421D}
.upload-box input{display:none}
.upload-box label{display:inline-block;padding:12px 25px;background:#80421D;color:#fff;border-radius:6px;cursor:pointer;margin-top:20px}
.icon-box{font-size:50px;color:#80421D}
.result-box{flex:1;min-width:300px;background:#fff;border-radius:12px;padding:30px;box-shadow:0 3px 10px rgba(0,0,0,0.05)}
.result-box h3{color:#80421D;font-size:24px;margin-bottom:10px}
.price-tag{display:inline-block;background:#FFF3E0;color:#E65100;padding:5px 12px;border-radius:20px;font-weight:bold;margin:10px 0}
.info-item{margin:8px 0}
.info-item span{color:#80421D;font-weight:bold}
.local-price-section{background:#fff;border-radius:12px;padding:30px;margin-bottom:60px;box-shadow:0 3px 10px rgba(0,0,0,0.05)}
.section-subtitle{font-size:22px;color:#80421D;margin-bottom:20px;padding-left:10px;border-left:4px solid #D9B38C}
.table{width:100%;border-collapse:collapse}
.table th,.table td{padding:12px 15px;text-align:left;border-bottom:1px solid #eee}
.table th{background:#F9F6F0;color:#80421D}
.table tr:hover{background:#fafafa}
.hot{color:#E65100;font-weight:bold}
.footer{background:#38281E;color:#F5EFE0;padding:30px 0;text-align:center;margin-top:30px}
.preview img{max-width:100%;margin-top:12px;border-radius:8px}
.preview-actions{margin-top:8px}
.hint{color:#888;margin-top:10px}
@media (max-width:768px){.recognize-section{flex-direction:column}.table{font-size:14px}}
</style>
