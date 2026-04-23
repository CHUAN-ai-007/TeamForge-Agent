<template>
  <div class="home-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div>
        <h1 class="page-title">欢迎回来 👋</h1>
        <p class="page-subtitle">管理和协作您的 AI Agent 团队</p>
      </div>
      <button class="btn-primary gap-2" @click="showCreateModal = true">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        新建团队
      </button>
    </header>

    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon teams">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ teamsStore.teams.length }}</span>
          <span class="stat-label">团队</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon agents">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ teamsStore.totalAgents }}</span>
          <span class="stat-label">Agent</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon chats">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
        </div>
        <div class="stat-info">
          <span class="stat-value">{{ chatStore.sessions.length }}</span>
          <span class="stat-label">对话</span>
        </div>
      </div>
    </div>

    <!-- 团队列表 -->
    <section class="teams-section">
      <div class="section-header">
        <h2 class="section-title">我的团队</h2>
        <span v-if="teamsStore.teams.length > 0" class="section-count">共 {{ teamsStore.teams.length }} 个</span>
      </div>

      <div v-if="teamsStore.teams.length > 0" class="teams-grid">
        <TeamCard
          v-for="team in teamsStore.teams"
          :key="team.info.id"
          :team="team.info"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <div class="empty-icon">
          <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
        <h3 class="empty-title">还没有团队</h3>
        <p class="empty-desc">创建您的第一个 AI Agent 团队，开始智能化协作</p>
        <button class="btn-primary" @click="showCreateModal = true">
          立即创建
        </button>
      </div>
    </section>

    <!-- 创建团队弹窗 -->
    <CreateTeamModal v-model="showCreateModal" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTeamsStore } from '@/stores/teams'
import { useChatStore } from '@/stores/chat'
import TeamCard from '@/components/teams/TeamCard.vue'
import CreateTeamModal from '@/components/teams/CreateTeamModal.vue'

const teamsStore = useTeamsStore()
const chatStore = useChatStore()

const showCreateModal = ref(false)
</script>

<style scoped>
.home-page {
  @apply p-6 max-w-7xl mx-auto;
}

.page-header {
  @apply flex items-center justify-between mb-8;
}

.stats-grid {
  @apply grid grid-cols-1 md:grid-cols-3 gap-6 mb-8;
}

.stat-card {
  @apply card p-5 flex items-center gap-4;
}

.stat-icon {
  @apply w-12 h-12 rounded-xl flex items-center justify-center;
}

.stat-icon.teams {
  @apply bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400;
}

.stat-icon.agents {
  @apply bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400;
}

.stat-icon.chats {
  @apply bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400;
}

.stat-info {
  @apply flex flex-col;
}

.stat-value {
  @apply text-2xl font-bold text-gray-900 dark:text-white;
}

.stat-label {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.teams-section {
  @apply space-y-4;
}

.section-header {
  @apply flex items-center justify-between;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.section-count {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.teams-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
}

.empty-state {
  @apply card py-16 text-center;
}

.empty-icon {
  @apply w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-dark-600;
}

.empty-title {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-2;
}

.empty-desc {
  @apply text-gray-500 dark:text-gray-400 mb-6;
}
</style>