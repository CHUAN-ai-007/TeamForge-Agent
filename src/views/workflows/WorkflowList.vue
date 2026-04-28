<template>
  <div class="workflows-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="flex items-center gap-4">
        <h1 class="text-2xl font-bold text-navy-900 dark:text-white">工作与任务</h1>
        <span class="text-sm text-navy-500 dark:text-navy-400">
          {{ filteredWorkflows.length }} 个工作流
        </span>
      </div>
      <div class="flex items-center gap-3">
        <select v-model="filterTeam" class="input text-sm py-2">
          <option value="">全部团队</option>
          <option v-for="team in teamsStore.teamList" :key="team.id" :value="team.id">
            {{ team.name }}
          </option>
        </select>
        <button class="btn-primary flex items-center gap-2" @click="showCreateModal = true">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          新建工作流
        </button>
      </div>
    </header>

    <!-- 工作流列表 -->
    <div class="workflows-content">
      <div v-if="filteredWorkflows.length === 0" class="empty-state">
        <div class="text-6xl mb-4">🔄</div>
        <h3 class="text-xl font-bold text-navy-900 dark:text-white mb-2">
          {{ workflowsStore.workflows.length === 0 ? '还没有工作流' : '没有符合条件的工作流' }}
        </h3>
        <p class="text-navy-500 dark:text-navy-400 mb-6 text-center max-w-md">
          工作流可以将多个 Agent 组织成可执行的任务流程，模拟团队协作完成复杂工作
        </p>
        <button class="btn-primary" @click="showCreateModal = true">
          创建第一个工作流
        </button>
      </div>

      <div v-else class="workflows-grid">
        <div
          v-for="workflow in filteredWorkflows"
          :key="workflow.id"
          class="workflow-card"
          :class="{ 'is-draft': workflow.status === 'draft' }"
          @click="goToDesigner(workflow.id)"
        >
          <!-- 卡片头部 -->
          <div class="workflow-card-header">
            <div class="workflow-icon">
              {{ getWorkflowIcon(workflow) }}
            </div>
            <div class="flex-1 min-w-0">
              <h3 class="workflow-name">{{ workflow.name }}</h3>
              <p class="workflow-team">{{ getTeamName(workflow.teamId) }}</p>
            </div>
            <span class="status-badge" :class="workflow.status">
              {{ workflow.status === 'draft' ? '草稿' : workflow.status === 'active' ? '活跃' : '已归档' }}
            </span>
          </div>

          <!-- 卡片内容 -->
          <p class="workflow-description">{{ workflow.description || '暂无描述' }}</p>

          <!-- 卡片统计 -->
          <div class="workflow-stats">
            <div class="stat-item">
              <span class="stat-value">{{ workflow.nodes.length }}</span>
              <span class="stat-label">节点</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ getRunCount(workflow.id) }}</span>
              <span class="stat-label">运行</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ getSuccessRate(workflow.id) }}%</span>
              <span class="stat-label">成功率</span>
            </div>
          </div>

          <!-- 卡片底部 -->
          <div class="workflow-card-footer">
            <span class="update-time">
              更新于 {{ formatDate(workflow.updatedAt) }}
            </span>
            <div class="card-actions" @click.stop>
              <button
                class="action-btn"
                title="运行"
                @click="runWorkflow(workflow)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
              <button
                class="action-btn"
                title="查看运行记录"
                @click="goToRuns(workflow.id)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </button>
              <button
                class="action-btn text-danger-500"
                title="删除"
                @click="confirmDelete(workflow)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 创建工作流弹窗 -->
    <Modal v-model="showCreateModal" title="新建工作流" size="md">
      <div class="space-y-4">
        <div class="form-group">
          <label class="form-label">所属团队 <span class="text-danger-500">*</span></label>
          <select v-model="createForm.teamId" class="input">
            <option value="">请选择团队</option>
            <option v-for="team in teamsStore.teamList" :key="team.id" :value="team.id">
              {{ team.name }}
            </option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">工作流名称 <span class="text-danger-500">*</span></label>
          <input
            v-model="createForm.name"
            type="text"
            class="input"
            placeholder="例如：产品需求分析流程"
            maxlength="50"
          >
        </div>
        <div class="form-group">
          <label class="form-label">描述</label>
          <textarea
            v-model="createForm.description"
            class="input"
            rows="3"
            placeholder="描述这个工作流的用途和场景..."
            maxlength="200"
          />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showCreateModal = false">取消</button>
        <button
          class="btn-primary"
          :disabled="!canCreate"
          @click="handleCreate"
        >
          创建
        </button>
      </template>
    </Modal>

    <!-- 删除确认弹窗 -->
    <Modal v-model="showDeleteModal" title="确认删除" size="sm">
      <p class="text-navy-600 dark:text-navy-300">
        确定要删除工作流 "{{ deleteTarget?.name }}" 吗？<br>
        <span class="text-sm text-navy-400">此操作不可恢复，相关的运行记录也将被删除</span>
      </p>
      <template #footer>
        <button class="btn-secondary" @click="showDeleteModal = false">取消</button>
        <button class="btn-danger" @click="handleDelete">删除</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useWorkflowsStore } from '@/stores/workflows'
import { useTeamsStore } from '@/stores/teams'
import { useAppStore } from '@/stores/app'
import Modal from '@/components/common/Modal.vue'
import type { Workflow } from '@/types'

const router = useRouter()
const workflowsStore = useWorkflowsStore()
const teamsStore = useTeamsStore()
const appStore = useAppStore()

// 筛选和状态
const filterTeam = ref('')
const showCreateModal = ref(false)
const showDeleteModal = ref(false)
const deleteTarget = ref<Workflow | null>(null)

// 创建表单
const createForm = ref({
  teamId: '',
  name: '',
  description: ''
})

// 过滤后的工作流
const filteredWorkflows = computed(() => {
  let list = workflowsStore.workflows
  if (filterTeam.value) {
    list = list.filter(w => w.teamId === filterTeam.value)
  }
  return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
})

// 是否可以创建
const canCreate = computed(() => {
  return createForm.value.teamId && createForm.value.name.trim()
})

// 获取团队名称
function getTeamName(teamId: string): string {
  const team = teamsStore.teams.find(t => t.info.id === teamId)
  return team?.info.name || '未知团队'
}

// 获取工作流图标
function getWorkflowIcon(workflow: Workflow): string {
  const nodeCount = workflow.nodes.length
  if (nodeCount <= 3) return '📋'
  if (nodeCount <= 6) return '📊'
  return '🔄'
}

// 获取运行次数
function getRunCount(workflowId: string): number {
  return workflowsStore.workflowRuns.filter(r => r.workflowId === workflowId).length
}

// 获取成功率
function getSuccessRate(workflowId: string): number {
  const runs = workflowsStore.workflowRuns.filter(r => r.workflowId === workflowId)
  if (runs.length === 0) return 0
  const success = runs.filter(r => r.status === 'completed').length
  return Math.round((success / runs.length) * 100)
}

// 格式化日期
function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))

  if (days === 0) {
    const hours = Math.floor(diff / (1000 * 60 * 60))
    if (hours === 0) {
      const minutes = Math.floor(diff / (1000 * 60))
      return minutes <= 1 ? '刚刚' : `${minutes} 分钟前`
    }
    return `${hours} 小时前`
  }
  if (days === 1) return '昨天'
  if (days < 7) return `${days} 天前`
  if (days < 30) return `${Math.floor(days / 7)} 周前`

  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

// 跳转到设计器
function goToDesigner(workflowId: string) {
  router.push(`/workflows/${workflowId}/design`)
}

// 跳转到运行记录
function goToRuns(workflowId: string) {
  router.push(`/workflows/${workflowId}/runs`)
}

// 运行工作流
async function runWorkflow(workflow: Workflow) {
  const run = workflowsStore.createRun(workflow.id, workflow.teamId)
  if (run) {
    appStore.showToast('工作流已开始运行', 'success')
    router.push(`/workflows/${workflow.id}/runs`)
  } else {
    appStore.showToast('运行失败', 'error')
  }
}

// 确认删除
function confirmDelete(workflow: Workflow) {
  deleteTarget.value = workflow
  showDeleteModal.value = true
}

// 执行删除
function handleDelete() {
  if (!deleteTarget.value) return

  const success = workflowsStore.deleteWorkflow(deleteTarget.value.id)
  if (success) {
    appStore.showToast('删除成功', 'success')
  } else {
    appStore.showToast('删除失败', 'error')
  }

  showDeleteModal.value = false
  deleteTarget.value = null
}

// 创建工作流
function handleCreate() {
  if (!canCreate.value) return

  const workflow = workflowsStore.createWorkflow(
    createForm.value.teamId,
    createForm.value.name.trim(),
    createForm.value.description.trim()
  )

  appStore.showToast('工作流创建成功', 'success')
  showCreateModal.value = false

  // 重置表单
  createForm.value = { teamId: '', name: '', description: '' }

  // 跳转到设计器
  router.push(`/workflows/${workflow.id}/design`)
}
</script>

<style scoped>
.workflows-page {
  @apply min-h-screen bg-navy-50/50 dark:bg-navy-950/50;
}

.page-header {
  @apply flex items-center justify-between px-8 py-6 bg-white dark:bg-navy-900 border-b border-navy-200 dark:border-navy-800;
}

.workflows-content {
  @apply p-8;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-20;
}

.workflows-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6;
}

.workflow-card {
  @apply bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800
         p-5 cursor-pointer transition-all duration-200
         hover:shadow-card-hover hover:-translate-y-0.5;
}

.workflow-card.is-draft {
  @apply border-dashed border-navy-300 dark:border-navy-700;
}

.workflow-card-header {
  @apply flex items-start gap-3 mb-3;
}

.workflow-icon {
  @apply w-12 h-12 text-2xl bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900/30 dark:to-primary-800/20
         rounded-xl flex items-center justify-center flex-shrink-0;
}

.workflow-name {
  @apply font-bold text-navy-900 dark:text-white truncate;
}

.workflow-team {
  @apply text-sm text-navy-500 dark:text-navy-400;
}

.status-badge {
  @apply px-2.5 py-1 text-xs font-semibold rounded-full flex-shrink-0;
}

.status-badge.draft {
  @apply bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-400;
}

.status-badge.active {
  @apply bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400 border border-success-200 dark:border-success-500/20;
}

.status-badge.archived {
  @apply bg-warning-50 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400;
}

.workflow-description {
  @apply text-sm text-navy-600 dark:text-navy-400 line-clamp-2 mb-4 min-h-[2.5rem];
}

.workflow-stats {
  @apply flex gap-4 py-3 border-t border-b border-navy-100 dark:border-navy-800 mb-4;
}

.stat-item {
  @apply flex flex-col;
}

.stat-value {
  @apply text-lg font-bold text-navy-900 dark:text-white;
}

.stat-label {
  @apply text-xs text-navy-500 dark:text-navy-400;
}

.workflow-card-footer {
  @apply flex items-center justify-between;
}

.update-time {
  @apply text-xs text-navy-400 dark:text-navy-500;
}

.card-actions {
  @apply flex items-center gap-1;
}

.action-btn {
  @apply p-2 rounded-lg text-navy-500 hover:text-primary-600 hover:bg-primary-50
         dark:text-navy-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20
         transition-all duration-200;
}

/* 表单样式 */
.form-group {
  @apply space-y-1.5;
}

.form-label {
  @apply block text-sm font-semibold text-navy-700 dark:text-navy-300;
}

.input {
  @apply w-full px-4 py-2.5 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl
         text-navy-900 dark:text-white placeholder-navy-400
         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
         transition-all duration-200;
}

.btn-primary {
  @apply px-5 py-2.5 text-sm font-semibold text-white
         bg-gradient-to-br from-primary-500 to-primary-600
         rounded-xl hover:from-primary-600 hover:to-primary-700
         disabled:opacity-50 disabled:cursor-not-allowed
         transition-all duration-200 shadow-quantplay;
}

.btn-secondary {
  @apply px-5 py-2.5 text-sm font-semibold text-navy-700 dark:text-navy-300
         bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700
         rounded-xl hover:bg-navy-50 dark:hover:bg-navy-700 transition-all duration-200;
}

.btn-danger {
  @apply px-5 py-2.5 text-sm font-semibold text-white
         bg-gradient-to-br from-danger-500 to-danger-600
         rounded-xl hover:from-danger-600 hover:to-danger-700
         transition-all duration-200;
}
</style>
