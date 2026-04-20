import { useRuntimeConfig } from '#app'
import type { Place, PaginatedResponse, PlaceFilters } from '~/types/place'

export const usePlaces = () => {
  const config = useRuntimeConfig()
  // 静态部署时直接调用后端 API
  const apiBase = config.public.apiBase === '/api/v1' 
    ? 'http://localhost:3001/api/v1' 
    : config.public.apiBase

  const places = ref<Place[]>([])
  const featured = ref<Place[]>([])
  const categories = ref<{ id: string; name: string; icon: string; slug: string }[]>([])
  const regions = ref<string[]>([])
  const loading = ref(false)
  const meta = ref({ total: 0, page: 1, limit: 12, totalPages: 0 })
  const hasMore = computed(() => meta.value.page < meta.value.totalPages)

  // 获取场所列表（支持筛选 + 无限滚动）
  const fetchPlaces = async (filters: PlaceFilters = {}, append = false) => {
    loading.value = true
    try {
      const query = new URLSearchParams()
      if (filters.region) query.set('region', filters.region)
      if (filters.ageMin) query.set('ageMin', String(filters.ageMin))
      if (filters.ageMax) query.set('ageMax', String(filters.ageMax))
      if (filters.price) query.set('price', filters.price)
      if (filters.indoor !== undefined) query.set('indoor', String(filters.indoor))
      query.set('page', String(filters.page || 1))
      query.set('limit', String(filters.limit || 12))

      const res = await $fetch<PaginatedResponse<Place>>(`${apiBase}/places?${query}`)
      places.value = append ? [...places.value, ...res.data] : res.data
      meta.value = res.meta
    } finally {
      loading.value = false
    }
  }

  // 获取编辑精选
  const fetchFeatured = async () => {
    featured.value = await $fetch<Place[]>(`${apiBase}/places/featured`)
  }

  // 获取分类
  const fetchCategories = async () => {
    categories.value = await $fetch(`${apiBase}/places/categories/list`)
  }

  // 获取区域列表
  const fetchRegions = async () => {
    regions.value = await $fetch<string[]>(`${apiBase}/places/regions/list`)
  }

  // 搜索
  const searchPlaces = async (q: string, page = 1) => {
    return $fetch<PaginatedResponse<Place>>(`${apiBase}/places/search`, {
      query: { q, page, limit: 12 },
    })
  }

  // 加载更多
  const loadMore = (filters: PlaceFilters) => {
    if (!hasMore.value || loading.value) return
    fetchPlaces({ ...filters, page: meta.value.page + 1 }, true)
  }

  return {
    places, featured, categories, regions,
    loading, meta, hasMore,
    fetchPlaces, fetchFeatured, fetchCategories, fetchRegions,
    searchPlaces, loadMore,
  }
}
