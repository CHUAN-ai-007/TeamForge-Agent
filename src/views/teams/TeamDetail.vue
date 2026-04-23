<template>
  <div v-if="team" class="team-detail-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="flex items-center gap-4">
        <button class="btn-ghost p-2" @click="$router.back()">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <div class="flex items-center gap-3">
            <h1 class="page-title">{{ team.info.name }}</h1>
            <span class="tag tag-blue">{{ team.info.industry }}</span>
          </div>
          <p class="page-subtitle">{{ team.info.agentCount }} 个 Agent · 创建于 {{ formatDate(team.info.createdAt, 'YYYY-MM-DD') }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button class="btn-secondary" @click="confirmDelete">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          删除
        </button>
        <router-link :to="`/teams/${team.info.id}/chat`" class="btn-primary">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          进入对话
        </router-link>
      </div>
    </header>

    <!-- 团队背景 -->
    <section class="team-background">
      <h2 class="section-title">企业背景</h2>
      <div class="card p-5">
        <p class="text-gray-700 dark:text-gray-300 leading-relaxed">{{ team.info.background }}</p>
      </div>
    </section>

    <!-- Agent 列表 -->
    <section class="agents-section">
      <div class="section-header">
        <h2 class="section-title">团队成员</h2>
        <span class="text-sm text-gray-500">共 {{ team.agents.length }} 位</span>
      </div>

      <div v-if="team.agents.length > 0" class="agents-grid">
        <AgentCard
          v-for="agent in team.agents"
          :key="agent.id"
          :agent="agent"
        />
      </div>

      <div v-else class="empty-state">
        <p class="text-gray-500">该团队还没有 Agent</p>
      </div>
    </section>
  </div>

  <!-- 删除确认弹窗 -->
  <Modal v-model="showDeleteModal" title="确认删除" size="sm">
    <p class="text-gray-600 dark:text-gray-300">
      确定要删除团队 "{{ team?.info.name }}" 吗？此操作不可恢复。
    </p>
    <template #footer>
      <button class="btn-secondary" @click="showDeleteModal = false">取消</button>
      <button class="btn-danger" @click="handleDelete">确认删除</button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useAppStore } from '@/stores/app'
import AgentCard from '@/components/agents/AgentCard.vue'
import Modal from '@/components/common/Modal.vue'
import { formatDate } from '@/utils'

const route = useRoute()
const router = useRouter()
const teamsStore = useTeamsStore()
const appStore = useAppStore()

const team = computed(() => teamsStore.currentTeam)
const showDeleteModal = ref(false)

function confirmDelete() {
  showDeleteModal.value = true
}

function handleDelete() {
  if (team.value) {
    teamsStore.deleteTeam(team.value.info.id)
    appStore.showToast('团队已删除', 'success')
    router.push('/')
  }
}
</script>

<style scoped>
.team-detail-page {
  @apply p-6 max-w-7xl mx-auto space-y-6;
}

.page-header {
  @apply flex items-center justify-between;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-4;
}

.team-background {
  @apply card;
}

.team-background .section-title {
  @apply px-5 pt-5 pb-0 mb-3;
}

.agents-section {
  @apply space-y-4;
}

.section-header {
  @apply flex items-center justify-between;
}

.agents-grid {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.empty-state {
  @apply card py-8 text-center;
}
</style>
