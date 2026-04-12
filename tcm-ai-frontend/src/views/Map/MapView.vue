<script setup>
import { ref, onMounted, watch } from 'vue'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
import iconUrl from 'leaflet/dist/images/marker-icon.png'
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'
import { nearby as apiNearby } from '@/api/location'
const JAVA_API_BASE_URL = (import.meta.env.VITE_JAVA_API_BASE_URL || 'http://localhost:8080').replace(/\/$/, '')
import { toDataURL } from 'qrcode'

// 修复 Vite 下 Leaflet 默认图标路径问题
L.Icon.Default.mergeOptions({
	iconRetinaUrl,
	iconUrl,
	shadowUrl
})

const map = ref(null)
const userLat = ref(null)
const userLng = ref(null)
const markersLayer = ref(null)
const routeLayer = ref(null)
const userMarker = ref(null)
const qrVisible = ref(false)
const qrDataUrl = ref('')
const lastApiUrl = ref('')
const lastApiResp = ref(null)
const apiError = ref('')
const nearbyCount = ref(0)

// filter controls
const selectedType = ref('中医馆')
const radius = ref(5)

const colors = {
	'中医馆': '#d9534f',
	'药房': '#5bc0de',
	'医院': '#5cb85c',
	'药店': '#f0ad4e'
}

function createDivIcon(color, highlighted = false) {
	const size = highlighted ? 22 : 14
	const boxShadow = highlighted ? '0 0 6px rgba(0,0,0,0.45)' : '0 0 2px rgba(0,0,0,0.3)'
	const border = highlighted ? '3px solid white' : '2px solid white'
	return L.divIcon({
		className: '',
		html: `<div style="background:${color};width:${size}px;height:${size}px;border-radius:50%;border:${border};box-shadow:${boxShadow}"></div>`,
		iconSize: [size + 6, size + 6],
		iconAnchor: [Math.floor((size + 6) / 2), Math.floor((size + 6) / 2)]
	})
}

function createUserIcon() {
	// 简单的红色定位针 SVG，底部为尖形锚点
	const svg = encodeURIComponent(`
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 36" width="28" height="42">
			<path d="M12 0C7.03 0 3 4.03 3 9c0 7.5 9 18 9 18s9-10.5 9-18c0-4.97-4.03-9-9-9z" fill="#e53935" stroke="#b71c1c" stroke-width="0.5"/>
			<circle cx="12" cy="9" r="4" fill="white"/>
		</svg>
	`)
	const html = `<div style="line-height:0"><img src="data:image/svg+xml;utf8,${svg}" style="display:block;width:28px;height:42px;transform:translateY(-6px)"/></div>`
	return L.divIcon({ html, className: '', iconSize: [28, 42], iconAnchor: [14, 42] })
}

function isHighlightedType(locType) {
	const sel = selectedType.value
	if (!sel || sel === '全部') return false
	if (sel === '药店/药房') return locType === '药店' || locType === '药房'
	return locType === sel
}

function escapeHtml(str = '') {
	return String(str)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;')
}

onMounted(() => {
		map.value = L.map('map').setView([39.9, 116.39], 12)

		// 将默认的放大/缩小控件移动到右上，避免与左上角的类型选择重叠
		try {
			if (map.value && map.value.zoomControl && map.value.zoomControl.setPosition) {
				map.value.zoomControl.setPosition('topright')
			} else {
				L.control.zoom({ position: 'topright' }).addTo(map.value)
			}
		} catch (e) {
			console.warn('无法设置缩放控件位置', e)
		}
	L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
		maxZoom: 19,
		attribution: '© OpenStreetMap'
	}).addTo(map.value)

	markersLayer.value = L.layerGroup().addTo(map.value)
	routeLayer.value = L.layerGroup().addTo(map.value)

	// 目前不展示导航相关按钮，弹窗仅显示地点信息

	// 获取定位并拉取附近地点
	if (navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(async (pos) => {
			userLat.value = pos.coords.latitude
			userLng.value = pos.coords.longitude
			if (userMarker.value) {
				userMarker.value.setLatLng([userLat.value, userLng.value])
			} else {
				userMarker.value = L.marker([userLat.value, userLng.value], { icon: createUserIcon(), zIndexOffset: 999 }).addTo(map.value).bindPopup('您在这里')
			}
			map.value.setView([userLat.value, userLng.value], 14)
			await loadNearby()
		}, async () => {
			// 定位失败，使用默认中心
			userLat.value = 39.9
			userLng.value = 116.39
			if (userMarker.value) {
				userMarker.value.setLatLng([userLat.value, userLng.value])
			} else {
				userMarker.value = L.marker([userLat.value, userLng.value], { icon: createUserIcon(), zIndexOffset: 999 }).addTo(map.value).bindPopup('您在这里')
			}
			map.value.setView([userLat.value, userLng.value], 14)
			await loadNearby()
		})
	} else {
		userLat.value = 39.9
		userLng.value = 116.39
		if (userMarker.value) {
			userMarker.value.setLatLng([userLat.value, userLng.value])
		} else {
			userMarker.value = L.marker([userLat.value, userLng.value], { icon: createUserIcon(), zIndexOffset: 999 }).addTo(map.value).bindPopup('您在这里')
		}
		map.value.setView([userLat.value, userLng.value], 14)
		loadNearby()
	}
})

async function loadNearby() {
	try {
		// 调试日志：当前筛选与位置
		console.debug('[Map] loadNearby called', { selectedType: selectedType.value, radius: radius.value, lat: userLat.value, lng: userLng.value })
		// 请求根据筛选条件的地点（合并药房/药店为一种选择）
		const apiTypeParam = (!selectedType.value || selectedType.value === '全部' || selectedType.value === '药店/药房') ? undefined : selectedType.value
		apiError.value = ''
		lastApiUrl.value = `${JAVA_API_BASE_URL}/api/locations/nearby?lat=${userLat.value}&lng=${userLng.value}&radius=${radius.value}${apiTypeParam ? `&type=${encodeURIComponent(apiTypeParam)}` : ''}`
		const resp = await apiNearby(userLat.value, userLng.value, radius.value, apiTypeParam)
		console.debug('[Map] apiNearby response', resp)
		const data = (resp && resp.data) ? resp.data : (resp || [])
		if (!data || (Array.isArray(data) && data.length === 0)) {
			// 如果后端返回空数组，记录响应以方便调试
			console.warn('[Map] apiNearby returned no data')
		}
		console.debug('[Map] nearby count', data ? data.length : 0)
		nearbyCount.value = data ? data.length : 0
		lastApiUrl.value = `${JAVA_API_BASE_URL}/api/locations/nearby?lat=${userLat.value}&lng=${userLng.value}&radius=${radius.value}${apiTypeParam ? `&type=${encodeURIComponent(apiTypeParam)}` : ''}`
		lastApiResp.value = data
		markersLayer.value.clearLayers()
		data.forEach((loc) => {
			const color = colors[loc.type] || '#007bff'
			const highlighted = isHighlightedType(loc.type)
			const marker = L.marker([loc.latitude, loc.longitude], { icon: createDivIcon(color, highlighted), title: loc.name }).addTo(markersLayer.value)
			if (!highlighted && selectedType.value && selectedType.value !== '全部') {
				marker.setOpacity(0.45)
			}

			// 点击标记：打开弹窗、居中并绘制路线（更直观的触发导航）
			marker.on('click', async () => {
				console.debug('[Map] marker clicked', loc)
				try { marker.openPopup() } catch (e) {}
				map.value.setView([loc.latitude, loc.longitude], 16)
				if (userLat.value && userLng.value) {
					console.debug('[Map] calling drawRoute from user to loc')
					await drawRoute(userLat.value, userLng.value, loc.latitude, loc.longitude)
				} else {
					console.warn('[Map] user position unknown, cannot draw route')
				}
			})

			marker.bindTooltip(`${loc.name}`)

			const popupHtml = `
				<div style="min-width:220px">
					<strong>${escapeHtml(loc.name)}</strong> ${loc.distance ? (' - ' + loc.distance + ' km') : ''}<br/>
					${escapeHtml(loc.address || '')}<br/>
					${escapeHtml(loc.phone || '')}<br/>
					${escapeHtml(loc.openingHours || '')}<br/>
					<div style="margin-top:8px">
						<button class="btn-route" style="margin-right:6px">在地图上显示路线</button>
						<button class="btn-open" style="margin-right:6px">在高德打开</button>
						<button class="btn-qr">二维码到手机</button>
					</div>
				</div>
			`
			marker.bindPopup(popupHtml)
			marker.on('popupopen', (e) => {
				const el = e.popup.getElement()
				if (!el) return
				const btnRoute = el.querySelector('.btn-route')
				const btnOpen = el.querySelector('.btn-open')
				const btnQr = el.querySelector('.btn-qr')
				if (btnRoute && !btnRoute.dataset._navAttached) {
					btnRoute.addEventListener('click', async () => {
						console.debug('[Map] popup route button clicked', loc)
						if (!userLat.value || !userLng.value) return
						await drawRoute(userLat.value, userLng.value, loc.latitude, loc.longitude)
					})
					btnRoute.dataset._navAttached = '1'
				}
				if (btnOpen && !btnOpen.dataset._openAttached) {
					btnOpen.addEventListener('click', () => {
						openExternalMap(loc.latitude, loc.longitude, loc.name)
					})
					btnOpen.dataset._openAttached = '1'
				}
				if (btnQr && !btnQr.dataset._qrAttached) {
					btnQr.addEventListener('click', async () => {
						try {
							const url = buildAmapUrl(loc.latitude, loc.longitude, loc.name)
							qrDataUrl.value = await toDataURL(url)
							qrVisible.value = true
						} catch (err) {
							console.error('生成二维码失败', err)
						}
					})
					btnQr.dataset._qrAttached = '1'
				}
			})
		})
	} catch (err) {
		console.error('加载附近地点失败', err)
		apiError.value = err && err.message ? err.message : String(err)
	}
}

function onFilter() {
	if (!userLat.value || !userLng.value) return
	loadNearby()
}

function buildAmapUrl(lat, lng, name) {
	// AMap URI（经度,纬度）格式
	const from = `${userLng.value},${userLat.value},我的位置`
	const to = `${lng},${lat},${encodeURIComponent(name)}`
	return `https://uri.amap.com/route/plan?from=${from}&to=${to}&policy=0&src=web.tcm`
}

function buildGoogleUrl(lat, lng) {
	return `https://www.google.com/maps/dir/?api=1&origin=${userLat.value},${userLng.value}&destination=${lat},${lng}`
}

function openExternalMap(lat, lng, name) {
	// 先尝试高德，用户可选择在新标签页中打开
	const amap = buildAmapUrl(lat, lng, name)
	window.open(amap, '_blank')
}

async function drawRoute(fromLat, fromLng, toLat, toLng) {
	routeLayer.value.clearLayers()
	// 优先请求后端（高德路由代理）；若后端未返回则回退至 OSRM 公共服务；若都失败则绘制直线
	try {
		const backendUrl = `${JAVA_API_BASE_URL}/api/route?fromLat=${fromLat}&fromLng=${fromLng}&toLat=${toLat}&toLng=${toLng}`
		const resp = await fetch(backendUrl)
		const j = await resp.json()
		if (j && j.data) {
			const geom = j.data
			if (geom) {
				const g = L.geoJSON(geom, { style: { color: '#3388ff', weight: 4 } }).addTo(routeLayer.value)
				map.value.fitBounds(g.getBounds(), { padding: [40, 40] })
				return
			}
		}
	} catch (err) {
		console.warn('后端路由请求失败，回退到 OSRM', err)
	}

	// 回退 OSRM
	try {
		const url = `https://router.project-osrm.org/route/v1/driving/${fromLng},${fromLat};${toLng},${toLat}?overview=full&geometries=geojson`
		const r = await fetch(url)
		const j = await r.json()
		if (j && j.routes && j.routes.length) {
			const geom = j.routes[0].geometry
			const g = L.geoJSON(geom, { style: { color: '#3388ff', weight: 4 } }).addTo(routeLayer.value)
			map.value.fitBounds(g.getBounds(), { padding: [40, 40] })
			return
		}
	} catch (err) {
		console.warn('OSRM 请求失败，使用直线替代', err)
	}

	const line = L.polyline([[fromLat, fromLng], [toLat, toLng]], { color: '#3388ff', dashArray: '6' }).addTo(routeLayer.value)
	map.value.fitBounds(line.getBounds(), { padding: [40, 40] })
}

function closeQR() {
	qrVisible.value = false
	qrDataUrl.value = ''
}

// 自动在用户切换筛选类型或半径时刷新附近地点
watch(selectedType, (nv, ov) => {
	if (!userLat.value || !userLng.value) {
		console.debug('[Map] selectedType changed but user pos unknown, skip loadNearby')
		return
	}
	loadNearby()
})

watch(radius, (nv, ov) => {
	if (!userLat.value || !userLng.value) {
		console.debug('[Map] radius changed but user pos unknown, skip loadNearby')
		return
	}
	loadNearby()
})
</script>

<template>
	<div class="map-controls">
		<label>
			类型:
			<select v-model="selectedType">
				<option value="中医馆">中医馆</option>
				<option value="医院">医院</option>
				<option value="药店/药房">药店/药房</option>
				<option value="全部">全部</option>
			</select>
		</label>
		<label style="margin-left:8px">
			半径(km):
			<input type="number" v-model.number="radius" min="0.5" max="50" step="0.5" style="width:70px;margin-left:6px" />
		</label>
		<button style="margin-left:8px" @click="onFilter">刷新</button>
		<span style="margin-left:12px;color:#666;font-size:13px">找到: {{ nearbyCount }} 个</span>
		<span style="margin-left:12px;color:#666;font-size:13px">位置: {{ userLat && userLng ? (userLat.toFixed(6) + ',' + userLng.toFixed(6)) : '未知' }}</span>
		<div style="margin-left:12px;color:#a00;font-size:12px">{{ apiError }}</div>
		<div style="margin-left:12px;color:#666;font-size:12px">API: <small style="display:block;max-width:380px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">{{ lastApiUrl }}</small></div>
	</div>

	<div id="map" style="height: calc(100vh - 80px); width: 100%;"></div>

	<div v-if="qrVisible" class="qr-modal">
		<div class="qr-card">
			<img :src="qrDataUrl" alt="qr" />
			<div style="margin-top:12px">
				<button @click="closeQR">关闭</button>
			</div>
		</div>
	</div>
</template>

<style scoped>
.qr-modal { position: fixed; left: 0; top: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 9999; }
.qr-card { background: white; padding: 16px; border-radius: 8px; display: flex; flex-direction: column; align-items: center; }
.qr-card img { width: 220px; height: 220px; }
.map-controls { position: absolute; top: 12px; left: 12px; z-index: 999; background: rgba(255,255,255,0.95); padding: 8px 10px; border-radius: 6px; box-shadow: 0 2px 8px rgba(0,0,0,0.15); }
</style>

