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
        <div class="flex items-center gap-3">
          <h2 class="section-title !mb-0">团队成员</h2>
          <span class="text-sm text-gray-500">共 {{ team.agents.length }} 位</span>
        </div>
        <button class="btn-primary text-sm" @click="showAddAgentModal = true">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          添加智能体
        </button>
      </div>

      <div v-if="team.agents.length > 0" class="agents-section">
        <p class="drag-hint mb-3 text-sm text-gray-500">
          <svg class="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
          拖拽智能体可调整顺序，第一位为团队负责人
        </p>
        <draggable
          v-model="sortedAgents"
          item-key="id"
          handle=".drag-handle"
          animation="200"
          ghost-class="ghost-agent"
          drag-class="dragging-agent"
          @end="handleDragEnd"
        >
          <template #item="{ element, index }">
            <AgentCard
              :agent="element"
              :is-leader="index === 0"
              :draggable="true"
              class="agent-item"
            />
          </template>
        </draggable>
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

  <!-- 添加智能体弹窗 -->
  <Modal v-model="showAddAgentModal" title="添加智能体" size="md">
    <div class="space-y-4">
      <div class="form-group">
        <label class="form-label">智能体名称 <span class="text-red-500">*</span></label>
        <input v-model="newAgentForm.name" type="text" class="input" placeholder="例如：产品经理">
      </div>
      <div class="form-group">
        <label class="form-label">岗位角色 <span class="text-red-500">*</span></label>
        <input v-model="newAgentForm.role" type="text" class="input" placeholder="例如：高级产品经理">
      </div>
      <div class="form-group">
        <label class="form-label">所属部门</label>
        <input v-model="newAgentForm.department" type="text" class="input" placeholder="例如：产品部">
      </div>
      <div class="form-group">
        <label class="form-label">职级</label>
        <select v-model="newAgentForm.level" class="input">
          <option value="junior">初级</option>
          <option value="senior">资深</option>
          <option value="lead">主管</option>
          <option value="executive">高管</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">能力标签（用逗号分隔）</label>
        <input v-model="newAgentForm.tags" type="text" class="input" placeholder="例如：产品规划,需求分析,用户研究">
      </div>
    </div>
    <template #footer>
      <button class="btn-secondary" @click="showAddAgentModal = false">取消</button>
      <button class="btn-primary" @click="handleAddAgent" :disabled="!isFormValid">确认添加</button>
    </template>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useAppStore } from '@/stores/app'
import draggable from 'vuedraggable'
import AgentCard from '@/components/agents/AgentCard.vue'
import Modal from '@/components/common/Modal.vue'
import { formatDate } from '@/utils'
import type { Agent } from '@/types'

const route = useRoute()
const router = useRouter()
const teamsStore = useTeamsStore()
const appStore = useAppStore()

const team = computed(() => teamsStore.currentTeam)

// 排序后的智能体列表
const sortedAgents = ref<Agent[]>([])

// 同步团队智能体数据到排序列表
watch(() => team.value?.agents, (agents) => {
  if (agents) {
    sortedAgents.value = [...agents]
  }
}, { immediate: true })

// 拖拽结束处理
function handleDragEnd() {
  if (!team.value) return

  // 更新团队中的智能体顺序
  team.value.agents = [...sortedAgents.value]

  // 保存到 localStorage
  teamsStore.saveToStorage()

  // 显示提示
  appStore.showToast('排序已保存', 'success')
}
const showDeleteModal = ref(false)
const showAddAgentModal = ref(false)

// 新智能体表单
const newAgentForm = ref({
  name: '',
  role: '',
  department: '',
  level: 'senior' as const,
  tags: ''
})

// 表单验证
const isFormValid = computed(() => {
  return newAgentForm.value.name.trim() && newAgentForm.value.role.trim()
})

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

function handleAddAgent() {
  if (!team.value || !isFormValid.value) return

  const now = new Date().toISOString()
  const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const newAgent: Agent = {
    id: agentId,
    teamId: team.value.info.id,
    meta: {
      id: agentId,
      name: newAgentForm.value.name,
      avatar: '👤',
      role: newAgentForm.value.role,
      department: newAgentForm.value.department || '未分配',
      level: newAgentForm.value.level,
      tags: newAgentForm.value.tags.split(',').map(t => t.trim()).filter(Boolean),
      permissions: [],
      createdAt: now,
      updatedAt: now
    },
    persona: {
      identity: `${newAgentForm.value.name}，${newAgentForm.value.role}，负责${newAgentForm.value.department || '团队'}相关工作。`,
      personality: '专业、负责、善于沟通',
      background: '具备丰富的行业经验和专业知识',
      communicationStyle: '清晰、直接、友好',
      values: ['专业', '协作', '创新'],
      expertise: newAgentForm.value.tags.split(',').map(t => t.trim()).filter(Boolean)
    },
    work: {
      responsibilities: ['完成本职工作', '协助团队协作', '推动项目进展'],
      workflow: '1. 接收任务 2. 分析需求 3. 执行工作 4. 反馈结果',
      collaborationRules: ['及时沟通', '主动协作', '共享信息'],
      boundaries: ['不越级决策', '遵守流程规范'],
      kpis: ['任务完成率', '协作满意度']
    },
    metaContent: '',
    personaContent: '',
    workContent: ''
  }

  teamsStore.addAgent(team.value.info.id, newAgent)
  appStore.showToast(`智能体 "${newAgentForm.value.name}" 添加成功！`, 'success')

  // 重置表单并关闭弹窗
  newAgentForm.value = {
    name: '',
    role: '',
    department: '',
    level: 'senior',
    tags: ''
  }
  showAddAgentModal.value = false
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

.form-group {
  @apply space-y-1.5;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

/* 拖拽相关样式 */
.agents-section {
  @apply space-y-2;
}

.agent-item {
  @apply mb-3;
}

.ghost-agent {
  @apply opacity-50 bg-primary-50 dark:bg-primary-900/20 border-2 border-dashed border-primary-500;
}

.dragging-agent {
  @apply opacity-90 shadow-2xl scale-[1.02];
}

.drag-hint {
  @apply flex items-center px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg;
}
</style>
