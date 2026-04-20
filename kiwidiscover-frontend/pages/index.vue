<script setup lang="ts">
import { usePlaces } from '~/composables/usePlaces'

const { featured, categories, fetchFeatured, fetchCategories } = usePlaces()

await Promise.all([fetchFeatured(), fetchCategories()])

const regions = ['Auckland', 'Wellington', 'Christchurch', 'Hamilton', 'Queenstown', 'Dunedin']
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Hero -->
    <section class="relative bg-gradient-to-br from-orange to-teal px-6 pt-16 pb-24 text-white">
      <div class="max-w-lg mx-auto text-center">
        <h1 class="text-4xl font-extrabold leading-tight mb-4">
          Discover NZ's Best<br/>Family Places 🇳🇿
        </h1>
        <p class="text-white/80 mb-8">Playgrounds, museums, indoor centres & more</p>

        <!-- 搜索框 -->
        <NuxtLink to="/search"
          class="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 text-gray-400 shadow-lg hover:shadow-xl transition-shadow"
        >
          <span class="text-xl">🔍</span>
          <span class="text-left">Search places, activities...</span>
        </NuxtLink>
      </div>
      <!-- 装饰圆 -->
      <div class="absolute -bottom-12 left-1/2 -translate-x-1/2 w-[600px] h-24 bg-gray-50 rounded-[50%]"></div>
    </section>

    <!-- 分类 -->
    <section class="px-6 -mt-8 mb-8">
      <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
        <NuxtLink v-for="cat in categories" :key="cat.id"
          :to="`/places?category=${cat.slug}`"
          class="flex-shrink-0 snap-start flex flex-col items-center gap-2 bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow w-20"
        >
          <span class="text-2xl">{{ cat.icon }}</span>
          <span class="text-xs font-semibold text-gray-700 text-center">{{ cat.name }}</span>
        </NuxtLink>
      </div>
    </section>

    <!-- 编辑精选 -->
    <section class="px-6 mb-8">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-xl font-bold">✨ Editor's Picks</h2>
        <NuxtLink to="/places" class="text-sm text-orange font-semibold">See All →</NuxtLink>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <PlaceCard v-for="place in featured.slice(0, 6)" :key="place.id" :place="place" />
      </div>
    </section>

    <!-- 区域 -->
    <section class="px-6 mb-12">
      <h2 class="text-xl font-bold mb-4">📍 Explore by Region</h2>
      <div class="flex flex-wrap gap-2">
        <NuxtLink v-for="r in regions" :key="r"
          :to="`/places?region=${r}`"
          class="chip"
        >{{ r }}</NuxtLink>
      </div>
    </section>
  </div>
</template>
