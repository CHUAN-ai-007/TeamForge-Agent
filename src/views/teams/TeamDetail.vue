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
          <p class="page-subtitle">{{ team.agents.length }} 个 Agent · 创建于 {{ formatDate(team.info.createdAt, 'YYYY-MM-DD') }}</p>
        </div>
      </div>

      <div class="flex items-center gap-3">
        <button class="btn-secondary" @click="showTeamInfo = true">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          企业背景
        </button>
        <button class="btn-danger-outline" @click="confirmDelete">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          删除
        </button>
        <router-link :to="`/teams/${team.info.id}/collaboration`" class="btn-amber">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
          </svg>
          主从协作
        </router-link>
        <router-link :to="`/teams/${team.info.id}/chat`" class="btn-primary">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          进入对话
        </router-link>
      </div>
    </header>

    <!-- 主内容区：左右布局 -->
    <div class="main-content">
      <!-- 左侧：组织架构树 -->
      <aside class="org-sidebar">
        <OrgTree
          :team-id="team.info.id"
          @select="handleOrgSelect"
        />
      </aside>

      <!-- 右侧：内容区 -->
      <main class="content-area">
        <!-- 面包屑导航 -->
        <nav class="breadcrumb">
          <span
            v-for="(item, index) in breadcrumbPath"
            :key="item.id"
            class="breadcrumb-item"
            :class="{ 'is-last': index === breadcrumbPath.length - 1 }"
            @click="handleBreadcrumbClick(item.id)"
          >
            {{ item.name }}
            <svg v-if="index < breadcrumbPath.length - 1" class="separator" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </nav>

        <!-- 子组织列表 -->
        <section v-if="childOrgs.length > 0" class="section">
          <div class="section-header">
            <h2 class="section-title">
              <span v-if="currentOrg">{{ currentOrg.name }}</span>
              <span v-else>组织架构</span>
              的子部门
            </h2>
            <span class="section-count">{{ childOrgs.length }} 个</span>
          </div>
          <div class="org-cards-grid">
            <div
              v-for="org in childOrgs"
              :key="org.id"
              class="org-card"
              @click="handleOrgSelect(org.id)"
            >
              <div class="org-card-icon">{{ getOrgTypeIcon(org.type) }}</div>
              <div class="org-card-info">
                <h3 class="org-card-name">{{ org.name }}</h3>
                <p class="org-card-desc">{{ org.description || '暂无描述' }}</p>
                <span class="org-card-count">{{ getOrgAgentCount(org.id) }} 个成员</span>
              </div>
            </div>
          </div>
        </section>

        <!-- Agent 列表 -->
        <section class="section">
          <div class="section-header">
            <div class="flex items-center gap-3">
              <h2 class="section-title">
                <span v-if="currentOrg">{{ currentOrg.name }}</span>
                <span v-else>全体成员</span>
              </h2>
              <span class="section-count">{{ currentAgents.length }} 人</span>
            </div>
            <button class="btn-primary text-sm" @click="showAddAgentModal = true">
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              添加成员
            </button>
          </div>

          <!-- 空状态 -->
          <div v-if="currentAgents.length === 0" class="empty-state">
            <div class="empty-icon">👥</div>
            <h3>暂无成员</h3>
            <p>该组织下还没有添加任何成员</p>
            <button class="btn-primary" @click="showAddAgentModal = true">添加成员</button>
          </div>

          <!-- Agent 列表 -->
          <div v-else class="agents-list">
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
                  @chat="handleAgentChat"
                />
              </template>
            </draggable>
          </div>
        </section>
      </main>
    </div>

    <!-- 企业背景弹窗 -->
    <Modal v-model="showTeamInfo" title="企业背景" size="md">
      <div class="team-info-content">
        <div class="info-section">
          <h3 class="info-label">公司名称</h3>
          <p class="info-value">{{ team.info.name }}</p>
        </div>
        <div class="info-section">
          <h3 class="info-label">所属行业</h3>
          <p class="info-value">{{ team.info.industry }}</p>
        </div>
        <div class="info-section">
          <h3 class="info-label">企业简介</h3>
          <p class="info-value whitespace-pre-wrap">{{ team.info.background }}</p>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showTeamInfo = false">关闭</button>
      </template>
    </Modal>

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

    <!-- 添加成员弹窗 -->
    <Modal v-model="showAddAgentModal" title="添加成员" size="md">
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
          <select v-model="newAgentForm.orgUnitId" class="input">
            <option v-for="org in allOrgUnits" :key="org.id" :value="org.id">
              {{ org.name }}
            </option>
          </select>
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
        <button class="btn-primary" :disabled="!isFormValid" @click="handleAddAgent">确认添加</button>
      </template>
    </Modal>

    <!-- Agent 对话弹窗 -->
    <AgentChatModal v-model="showChatModal" :agent="chatAgent" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useAppStore } from '@/stores/app'
import draggable from 'vuedraggable'
import OrgTree from '@/components/teams/OrgTree.vue'
import AgentCard from '@/components/agents/AgentCard.vue'
import AgentChatModal from '@/components/agents/AgentChatModal.vue'
import Modal from '@/components/common/Modal.vue'
import { formatDate } from '@/utils'
import type { Agent, OrgUnit } from '@/types'

const router = useRouter()
const teamsStore = useTeamsStore()
const appStore = useAppStore()

const team = computed(() => teamsStore.currentTeam)
const currentOrg = computed(() => teamsStore.currentOrgUnit)

// 当前选中组织单元的子组织
const childOrgs = computed(() => {
  if (!team.value) return []
  const currentOrgId = teamsStore.currentOrgUnitId
  return team.value.orgStructure
    .filter(u => u.parentId === currentOrgId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

// 当前选中组织单元的成员
const currentAgents = computed(() => {
  if (!team.value) return []
  const currentOrgId = teamsStore.currentOrgUnitId
  const agents = currentOrgId
    ? team.value.agents.filter(a => a.orgUnitId === currentOrgId)
    : team.value.agents
  // 按 sortOrder 排序，拖拽后的顺序会被保留
  return agents.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
})

// 面包屑路径
const breadcrumbPath = computed(() => {
  if (!team.value || !teamsStore.currentOrgUnitId) return []
  return teamsStore.getOrgUnitPath(team.value.info.id, teamsStore.currentOrgUnitId)
})

// 所有组织单元（用于选择）
const allOrgUnits = computed(() => {
  if (!team.value) return []
  return team.value.orgStructure.sort((a, b) => a.name.localeCompare(b.name))
})

// 拖拽排序
const sortedAgents = ref<Agent[]>([])

watch(currentAgents, (agents) => {
  sortedAgents.value = [...agents]
}, { immediate: true })

function handleDragEnd() {
  if (!team.value) return
  // 更新当前组织内所有 agent 的 sortOrder
  sortedAgents.value.forEach((agent, index) => {
    agent.sortOrder = index
  })
  teamsStore.saveToStorage()
  appStore.showToast('排序已保存', 'success')
}

// 选中组织
function handleOrgSelect(orgId: string) {
  teamsStore.setCurrentOrgUnit(orgId)
}

// 面包屑点击
function handleBreadcrumbClick(orgId: string) {
  teamsStore.setCurrentOrgUnit(orgId)
}

// 获取组织类型图标
function getOrgTypeIcon(type: OrgUnit['type']): string {
  const icons: Record<string, string> = {
    company: '🏢',
    department: '📁',
    group: '👥',
    team: '👤',
  }
  return icons[type] || '📄'
}

// 获取组织成员数量
function getOrgAgentCount(orgId: string): number {
  if (!team.value) return 0
  return team.value.agents.filter(a => a.orgUnitId === orgId).length
}

// 弹窗控制
const showDeleteModal = ref(false)
const showAddAgentModal = ref(false)
const showTeamInfo = ref(false)

// 新成员表单
const newAgentForm = ref({
  name: '',
  role: '',
  orgUnitId: '',
  level: 'senior' as const,
  tags: '',
})

// 监听当前组织变化，更新表单的默认部门
watch(() => teamsStore.currentOrgUnitId, (orgId) => {
  if (orgId) {
    newAgentForm.value.orgUnitId = orgId
  }
}, { immediate: true })

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
    orgUnitId: newAgentForm.value.orgUnitId || teamsStore.currentOrgUnitId,
    sortOrder: 0,
    meta: {
      id: agentId,
      name: newAgentForm.value.name,
      avatar: '👤',
      role: newAgentForm.value.role,
      department: team.value.orgStructure.find(o => o.id === (newAgentForm.value.orgUnitId || teamsStore.currentOrgUnitId))?.name || '未分配',
      level: newAgentForm.value.level,
      tags: newAgentForm.value.tags.split(',').map(t => t.trim()).filter(Boolean),
      permissions: [],
      createdAt: now,
      updatedAt: now,
    },
    persona: {
      identity: `${newAgentForm.value.name}，${newAgentForm.value.role}，负责相关工作。`,
      personality: '专业、负责、善于沟通',
      background: '具备丰富的行业经验和专业知识',
      communicationStyle: '清晰、直接、友好',
      values: ['专业', '协作', '创新'],
      expertise: newAgentForm.value.tags.split(',').map(t => t.trim()).filter(Boolean),
    },
    work: {
      responsibilities: ['完成本职工作', '协助团队协作', '推动项目进展'],
      workflow: '1. 接收任务 2. 分析需求 3. 执行工作 4. 反馈结果',
      collaborationRules: ['及时沟通', '主动协作', '共享信息'],
      boundaries: ['不越级决策', '遵守流程规范'],
      kpis: ['任务完成率', '协作满意度'],
    },
    metaContent: '',
    personaContent: '',
    workContent: '',
  }

  teamsStore.addAgent(team.value.info.id, newAgent)
  appStore.showToast(`成员 "${newAgentForm.value.name}" 添加成功！`, 'success')

  // 重置表单
  newAgentForm.value = {
    name: '',
    role: '',
    orgUnitId: teamsStore.currentOrgUnitId || '',
    level: 'senior',
    tags: '',
  }
  showAddAgentModal.value = false
}

// Agent 对话
const chatAgent = ref<Agent | null>(null)
const showChatModal = ref(false)

function handleAgentChat(agent: Agent) {
  chatAgent.value = agent
  showChatModal.value = true
}
</script>

<style scoped>
.team-detail-page {
  @apply h-full flex flex-col;
}

.page-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 flex-shrink-0;
}

.btn-ghost {
  @apply p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-dark-700 transition-colors;
}

.btn-danger-outline {
  @apply inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium
         text-red-600 hover:text-red-700 hover:bg-red-50
         dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-900/20
         transition-colors;
}

.btn-amber {
  @apply inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium
         text-amber-700 hover:text-amber-800 hover:bg-amber-50
         dark:text-amber-400 dark:hover:text-amber-300 dark:hover:bg-amber-900/20
         bg-amber-100 dark:bg-amber-900/30
         transition-colors;
}

.main-content {
  @apply flex-1 flex overflow-hidden;
}

/* 左侧组织架构 */
.org-sidebar {
  @apply w-72 border-r border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 overflow-hidden;
}

/* 右侧内容区 */
.content-area {
  @apply flex-1 overflow-y-auto p-6;
}

/* 面包屑 */
.breadcrumb {
  @apply flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-6;
}

.breadcrumb-item {
  @apply flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-300 cursor-pointer transition-colors;
}

.breadcrumb-item.is-last {
  @apply text-gray-900 dark:text-white font-medium cursor-default;
}

.breadcrumb-item .separator {
  @apply w-4 h-4 mx-1;
}

/* 区块样式 */
.section {
  @apply mb-8;
}

.section-header {
  @apply flex items-center justify-between mb-4;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.section-count {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

/* 组织卡片网格 */
.org-cards-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.org-card {
  @apply p-4 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700
         cursor-pointer hover:shadow-md hover:border-primary-200 dark:hover:border-primary-800
         transition-all duration-200;
}

.org-card-icon {
  @apply text-2xl mb-3;
}

.org-card-info {
  @apply space-y-1;
}

.org-card-name {
  @apply font-medium text-gray-900 dark:text-white;
}

.org-card-desc {
  @apply text-sm text-gray-500 dark:text-gray-400 line-clamp-1;
}

.org-card-count {
  @apply text-xs text-gray-400 dark:text-gray-500;
}

/* Agent 列表 */
.agents-list {
  @apply space-y-3;
}

.agent-item {
  @apply transition-all;
}

.ghost-agent {
  @apply opacity-50 bg-primary-50 dark:bg-primary-900/20 border-2 border-dashed border-primary-500;
}

.dragging-agent {
  @apply opacity-90 shadow-2xl;
}

/* 空状态 */
.empty-state {
  @apply py-12 text-center bg-white dark:bg-dark-800 rounded-xl border border-dashed border-gray-300 dark:border-dark-600;
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

/* 表单 */
.form-group {
  @apply space-y-1.5;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

/* 团队信息弹窗 */
.team-info-content {
  @apply space-y-4;
}

.info-section {
  @apply space-y-1;
}

.info-label {
  @apply text-sm font-medium text-gray-500 dark:text-gray-400;
}

.info-value {
  @apply text-gray-900 dark:text-white;
}
</style>
