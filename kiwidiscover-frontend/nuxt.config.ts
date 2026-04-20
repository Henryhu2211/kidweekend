// nuxt.config.ts
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },

  modules: [
    '@nuxt/ui',
    '@pinia/nuxt',
    '@nuxtjs/i18n',
  ],

  // 禁用默认 CSP，改用自定义响应头
  nitro: {
    routeRules: {
      '/**': {
        headers: {
          'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https://kidweekend.onrender.com https://api.kidweekend.nz; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
        },
      },
    },
  },

  css: ['~/assets/css/main.css'],

  routeRules: {},

  runtimeConfig: {
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE || 'https://kidweekend.onrender.com/api/v1',
      mapToken: process.env.NUXT_PUBLIC_MAP_TOKEN || '',
    },
  },

  i18n: {
    locales: [
      { code: 'en', name: 'English', file: 'en.json' },
      { code: 'zh', name: '中文', file: 'zh.json' },
    ],
    defaultLocale: 'en',
    langDir: 'locales',
    strategy: 'prefix_except_default',
    detectBrowserLanguage: { useCookie: true, cookieKey: 'i18n_redirected' },
  },

  app: {
    head: {
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap' },
      ],
    },
  },

  // 修复 unhead getActiveHead：i18n 从 unhead 主入口导入，但 getActiveHead 在 legacy 路径
  vite: {
    plugins: [
      {
        name: 'fix-unhead-i18n',
        enforce: 'pre',
        resolveId(id, importer) {
          if (id === 'unhead' && importer && importer.includes('@nuxtjs/i18n')) {
            const { resolve } = require('path');
            return resolve(process.cwd(), 'node_modules/unhead/dist/legacy.mjs');
          }
        },
      },
    ],
  },

  typescript: {
    typeCheck: false,
  },
})
