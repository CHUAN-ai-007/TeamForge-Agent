<template>
  <router-link :to="`/teams/${team.id}`" class="team-card">
    <div class="team-header">
      <div class="team-avatar">{{ team.name[0] }}</div>
      <div class="team-info">
        <h3 class="team-name">{{ team.name }}</h3>
        <span class="team-industry">{{ team.industry }}</span>
      </div>
    </div>
    <p class="team-description">{{ truncateText(team.description, 80) }}</p>
    <div class="team-footer">
      <div class="team-stats">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <span>{{ team.agentCount }} 个 Agent</span>
      </div>
      <span class="team-date">{{ formatRelativeTime(team.updatedAt) }}</span>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import type { TeamInfo } from '@/types'
import { truncateText, formatRelativeTime } from '@/utils'

defineProps<{
  team: TeamInfo
}>()
</script>

<style scoped>
.team-card {
  @apply block bg-white dark:bg-dark-800 rounded-xl p-5 border border-gray-200 dark:border-dark-700 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5;
}

.team-header {
  @apply flex items-center gap-3 mb-3;
}

.team-avatar {
  @apply w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 text-white text-xl font-bold flex items-center justify-center flex-shrink-0;
}

.team-info {
  @apply min-w-0;
}

.team-name {
  @apply font-semibold text-gray-900 dark:text-white truncate;
}

.team-industry {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.team-description {
  @apply text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2;
}

.team-footer {
  @apply flex items-center justify-between text-sm text-gray-500 dark:text-gray-400;
}

.team-stats {
  @apply flex items-center gap-1.5;
}

.team-date {
  @apply text-xs;
}
</style>
