<script setup>
import { onMounted } from 'vue'

const STAT_KEY = 'mapVisitCount'

const bumpVisitCount = () => {
	const current = parseInt(localStorage.getItem(STAT_KEY) || '0', 10)
	const next = Number.isFinite(current) ? current + 1 : 1
	localStorage.setItem(STAT_KEY, String(next))
}

onMounted(() => {
	bumpVisitCount()
})
</script>

<template>

地图
</template>

<style lang="css" scoped>

</style>
