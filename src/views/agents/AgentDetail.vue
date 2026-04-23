<template>
  <div v-if="agent && team" class="agent-detail-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="flex items-center gap-4">
        <button class="btn-ghost p-2" @click="$router.back()">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>

        <div class="agent-header-info">
          <div class="flex items-center gap-3">
            <span class="text-4xl">{{ agent.meta.avatar }}</span>
            <div>
              <h1 class="page-title">{{ agent.meta.name }}</h1>
              <div class="flex items-center gap-2 mt-1">
                <span class="text-gray-500 dark:text-gray-400">{{ agent.meta.role }}</span>
                <span class="text-gray-300">·</span>
                <span class="level-badge" :class="`level-${agent.meta.level}`">
                  {{ levelText[agent.meta.level] }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="btn-secondary" @click="confirmDelete">
        <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
        </svg>
        删除
      </button>
    </header>

    <!-- 简介 -->
    <section class="agent-intro">
      <div class="card p-5">
        <div class="flex flex-wrap gap-2 mb-4">
          <span v-for="tag in agent.meta.tags" :key="tag" class="tag tag-blue">{{ tag }}</span>
        </div>
        <p class="text-gray-700 dark:text-gray-300">
          {{ agent.persona.identity.slice(0, 200) }}...
        </p>
      </div>
    </section>

    <!-- 文档内容 -->
    <section class="agent-documents">
      <AgentDocuments :agent="agent" />
    </section>
  </div>

  <!-- 删除确认弹窗 -->
  <Modal v-model="showDeleteModal" title="确认删除" size="sm">
    <p class="text-gray-600 dark:text-gray-300">
      确定要删除 Agent "{{ agent?.meta.name }}" 吗？此操作不可恢复。
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
import AgentDocuments from '@/components/agents/AgentDocuments.vue'
import Modal from '@/components/common/Modal.vue'

const route = useRoute()
const router = useRouter()
const teamsStore = useTeamsStore()
const appStore = useAppStore()

const teamId = computed(() => route.params.teamId as string)
const agentId = computed(() => route.params.agentId as string)

const team = computed(() => teamsStore.getTeam(teamId.value))
const agent = computed(() => teamsStore.getAgent(teamId.value, agentId.value))

const showDeleteModal = ref(false)

const levelText = {
  junior: '初级',
  senior: '资深',
  lead: '主管',
  executive: '高管',
}

function confirmDelete() {
  showDeleteModal.value = true
}

function handleDelete() {
  if (agent.value && team.value) {
    teamsStore.deleteAgent(team.value.info.id, agent.value.id)
    appStore.showToast('Agent 已删除', 'success')
    router.push(`/teams/${team.value.info.id}`)
  }
}
</script>

<style scoped>
.agent-detail-page {
  @apply p-6 max-w-5xl mx-auto space-y-6;
}

.page-header {
  @apply flex items-center justify-between;
}

.agent-header-info {
  @apply flex items-center gap-4;
}

.level-badge {
  @apply px-2 py-0.5 text-xs font-medium rounded;
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

.agent-intro {
  @apply space-y-2;
}

.agent-documents {
  @apply space-y-2;
}
</style>
