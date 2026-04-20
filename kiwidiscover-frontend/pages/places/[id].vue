<script setup lang="ts">
import type { Place, Review } from '~/types/place'
import { useAuth } from '~/composables/useAuth'

const route = useRoute()
const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const { token, isAuthenticated } = useAuth()

// 获取场所详情
const { data: place } = await useFetch<Place>(`${apiBase}/places/${route.params.id}`)

// 图片轮播
const currentImage = ref(0)
const nextImage = () => {
  if (place.value) currentImage.value = (currentImage.value + 1) % place.value.images.length
}

// Tab 切换
const tabs = ['info', 'facilities', 'reviews', 'map'] as const
const activeTab = ref<string>('info')

// 评论
const { data: reviews } = await useFetch<Review[]>(
  () => place.value ? `${apiBase}/places/${place.value.id}/reviews` : '',
  { watch: [() => route.params.id] }
)

const onReviewSubmitted = () => {
  refreshNuxtData()
}

// 收藏
const isFavorite = ref(false)
const toggleFavorite = async () => {
  if (!place.value || !token.value) return
  if (isFavorite.value) {
    await $fetch(`${apiBase}/users/me/favorites/${place.value.id}`, {
      method: 'DELETE', headers: { Authorization: `Bearer ${token.value}` },
    })
  } else {
    await $fetch(`${apiBase}/users/me/favorites/${place.value.id}`, {
      method: 'POST', headers: { Authorization: `Bearer ${token.value}` },
    })
  }
  isFavorite.value = !isFavorite.value
}

// 价格标签
const priceLabel = computed(() => {
  if (!place.value) return ''
  const map: Record<string, string> = { free: 'Free', low: '$', medium: '$$', high: '$$$' }
  return map[place.value.priceRange] || place.value.price
})

// SEO
useHead(() => ({
  title: place.value ? `${place.value.name} — KiwiDiscover` : 'Loading...',
  meta: [{ name: 'description', content: place.value?.shortDescription || '' }],
}))
</script>

<template>
  <div v-if="place" class="min-h-screen bg-gray-50 pb-24">
    <!-- 图片轮播 -->
    <div class="relative aspect-[16/9] bg-gray-200 overflow-hidden">
      <img
        :src="place.images[currentImage] || place.coverImage"
        :alt="place.name"
        class="w-full h-full object-cover"
      />
      <!-- 返回 -->
      <NuxtLink to="/places"
        class="absolute top-4 left-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md"
      >←</NuxtLink>
      <!-- 收藏 -->
      <button @click="toggleFavorite"
        class="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md"
      >{{ isFavorite ? '❤️' : '🤍' }}</button>
      <!-- 指示器 -->
      <div v-if="place.images.length > 1"
        class="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        <span v-for="(_, i) in place.images" :key="i"
          class="w-2 h-2 rounded-full transition-colors"
          :class="i === currentImage ? 'bg-white' : 'bg-white/50'"
          @click="currentImage = i"
        />
      </div>
    </div>

    <!-- 核心信息 -->
    <div class="px-6 pt-6 -mt-6 bg-gray-50 rounded-t-3xl relative">
      <div class="flex items-start justify-between">
        <h1 class="text-2xl font-extrabold leading-tight flex-1">{{ place.name }}</h1>
        <span class="ml-3 bg-yellow px-3 py-1 rounded-full text-sm font-bold">⭐ {{ place.rating?.toFixed(1) }}</span>
      </div>
      <p class="text-gray-500 mt-1 text-sm">{{ place.shortDescription }}</p>

      <div class="flex flex-wrap gap-3 mt-4 text-sm text-gray-600">
        <span class="flex items-center gap-1">📍 {{ place.region }}</span>
        <span class="flex items-center gap-1">{{ place.indoor ? '🏠 Indoor' : '🌳 Outdoor' }}</span>
        <span class="flex items-center gap-1">👶 {{ place.ageMin }}-{{ place.ageMax }}岁</span>
        <span class="flex items-center gap-1">💰 {{ priceLabel }}</span>
      </div>

      <div class="flex gap-3 mt-5">
        <a :href="`https://maps.google.com/?q=${place.lat},${place.lng}`" target="_blank"
          class="btn-primary flex-1 text-center flex items-center justify-center gap-2">
          🧭 Navigate
        </a>
        <a v-if="place.phone" :href="`tel:${place.phone}`"
          class="btn-outline flex-1 text-center flex items-center justify-center gap-2">
          📞 Call
        </a>
      </div>
    </div>

    <!-- Tabs -->
    <div class="px-6 mt-6">
      <div class="flex gap-1 bg-gray-100 rounded-xl p-1">
        <button v-for="tab in tabs" :key="tab" @click="activeTab = tab"
          class="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-colors capitalize"
          :class="activeTab === tab ? 'bg-white text-orange shadow-sm' : 'text-gray-500'"
        >{{ tab }}</button>
      </div>
    </div>

    <!-- Tab 内容 -->
    <div class="px-6 mt-4">
      <!-- 信息 -->
      <div v-if="activeTab === 'info'" class="space-y-4">
        <div class="bg-white rounded-2xl p-5 space-y-3">
          <h3 class="font-bold">About</h3>
          <p class="text-gray-600 text-sm leading-relaxed">{{ place.description }}</p>
        </div>
        <div class="bg-white rounded-2xl p-5 space-y-3">
          <h3 class="font-bold">Details</h3>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div><span class="text-gray-400">Address</span><p class="font-medium">{{ place.address }}</p></div>
            <div><span class="text-gray-400">Hours</span><p class="font-medium">{{ place.openingHours }}</p></div>
            <div v-if="place.website"><span class="text-gray-400">Website</span>
              <a :href="place.website" class="text-orange font-medium block truncate" target="_blank">{{ place.website }}</a>
            </div>
            <div v-if="place.phone"><span class="text-gray-400">Phone</span>
              <a :href="`tel:${place.phone}`" class="font-medium">{{ place.phone }}</a>
            </div>
          </div>
        </div>
      </div>

      <!-- 设施 -->
      <div v-if="activeTab === 'facilities'" class="bg-white rounded-2xl p-5">
        <h3 class="font-bold mb-3">Facilities</h3>
        <div class="flex flex-wrap gap-2">
          <span v-for="f in place.facilities" :key="f" class="chip">{{ f }}</span>
        </div>
      </div>

      <!-- 评论 -->
      <div v-if="activeTab === 'reviews'" class="space-y-4">
        <ReviewForm v-if="isAuthenticated" :place-id="place.id" @submitted="onReviewSubmitted" />
        <p v-else class="text-center text-sm text-gray-400 py-4">
          <NuxtLink to="/auth/login" class="text-orange font-semibold">Log in</NuxtLink> to leave a review
        </p>
        <div v-for="r in reviews" :key="r.id" class="bg-white rounded-2xl p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="font-semibold text-sm">{{ r.userName }}</span>
            <span class="text-xs text-gray-400">{{ r.visitDate }}</span>
          </div>
          <div class="text-sm mb-1">⭐{{ '⭐'.repeat(r.rating - 1) }}</div>
          <p class="text-sm text-gray-600">{{ r.content }}</p>
        </div>
      </div>

      <!-- 地图 -->
      <div v-if="activeTab === 'map'" class="h-[50vh]">
        <MapWidget :places="[place]" :zoom="15" />
      </div>
    </div>
  </div>

  <!-- 加载中 -->
  <div v-else class="min-h-screen flex items-center justify-center">
    <div class="text-4xl animate-pulse">🦜</div>
  </div>
</template>
