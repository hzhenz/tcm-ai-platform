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

						<!-- 无图片时显示上传占位 -->
						<div v-if="!previewUrl" class="upload-placeholder">
							<div class="icon-box">🌿</div>
							<h3>上传药材图片</h3>
							<p>支持 JPG / PNG 格式，多目标识别会返回多个标注</p>
							<label for="upload" @click.prevent="triggerFile" class="primary-btn">选择图片并识别</label>
						</div>

						<!-- 有图片时占满左侧框 -->
						<div v-else class="full-image image-area" ref="imageArea">
							<img :src="previewUrl" alt="preview" ref="previewImg" @load="onImageLoad" />

							<!-- 标注框 -->
							<div v-for="(d, idx) in detections" :key="d.id" class="bbox" :class="{active: selectedIndex===idx}"
								:style="bboxStyle(d.bbox)" @click.stop="selectDetection(idx)">
								<div class="badge">{{ idx+1 }}</div>
							</div>

							<div class="full-image-actions">
								<button class="secondary-btn" @click.prevent="triggerFile">重选图片</button>
								<button class="danger-btn" @click="clear">清除</button>
							</div>
						</div>
				</div>

				<div class="detect-list" v-if="detections.length">
					<h4>检测到 {{ detections.length }} 个目标</h4>
					<ul>
						<li v-for="(d, idx) in detections" :key="d.id" :class="{active: selectedIndex===idx}" @click="selectDetection(idx)">
							<span class="num">{{ idx+1 }}</span>
							<div class="meta">
								<div class="name">{{ d.name }}</div>
								<div class="conf">置信度：{{ (d.confidence*100).toFixed(0) }}%</div>
							</div>
						</li>
					</ul>
				</div>
			</div>

			<div class="right-panel">
				<div class="result-box">
					<h3>识别知识库</h3>
					<div v-if="loading" class="hint">识别中...</div>
					<div v-else>
						<div v-if="detections.length" class="knowledge-list">
							<div v-for="(d, idx) in detections" :key="d.id" :class="['knowledge-item', {active: selectedIndex===idx}]" @click="selectDetection(idx)">
								<div class="num">{{ idx+1 }}</div>
								<div class="content">
									<div class="row top">
										<div class="title">{{ d.name }}</div>
										<div class="tag">置信度 {{ (d.confidence*100).toFixed(0) }}%</div>
									</div>
									<div class="meta"><strong>市场价：</strong>{{ d.marketPrice || '—' }} 元/公斤</div>
									<div class="meta"><strong>性味：</strong>{{ d.property || '—' }}</div>
									<div class="meta"><strong>归经：</strong>{{ d.meridian || '—' }}</div>
									<div class="meta"><strong>功效：</strong>{{ d.function || '—' }}</div>
									<div class="meta"><strong>长沙本地均价：</strong>{{ d.localPrice || '—' }} 元/公斤</div>
								</div>
							</div>
						</div>
						<div v-else class="hint">请上传图片进行识别（示例显示多个识别结果）</div>
					</div>
				</div>
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
import { ref, reactive, computed } from 'vue'

const fileInput = ref(null)
const previewUrl = ref('')
const loading = ref(false)

// 后端识别接口（可在 .env 中配置 VITE_HERB_IDENTIFY_API）
const API_URL = import.meta.env.VITE_HERB_IDENTIFY_API || ''

// 多目标识别结果数组
const detections = ref([])
const selectedIndex = ref(0)

const localPrices = ref([
	{ name: '长沙市中医医院', area: '天心区', gancao: '34元/公斤', danggui: '68元/公斤', huangqi: '55元/公斤', update: '今日 09:20' },
	{ name: '百草堂大药房', area: '岳麓区', gancao: '33元/公斤', danggui: '65元/公斤', huangqi: '52元/公斤', update: '今日 10:10' },
	{ name: '德顺堂中医馆', area: '雨花区', gancao: '31元/公斤', danggui: '62元/公斤', huangqi: '50元/公斤', update: '今日 08:50', hot: true },
])

function triggerFile() { fileInput.value && fileInput.value.click() }

function clear() {
	previewUrl.value && URL.revokeObjectURL(previewUrl.value)
	previewUrl.value = ''
	detections.value = []
	selectedIndex.value = 0
}

function selectDetection(idx) {
	selectedIndex.value = idx
}

const selectedDetection = computed(() => detections.value[selectedIndex.value] || null)

async function onFileChange(e) {
	const file = e.target.files && e.target.files[0]
	if (!file) return
	previewUrl.value && URL.revokeObjectURL(previewUrl.value)
	previewUrl.value = URL.createObjectURL(file)

	loading.value = true
	try {
		let res
		if (API_URL) {
			res = await identifyWithApi(file)
		} else {
			res = await fakeIdentify(file)
		}
		// 兼容后端返回单对象或数组
		if (Array.isArray(res)) detections.value = res
		else if (Array.isArray(res.detections)) detections.value = res.detections
		else detections.value = [res]
		selectedIndex.value = 0
	} catch (err) {
		console.error(err)
	} finally {
		loading.value = false
	}
}

// 调用后端多目标识别接口，返回 detections 数组或包装对象
async function identifyWithApi(file) {
	const form = new FormData()
	form.append('image', file)
	const resp = await fetch(API_URL, { method: 'POST', body: form })
	if (!resp.ok) throw new Error('识别接口返回错误')
	const data = await resp.json()
	return data
}

// 示例：返回多个检测目标，bbox 使用百分比表示
function fakeIdentify(file) {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve([
				{
					id: 'd1', name: '甘草', confidence: 0.96,
					bbox: { left: 8, top: 12, width: 30, height: 28 },
					marketPrice: 32, property: '甘，平', meridian: '心、肺、脾、胃经', function: '益气补中，清热解毒，调和诸药', localPrice: 35,
				},
				{
					id: 'd2', name: '当归', confidence: 0.87,
					bbox: { left: 50, top: 30, width: 36, height: 40 },
					marketPrice: 68, property: '甘，辛，温', meridian: '肝、心、脾经', function: '补血活血，调经止痛', localPrice: 70,
				}
			])
		}, 700)
	})
}

// 辅助：将 bbox 转为行内样式（百分比）
function bboxStyle(bbox) {
	if (!bbox) return {}
	return {
		top: bbox.top + '%',
		left: bbox.left + '%',
		width: bbox.width + '%',
		height: bbox.height + '%',
	}
}

function onImageLoad() {
	// 如果需要可以在这里将像素 bbox 转换为百分比
}

/*
	将模型接入说明（示例）：
	1) 后端API：将文件通过 FormData 上传到后端识别接口，如 `/api/herb/identify`，返回识别标签和置信度与相关信息。
		 示例：
			 const form = new FormData(); form.append('image', file);
			 await fetch('/api/herb/identify', { method: 'POST', body: form })

	2) 浏览器端部署模型：若要在前端直接运行模型，可使用 WebAssembly / ONNX.js / TensorFlow.js
		 - 将训练好的模型导出成支持的格式并在前端加载推理。
		 - 注意性能与体积：大型模型可能需要边缘服务器或模型裁剪/蒸馏。
*/
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
.hero-card{background:#fff;border-radius:12px;padding:20px 28px;margin:20px auto 28px;max-width:1100px;box-shadow:0 6px 18px rgba(56,40,30,0.06)}
.page-title{text-align:center;padding:18px 0 6px;font-size:32px;color:#80421D;position:relative;margin:0}
.page-title::after{content:'';width:70px;height:4px;background:#D9B38C;position:absolute;bottom:-8px;left:50%;transform:translateX(-50%);border-radius:3px}
.desc{text-align:center;color:#666;margin:14px 0 0}
.recognize-section{display:flex;flex-wrap:wrap;gap:30px;margin-bottom:50px;align-items:flex-start}

.left-panel{flex:1;min-width:320px;display:flex;flex-direction:column;gap:18px}
.right-panel{flex:1;min-width:320px}

.image-area{position:relative;background:#fff;padding:12px;border-radius:8px}
.image-area img{display:block;width:100%;height:100%;border-radius:6px;object-fit:cover}

.bbox{position:absolute;border:2px solid rgba(128,66,29,0.9);box-shadow:0 2px 6px rgba(128,66,29,0.12);border-radius:6px;cursor:pointer;overflow:hidden}
.bbox .badge{position:absolute;top:-10px;left:-10px;background:#E65100;color:#fff;width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:700;box-shadow:0 2px 6px rgba(0,0,0,0.12)}
.bbox.active{border-color:#E65100}

.detect-list{background:#fff;border-radius:10px;padding:12px;border:1px solid #F0E6DA;max-height:220px;overflow:auto}
.upload-box{flex:1;min-height:460px;background:#fff;border-radius:12px;padding:18px;transition:.3s;display:flex;flex-direction:column;justify-content:center}
.upload-placeholder{display:flex;flex-direction:column;align-items:center;gap:12px}
.primary-btn{display:inline-block;padding:12px 26px;background:#80421D;color:#fff;border-radius:8px;cursor:pointer}
.primary-btn:hover{background:#66331A}
.full-image{position:relative;flex:1;display:flex;flex-direction:column}
.full-image img{width:100%;height:100%;border-radius:8px}
.full-image-actions{display:flex;gap:10px;justify-content:center;padding:12px 0}
.secondary-btn{background:#D9B38C;border-radius:6px;padding:8px 14px;border:none;cursor:pointer}
.secondary-btn:hover{background:#cbb28f}
.danger-btn{background:#E65100;color:#fff;border-radius:6px;padding:8px 14px;border:none;cursor:pointer}
.danger-btn:hover{opacity:.9}
.knowledge-list{max-height:420px;overflow-y:auto;display:flex;flex-direction:column;gap:10px;padding-right:6px}
.knowledge-item{display:flex;gap:12px;align-items:flex-start;padding:12px;border-radius:8px;background:#fff;border:1px solid #F3E9DA;cursor:pointer}
.knowledge-item.active{background:#FFF6EE;border-color:#F0D7BF;box-shadow:0 2px 6px rgba(224,150,100,0.08)}
.knowledge-item .num{min-width:36px;height:36px;background:#80421D;color:#fff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-weight:700}
.knowledge-item .content{flex:1}
.knowledge-item .top{display:flex;justify-content:space-between;align-items:center}
.knowledge-item .title{font-weight:700;color:#333}
.knowledge-item .tag{font-size:12px;color:#888}
.knowledge-item .meta{font-size:13px;color:#555;margin-top:6px}

/* 微调右侧滚动条外观（仅用于桌面） */
.knowledge-list::-webkit-scrollbar{width:8px}
.knowledge-list::-webkit-scrollbar-thumb{background:#E6CDB5;border-radius:8px}
.detect-list h4{margin:0 0 8px;color:#80421D}
.detect-list ul{list-style:none;padding:0;margin:0}
.detect-list li{display:flex;gap:12px;align-items:center;padding:8px;border-radius:8px;cursor:pointer;transition:background .15s}
.detect-list li:hover{background:#FBF6F1}
.detect-list li.active{background:#FFF6EE;border:1px solid #F0D7BF}
.detect-list .num{background:#80421D;color:#fff;width:30px;height:30px;border-radius:6px;display:inline-flex;align-items:center;justify-content:center;font-weight:700}
.detect-list .meta{display:flex;flex-direction:column}
.detect-list .meta .name{font-weight:600;color:#333}
.detect-list .meta .conf{font-size:12px;color:#888}
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
 