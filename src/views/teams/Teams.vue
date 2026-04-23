<template>
  <div class="teams-page">
    <header class="page-header">
      <div>
        <h1 class="page-title">团队管理</h1>
        <p class="page-subtitle">管理您的 AI Agent 团队</p>
      </div>
      <button class="btn-primary gap-2" @click="showCreateModal = true">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        新建团队
      </button>
    </header>

    <div v-if="teamsStore.teams.length > 0" class="teams-list">
      <TeamCard
        v-for="team in teamsStore.teams"
        :key="team.info.id"
        :team="team.info"
      />
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state card">
      <div class="empty-icon">📁</div>
      <h3>还没有团队</h3>
      <p>创建您的第一个 AI Agent 团队</p>
      <button class="btn-primary" @click="showCreateModal = true">立即创建</button>
    </div>

    <!-- 创建团队弹窗 -->
    <CreateTeamModal v-model="showCreateModal" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useTeamsStore } from '@/stores/teams'
import TeamCard from '@/components/teams/TeamCard.vue'
import CreateTeamModal from '@/components/teams/CreateTeamModal.vue'

const teamsStore = useTeamsStore()
const showCreateModal = ref(false)
</script>

<style scoped>
.teams-page {
  @apply p-6 max-w-7xl mx-auto;
}

.page-header {
  @apply flex items-center justify-between mb-8;
}

.teams-list {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
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
