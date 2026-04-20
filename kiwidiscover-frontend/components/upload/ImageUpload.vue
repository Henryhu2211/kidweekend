<script setup lang="ts">
import { useRuntimeConfig } from '#app'
import { useAuth } from '~/composables/useAuth'

// Props & Emits
const props = defineProps<{
  modelValue?: string   // current image URL (for preview / v-model)
  uploadUrl?: string     // backend endpoint
  placeholder?: string
}>()
const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const config = useRuntimeConfig()
const apiBase = config.public.apiBase
const uploadEndpoint = props.uploadUrl || `${apiBase}/upload`
const { token } = useAuth()

// Allowed types & max size
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
const MAX_SIZE_BYTES = 5 * 1024 * 1024 // 5 MB

// Reactive state
const preview = ref<string>(props.modelValue || '')
const uploading = ref(false)
const progress = ref(0)
const error = ref('')
const dragOver = ref(false)
const inputRef = ref<HTMLInputElement | null>(null)

// Keep preview in sync with v-model changes
watch(() => props.modelValue, (val) => { if (val) preview.value = val })

// ── Helpers ──────────────────────────────────────────────────────────────────

const isValidType = (file: File) => ACCEPTED_TYPES.includes(file.type)

const isValidSize = (file: File) => file.size <= MAX_SIZE_BYTES

const formatSize = (bytes: number) =>
  bytes < 1048576 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1048576).toFixed(1)} MB`

const friendlyError = (code?: string): string => {
  switch (code) {
    case '413': return 'File is too large. Please choose an image under 5 MB.'
    case '415': return 'Unsupported file format. Please use JPEG, PNG, GIF, or WebP.'
    case '401': return 'Authentication expired. Please log in again.'
    case '429': return 'Too many requests. Please wait a moment and try again.'
    default:    return 'Upload failed. Please check your connection and try again.'
  }
}

// ── Upload ───────────────────────────────────────────────────────────────────

const upload = async (file: File) => {
  error.value = ''

  if (!isValidType(file)) {
    error.value = `Unsupported format: ${file.type || 'unknown'}. Use JPEG, PNG, GIF, or WebP.`
    return
  }
  if (!isValidSize(file)) {
    error.value = `File (${formatSize(file.size)}) exceeds the 5 MB limit.`
    return
  }

  uploading.value = true
  progress.value = 0

  try {
    // Show local preview immediately
    preview.value = URL.createObjectURL(file)

    const fd = new FormData()
    fd.append('file', file)

    const response = await $fetch<{ url: string }>(uploadEndpoint, {
      method: 'POST',
      headers: token.value ? { Authorization: `Bearer ${token.value}` } : {},
      body: fd,
      onRequestProgress: (ev: { loaded: number; total: number }) => {
        if (ev.total) progress.value = Math.round((ev.loaded / ev.total) * 100)
      },
    })

    emit('update:modelValue', response.url)
  } catch (e: any) {
    error.value = friendlyError(e?.status?.toString())
    preview.value = ''   // clear bad preview
  } finally {
    uploading.value = false
    progress.value = 0
  }
}

// ── Event Handlers ───────────────────────────────────────────────────────────

const onFileChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) upload(file)
}

const onDrop = (e: DragEvent) => {
  dragOver.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) upload(file)
}

const openPicker = () => inputRef.value?.click()
</script>

<template>
  <div class="space-y-3">
    <!-- Preview -->
    <div
      class="relative w-full h-48 rounded-xl border-2 border-dashed overflow-hidden cursor-pointer transition-colors"
      :class="dragOver ? 'border-orange bg-orange/5' : preview ? 'border-gray-200' : 'border-gray-300 hover:border-orange'"
      @click="!preview && openPicker()"
      @dragover.prevent="dragOver = true"
      @dragleave="dragOver = false"
      @drop.prevent="onDrop"
    >
      <img
        v-if="preview"
        :src="preview"
        alt="Preview"
        class="w-full h-full object-cover"
        @click.stop="openPicker()"
      />
      <div v-else class="flex flex-col items-center justify-center h-full gap-2 text-gray-400">
        <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2 1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span class="text-sm font-medium">Click or drag & drop to upload</span>
        <span class="text-xs">JPEG, PNG, GIF, WebP · max 5 MB</span>
      </div>
    </div>

    <!-- Hidden file input -->
    <input
      ref="inputRef"
      type="file"
      accept="image/jpeg,image/png,image/gif,image/webp"
      class="hidden"
      @change="onFileChange"
    />

    <!-- Upload progress bar -->
    <div v-if="uploading" class="space-y-1">
      <div class="flex justify-between text-xs text-gray-500">
        <span>Uploading…</span>
        <span>{{ progress }}%</span>
      </div>
      <div class="w-full bg-gray-200 rounded-full h-1.5">
        <div
          class="bg-orange h-1.5 rounded-full transition-all duration-300"
          :style="{ width: `${progress}%` }"
        />
      </div>
    </div>

    <!-- Error message -->
    <p v-if="error" class="text-red-500 text-sm flex items-center gap-1">
      <svg class="w-4 h-4 shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
      </svg>
      {{ error }}
    </p>

    <!-- Replace hint -->
    <p v-if="preview && !uploading" class="text-xs text-gray-400 text-center">
      Click image to replace · JPEG, PNG, GIF, WebP · max 5 MB
    </p>
  </div>
</template>
