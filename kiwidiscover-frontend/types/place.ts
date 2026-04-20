export interface Place {
  id: string
  name: string
  slug: string
  coverImage: string
  images: string[]
  description: string
  shortDescription: string
  region: string
  address: string
  lat: number
  lng: number
  category: string
  ageMin: number
  ageMax: number
  priceRange: 'free' | 'low' | 'medium' | 'high'
  price: string
  rating: number
  reviewCount: number
  indoor: boolean
  outdoor: boolean
  facilities: string[]
  openingHours: string
  website: string
  phone: string
}

export interface Review {
  id: string
  userId: string
  userName: string
  rating: number
  content: string
  visitDate: string
  createdAt: string
}

export interface Category {
  id: string
  name: string
  icon: string
  slug: string
}

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; totalPages: number }
}

export interface PlaceFilters {
  region?: string
  ageMin?: number
  ageMax?: number
  price?: string
  indoor?: boolean
  page?: number
  limit?: number
}
