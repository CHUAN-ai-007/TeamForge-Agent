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
        <div class="logo-brand">
          <span class="logo-text">TeamForge</span>
          <span class="logo-version">V {{ appVersion }}</span>
        </div>
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

declare const __APP_VERSION__: string

const route = useRoute()
const appStore = useAppStore()
const settingsStore = useSettingsStore()
const appVersion = __APP_VERSION__

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
    label: '工作与任务',
    path: '/workflows',
    icon: () => h('svg', { class: 'w-5 h-5', fill: 'none', viewBox: '0 0 24 24', stroke: 'currentColor' }, [
      h('path', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-width': '2', d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' })
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
  @apply fixed top-0 left-0 right-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur-xl border-b border-navy-200 dark:border-navy-800;
}

.navbar-container {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between;
}

.logo {
  @apply flex items-center gap-3 flex-shrink-0;
}

.logo-icon {
  @apply w-10 h-10 bg-gradient-to-br from-primary-600 to-primary-500 rounded-xl flex items-center justify-center text-white shadow-quantplay;
}

.logo-brand {
  @apply hidden sm:flex items-baseline gap-2;
}

.logo-text {
  @apply text-xl font-bold bg-gradient-to-r from-navy-900 to-navy-700 dark:from-white dark:to-navy-200 bg-clip-text text-transparent;
}

.logo-version {
  @apply text-xs font-semibold text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-2 py-0.5 rounded-full;
}

.main-nav {
  @apply hidden md:flex items-center gap-1;
}

.nav-item {
  @apply relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-navy-600 dark:text-navy-300 hover:bg-navy-100 dark:hover:bg-navy-800 hover:text-navy-900 dark:hover:text-white transition-all duration-200 text-sm font-medium;
}

.nav-item.active {
  @apply bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400;
}

.nav-item.active::before {
  content: '';
  @apply absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-primary-500 rounded-r-full;
}

.nav-icon {
  @apply w-5 h-5;
}

.navbar-actions {
  @apply flex items-center gap-3;
}

.status-badge {
  @apply hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border;
}

.status-ok {
  @apply bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20 text-success-600 dark:text-success-400;
}

.status-error {
  @apply bg-danger-50 dark:bg-danger-500/10 border-danger-200 dark:border-danger-500/20 text-danger-600 dark:text-danger-400;
}

.status-dot {
  @apply w-2 h-2 rounded-full bg-current animate-pulse;
}

.status-text {
  @apply whitespace-nowrap;
}

.theme-btn {
  @apply p-2.5 rounded-xl text-navy-500 dark:text-navy-400 hover:bg-navy-100 dark:hover:bg-navy-800 hover:text-navy-900 dark:hover:text-white transition-all duration-200;
}

/* 移动端菜单按钮 */
.mobile-menu-btn {
  @apply md:hidden p-2.5 rounded-xl text-navy-600 hover:bg-navy-100 dark:hover:bg-navy-800;
}
</style>
