import { useRuntimeConfig } from '#app'

export interface User {
  id: string
  email: string
  name: string
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase

  const user = ref<User | null>(null)
  const token = useCookie('auth_token', { maxAge: 60 * 60 * 24 * 30, path: '/' })
  const isAuthenticated = computed(() => !!token.value)

  // 获取当前用户
  const fetchMe = async () => {
    if (!token.value) return
    try {
      user.value = await $fetch<User>(`${apiBase}/auth/me`, {
        headers: { Authorization: `Bearer ${token.value}` },
      })
    } catch {
      token.value = null
      user.value = null
    }
  }

  // 登录
  const login = async (email: string, password: string) => {
    const res: any = await $fetch(`${apiBase}/auth/login`, {
      method: 'POST', body: { email, password },
    })
    token.value = res.token
    await fetchMe()
  }

  // 注册
  const register = async (email: string, password: string, name: string) => {
    const res: any = await $fetch(`${apiBase}/auth/register`, {
      method: 'POST', body: { email, password, name },
    })
    token.value = res.token
    await fetchMe()
  }

  // 登出
  const logout = () => {
    token.value = null
    user.value = null
    navigateTo('/')
  }

  return { user, token, isAuthenticated, fetchMe, login, register, logout }
}
