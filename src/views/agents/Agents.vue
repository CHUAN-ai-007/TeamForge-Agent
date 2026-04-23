<template>
  <div class="agents-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">智能体管理</h1>
        <p class="page-subtitle">管理您的所有 AI Agent</p>
      </div>
      <span class="text-sm text-gray-500">共 {{ totalAgents }} 个 Agent</span>
    </header>

    <div v-if="allAgents.length > 0" class="agents-list">
      <div
        v-for="agent in allAgents"
        :key="agent.id"
        class="agent-card"
        @click="$router.push(`/teams/${agent.teamId}/agents/${agent.id}`)"
      >
        <div class="agent-avatar">{{ agent.meta.avatar }}</div>
        <div class="agent-info">
          <h4 class="agent-name">{{ agent.meta.name }}</h4>
          <p class="agent-role">{{ agent.meta.role }}</p>
          <p class="agent-team text-sm text-gray-400">{{ getTeamName(agent.teamId) }}</p>
        </div>
        <div class="agent-tags">
          <span v-for="tag in agent.meta.tags.slice(0, 2)" :key="tag" class="tag tag-blue text-xs">
            {{ tag }}
          </span>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state card">
      <div class="empty-icon">🤖</div>
      <h3>还没有智能体</h3>
      <p>先创建团队，系统会自动生成 AI Agent</p>
      <router-link to="/teams" class="btn-primary">去创建团队</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useTeamsStore } from '@/stores/teams'

const teamsStore = useTeamsStore()

const allAgents = computed(() => {
  return teamsStore.teams.flatMap(team => team.agents)
})

const totalAgents = computed(() => {
  return allAgents.value.length
})

function getTeamName(teamId: string): string {
  const team = teamsStore.getTeam(teamId)
  return team?.info.name || '未知团队'
}
</script>

<style scoped>
.agents-page {
  @apply p-6 max-w-7xl mx-auto;
}

.page-header {
  @apply flex items-center justify-between mb-8;
}

.agents-list {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4;
}

.agent-card {
  @apply bg-white dark:bg-dark-800 rounded-xl p-4 border border-gray-200 dark:border-dark-700
         hover:border-primary-500 dark:hover:border-primary-500 hover:shadow-md
         transition-all duration-200 cursor-pointer;
}

.agent-avatar {
  @apply w-12 h-12 text-2xl bg-gradient-to-br from-gray-100 to-gray-200
         dark:from-dark-700 dark:to-dark-600 rounded-xl flex items-center justify-center mb-3;
}

.agent-name {
  @apply font-semibold text-gray-900 dark:text-white;
}

.agent-role {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-0.5;
}

.agent-team {
  @apply mt-1;
}

.agent-tags {
  @apply flex flex-wrap gap-1.5 mt-3;
}

.empty-state {
  @apply py-16 text-center;
}

.empty-icon {
  @apply text-5xl mb-4;
}

.empty-state h3 {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-2;
}

.empty-state p {
  @apply text-gray-500 dark:text-gray-400 mb-6;
}
</style>
