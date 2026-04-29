<template>
  <div class="collaboration-page">
    <!-- 页面头部 -->
    <header class="page-header">
      <div class="flex items-center gap-4">
        <button class="btn-secondary" @click="$router.back()">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 class="page-title">{{ currentTeam?.info.name || '团队' }} - 主从协作</h1>
          <p class="page-subtitle">主Agent拆解任务，子Agent协同执行</p>
        </div>
      </div>
      <button class="btn-primary gap-2" @click="showNewTaskModal = true">
        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
        </svg>
        新建协作任务
      </button>
    </header>

    <div class="collaboration-layout">
      <!-- 左侧任务列表 -->
      <aside class="task-sidebar">
        <div class="sidebar-header">
          <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">协作任务</h3>
          <span class="text-xs text-gray-500">{{ tasks.length }} 个任务</span>
        </div>
        <div class="task-list">
          <div
            v-for="task in tasks"
            :key="task.id"
            class="task-item"
            :class="{ active: currentTaskId === task.id }"
            @click="selectTask(task.id)"
          >
            <div class="flex items-start gap-3">
              <div class="task-status-icon" :class="task.status">
                <svg v-if="task.status === 'completed'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <svg v-else-if="task.status === 'error'" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                <svg v-else-if="task.status === 'executing'" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="task-title">{{ task.title }}</p>
                <p class="task-meta">{{ formatDate(task.updatedAt) }}</p>
                <div class="mt-2">
                  <div class="progress-bar">
                    <div class="progress-fill" :style="{ width: `${task.progress}%` }" :class="task.status"></div>
                  </div>
                  <span class="text-xs text-gray-500">{{ task.progress }}%</span>
                </div>
              </div>
            </div>
          </div>
          <div v-if="tasks.length === 0" class="empty-tasks">
            <p class="text-sm text-gray-500">暂无协作任务</p>
            <p class="text-xs text-gray-400 mt-1">点击右上角新建任务</p>
          </div>
        </div>
      </aside>

      <!-- 右侧主内容区 -->
      <main class="task-content">
        <div v-if="!currentTask" class="empty-state">
          <div class="empty-icon">
            <svg class="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 class="empty-title">选择一个任务开始</h3>
          <p class="empty-desc">或创建新的协作任务</p>
        </div>

        <template v-else>
          <!-- 任务头部信息 -->
          <div class="task-header">
            <div class="flex items-center justify-between">
              <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ currentTask.title }}</h2>
              <div class="flex items-center gap-2">
                <span class="status-badge" :class="currentTask.status">{{ statusText }}</span>
                <button
                  v-if="canStop"
                  class="btn-danger"
                  @click="stopTask"
                >
                  停止
                </button>
                <button
                  v-else-if="currentTask.status === 'completed'"
                  class="btn-secondary"
                  @click="copyResult"
                >
                  复制结果
                </button>
              </div>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mt-2">{{ currentTask.description }}</p>
            <div class="mt-4 flex items-center gap-4 text-sm">
              <span class="text-gray-500">
                主Agent: <strong class="text-gray-700 dark:text-gray-300">{{ currentTask.leaderAgentName }}</strong>
              </span>
              <span class="text-gray-500">
                子任务: <strong class="text-gray-700 dark:text-gray-300">{{ completedSubTasks }}/{{ currentTask.subTasks.length }}</strong>
              </span>
            </div>
          </div>

          <!-- 执行进度 -->
          <div v-if="progressMessage" class="progress-toast">
            <svg class="w-5 h-5 animate-spin text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>{{ progressMessage }}</span>
          </div>

          <!-- 子任务列表 -->
          <div v-if="currentTask.subTasks.length > 0" class="subtasks-section">
            <h3 class="section-title">子任务执行状态</h3>
            <div class="subtasks-grid">
              <div
                v-for="subTask in currentTask.subTasks"
                :key="subTask.id"
                class="subtask-card"
                :class="subTask.status"
                @click="showSubTaskDetail(subTask)"
              >
                <div class="flex items-start justify-between">
                  <div class="flex items-center gap-2">
                    <div class="status-dot" :class="subTask.status"></div>
                    <span class="agent-name">{{ subTask.agentName }}</span>
                  </div>
                  <button
                    v-if="subTask.status === 'failed'"
                    class="retry-btn"
                    @click.stop="retrySubTask(subTask.id)"
                  >
                    重试
                  </button>
                </div>
                <h4 class="subtask-title">{{ subTask.title }}</h4>
                <p class="subtask-desc">{{ subTask.description }}</p>
                <div v-if="subTask.dependencies.length > 0" class="dependencies">
                  <span class="text-xs text-gray-500">依赖:</span>
                  <span
                    v-for="depId in subTask.dependencies"
                    :key="depId"
                    class="dep-tag"
                  >
                    {{ getSubTaskTitle(depId) }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 执行计划 -->
          <div v-if="currentTask.executionPlan" class="plan-section">
            <h3 class="section-title">执行计划</h3>
            <div class="plan-content">
              <MarkdownViewer :content="currentTask.executionPlan" />
            </div>
          </div>

          <!-- 最终输出 -->
          <div v-if="currentTask.finalOutput" class="result-section">
            <h3 class="section-title">最终交付物</h3>
            <div class="result-content">
              <MarkdownViewer :content="currentTask.finalOutput" />
            </div>
          </div>

          <!-- 消息时间线 -->
          <div class="messages-section">
            <h3 class="section-title">协作过程</h3>
            <div class="messages-timeline">
              <div
                v-for="msg in currentTask.messages"
                :key="msg.id"
                class="message-item"
                :class="msg.role"
              >
                <div class="message-avatar" :class="msg.role">
                  {{ getAvatarText(msg) }}
                </div>
                <div class="message-content">
                  <div class="message-header">
                    <span class="message-author">{{ getAuthorName(msg) }}</span>
                    <span class="message-time">{{ formatTime(msg.timestamp) }}</span>
                  </div>
                  <div class="message-body">
                    <div v-if="msg.type === 'plan'" class="message-type-tag plan">执行计划</div>
                    <div v-if="msg.type === 'task_assignment'" class="message-type-tag assignment">任务分配</div>
                    <div v-if="msg.type === 'task_result'" class="message-type-tag result">任务结果</div>
                    <div v-if="msg.type === 'summary'" class="message-type-tag summary">最终汇总</div>
                    <MarkdownViewer :content="msg.content" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </template>
      </main>
    </div>

    <!-- 新建任务弹窗 -->
    <Modal v-model="showNewTaskModal" title="新建协作任务" size="lg">
      <div class="space-y-4">
        <div>
          <label class="form-label">任务标题</label>
          <input v-model="newTaskForm.title" type="text" class="form-input" placeholder="输入任务标题">
        </div>
        <div>
          <label class="form-label">任务描述</label>
          <textarea v-model="newTaskForm.description" class="form-textarea" rows="4" placeholder="详细描述需要完成的任务..."></textarea>
        </div>
        <div>
          <label class="form-label">主Agent (负责人)</label>
          <div class="leader-select">
            <div
              v-if="leaderAgent"
              class="leader-card"
            >
              <div class="leader-avatar">{{ leaderAgent.meta.name[0] }}</div>
              <div class="leader-info">
                <p class="leader-name">{{ leaderAgent.meta.name }}</p>
                <p class="leader-role">{{ leaderAgent.meta.role }}</p>
              </div>
              <span class="leader-badge">负责人</span>
            </div>
            <p v-else class="text-sm text-red-500">未检测到负责人，请确保团队中有Agent标记为"负责人"或职级较高</p>
          </div>
        </div>
        <div v-if="subAgents.length > 0">
          <label class="form-label">子Agent ({{ subAgents.length }}位)</label>
          <div class="sub-agents-list">
            <div v-for="agent in subAgents" :key="agent.id" class="sub-agent-tag">
              {{ agent.meta.name }} - {{ agent.meta.role }}
            </div>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showNewTaskModal = false">取消</button>
        <button
          class="btn-primary"
          :disabled="!canCreateTask"
          @click="createTask"
        >
          {{ isCreating ? '创建中...' : '开始协作' }}
        </button>
      </template>
    </Modal>

    <!-- 子任务详情弹窗 -->
    <Modal v-model="showSubTaskModal" :title="selectedSubTask?.title || ''" size="lg">
      <div v-if="selectedSubTask" class="space-y-4">
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <div class="status-dot" :class="selectedSubTask.status"></div>
            <span class="text-sm font-medium">{{ subTaskStatusText }}</span>
          </div>
          <span class="text-sm text-gray-500">执行者: {{ selectedSubTask.agentName }}</span>
        </div>
        <div>
          <h4 class="text-sm font-medium text-gray-700 mb-2">任务描述</h4>
          <p class="text-gray-600">{{ selectedSubTask.description }}</p>
        </div>
        <div v-if="selectedSubTask.output">
          <h4 class="text-sm font-medium text-gray-700 mb-2">执行结果</h4>
          <div class="subtask-output">
            <MarkdownViewer :content="selectedSubTask.output" />
          </div>
        </div>
        <div v-if="selectedSubTask.error" class="error-box">
          <h4 class="text-sm font-medium text-red-700 mb-1">错误信息</h4>
          <p class="text-red-600 text-sm">{{ selectedSubTask.error }}</p>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showSubTaskModal = false">关闭</button>
        <button
          v-if="selectedSubTask?.status === 'failed'"
          class="btn-primary"
          @click="retrySubTask(selectedSubTask.id)"
        >
          重试任务
        </button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useCollaborationStore } from '@/stores/collaboration'
import { useAppStore } from '@/stores/app'
import type { SubTask, CollaborationMessage } from '@/types'
import * as collaborationUtils from '@/utils/collaboration'
import MarkdownViewer from '@/components/common/MarkdownViewer.vue'
import Modal from '@/components/common/Modal.vue'

const route = useRoute()
const router = useRouter()
const teamsStore = useTeamsStore()
const collaborationStore = useCollaborationStore()
const appStore = useAppStore()

// 团队ID
const teamId = computed(() => route.params.id as string)

// 当前团队
const currentTeam = computed(() => {
  return teamsStore.getTeam(teamId.value)
})

// 识别主Agent
const leaderAgent = computed(() => {
  if (!currentTeam.value) return null
  return collaborationUtils.identifyLeaderAgent(currentTeam.value.agents)
})

// 子Agent列表
const subAgents = computed(() => {
  if (!currentTeam.value || !leaderAgent.value) return []
  return collaborationUtils.getSubAgents(currentTeam.value.agents, leaderAgent.value.id)
})

// 任务列表
const tasks = computed(() => {
  return collaborationStore.teamTasks(teamId.value).map(t => ({
    ...t,
    progress: collaborationUtils.calculateProgress(t)
  }))
})

// 当前选中任务
const currentTaskId = computed({
  get: () => collaborationStore.currentTaskId,
  set: (id) => collaborationStore.setCurrentTask(id)
})

const currentTask = computed(() => collaborationStore.currentTask)

// 状态计算
const statusText = computed(() => {
  const statusMap: Record<string, string> = {
    'pending': '待开始',
    'analyzing': '分析中',
    'assigning': '分配中',
    'executing': '执行中',
    'reviewing': '汇总中',
    'completed': '已完成',
    'error': '失败'
  }
  return statusMap[currentTask.value?.status || 'pending']
})

const completedSubTasks = computed(() => {
  return currentTask.value?.subTasks.filter(t => t.status === 'completed').length || 0
})

const canStop = computed(() => {
  return collaborationStore.isProcessing && ['analyzing', 'assigning', 'executing', 'reviewing'].includes(currentTask.value?.status || '')
})

// 新建任务表单
const showNewTaskModal = ref(false)
const isCreating = ref(false)
const newTaskForm = ref({
  title: '',
  description: ''
})

const canCreateTask = computed(() => {
  return newTaskForm.value.title.trim() &&
         newTaskForm.value.description.trim() &&
         leaderAgent.value &&
         subAgents.value.length > 0 &&
         !isCreating.value
})

// 进度消息
const progressMessage = ref('')

// 子任务详情
const showSubTaskModal = ref(false)
const selectedSubTask = ref<SubTask | null>(null)

const subTaskStatusText = computed(() => {
  const statusMap: Record<string, string> = {
    'pending': '待执行',
    'assigned': '已分配',
    'executing': '执行中',
    'completed': '已完成',
    'failed': '失败'
  }
  return statusMap[selectedSubTask.value?.status || 'pending']
})

// 方法
function selectTask(id: string) {
  collaborationStore.setCurrentTask(id)
}

async function createTask() {
  if (!canCreateTask.value || !leaderAgent.value || !currentTeam.value) return

  isCreating.value = true
  progressMessage.value = '正在初始化协作任务...'

  try {
    const task = collaborationStore.createTask(
      teamId.value,
      newTaskForm.value.title,
      newTaskForm.value.description,
      leaderAgent.value
    )

    showNewTaskModal.value = false
    newTaskForm.value = { title: '', description: '' }

    // 自动开始执行
    await collaborationStore.executeCollaboration(
      task.id,
      currentTeam.value,
      (msg) => { progressMessage.value = msg }
    )

    appStore.showToast('协作任务完成', 'success')
  } catch (error) {
    const msg = error instanceof Error ? error.message : '创建失败'
    appStore.showToast(msg, 'error')
  } finally {
    isCreating.value = false
    progressMessage.value = ''
  }
}

function stopTask() {
  collaborationStore.stopTask()
  progressMessage.value = ''
  appStore.showToast('任务已停止', 'warning')
}

function copyResult() {
  if (!currentTask.value?.finalOutput) return
  navigator.clipboard.writeText(currentTask.value.finalOutput)
  appStore.showToast('已复制到剪贴板', 'success')
}

function showSubTaskDetail(subTask: SubTask) {
  selectedSubTask.value = subTask
  showSubTaskModal.value = true
}

function getSubTaskTitle(id: string): string {
  const task = currentTask.value?.subTasks.find(t => t.id === id)
  return task ? task.title : id
}

async function retrySubTask(subTaskId: string) {
  if (!currentTeam.value) return

  try {
    await collaborationStore.retrySubTask(currentTaskId.value!, subTaskId, currentTeam.value)
    appStore.showToast('子任务已重新执行', 'success')
    showSubTaskModal.value = false
  } catch (error) {
    appStore.showToast('重试失败', 'error')
  }
}

function getAvatarText(msg: CollaborationMessage): string {
  if (msg.role === 'user') return '我'
  if (msg.role === 'leader') return '主'
  if (msg.role === 'sub') return msg.agentName?.[0] || '子'
  return '系'
}

function getAuthorName(msg: CollaborationMessage): string {
  if (msg.role === 'user') return '我'
  if (msg.role === 'leader') return `${msg.agentName || '主Agent'} (负责人)`
  if (msg.role === 'sub') return msg.agentName || '子Agent'
  return '系统'
}

function formatDate(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function formatTime(timestamp: number): string {
  const date = new Date(timestamp)
  return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
}

// 初始化
onMounted(() => {
  if (!currentTeam.value) {
    router.push('/')
    return
  }

  // 如果没有负责人，显示提示
  if (!leaderAgent.value) {
    appStore.showToast('未检测到负责人Agent，请先在团队详情中设置', 'warning')
  }
})
</script>

<style scoped>
.collaboration-page {
  @apply h-[calc(100vh-4rem)] flex flex-col;
}

.page-header {
  @apply flex items-center justify-between px-6 py-4 bg-white dark:bg-dark-800 border-b border-gray-200 dark:border-dark-700;
}

.page-title {
  @apply text-xl font-semibold text-gray-900 dark:text-white;
}

.page-subtitle {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.collaboration-layout {
  @apply flex-1 flex overflow-hidden;
}

/* 侧边栏 */
.task-sidebar {
  @apply w-80 bg-gray-50 dark:bg-dark-900 border-r border-gray-200 dark:border-dark-700 flex flex-col;
}

.sidebar-header {
  @apply px-4 py-3 border-b border-gray-200 dark:border-dark-700 flex items-center justify-between;
}

.task-list {
  @apply flex-1 overflow-y-auto p-3 space-y-2;
}

.task-item {
  @apply p-3 bg-white dark:bg-dark-800 rounded-lg cursor-pointer transition-all hover:shadow-md;
  @apply border border-transparent hover:border-gray-200 dark:hover:border-dark-600;
}

.task-item.active {
  @apply border-primary-500 ring-1 ring-primary-500;
}

.task-status-icon {
  @apply w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0;
}

.task-status-icon.pending { @apply bg-gray-100 text-gray-500; }
.task-status-icon.analyzing { @apply bg-blue-100 text-blue-600; }
.task-status-icon.assigning { @apply bg-yellow-100 text-yellow-600; }
.task-status-icon.executing { @apply bg-purple-100 text-purple-600; }
.task-status-icon.reviewing { @apply bg-orange-100 text-orange-600; }
.task-status-icon.completed { @apply bg-green-100 text-green-600; }
.task-status-icon.error { @apply bg-red-100 text-red-600; }

.task-title {
  @apply text-sm font-medium text-gray-900 dark:text-white truncate;
}

.task-meta {
  @apply text-xs text-gray-500 mt-1;
}

.progress-bar {
  @apply h-1.5 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full rounded-full transition-all duration-500;
}

.progress-fill.pending { @apply bg-gray-400; }
.progress-fill.analyzing { @apply bg-blue-500; }
.progress-fill.assigning { @apply bg-yellow-500; }
.progress-fill.executing { @apply bg-purple-500; }
.progress-fill.reviewing { @apply bg-orange-500; }
.progress-fill.completed { @apply bg-green-500; }
.progress-fill.error { @apply bg-red-500; }

.empty-tasks {
  @apply text-center py-8;
}

/* 主内容区 */
.task-content {
  @apply flex-1 overflow-y-auto p-6 bg-white dark:bg-dark-800;
}

.empty-state {
  @apply h-full flex flex-col items-center justify-center text-center;
}

.empty-icon {
  @apply text-gray-300 dark:text-dark-600 mb-4;
}

.empty-title {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-2;
}

.empty-desc {
  @apply text-gray-500 dark:text-gray-400;
}

.task-header {
  @apply pb-6 border-b border-gray-200 dark:border-dark-700 mb-6;
}

.status-badge {
  @apply px-3 py-1 rounded-full text-xs font-medium;
}

.status-badge.pending { @apply bg-gray-100 text-gray-700; }
.status-badge.analyzing { @apply bg-blue-100 text-blue-700; }
.status-badge.assigning { @apply bg-yellow-100 text-yellow-700; }
.status-badge.executing { @apply bg-purple-100 text-purple-700; }
.status-badge.reviewing { @apply bg-orange-100 text-orange-700; }
.status-badge.completed { @apply bg-green-100 text-green-700; }
.status-badge.error { @apply bg-red-100 text-red-700; }

.progress-toast {
  @apply fixed bottom-6 right-6 flex items-center gap-3 px-4 py-3 bg-white dark:bg-dark-800 rounded-lg shadow-lg border border-gray-200 dark:border-dark-700 z-50;
}

/* 子任务网格 */
.subtasks-section {
  @apply mb-8;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white mb-4;
}

.subtasks-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.subtask-card {
  @apply p-4 bg-gray-50 dark:bg-dark-700 rounded-lg cursor-pointer transition-all hover:shadow-md;
  @apply border-l-4 border-transparent;
}

.subtask-card.pending { @apply border-l-gray-400; }
.subtask-card.assigned { @apply border-l-yellow-400; }
.subtask-card.executing { @apply border-l-purple-400; }
.subtask-card.completed { @apply border-l-green-400; }
.subtask-card.failed { @apply border-l-red-400; }

.status-dot {
  @apply w-2.5 h-2.5 rounded-full;
}

.status-dot.pending { @apply bg-gray-400; }
.status-dot.assigned { @apply bg-yellow-400; }
.status-dot.executing { @apply bg-purple-400; }
.status-dot.completed { @apply bg-green-400; }
.status-dot.failed { @apply bg-red-400; }

.agent-name {
  @apply text-xs font-medium text-gray-600 dark:text-gray-400;
}

.subtask-title {
  @apply text-sm font-semibold text-gray-900 dark:text-white mt-2;
}

.subtask-desc {
  @apply text-xs text-gray-500 mt-1 line-clamp-2;
}

.retry-btn {
  @apply text-xs text-primary-600 hover:text-primary-700 font-medium;
}

.dependencies {
  @apply flex items-center gap-2 mt-3 flex-wrap;
}

.dep-tag {
  @apply text-xs px-2 py-0.5 bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-400 rounded;
}

/* 计划与结果 */
.plan-section, .result-section {
  @apply mb-8;
}

.plan-content, .result-content {
  @apply p-4 bg-gray-50 dark:bg-dark-700 rounded-lg;
}

.result-content {
  @apply border-l-4 border-primary-500;
}

/* 消息时间线 */
.messages-section {
  @apply mb-8;
}

.messages-timeline {
  @apply space-y-4;
}

.message-item {
  @apply flex gap-4;
}

.message-avatar {
  @apply w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0;
}

.message-avatar.user { @apply bg-primary-100 text-primary-700; }
.message-avatar.leader { @apply bg-amber-100 text-amber-700; }
.message-avatar.sub { @apply bg-blue-100 text-blue-700; }
.message-avatar.system { @apply bg-gray-100 text-gray-600; }

.message-content {
  @apply flex-1;
}

.message-header {
  @apply flex items-center gap-2 mb-1;
}

.message-author {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.message-time {
  @apply text-xs text-gray-500;
}

.message-body {
  @apply p-3 bg-gray-50 dark:bg-dark-700 rounded-lg;
}

.message-type-tag {
  @apply inline-block text-xs px-2 py-0.5 rounded mb-2 font-medium;
}

.message-type-tag.plan { @apply bg-blue-100 text-blue-700; }
.message-type-tag.assignment { @apply bg-yellow-100 text-yellow-700; }
.message-type-tag.result { @apply bg-green-100 text-green-700; }
.message-type-tag.summary { @apply bg-purple-100 text-purple-700; }

/* 新建任务弹窗 */
.leader-select {
  @apply p-3 bg-gray-50 dark:bg-dark-700 rounded-lg;
}

.leader-card {
  @apply flex items-center gap-3;
}

.leader-avatar {
  @apply w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold;
}

.leader-info {
  @apply flex-1;
}

.leader-name {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.leader-role {
  @apply text-xs text-gray-500;
}

.leader-badge {
  @apply px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-medium rounded-full;
}

.sub-agents-list {
  @apply flex flex-wrap gap-2;
}

.sub-agent-tag {
  @apply px-3 py-1.5 bg-gray-100 dark:bg-dark-600 text-gray-700 dark:text-gray-300 text-sm rounded-full;
}

/* 子任务详情 */
.subtask-output {
  @apply p-4 bg-gray-50 dark:bg-dark-700 rounded-lg max-h-96 overflow-y-auto;
}

.error-box {
  @apply p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800;
}

/* 按钮样式 */
.btn-primary {
  @apply inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg font-medium;
  @apply hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.btn-secondary {
  @apply inline-flex items-center justify-center px-4 py-2 bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium;
  @apply hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors;
}

.btn-danger {
  @apply inline-flex items-center justify-center px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium;
  @apply hover:bg-red-200 transition-colors;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.form-input {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg;
  @apply bg-white dark:bg-dark-700 text-gray-900 dark:text-white;
  @apply focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none;
}

.form-textarea {
  @apply w-full px-3 py-2 border border-gray-300 dark:border-dark-600 rounded-lg resize-none;
  @apply bg-white dark:bg-dark-700 text-gray-900 dark:text-white;
  @apply focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none;
}
</style>
