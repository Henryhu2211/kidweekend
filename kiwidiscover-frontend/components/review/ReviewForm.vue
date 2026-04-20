<script setup lang="ts">
import { useRuntimeConfig } from '#app'
import { useAuth } from '~/composables/useAuth'

const props = defineProps<{ placeId: string }>()
const emit = defineEmits<{ submitted: [] }>()

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const { token } = useAuth()

const rating = ref(0)
const hoverRating = ref(0)
const content = ref('')
const visitDate = ref('')
const submitting = ref(false)
const error = ref('')

const stars = [1, 2, 3, 4, 5]

const submit = async () => {
  if (rating.value === 0 || !content.value.trim()) {
    error.value = 'Please add a rating and review'
    return
  }
  submitting.value = true
  error.value = ''
  try {
    await $fetch(`${apiBase}/places/${props.placeId}/reviews`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token.value}` },
      body: { rating: rating.value, content: content.value, visitDate: visitDate.value },
    })
    emit('submitted')
    rating.value = 0
    content.value = ''
    visitDate.value = ''
  } catch (e: any) {
    error.value = e?.data?.message || 'Failed to submit review'
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <form @submit.prevent="submit" class="space-y-4">
    <!-- 星级 -->
    <div class="flex items-center gap-1">
      <button v-for="star in stars" :key="star" type="button"
        class="w-10 h-10 text-2xl transition-transform hover:scale-110 focus:outline-none"
        @click="rating = star"
        @mouseenter="hoverRating = star"
        @mouseleave="hoverRating = 0"
      >
        {{ star <= (hoverRating || rating) ? '⭐' : '☆' }}
      </button>
      <span class="ml-2 text-sm text-gray-400" v-if="rating">{{ rating }}/5</span>
    </div>

    <!-- 日期 -->
    <input v-model="visitDate" type="date"
      class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange focus:ring-2 focus:ring-orange/20 outline-none text-sm"
    />

    <!-- 内容 -->
    <textarea v-model="content" rows="3" placeholder="Share your experience..."
      class="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-orange focus:ring-2 focus:ring-orange/20 outline-none text-sm resize-none"
    />

    <!-- 错误 -->
    <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

    <!-- 提交 -->
    <button type="submit" :disabled="submitting"
      class="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {{ submitting ? 'Submitting...' : 'Submit Review' }}
    </button>
  </form>
</template>
