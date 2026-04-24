<template>
  <header class="navbar">
    <div class="navbar-container">
      <!-- Logo -->
      <router-link to="/" class="logo">
        <div class="logo-icon">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <span class="logo-text">TeamForge</span>
      </router-link>

      <!-- 主导航 -->
      <nav class="main-nav">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <component :is="item.icon" class="nav-icon" />
          <span>{{ item.label }}</span>
        </router-link>
      </nav>

      <!-- 右侧操作区 -->
      <div class="navbar-actions">
        <!-- AI 配置状态 -->
        <div class="status-badge" :class="settingsStore.hasValidConfig ? 'status-ok' : 'status-error'">
          <div class="status-dot"></div>
          <span class="status-text">{{ settingsStore.hasValidConfig ? 'AI 已配置' : '未配置' }}</span>
        </div>

        <!-- 主题切换 -->
        <button class="theme-btn" @click="toggleTheme">
          <svg v-if="appStore.isDark" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <svg v-else class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </button>

      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
import { h } from 'vue'
import { useRoute } from 'vue-router'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'

const route = useRoute()
const appStore = useAppStore()
const settingsStore = useSettingsStore()

// 导航配置
const navItems = [
  {
    label: '首页',
    path: '/',
    icon: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' })
    ])
  },
  {
    label: '团队',
    path: '/teams',
    icon: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' })
    ])
  },
  {
    label: '智能体',
    path: '/agents',
    icon: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' })
    ])
  },
  {
    label: '模型配置',
    path: '/settings',
    icon: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' }),
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' })
    ])
  }
]

// 判断导航项是否激活
function isActive(path: string): boolean {
  if (path === '/') {
    return route.path === '/'
  }
  return route.path.startsWith(path)
}

// 切换主题
function toggleTheme() {
  const newTheme = appStore.isDark ? 'light' : 'dark'
  appStore.setTheme(newTheme)
}
</script>

<style scoped>
.navbar {
  @apply fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-dark-800/80 backdrop-blur-lg border-b border-gray-200 dark:border-dark-700;
}

.navbar-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between;
}

.logo {
  @apply flex items-center gap-2 flex-shrink-0;
}

.logo-icon {
  @apply w-9 h-9 bg-gradient-to-br from-primary-500 to-purple-600 rounded-lg flex items-center justify-center text-white;
}

.logo-text {
  @apply text-xl font-bold text-gray-900 dark:text-white hidden sm:block;
}

.main-nav {
  @apply hidden md:flex items-center gap-1;
}

.nav-item {
  @apply flex items-center gap-2 px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white transition-all duration-200 text-sm font-medium;
}

.nav-item.active {
  @apply bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400;
}

.nav-icon {
  @apply w-5 h-5;
}

.navbar-actions {
  @apply flex items-center gap-3;
}

.status-badge {
  @apply hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium;
}

.status-ok {
  @apply bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400;
}

.status-error {
  @apply bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400;
}

.status-dot {
  @apply w-1.5 h-1.5 rounded-full bg-current;
}

.status-text {
  @apply whitespace-nowrap;
}

.theme-btn {
  @apply p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-700 hover:text-gray-900 dark:hover:text-white transition-colors;
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  @apply md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-dark-700;
}
</style>
