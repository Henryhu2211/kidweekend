<script setup lang="ts">
import type { Place } from '~/types/place'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'

const props = defineProps<{
  places: Place[]
  center?: [number, number]
  zoom?: number
  highlight?: string
}>()

const mapContainer = ref<HTMLDivElement>()
const map = ref<maplibregl.Map>()

const config = useRuntimeConfig()
const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json'

onMounted(() => {
  if (!mapContainer.value) return

  map.value = new maplibregl.Map({
    container: mapContainer.value,
    style: MAP_STYLE,
    center: props.center || [174.7633, -41.2865], // Wellington
    zoom: props.zoom || 11,
    attributionControl: false,
  })

  // 添加标记
  watch(() => props.places, (places) => {
    if (!map.value) return
    // 清除旧标记
    document.querySelectorAll('.map-marker').forEach(el => el.remove())

    places.forEach((place) => {
      const el = document.createElement('div')
      el.className = 'map-marker'
      el.innerHTML = `<div class="w-8 h-8 bg-orange text-white rounded-full flex items-center justify-center text-xs font-bold shadow-lg cursor-pointer ${place.id === props.highlight ? 'ring-2 ring-yellow scale-125' : ''}">📌</div>`
      el.onclick = () => navigateTo(`/places/${place.id}`)

      new maplibregl.Marker({ element: el })
        .setLngLat([place.lng, place.lat])
        .addTo(map.value!)
    })

    // 自动适配边界
    if (places.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      places.forEach(p => bounds.extend([p.lng, p.lat]))
      map.value.fitBounds(bounds, { padding: 48, maxZoom: 14 })
    }
  }, { immediate: true })
})

onUnmounted(() => { map.value?.remove() })
</script>

<template>
  <div class="relative w-full h-full min-h-[300px] rounded-2xl overflow-hidden">
    <div ref="mapContainer" class="absolute inset-0" />
  </div>
</template>
