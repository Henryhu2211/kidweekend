<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-gray-100">
      <nav class="max-w-7xl mx-auto flex items-center justify-between px-4 h-16">
        <NuxtLinkLocale to="/" class="flex items-center gap-2">
          <span class="text-2xl">🥝</span>
          <span class="font-extrabold text-xl text-orange">Kiwidiscover</span>
        </NuxtLinkLocale>
        <div class="hidden md:flex items-center gap-6">
          <NuxtLinkLocale to="/places" class="text-sm font-semibold text-gray-600 hover:text-orange transition-colors">{{ $t('nav.places') }}</NuxtLinkLocale>
          <NuxtLinkLocale to="/search" class="text-sm font-semibold text-gray-600 hover:text-orange transition-colors">{{ $t('nav.search') }}</NuxtLinkLocale>
        </div>
        <div class="flex items-center gap-3">
          <LanguageSwitcher />
          <button class="md:hidden p-2 text-gray-600" aria-label="Menu">
            <Icon name="i-heroicons-bars-3" class="w-6 h-6" />
          </button>
        </div>
      </nav>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="bg-gray-50 border-t border-gray-100 py-8 mt-auto">
      <div class="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
        <p>&copy; {{ new Date().getFullYear() }} KidWeekend NZ — {{ $t('footer.rights') }}</p>
      </div>
    </footer>
  </div>
</template>
