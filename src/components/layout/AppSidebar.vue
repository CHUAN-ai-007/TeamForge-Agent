<template>
  <aside class="sidebar">
    <!-- Logo -->
    <div class="sidebar-header">
      <router-link to="/" class="logo">
        <div class="logo-icon">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <span class="logo-text">TeamForge</span>
      </router-link>
    </div>

    <!-- 导航菜单 -->
    <nav class="sidebar-nav">
      <router-link to="/" class="nav-item" :class="{ active: $route.name === 'Home' }">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
        <span>首页</span>
      </router-link>

      <div class="nav-section">
        <span class="nav-section-title">团队</span>
        <router-link
          v-for="team in teamsStore.teamList.slice(0, 5)"
          :key="team.id"
          :to="`/teams/${team.id}`"
          class="nav-item"
          :class="{ active: $route.params.id === team.id }"
        >
          <span class="team-avatar">{{ team.name[0] }}</span>
          <span class="truncate">{{ team.name }}</span>
        </router-link>
        <router-link v-if="teamsStore.teams.length > 5" to="/" class="nav-item text-gray-400">
          <span>查看全部 ({{ teamsStore.teams.length }})</span>
        </router-link>
      </div>

      <div class="nav-section">
        <span class="nav-section-title">设置</span>
        <router-link to="/settings" class="nav-item" :class="{ active: $route.name === 'Settings' }">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span>模型配置</span>
        </router-link>
      </div>
    </nav>

    <!-- 底部信息 -->
    <div class="sidebar-footer">
      <div class="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <div class="w-2 h-2 rounded-full" :class="settingsStore.hasValidConfig ? 'bg-green-500' : 'bg-red-500'"></div>
        <span>{{ settingsStore.hasValidConfig ? 'AI 已配置' : '未配置 AI' }}</span>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { useTeamsStore } from '@/stores/teams'
import { useSettingsStore } from '@/stores/settings'

const teamsStore = useTeamsStore()
const settingsStore = useSettingsStore()
</script>

<style scoped>
.sidebar {
  @apply fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-dark-800 border-r border-gray-200 dark:border-dark-700 flex flex-col z-40;
}

.sidebar-header {
  @apply p-4 border-b border-gray-200 dark:border-dark-700;
}

.logo {
  @apply flex items-center gap-3;
}

.logo-icon {
  @apply w-10 h-10 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white;
}

.logo-text {
  @apply text-xl font-bold text-gray-900 dark:text-white;
}

.sidebar-nav {
  @apply flex-1 overflow-y-auto p-3 space-y-1;
}

.nav-section {
  @apply mt-4;
}

.nav-section-title {
  @apply px-3 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider;
}

.nav-item {
  @apply flex items-center gap-3 px-3 py-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors;
}

.nav-item.active {
  @apply bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-medium;
}

.team-avatar {
  @apply w-6 h-6 rounded bg-gradient-to-br from-gray-400 to-gray-600 text-white text-xs flex items-center justify-center font-bold;
}

.sidebar-footer {
  @apply p-4 border-t border-gray-200 dark:border-dark-700;
}
</style>
