<template>
  <div class="workflow-runs-page">
    <!-- 头部 -->
    <header class="page-header">
      <div class="flex items-center gap-4">
        <button class="back-btn" @click="goBack">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 class="text-xl font-bold text-navy-900 dark:text-white">{{ workflow?.name }}</h1>
          <p class="text-sm text-navy-500 dark:text-navy-400">运行记录</p>
        </div>
      </div>
      <div class="flex items-center gap-3">
        <button class="btn-secondary" @click="goToDesigner">
          编辑工作流
        </button>
        <button class="btn-primary flex items-center gap-2" @click="runWorkflow">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          运行
        </button>
      </div>
    </header>

    <!-- 运行列表 -->
    <div class="runs-content">
      <div v-if="runs.length === 0" class="empty-state">
        <div class="text-6xl mb-4">▶️</div>
        <h3 class="text-xl font-bold text-navy-900 dark:text-white mb-2">还没有运行记录</h3>
        <p class="text-navy-500 dark:text-navy-400 mb-6">点击"运行"按钮开始执行工作流</p>
        <button class="btn-primary" @click="runWorkflow">立即运行</button>
      </div>

      <div v-else class="runs-list">
        <div
          v-for="run in runs"
          :key="run.id"
          class="run-card"
          :class="run.status"
        >
          <div class="run-header">
            <div class="flex items-center gap-3">
              <span class="run-status" :class="run.status">
                {{ getStatusText(run.status) }}
              </span>
              <span class="run-name">{{ run.name }}</span>
            </div>
            <div class="flex items-center gap-2">
              <button
                v-if="run.status === 'running'"
                class="action-btn"
                title="停止"
                @click="stopRun(run)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                </svg>
              </button>
              <button
                class="action-btn text-danger-500"
                title="删除"
                @click="confirmDelete(run)"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- 节点执行状态 -->
          <div class="run-nodes">
            <div
              v-for="node in getRunNodes(run)"
              :key="node.id"
              class="run-node"
              :class="run.nodeStates[node.id]?.status"
            >
              <div class="node-icon">{{ getNodeIcon(node.type) }}</div>
              <div class="node-info">
                <div class="node-name">{{ node.name }}</div>
                <div class="node-status">
                  {{ getNodeStatusText(run.nodeStates[node.id]?.status) }}
                </div>
              </div>
            </div>
          </div>

          <div class="run-footer">
            <div class="run-time">
              <span>开始: {{ formatDate(run.startTime) }}</span>
              <span v-if="run.endTime">结束: {{ formatDate(run.endTime) }}</span>
            </div>
            <div class="run-duration" v-if="run.endTime">
              耗时: {{ getDuration(run.startTime, run.endTime) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <Modal v-model="showDeleteModal" title="确认删除" size="sm">
      <p class="text-navy-600 dark:text-navy-300">
        确定要删除这条运行记录吗？
      </p>
      <template #footer>
        <button class="btn-secondary" @click="showDeleteModal = false">取消</button>
        <button class="btn-danger" @click="handleDelete">删除</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowsStore } from '@/stores/workflows'
import { useAppStore } from '@/stores/app'
import Modal from '@/components/common/Modal.vue'
import type { WorkflowRun, WorkflowNodeType } from '@/types'

const route = useRoute()
const router = useRouter()
const workflowsStore = useWorkflowsStore()
const appStore = useAppStore()

// 状态
const showDeleteModal = ref(false)
const deleteTarget = ref<WorkflowRun | null>(null)

// 计算属性
const workflowId = computed(() => route.params.id as string)
const workflow = computed(() => workflowsStore.workflows.find(w => w.id === workflowId.value))
const runs = computed(() => {
  return workflowsStore.workflowRuns
    .filter(r => r.workflowId === workflowId.value)
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
})

// 方法
function goBack() {
  router.push('/workflows')
}

function goToDesigner() {
  router.push(`/workflows/${workflowId.value}/design`)
}

function getNodeIcon(type: WorkflowNodeType): string {
  const icons: Record<string, string> = {
    start: '🚀',
    end: '🏁',
    task: '📋',
    approval: '✅',
    condition: '🔀'
  }
  return icons[type] || '📄'
}

function getRunNodes(run: WorkflowRun) {
  const wf = workflow.value
  if (!wf) return []
  // 按节点执行状态排序
  return wf.nodes.sort((a, b) => {
    const statusA = run.nodeStates[a.id]?.status || 'pending'
    const statusB = run.nodeStates[b.id]?.status || 'pending'
    if (statusA === 'completed') return -1
    if (statusB === 'completed') return 1
    if (statusA === 'running') return -1
    if (statusB === 'running') return 1
    return 0
  })
}

function getStatusText(status: WorkflowRun['status']): string {
  const texts: Record<string, string> = {
    running: '运行中',
    completed: '已完成',
    failed: '失败',
    paused: '已暂停'
  }
  return texts[status] || status
}

function getNodeStatusText(status?: string): string {
  const texts: Record<string, string> = {
    pending: '等待中',
    running: '执行中',
    completed: '完成',
    failed: '失败',
    skipped: '跳过'
  }
  return texts[status || 'pending'] || status || '等待中'
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function getDuration(start: string, end: string): string {
  const diff = new Date(end).getTime() - new Date(start).getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  const seconds = Math.floor((diff % (1000 * 60)) / 1000)
  if (minutes > 0) {
    return `${minutes}分${seconds}秒`
  }
  return `${seconds}秒`
}

function runWorkflow() {
  if (!workflow.value) return

  const run = workflowsStore.createRun(workflow.value.id, workflow.value.teamId)
  if (run) {
    appStore.showToast('工作流已开始运行', 'success')
  }
}

function stopRun(run: WorkflowRun) {
  workflowsStore.updateRunStatus(run.id, 'paused')
  appStore.showToast('工作流已停止', 'success')
}

function confirmDelete(run: WorkflowRun) {
  deleteTarget.value = run
  showDeleteModal.value = true
}

function handleDelete() {
  if (!deleteTarget.value) return

  const success = workflowsStore.deleteRun(deleteTarget.value.id)
  if (success) {
    appStore.showToast('删除成功', 'success')
  } else {
    appStore.showToast('删除失败', 'error')
  }

  showDeleteModal.value = false
  deleteTarget.value = null
}
</script>

<style scoped>
.workflow-runs-page {
  @apply min-h-screen bg-navy-50/50 dark:bg-navy-950/50;
}

.page-header {
  @apply flex items-center justify-between px-8 py-6 bg-white dark:bg-navy-900 border-b border-navy-200 dark:border-navy-800;
}

.back-btn {
  @apply p-2 rounded-lg text-navy-500 hover:text-navy-700 hover:bg-navy-100
         dark:text-navy-400 dark:hover:text-navy-200 dark:hover:bg-navy-800
         transition-all duration-200;
}

.runs-content {
  @apply p-8;
}

.empty-state {
  @apply flex flex-col items-center justify-center py-20;
}

.runs-list {
  @apply max-w-4xl mx-auto space-y-4;
}

.run-card {
  @apply bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 p-6
         transition-all duration-200;
}

.run-card.running {
  @apply border-primary-300 dark:border-primary-500/50 shadow-quantplay;
}

.run-card.completed {
  @apply border-success-200 dark:border-success-500/30;
}

.run-card.failed {
  @apply border-danger-200 dark:border-danger-500/30;
}

.run-header {
  @apply flex items-center justify-between mb-4;
}

.run-status {
  @apply px-3 py-1 text-xs font-semibold rounded-full;
}

.run-status.running {
  @apply bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400;
}

.run-status.completed {
  @apply bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400;
}

.run-status.failed {
  @apply bg-danger-50 dark:bg-danger-500/10 text-danger-600 dark:text-danger-400;
}

.run-status.paused {
  @apply bg-warning-50 dark:bg-warning-500/10 text-warning-600 dark:text-warning-400;
}

.run-name {
  @apply font-semibold text-navy-900 dark:text-white;
}

.run-nodes {
  @apply flex flex-wrap gap-3 mb-4;
}

.run-node {
  @apply flex items-center gap-2 px-3 py-2 rounded-xl
         bg-navy-50 dark:bg-navy-800
         border border-navy-200 dark:border-navy-700;
}

.run-node.pending {
  @apply opacity-60;
}

.run-node.running {
  @apply bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-500/30;
}

.run-node.completed {
  @apply bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/30;
}

.run-node.failed {
  @apply bg-danger-50 dark:bg-danger-500/10 border-danger-200 dark:border-danger-500/30;
}

.run-node .node-icon {
  @apply w-8 h-8 rounded-lg bg-white dark:bg-navy-700
         flex items-center justify-center text-lg;
}

.run-node .node-info {
  @apply flex flex-col;
}

.run-node .node-name {
  @apply text-sm font-medium text-navy-900 dark:text-white;
}

.run-node .node-status {
  @apply text-xs text-navy-500 dark:text-navy-400;
}

.run-footer {
  @apply flex items-center justify-between pt-4 border-t border-navy-100 dark:border-navy-800;
}

.run-time {
  @apply flex items-center gap-4 text-sm text-navy-500 dark:text-navy-400;
}

.run-duration {
  @apply text-sm font-medium text-navy-700 dark:text-navy-300;
}

.action-btn {
  @apply p-2 rounded-lg text-navy-500 hover:text-primary-600 hover:bg-primary-50
         dark:text-navy-400 dark:hover:text-primary-400 dark:hover:bg-primary-900/20
         transition-all duration-200;
}

/* 按钮 */
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
