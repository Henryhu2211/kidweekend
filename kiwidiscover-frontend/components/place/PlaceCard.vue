<script setup lang="ts">
import type { Place } from '~/types/place'

const props = defineProps<{ place: Place }>()

const priceLabel = computed(() => {
  const map: Record<string, string> = { free: 'Free', low: '$', medium: '$$', high: '$$$' }
  return map[props.place.priceRange] || props.place.price
})
</script>

<template>
  <NuxtLink :to="`/places/${place.id}`" class="card group block">
    <div class="relative aspect-[4/3] overflow-hidden">
      <img
        :src="place.coverImage"
        :alt="place.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        loading="lazy"
      />
      <!-- 价格标签 -->
      <span class="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-orange">
        {{ priceLabel }}
      </span>
      <!-- 评分 -->
      <span v-if="place.rating" class="absolute top-3 right-3 bg-yellow/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-gray-900 flex items-center gap-1">
        ⭐ {{ place.rating.toFixed(1) }}
      </span>
    </div>
    <div class="p-4">
      <div class="flex items-start justify-between gap-2">
        <h3 class="font-bold text-base leading-tight line-clamp-2">{{ place.name }}</h3>
      </div>
      <p class="text-sm text-gray-500 mt-1 line-clamp-1">{{ place.shortDescription }}</p>
      <div class="flex items-center gap-3 mt-3 text-xs text-gray-400">
        <span class="flex items-center gap-1">📍 {{ place.region }}</span>
        <span class="flex items-center gap-1">
          {{ place.indoor ? '🏠' : '🌳' }}
          {{ place.ageMin }}-{{ place.ageMax }}岁
        </span>
      </div>
    </div>
  </NuxtLink>
</template>
