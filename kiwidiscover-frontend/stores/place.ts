import { defineStore } from 'pinia'
import type { PlaceFilters } from '~/types/place'

export const usePlaceStore = defineStore('place', () => {
  // 筛选状态（持久化到 URL）
  const filters = reactive<PlaceFilters>({
    region: '',
    ageMin: undefined,
    ageMax: undefined,
    price: '',
    indoor: undefined,
  })

  const showMap = ref(false)
  const currentCategory = ref('')

  const setFilter = (key: keyof PlaceFilters, value: any) => {
    filters[key] = value || undefined
  }

  const resetFilters = () => {
    Object.assign(filters, {
      region: '', ageMin: undefined, ageMax: undefined,
      price: '', indoor: undefined,
    })
  }

  const toggleMap = () => { showMap.value = !showMap.value }

  const toQuery = () => {
    const q: Record<string, string> = {}
    if (filters.region) q.region = filters.region
    if (filters.ageMin) q.ageMin = String(filters.ageMin)
    if (filters.ageMax) q.ageMax = String(filters.ageMax)
    if (filters.price) q.price = filters.price
    if (filters.indoor !== undefined) q.indoor = String(filters.indoor)
    return q
  }

  return { filters, showMap, currentCategory, setFilter, resetFilters, toggleMap, toQuery }
})
