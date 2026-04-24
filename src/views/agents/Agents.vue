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

        <!-- 操作按钮 -->
        <div class="agent-actions">
          <button class="action-btn config" @click.stop="openConfigModal(agent)">
            <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            基础配置
          </button>
          <button class="action-btn train" @click.stop="trainAgent(agent)">
            <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Agent训练
          </button>
          <button class="action-btn skill" @click.stop="manageSkills(agent)">
            <svg class="w-3.5 h-3.5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            skill
          </button>
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

    <!-- 基础配置弹窗 -->
    <Modal v-model="showConfigModal" title="基础配置" size="sm">
      <div class="space-y-4">
        <div class="form-group">
          <label class="form-label">智能体名称 <span class="text-red-500">*</span></label>
          <input
            v-model="editName"
            type="text"
            class="input"
            placeholder="请输入智能体名称"
            @keyup.enter="saveConfig"
          />
        </div>
        <div class="form-group">
          <label class="form-label">角色描述</label>
          <input
            v-model="editRole"
            type="text"
            class="input"
            placeholder="请输入角色描述"
            @keyup.enter="saveConfig"
          />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="closeConfigModal">取消</button>
        <button class="btn-primary" :disabled="!editName.trim()" @click="saveConfig">保存</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTeamsStore } from '@/stores/teams'
import Modal from '@/components/common/Modal.vue'
import type { Agent } from '@/types'

const teamsStore = useTeamsStore()

// 基础配置弹窗状态
const showConfigModal = ref(false)
const editingAgent = ref<Agent | null>(null)
const editName = ref('')
const editRole = ref('')

// 打开基础配置弹窗
function openConfigModal(agent: Agent) {
  editingAgent.value = agent
  editName.value = agent.meta.name
  editRole.value = agent.meta.role
  showConfigModal.value = true
}

// 关闭弹窗
function closeConfigModal() {
  showConfigModal.value = false
  editingAgent.value = null
  editName.value = ''
  editRole.value = ''
}

// 保存基础配置
function saveConfig() {
  if (!editingAgent.value || !editName.value.trim()) return

  teamsStore.updateAgent(editingAgent.value.teamId, editingAgent.value.id, {
    meta: {
      ...editingAgent.value.meta,
      name: editName.value.trim(),
      role: editRole.value.trim(),
      updatedAt: new Date().toISOString(),
    },
  })

  closeConfigModal()
}

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

function trainAgent(agent: typeof allAgents.value[0]) {
  // TODO: 实现智能体训练功能
  alert(`训练智能体: ${agent.meta.name}`)
}

function manageSkills(agent: typeof allAgents.value[0]) {
  // TODO: 实现技能管理功能
  alert(`管理技能: ${agent.meta.name}`)
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

.agent-actions {
  @apply flex items-center gap-2 mt-4 pt-3 border-t border-gray-200 dark:border-dark-700;
}

.action-btn {
  @apply flex-1 flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg transition-colors;
}

.action-btn.config {
  @apply bg-gray-50 dark:bg-gray-800/50 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50;
}

.action-btn.train {
  @apply bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-100 dark:hover:bg-primary-900/50;
}

.action-btn.skill {
  @apply bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50;
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
