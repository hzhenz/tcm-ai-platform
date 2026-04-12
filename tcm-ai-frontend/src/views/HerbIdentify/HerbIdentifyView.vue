<template>
	<div class="herb-page font-chinese text-ancient-dark bg-ancient-light">
		<header class="page-nav-bar fixed top-0 left-0 right-0 bg-ancient-tan text-white text-center py-3 text-lg font-bold shadow-md z-30 flex items-center justify-center gap-4 md:gap-6">
			<span class="page-nav-title whitespace-nowrap">药材智能识别</span>

			<div class="page-nav-items flex items-center gap-3 md:gap-4">
				<button @click="goToAiTongue" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
					<i class="fa-solid fa-face-smile text-base md:text-lg"></i>
					<span class="text-xs mt-0.5 hidden md:inline">AI舌诊</span>
				</button>

				<button @click="goToAiConsult" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
					<i class="fa-solid fa-user-doctor text-base md:text-lg"></i>
					<span class="text-xs mt-0.5 hidden md:inline">AI问诊</span>
				</button>

				<button @click="goToHerbRecog" class="page-nav-item flex flex-col items-center transition-colors duration-200" :class="{ active: currentPage === 'herbRecog' }" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
					<i class="fa-solid fa-leaf text-base md:text-lg"></i>
					<span class="text-xs mt-0.5 hidden md:inline">中药识别</span>
				</button>

				<button @click="goToTcmScience" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
					<i class="fa-solid fa-book-open text-base md:text-lg"></i>
					<span class="text-xs mt-0.5 hidden md:inline">中医科普</span>
				</button>

				<button @click="goToHome" class="page-nav-item flex flex-col items-center transition-colors duration-200" style="color: white;" @mouseover="e => e.currentTarget.style.color = '#E8D8B0'" @mouseout="e => e.currentTarget.style.color = 'white'">
					<i class="fa-solid fa-house text-base md:text-lg"></i>
					<span class="text-xs mt-0.5 hidden md:inline">返回首页</span>
				</button>
			</div>
		</header>

		<main class="container page-grid">
			<section class="workspace-card reveal-up">
				<div class="section-head">
					<div>
						<p class="section-eyebrow">识别工作区</p>
						<h2>上传药材图像并交互查看每个目标</h2>
					</div>
					<div class="runtime-pills">
						<span v-for="pill in runtimePills" :key="pill" class="pill">{{ pill }}</span>
					</div>
				</div>

				<input
					id="herb-upload"
					ref="fileInput"
					type="file"
					accept="image/*"
					class="file-input"
					@change="onFileChange"
				/>

				<div v-if="!hasImage" class="upload-empty">
					<div class="upload-icon">🌿</div>
					<h3>拖拽或选择图片</h3>
					<p>支持 JPG / PNG。若检测器在线，将返回 bbox 与多目标分类。</p>
					<button class="btn primary" @click="triggerFile">上传并分析</button>
				</div>

				<div v-else class="image-shell">
					<div class="image-frame">
						<img ref="previewImg" :src="previewUrl" alt="草药预览" @load="onImageLoad" />

						<button
							v-for="d in detectionsWithBbox"
							:key="d.id"
							class="bbox"
							:class="{ active: selectedIndex === d.rawIndex }"
							:style="bboxStyle(d.bbox)"
							@click="selectDetection(d.rawIndex)"
						>
							<span class="bbox-id">{{ d.rawIndex + 1 }}</span>
						</button>
					</div>

					<div class="workspace-actions">
						<button class="btn ghost" @click="triggerFile">更换图片</button>
						<button class="btn danger" @click="clear">清空结果</button>
					</div>

					<div v-if="orderedHerbFeatures.length" class="detection-tabs">
						<button
							v-for="item in orderedHerbFeatures"
							:key="item.id"
							class="tab-pill"
							:class="{ active: selectedIndex === item.rawIndex }"
							@click="selectDetection(item.rawIndex)"
						>
							<span>{{ item.index }}</span>
							{{ item.name }}
						</button>
					</div>
				</div>
			</section>

			<section class="insight-column">
				<article class="runtime-card reveal-up">
					<div class="section-head compact">
						<div>
							<p class="section-eyebrow">模型运行态</p>
							<h3>融合链路诊断</h3>
						</div>
						<span class="status-dot" :class="detectorStateClass">{{ detectorStateLabel }}</span>
					</div>

					<p class="runtime-summary">{{ runtimeSummary }}</p>

					<div class="meta-grid">
						<div class="meta-item">
							<p>融合模式</p>
							<strong>{{ runtimeModeLabel }}</strong>
						</div>
						<div class="meta-item">
							<p>分类模型</p>
							<strong>{{ runtime.model }}</strong>
						</div>
						<div class="meta-item">
							<p>检测数量</p>
							<strong>{{ runtime.detectionCount }}</strong>
						</div>
						<div class="meta-item">
							<p>置信阈值</p>
							<strong>{{ runtime.detectorConfig?.conf ?? '--' }}</strong>
						</div>
					</div>

					<p v-if="runtime.detectorWeight" class="runtime-path">权重：{{ runtime.detectorWeight }}</p>
					<p v-if="runtime.detectorMessage" class="runtime-warning">{{ runtime.detectorMessage }}</p>
					<p v-if="errorText" class="runtime-error">{{ errorText }}</p>
				</article>

				<article class="result-card reveal-up">
					<div class="section-head compact">
						<div>
							<p class="section-eyebrow">识别结果</p>
							<h3>目标级分类洞察</h3>
						</div>
					</div>

					<div v-if="loading" class="skeleton-list">
						<div v-for="n in 3" :key="n" class="skeleton-item" />
					</div>

					<div v-else-if="orderedHerbFeatures.length" class="result-list">
						<button
							v-for="item in orderedHerbFeatures"
							:key="item.id"
							class="result-item"
							:class="{ active: selectedIndex === item.rawIndex }"
							@click="selectDetection(item.rawIndex)"
						>
							<div class="item-head">
								<div>
									<span class="item-index">#{{ item.index }}</span>
									<strong>{{ item.name }}</strong>
								</div>
								<span v-if="item.isToxic" class="tox-tag">毒性关注</span>
							</div>

							<div class="meter-wrap">
								<p>分类置信度 {{ item.confidenceText }}</p>
								<div class="meter"><span :style="{ width: `${Math.round(item.confidenceRate * 100)}%` }" /></div>
							</div>

							<div class="meter-wrap">
								<p>检测置信度 {{ item.detectorConfidenceText }}</p>
								<div class="meter detector"><span :style="{ width: `${Math.round(item.detectorConfidenceRate * 100)}%` }" /></div>
							</div>

							<div class="mini-meta">
								<span>检测类别：{{ item.detectorLabel }}</span>
								<span>性味：{{ item.property }}</span>
							</div>

							<div class="topk-row">
								<span v-for="(candidate, idx) in item.topk" :key="`${item.id}-${idx}`" class="topk-chip">
									{{ candidate.name }} · {{ formatTopkConfidence(candidate.confidence) }}
								</span>
							</div>
						</button>
					</div>

					<p v-else class="empty-tip">{{ hasImage ? runtimeSummary : '请上传图片以开始识别' }}</p>
				</article>
			</section>
		</main>

		<section class="container detail-market-grid">
			<article class="detail-card reveal-up">
				<div class="section-head compact">
					<div>
						<p class="section-eyebrow">当前选中目标</p>
						<h3>{{ activeDetection?.name || '未选择目标' }}</h3>
					</div>
				</div>
				<div v-if="activeDetection" class="detail-content">
					<div class="detail-line"><span>分类置信度</span><strong>{{ result.confidenceText }}</strong></div>
					<div class="detail-line"><span>性味</span><strong>{{ result.property }}</strong></div>
					<div class="detail-line"><span>归经</span><strong>{{ result.meridian }}</strong></div>
					<div class="detail-line"><span>核心功效</span><strong>{{ result.function }}</strong></div>
					<div class="detail-line"><span>市场价</span><strong>{{ result.marketPrice }} 元/公斤</strong></div>
					<div class="detail-line"><span>长沙均价</span><strong>{{ result.localPrice }} 元/公斤</strong></div>
				</div>
				<p v-else class="empty-tip">上传并识别后，点击目标卡片查看对应中医知识。</p>
			</article>

			<article class="market-card reveal-up">
				<div class="section-head compact">
					<div>
						<p class="section-eyebrow">本地行情</p>
						<h3>长沙诊所/药房价格监测</h3>
					</div>
				</div>

				<div class="table-wrap">
					<table>
						<thead>
							<tr>
								<th>医馆/药房</th>
								<th>区域</th>
								<th>甘草</th>
								<th>当归</th>
								<th>黄芪</th>
								<th>更新时间</th>
							</tr>
						</thead>
						<tbody>
							<tr v-for="(row, idx) in localPrices" :key="idx">
								<td>{{ row.name }}</td>
								<td>{{ row.area }}</td>
								<td :class="{ hot: row.hot }">{{ row.gancao }}</td>
								<td>{{ row.danggui }}</td>
								<td>{{ row.huangqi }}</td>
								<td>{{ row.update }}</td>
							</tr>
						</tbody>
					</table>
				</div>
			</article>
		</section>
	</div>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'

import { useHerbIdentify } from './useHerbIdentify'

const router = useRouter()
const currentPage = ref('herbRecog')

const {
	fileInput,
	previewImg,
	previewUrl,
	loading,
	selectedIndex,
	localPrices,
	errorText,
	result,
	runtime,
	hasImage,
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
} = useHerbIdentify()

const runtimeModeLabel = computed(() => {
	if (runtime.fusionMode === 'detect+classify') return '检测 + 分类融合'
	if (runtime.fusionMode === 'classify-only') return '单图分类回退'
	return '待机中'
})

const detectorStateLabel = computed(() => (runtime.detectorEnabled ? '在线' : '离线'))
const detectorStateClass = computed(() => (runtime.detectorEnabled ? 'online' : 'offline'))

function formatTopkConfidence(value) {
	const confidence = Number(value)
	return Number.isFinite(confidence) ? `${(confidence * 100).toFixed(1)}%` : '--'
}

const goToHome = () => router.push({ name: 'home' })

const goToAiTongue = () => {
	router.push({ name: 'tongue' })
}

const goToAiConsult = () => {
	router.push({ name: 'consultation' })
}

const goToHerbRecog = () => {
	router.push({ name: 'herb' })
}

const goToTcmScience = () => {
	router.push({ name: 'science' })
}
</script>

<style scoped>
.herb-page {
	--bg-main: #f7f2e8;
	--bg-deep: #efe4d2;
	--bg-card: rgba(255, 252, 245, 0.92);
	--stroke: rgba(194, 168, 120, 0.28);
	--text-main: #1c2b26;
	--text-soft: #5f6a66;
	--brand: #1c2b26;
	--brand-strong: #13211d;
	--accent: #c2a878;
	--accent-2: #8a6b32;
	--danger: #cc5134;
	--shadow: 0 16px 40px rgba(28, 43, 38, 0.12);
	min-height: 100vh;
	padding-bottom: 32px;
	background:
		radial-gradient(circle at 100% 0%, rgba(194, 168, 120, 0.18), transparent 36%),
		radial-gradient(circle at 0% 24%, rgba(28, 43, 38, 0.08), transparent 35%),
		linear-gradient(180deg, var(--bg-main), var(--bg-deep));
	color: var(--text-main);
	font-family: 'Noto Serif SC', 'Songti SC', 'STSong', 'Microsoft YaHei', serif;
	padding-top: 64px;
}

.bg-ancient-tan {
	background-color: #1C2B26;
}

.page-nav-item.active {
	color: #E8D8B0 !important;
	filter: drop-shadow(0 0 6px rgba(194, 168, 120, 0.8));
}

.herb-page::before {
	content: '';
	position: fixed;
	inset: 0;
	pointer-events: none;
	opacity: 0.2;
	background-image: linear-gradient(120deg, rgba(194, 168, 120, 0.07) 1px, transparent 1px);
	background-size: 26px 26px;
}

.container {
	width: min(1200px, calc(100% - 2.4rem));
	margin: 0 auto;
}

.header-shell {
	position: sticky;
	top: 0;
	z-index: 20;
	backdrop-filter: blur(10px);
	border-bottom: 1px solid var(--stroke);
	background: rgba(245, 238, 225, 0.74);
}

.header-row {
	display: flex;
	align-items: center;
	justify-content: space-between;
	gap: 16px;
	padding: 18px 0;
}

.kicker {
	margin: 0;
	font-size: 12px;
	letter-spacing: 0.24em;
	color: var(--text-soft);
}

.title {
	margin: 2px 0;
	font-size: clamp(24px, 3.6vw, 36px);
	font-weight: 700;
}

.subtitle {
	margin: 0;
	font-size: 14px;
	color: var(--text-soft);
}

.header-actions {
	display: flex;
	gap: 10px;
	flex-wrap: wrap;
	justify-content: flex-end;
}

.nav-link {
	padding: 10px 16px;
	border-radius: 999px;
	border: 1px solid var(--stroke);
	text-decoration: none;
	color: var(--brand);
	font-size: 13px;
	transition: transform 0.2s ease, background 0.2s ease;
}

.nav-link:hover {
	transform: translateY(-1px);
	background: rgba(128, 66, 29, 0.08);
}

.nav-link.solid {
	background: var(--brand);
	color: #fff;
	border-color: transparent;
}

.page-grid {
	display: grid;
	grid-template-columns: 1.1fr 0.9fr;
	gap: 22px;
	padding-top: 24px;
}

.workspace-card,
.runtime-card,
.result-card,
.detail-card,
.market-card {
	position: relative;
	background: var(--bg-card);
	border: 1px solid var(--stroke);
	border-radius: 20px;
	box-shadow: var(--shadow);
	overflow: hidden;
}

.workspace-card {
	padding: 22px;
}

.section-head {
	display: flex;
	align-items: flex-start;
	justify-content: space-between;
	gap: 12px;
	margin-bottom: 18px;
}

.section-head h2,
.section-head h3 {
	margin: 0;
	font-size: 20px;
}

.section-head.compact h3 {
	font-size: 18px;
}

.section-eyebrow {
	margin: 0 0 3px;
	font-size: 12px;
	letter-spacing: 0.12em;
	text-transform: uppercase;
	color: var(--text-soft);
}

.runtime-pills {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	justify-content: flex-end;
}

.pill {
	padding: 6px 10px;
	border-radius: 999px;
	font-size: 12px;
	background: rgba(128, 66, 29, 0.1);
	color: var(--brand);
	border: 1px solid rgba(128, 66, 29, 0.16);
}

.file-input {
	display: none;
}

.upload-empty {
	min-height: 500px;
	display: grid;
	place-items: center;
	text-align: center;
	padding: 28px 16px;
	border: 2px dashed rgba(128, 66, 29, 0.3);
	border-radius: 18px;
	background: linear-gradient(145deg, rgba(255, 255, 255, 0.7), rgba(236, 225, 199, 0.4));
}

.upload-icon {
	font-size: 54px;
	line-height: 1;
}

.upload-empty h3 {
	margin: 12px 0 6px;
	font-size: 24px;
}

.upload-empty p {
	margin: 0 0 16px;
	max-width: 460px;
	color: var(--text-soft);
}

.btn {
	border: none;
	cursor: pointer;
	padding: 10px 16px;
	border-radius: 12px;
	font-size: 14px;
	font-weight: 600;
	transition: transform 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
}

.btn:hover {
	transform: translateY(-1px);
}

.btn.primary {
	background: linear-gradient(140deg, var(--brand), var(--brand-strong));
	color: #fff;
	box-shadow: 0 8px 20px rgba(28, 43, 38, 0.24);
}

.btn.ghost {
	background: rgba(194, 168, 120, 0.12);
	color: var(--brand);
}

.btn.danger {
	background: rgba(204, 81, 52, 0.12);
	color: var(--danger);
}

.image-shell {
	display: flex;
	flex-direction: column;
	gap: 12px;
}

.image-frame {
	position: relative;
	min-height: 450px;
	border-radius: 16px;
	overflow: hidden;
	background: #fff;
	border: 1px solid rgba(0, 0, 0, 0.05);
}

.image-frame img {
	width: 100%;
	height: 100%;
	min-height: 450px;
	object-fit: contain;
}

.bbox {
	position: absolute;
	border: 2px solid rgba(194, 168, 120, 0.95);
	border-radius: 10px;
	background: rgba(194, 168, 120, 0.1);
	cursor: pointer;
	transition: transform 0.2s ease, border-color 0.2s ease;
}

.bbox:hover {
	transform: scale(1.01);
}

.bbox.active {
	border-color: var(--accent-2);
	background: rgba(28, 43, 38, 0.12);
}

.bbox-id {
	position: absolute;
	top: -12px;
	left: -10px;
	width: 28px;
	height: 28px;
	border-radius: 50%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	font-size: 12px;
	font-weight: 700;
	background: var(--accent-2);
	color: #fff;
}

.workspace-actions {
	display: flex;
	gap: 8px;
}

.detection-tabs {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
}

.tab-pill {
	display: inline-flex;
	gap: 6px;
	align-items: center;
	padding: 8px 12px;
	border-radius: 999px;
	border: 1px solid var(--stroke);
	background: #fff;
	color: var(--text-main);
	cursor: pointer;
	transition: all 0.2s ease;
}

.tab-pill span {
	width: 18px;
	height: 18px;
	border-radius: 50%;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	background: rgba(194, 168, 120, 0.18);
	font-size: 11px;
}

.tab-pill.active {
	border-color: var(--accent-2);
	background: rgba(28, 43, 38, 0.08);
}

.insight-column {
	display: grid;
	gap: 16px;
	grid-template-rows: auto 1fr;
}

.runtime-card,
.result-card,
.detail-card,
.market-card {
	padding: 18px;
}

.status-dot {
	padding: 6px 12px;
	border-radius: 999px;
	font-size: 12px;
	font-weight: 700;
}

.status-dot.online {
	background: rgba(28, 43, 38, 0.12);
	color: var(--accent-2);
}

.status-dot.offline {
	background: rgba(204, 81, 52, 0.14);
	color: var(--danger);
}

.runtime-summary {
	margin: 0;
	font-size: 14px;
	line-height: 1.6;
	color: var(--text-soft);
}

.meta-grid {
	display: grid;
	grid-template-columns: repeat(2, minmax(0, 1fr));
	gap: 10px;
	margin-top: 14px;
}

.meta-item {
	padding: 10px;
	border-radius: 12px;
	background: rgba(255, 255, 255, 0.7);
	border: 1px solid rgba(0, 0, 0, 0.04);
}

.meta-item p {
	margin: 0;
	font-size: 12px;
	color: var(--text-soft);
}

.meta-item strong {
	font-size: 14px;
}

.runtime-path,
.runtime-warning,
.runtime-error {
	margin: 10px 0 0;
	padding: 8px 10px;
	border-radius: 10px;
	font-size: 12px;
	line-height: 1.5;
}

.runtime-path {
	background: rgba(194, 168, 120, 0.12);
}

.runtime-warning {
	background: rgba(194, 168, 120, 0.14);
	color: #6f5a2d;
}

.runtime-error {
	background: rgba(204, 81, 52, 0.14);
	color: #8f2b16;
}

.result-list {
	display: flex;
	flex-direction: column;
	gap: 10px;
}

.result-item {
	border: 1px solid var(--stroke);
	border-radius: 14px;
	padding: 12px;
	text-align: left;
	background: rgba(255, 255, 255, 0.84);
	cursor: pointer;
	transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
	animation: resultReveal 0.4s ease both;
}

.result-item:hover {
	transform: translateY(-2px);
	box-shadow: 0 8px 20px rgba(48, 31, 16, 0.1);
}

.result-item.active {
	border-color: var(--accent-2);
	box-shadow: 0 10px 22px rgba(28, 43, 38, 0.12);
}

.item-head {
	display: flex;
	justify-content: space-between;
	align-items: center;
	gap: 10px;
	margin-bottom: 8px;
}

.item-head strong {
	display: block;
	font-size: 17px;
}

.item-index {
	font-size: 12px;
	color: var(--text-soft);
}

.tox-tag {
	padding: 4px 8px;
	border-radius: 999px;
	font-size: 11px;
	font-weight: 700;
	color: #8f2b16;
	background: rgba(204, 81, 52, 0.12);
}

.meter-wrap {
	margin-bottom: 8px;
}

.meter-wrap p {
	margin: 0 0 4px;
	font-size: 12px;
	color: var(--text-soft);
}

.meter {
	height: 8px;
	border-radius: 999px;
	background: rgba(128, 66, 29, 0.12);
	overflow: hidden;
}

.meter span {
	display: block;
	height: 100%;
	background: linear-gradient(90deg, var(--accent), #ffbc6b);
}

.meter.detector span {
	background: linear-gradient(90deg, var(--accent-2), #4fc89f);
}

.mini-meta {
	display: flex;
	flex-wrap: wrap;
	gap: 8px;
	font-size: 12px;
	color: var(--text-soft);
	margin-bottom: 8px;
}

.topk-row {
	display: flex;
	flex-wrap: wrap;
	gap: 6px;
}

.topk-chip {
	font-size: 11px;
	padding: 4px 8px;
	border-radius: 999px;
	background: rgba(194, 168, 120, 0.1);
	border: 1px solid rgba(194, 168, 120, 0.18);
}

.skeleton-list {
	display: grid;
	gap: 10px;
}

.skeleton-item {
	height: 118px;
	border-radius: 14px;
	background: linear-gradient(90deg, rgba(238, 229, 211, 0.7) 25%, rgba(255, 255, 255, 0.8) 50%, rgba(238, 229, 211, 0.7) 75%);
	background-size: 300% 100%;
	animation: shimmer 1.3s infinite;
}

.detail-market-grid {
	margin-top: 22px;
	display: grid;
	gap: 22px;
	grid-template-columns: 0.75fr 1.25fr;
}

.detail-content {
	display: grid;
	gap: 8px;
}

.detail-line {
	display: flex;
	justify-content: space-between;
	align-items: flex-start;
	gap: 10px;
	padding: 10px;
	border-radius: 10px;
	background: rgba(255, 255, 255, 0.7);
	border: 1px solid rgba(0, 0, 0, 0.04);
}

.detail-line span {
	font-size: 13px;
	color: var(--text-soft);
}

.detail-line strong {
	text-align: right;
	font-size: 14px;
}

.table-wrap {
	overflow-x: auto;
}

table {
	width: 100%;
	border-collapse: collapse;
	font-size: 14px;
}

th,
td {
	padding: 10px 12px;
	border-bottom: 1px solid rgba(0, 0, 0, 0.06);
	white-space: nowrap;
}

th {
	text-align: left;
	font-size: 12px;
	letter-spacing: 0.04em;
	color: var(--text-soft);
	background: rgba(128, 66, 29, 0.06);
}

.hot {
	color: var(--danger);
	font-weight: 700;
}

.empty-tip {
	margin: 0;
	padding: 12px;
	font-size: 14px;
	color: var(--text-soft);
	background: rgba(255, 255, 255, 0.6);
	border-radius: 10px;
}

.reveal-up {
	animation: revealUp 0.55s ease both;
}

@keyframes revealUp {
	from {
		opacity: 0;
		transform: translateY(12px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes resultReveal {
	from {
		opacity: 0;
		transform: translateY(8px);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

@keyframes shimmer {
	0% {
		background-position: 100% 0;
	}
	100% {
		background-position: -100% 0;
	}
}

@media (max-width: 1080px) {
	.page-grid,
	.detail-market-grid {
		grid-template-columns: 1fr;
	}

	.image-frame,
	.image-frame img {
		min-height: 360px;
	}
}

@media (max-width: 760px) {
	.container {
		width: calc(100% - 1.2rem);
	}

	.header-row {
		flex-direction: column;
		align-items: flex-start;
	}

	.header-actions {
		justify-content: flex-start;
	}

	.section-head,
	.section-head.compact {
		flex-direction: column;
	}

	.meta-grid {
		grid-template-columns: 1fr;
	}

	.workspace-actions {
		flex-wrap: wrap;
	}

	.image-frame,
	.image-frame img {
		min-height: 280px;
	}
}
</style>
