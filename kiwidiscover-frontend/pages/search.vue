<script setup lang="ts">
import { usePlaces } from '~/composables/usePlaces'

const router = useRouter()
const route = useRoute()
const { searchPlaces } = usePlaces()

const query = ref((route.query.q as string) || '')
const results = ref<any[]>([])
const suggestions = ref<string[]>([])
const loading = ref(false)
const showResults = computed(() => query.value.trim().length > 0)

// 热门搜索
const hotSearches = ['Playground', 'Indoor play', 'Museum', 'Swimming pool', 'Animal farm', 'Trampoline']

// 搜索历史
const history = useCookie<string[]>('search_history', { maxAge: 60 * 60 * 24 * 30, default: () => [] })

// 搜索防抖
let timer: ReturnType<typeof setTimeout>
const doSearch = async (q: string) => {
  if (q.trim().length < 2) {
    results.value = []
    return
  }
  loading.value = true
  try {
    const res = await searchPlaces(q)
    results.value = res.data
    // 保存历史
    if (q.trim() && !history.value.includes(q.trim())) {
      history.value.unshift(q.trim())
      history.value = history.value.slice(0, 10)
    }
  } finally {
    loading.value = false
  }
}

watch(query, (val) => {
  clearTimeout(timer)
  timer = setTimeout(() => doSearch(val), 300)
})

const clearHistory = () => { history.value = [] }

const goSearch = (q: string) => {
  query.value = q
  doSearch(q)
}

const inputRef = ref<HTMLInputElement>()
onMounted(() => inputRef.value?.focus())
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- 搜索栏 -->
    <header class="sticky top-0 z-30 bg-white border-b border-gray-100 px-4 py-3">
      <div class="flex items-center gap-3">
        <NuxtLink to="/" class="text-gray-400">←</NuxtLink>
        <input
          ref="inputRef"
          v-model="query"
          type="search"
          placeholder="Search places, activities..."
          class="flex-1 bg-gray-100 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange/20"
          enterkeyhint="search"
        />
        <button v-if="query" @click="query = ''; results = []" class="text-gray-400">✕</button>
      </div>
    </header>

    <!-- 搜索结果 -->
    <div v-if="showResults" class="px-4 pt-4">
      <p v-if="loading" class="text-center text-sm text-gray-400 py-8">Searching...</p>
      <div v-else-if="results.length" class="grid grid-cols-2 gap-4">
        <PlaceCard v-for="place in results" :key="place.id" :place="place" />
      </div>
      <div v-else class="text-center py-16">
        <p class="text-4xl mb-3">🔍</p>
        <p class="text-gray-400">No results for "{{ query }}"</p>
      </div>
    </div>

    <!-- 默认页：热门 + 历史 -->
    <div v-else class="px-6 pt-6">
      <!-- 搜索历史 -->
      <div v-if="history.length" class="mb-8">
        <div class="flex items-center justify-between mb-3">
          <h2 class="font-bold text-gray-700">Recent Searches</h2>
          <button @click="clearHistory" class="text-sm text-gray-400">Clear</button>
        </div>
        <div class="flex flex-wrap gap-2">
          <button v-for="h in history" :key="h"
            class="chip" @click="goSearch(h)">{{ h }}</button>
        </div>
      </div>

      <!-- 热门搜索 -->
      <div>
        <h2 class="font-bold text-gray-700 mb-3">🔥 Popular Searches</h2>
        <div class="flex flex-wrap gap-2">
          <button v-for="h in hotSearches" :key="h"
            class="chip" @click="goSearch(h)">{{ h }}</button>
        </div>
      </div>
    </div>
  </div>
</template>
