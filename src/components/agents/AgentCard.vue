<template>
  <router-link :to="`/teams/${agent.teamId}/agents/${agent.id}`" class="agent-card">
    <div class="agent-avatar">{{ agent.meta.avatar }}</div>
    <div class="agent-info">
      <h4 class="agent-name">{{ agent.meta.name }}</h4>
      <p class="agent-role">{{ agent.meta.role }}</p>
      <div class="agent-tags">
        <span v-for="tag in agent.meta.tags.slice(0, 3)" :key="tag" class="tag tag-blue">
          {{ tag }}
        </span>
      </div>
    </div>
    <div class="agent-level">
      <span class="level-badge" :class="`level-${agent.meta.level}`">
        {{ levelText[agent.meta.level] }}
      </span>
    </div>
  </router-link>
</template>

<script setup lang="ts">
import type { Agent } from '@/types'

defineProps<{
  agent: Agent
}>()

const levelText = {
  junior: '初级',
  senior: '资深',
  lead: '主管',
  executive: '高管',
}
</script>

<style scoped>
.agent-card {
  @apply flex items-center gap-4 p-4 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 hover:shadow-md;
}

.agent-avatar {
  @apply w-14 h-14 text-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-700 dark:to-dark-600 rounded-xl flex items-center justify-center flex-shrink-0;
}

.agent-info {
  @apply flex-1 min-w-0;
}

.agent-name {
  @apply font-semibold text-gray-900 dark:text-white truncate;
}

.agent-role {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-0.5;
}

.agent-tags {
  @apply flex flex-wrap gap-1.5 mt-2;
}

.agent-level {
  @apply flex-shrink-0;
}

.level-badge {
  @apply px-2 py-1 text-xs font-medium rounded;
}

.level-junior {
  @apply bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400;
}

.level-senior {
  @apply bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400;
}

.level-lead {
  @apply bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400;
}

.level-executive {
  @apply bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400;
}
</style>
