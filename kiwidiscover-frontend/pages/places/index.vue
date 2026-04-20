<script setup lang="ts">
import { usePlaces } from '~/composables/usePlaces'
import { usePlaceStore } from '~/stores/place'

const route = useRoute()
const store = usePlaceStore()
const { places, regions, loading, hasMore, fetchPlaces, fetchRegions, loadMore } = usePlaces()

// 初始化区域列表
await fetchRegions()

// 从 URL 读取筛选参数
onMounted(() => {
  const q = route.query
  if (q.region) store.setFilter('region', q.region)
  if (q.price) store.setFilter('price', q.price)
  if (q.ageMin) store.setFilter('ageMin', Number(q.ageMin))
})

// 监听筛选变化，重新请求
watch(() => store.filters, () => {
  navigateTo({ query: { ...route.query, ...store.toQuery(), page: 1 } }, { replace: true })
  fetchPlaces({ ...store.filters, page: 1 })
}, { deep: true })

// 初始加载
await fetchPlaces({ ...store.filters, page: 1 })

// 无限滚动
const sentinel = ref<HTMLElement>()
const { stop } = useIntersectionObserver(sentinel, ([{ isIntersecting }]) => {
  if (isIntersecting && hasMore.value && !loading.value) {
    loadMore(store.filters)
  }
})

// 价格选项
const priceOptions = [
  { value: '', label: 'Any Price' },
  { value: 'free', label: '🆓 Free' },
  { value: 'low', label: '$ Budget' },
  { value: 'medium', label: '$$ Moderate' },
  { value: 'high', label: '$$$ Premium' },
]

// 筛选面板
const showFilter = ref(false)
</script>

<template>
  <div class="min-h-screen bg-gray-50 pb-24">
    <!-- 顶部栏 -->
    <header class="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div class="flex items-center justify-between px-4 py-3">
        <NuxtLink to="/" class="text-orange font-bold text-lg">←</NuxtLink>
        <h1 class="font-bold text-lg">All Places</h1>
        <button @click="showFilter = !showFilter" class="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
          ⚙️
        </button>
      </div>

      <!-- 筛选栏 -->
      <div v-if="showFilter" class="px-4 pb-4 space-y-3 animate-fade-in">
        <!-- 区域 -->
        <div class="flex gap-2 overflow-x-auto scrollbar-hide">
          <button class="chip" :class="{ 'chip-active': !store.filters.region }"
            @click="store.setFilter('region', '')">All</button>
          <button v-for="r in regions" :key="r" class="chip whitespace-nowrap"
            :class="{ 'chip-active': store.filters.region === r }"
            @click="store.setFilter('region', r)">{{ r }}</button>
        </div>
        <!-- 价格 -->
        <div class="flex gap-2 overflow-x-auto scrollbar-hide">
          <button v-for="p in priceOptions" :key="p.value" class="chip whitespace-nowrap"
            :class="{ 'chip-active': store.filters.price === p.value }"
            @click="store.setFilter('price', p.value)">{{ p.label }}</button>
        </div>
      </div>
    </header>

    <!-- 地图切换 -->
    <div class="px-4 pt-4 flex gap-2">
      <button class="chip flex-1 justify-center"
        :class="{ 'chip-active': !store.showMap }"
        @click="store.toggleMap()">📋 List</button>
      <button class="chip flex-1 justify-center"
        :class="{ 'chip-active': store.showMap }"
        @click="store.toggleMap()">🗺️ Map</button>
    </div>

    <!-- 地图视图 -->
    <div v-if="store.showMap" class="px-4 pt-4">
      <MapWidget :places="places" class="h-[60vh]" />
    </div>

    <!-- 列表视图 -->
    <div v-else class="px-4 pt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      <PlaceCard v-for="place in places" :key="place.id" :place="place" />
    </div>

    <!-- 无限滚动哨兵 -->
    <div ref="sentinel" class="py-8 text-center text-sm text-gray-400">
      <span v-if="loading">Loading...</span>
      <span v-else-if="!hasMore && places.length">— End of results —</span>
      <span v-else-if="!places.length">No places found. Try adjusting filters.</span>
    </div>
  </div>
</template>
