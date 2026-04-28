<template>
  <div class="workflow-designer">
    <!-- 头部 -->
    <header class="designer-header">
      <div class="flex items-center gap-4">
        <button class="back-btn" @click="goBack">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div v-if="!isEditingName" class="flex items-center gap-2" @click="startEditName">
          <h1 class="text-xl font-bold text-navy-900 dark:text-white">{{ workflow?.name || '新建工作流' }}</h1>
          <svg class="w-4 h-4 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
        </div>
        <div v-else class="flex items-center gap-2">
          <input
            ref="nameInput"
            v-model="editingName"
            type="text"
            class="input text-lg py-1 w-64"
            @blur="saveName"
            @keyup.enter="saveName"
          >
        </div>
      </div>
      <div class="flex items-center gap-3">
        <span class="text-sm text-navy-500 dark:text-navy-400">
          {{ workflow?.nodes.length || 0 }} 个节点
        </span>
        <button class="btn-secondary flex items-center gap-2" @click="showAddNodeModal = true">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          添加节点
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

    <!-- 主体内容 -->
    <div class="designer-body">
      <!-- 左侧：节点列表 -->
      <aside class="nodes-sidebar">
        <div class="sidebar-header">
          <h3 class="text-sm font-bold text-navy-700 dark:text-navy-300">流程节点</h3>
        </div>
        <div class="nodes-list">
          <div
            v-for="(node, index) in sortedNodes"
            :key="node.id"
            class="node-item"
            :class="{ 'is-selected': selectedNode?.id === node.id, [`type-${node.type}`]: true }"
            @click="selectNode(node)"
          >
            <div class="node-number">{{ index + 1 }}</div>
            <div class="node-icon">{{ getNodeIcon(node.type) }}</div>
            <div class="node-info">
              <div class="node-name">{{ node.name }}</div>
              <div class="node-agent" v-if="node.agentId">
                {{ getAgentName(node.agentId) }}
              </div>
              <div class="node-agent empty" v-else>未分配 Agent</div>
            </div>
            <div v-if="node.type !== 'start' && node.type !== 'end'" class="node-delete" @click.stop="confirmDeleteNode(node)">
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          </div>
        </div>
      </aside>

      <!-- 右侧：节点配置 -->
      <main class="config-area">
        <div v-if="!selectedNode" class="empty-config">
          <div class="text-6xl mb-4">📝</div>
          <h3 class="text-xl font-bold text-navy-900 dark:text-white mb-2">配置节点</h3>
          <p class="text-navy-500 dark:text-navy-400 text-center max-w-sm">
            点击左侧节点进行配置，设置执行 Agent、输入输出和提示词模板
          </p>
        </div>

        <div v-else class="config-form">
          <!-- 节点基本信息 -->
          <section class="config-section">
            <h3 class="section-title">基本信息</h3>
            <div class="form-grid">
              <div class="form-group">
                <label class="form-label">节点名称</label>
                <input v-model="selectedNode.name" type="text" class="input" @change="saveWorkflow">
              </div>
              <div class="form-group">
                <label class="form-label">节点类型</label>
                <select v-model="selectedNode.type" class="input" @change="saveWorkflow">
                  <option value="start">开始</option>
                  <option value="end">结束</option>
                  <option value="task">任务</option>
                  <option value="approval">审批</option>
                  <option value="condition">条件</option>
                </select>
              </div>
            </div>
            <div class="form-group mt-4">
              <label class="form-label">描述</label>
              <input v-model="selectedNode.description" type="text" class="input" placeholder="描述这个节点的用途" @change="saveWorkflow">
            </div>
          </section>

          <!-- 执行配置 -->
          <section v-if="selectedNode.type === 'task' || selectedNode.type === 'approval'" class="config-section">
            <h3 class="section-title">执行配置</h3>
            <div class="form-group">
              <label class="form-label">执行 Agent</label>
              <select v-model="selectedNode.agentId" class="input" @change="saveWorkflow">
                <option value="">请选择 Agent</option>
                <option v-for="agent in teamAgents" :key="agent.id" :value="agent.id">
                  {{ agent.meta.avatar }} {{ agent.meta.name }} - {{ agent.meta.role }}
                </option>
              </select>
            </div>
          </section>

          <!-- 输入定义 -->
          <section v-if="selectedNode.type !== 'start'" class="config-section">
            <div class="section-header">
              <h3 class="section-title">输入定义</h3>
              <button class="btn-text" @click="addInput">+ 添加</button>
            </div>
            <div class="io-list">
              <div v-for="(input, idx) in selectedNode.inputs" :key="input.id" class="io-item">
                <input v-model="input.name" type="text" class="input-sm" placeholder="名称" @change="saveWorkflow">
                <select v-model="input.type" class="input-sm" @change="saveWorkflow">
                  <option value="text">文本</option>
                  <option value="file">文件</option>
                  <option value="reference">引用</option>
                </select>
                <input v-model="input.description" type="text" class="input-sm flex-1" placeholder="描述" @change="saveWorkflow">
                <button class="btn-icon text-danger-500" @click="removeInput(idx)">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div v-if="selectedNode.inputs.length === 0" class="io-empty">
                暂无输入定义，点击"添加"创建
              </div>
            </div>
          </section>

          <!-- 输出定义 -->
          <section v-if="selectedNode.type !== 'end'" class="config-section">
            <div class="section-header">
              <h3 class="section-title">输出定义</h3>
              <button class="btn-text" @click="addOutput">+ 添加</button>
            </div>
            <div class="io-list">
              <div v-for="(output, idx) in selectedNode.outputs" :key="output.id" class="io-item">
                <input v-model="output.name" type="text" class="input-sm" placeholder="名称" @change="saveWorkflow">
                <select v-model="output.type" class="input-sm" @change="saveWorkflow">
                  <option value="text">文本</option>
                  <option value="file">文件</option>
                  <option value="json">JSON</option>
                </select>
                <input v-model="output.description" type="text" class="input-sm flex-1" placeholder="描述" @change="saveWorkflow">
                <button class="btn-icon text-danger-500" @click="removeOutput(idx)">
                  <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
              <div v-if="selectedNode.outputs.length === 0" class="io-empty">
                暂无输出定义，点击"添加"创建
              </div>
            </div>
          </section>

          <!-- 提示词模板 -->
          <section v-if="selectedNode.type === 'task' || selectedNode.type === 'approval'" class="config-section">
            <h3 class="section-title">提示词模板</h3>
            <p class="text-sm text-navy-500 dark:text-navy-400 mb-3">
              支持变量：{'{{'}input.name{'}}'} 引用输入，{'{{'}nodes.nodeId.outputs.name{'}}'} 引用上游节点输出
            </p>
            <textarea
              v-model="selectedNode.promptTemplate"
              class="input code-area"
              rows="8"
              placeholder="请输入提示词模板..."
              @change="saveWorkflow"
            />
          </section>
        </div>
      </main>
    </div>

    <!-- 添加节点弹窗 -->
    <Modal v-model="showAddNodeModal" title="添加节点" size="sm">
      <div class="space-y-4">
        <div class="form-group">
          <label class="form-label">节点名称 <span class="text-danger-500">*</span></label>
          <input v-model="newNodeForm.name" type="text" class="input" placeholder="例如：需求分析">
        </div>
        <div class="form-group">
          <label class="form-label">节点类型</label>
          <div class="node-type-grid">
            <button
              v-for="type in nodeTypes"
              :key="type.value"
              class="type-btn"
              :class="{ active: newNodeForm.type === type.value }"
              @click="newNodeForm.type = type.value"
            >
              <span class="type-icon">{{ type.icon }}</span>
              <span class="type-name">{{ type.label }}</span>
            </button>
          </div>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showAddNodeModal = false">取消</button>
        <button class="btn-primary" :disabled="!newNodeForm.name.trim()" @click="addNode">添加</button>
      </template>
    </Modal>

    <!-- 删除确认弹窗 -->
    <Modal v-model="showDeleteNodeModal" title="确认删除" size="sm">
      <p class="text-navy-600 dark:text-navy-300">
        确定要删除节点 "{{ nodeToDelete?.name }}" 吗？
      </p>
      <template #footer>
        <button class="btn-secondary" @click="showDeleteNodeModal = false">取消</button>
        <button class="btn-danger" @click="deleteNode">删除</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useWorkflowsStore } from '@/stores/workflows'
import { useTeamsStore } from '@/stores/teams'
import { useAppStore } from '@/stores/app'
import Modal from '@/components/common/Modal.vue'
import type { WorkflowNode, WorkflowNodeType } from '@/types'

const route = useRoute()
const router = useRouter()
const workflowsStore = useWorkflowsStore()
const teamsStore = useTeamsStore()
const appStore = useAppStore()

// 节点类型选项
const nodeTypes: { value: WorkflowNodeType; label: string; icon: string }[] = [
  { value: 'task', label: '任务', icon: '📋' },
  { value: 'approval', label: '审批', icon: '✅' },
  { value: 'condition', label: '条件', icon: '🔀' },
]

// 状态
const isEditingName = ref(false)
const editingName = ref('')
const nameInput = ref<HTMLInputElement>()
const selectedNode = ref<WorkflowNode | null>(null)
const showAddNodeModal = ref(false)
const showDeleteNodeModal = ref(false)
const nodeToDelete = ref<WorkflowNode | null>(null)

// 新节点表单
const newNodeForm = ref({
  name: '',
  type: 'task' as WorkflowNodeType
})

// 计算属性
const workflowId = computed(() => route.params.id as string)
const isNew = computed(() => !workflowId.value)

const workflow = computed(() => {
  if (isNew.value) return null
  return workflowsStore.workflows.find(w => w.id === workflowId.value) || null
})

const sortedNodes = computed(() => {
  if (!workflow.value) return []
  // 按类型排序：start -> others -> end
  const nodes = [...workflow.value.nodes]
  return nodes.sort((a, b) => {
    if (a.type === 'start') return -1
    if (b.type === 'start') return 1
    if (a.type === 'end') return 1
    if (b.type === 'end') return -1
    return 0
  })
})

const teamAgents = computed(() => {
  if (!workflow.value) return []
  const team = teamsStore.teams.find(t => t.info.id === workflow.value?.teamId)
  return team?.agents || []
})

// 生命周期
onMounted(() => {
  if (workflow.value) {
    workflowsStore.setCurrentWorkflow(workflow.value.id)
  }
})

// 方法
function goBack() {
  router.push('/workflows')
}

function startEditName() {
  editingName.value = workflow.value?.name || ''
  isEditingName.value = true
  nextTick(() => nameInput.value?.focus())
}

function saveName() {
  if (editingName.value.trim() && workflow.value) {
    workflowsStore.updateWorkflow(workflow.value.id, { name: editingName.value.trim() })
  }
  isEditingName.value = false
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

function getAgentName(agentId: string): string {
  const agent = teamAgents.value.find(a => a.id === agentId)
  return agent ? `${agent.meta.avatar} ${agent.meta.name}` : '未知 Agent'
}

function selectNode(node: WorkflowNode) {
  selectedNode.value = node
}

function addNode() {
  if (!workflow.value || !newNodeForm.value.name.trim()) return

  const node = workflowsStore.addNode(workflow.value.id, {
    name: newNodeForm.value.name.trim(),
    type: newNodeForm.value.type,
    position: { x: 300, y: 200 }
  })

  if (node) {
    selectedNode.value = node
    newNodeForm.value = { name: '', type: 'task' }
    showAddNodeModal.value = false
    appStore.showToast('节点已添加', 'success')
  }
}

function confirmDeleteNode(node: WorkflowNode) {
  nodeToDelete.value = node
  showDeleteNodeModal.value = true
}

function deleteNode() {
  if (!workflow.value || !nodeToDelete.value) return

  const success = workflowsStore.deleteNode(workflow.value.id, nodeToDelete.value.id)
  if (success) {
    if (selectedNode.value?.id === nodeToDelete.value.id) {
      selectedNode.value = null
    }
    appStore.showToast('节点已删除', 'success')
  }

  showDeleteNodeModal.value = false
  nodeToDelete.value = null
}

function addInput() {
  if (!selectedNode.value || !workflow.value) return
  workflowsStore.addNodeInput(workflow.value.id, selectedNode.value.id, {
    name: `input_${selectedNode.value.inputs.length + 1}`,
    type: 'text',
    required: false,
    description: ''
  })
}

function removeInput(index: number) {
  if (!selectedNode.value || !workflow.value) return
  const input = selectedNode.value.inputs[index]
  if (input) {
    workflowsStore.removeNodeInput(workflow.value.id, selectedNode.value.id, input.id)
  }
}

function addOutput() {
  if (!selectedNode.value || !workflow.value) return
  workflowsStore.addNodeOutput(workflow.value.id, selectedNode.value.id, {
    name: `output_${selectedNode.value.outputs.length + 1}`,
    type: 'text',
    description: ''
  })
}

function removeOutput(index: number) {
  if (!selectedNode.value || !workflow.value) return
  const output = selectedNode.value.outputs[index]
  if (output) {
    workflowsStore.removeNodeOutput(workflow.value.id, selectedNode.value.id, output.id)
  }
}

function saveWorkflow() {
  workflowsStore.saveToStorage()
}

function runWorkflow() {
  if (!workflow.value) return

  // 检查是否有可执行的节点
  const executableNodes = workflow.value.nodes.filter(n => n.type === 'task' || n.type === 'approval')
  if (executableNodes.length === 0) {
    appStore.showToast('工作流中没有可执行的节点', 'warning')
    return
  }

  // 检查是否所有任务节点都分配了Agent
  const unassignedNodes = executableNodes.filter(n => !n.agentId)
  if (unassignedNodes.length > 0) {
    appStore.showToast(`节点 "${unassignedNodes[0].name}" 未分配 Agent`, 'warning')
    selectedNode.value = unassignedNodes[0]
    return
  }

  const run = workflowsStore.createRun(workflow.value.id, workflow.value.teamId)
  if (run) {
    appStore.showToast('工作流已开始运行', 'success')
    router.push(`/workflows/${workflow.value.id}/runs`)
  }
}
</script>

<style scoped>
.workflow-designer {
  @apply h-screen flex flex-col bg-navy-50/50 dark:bg-navy-950/50;
}

.designer-header {
  @apply flex items-center justify-between px-6 py-4 bg-white dark:bg-navy-900 border-b border-navy-200 dark:border-navy-800;
}

.back-btn {
  @apply p-2 rounded-lg text-navy-500 hover:text-navy-700 hover:bg-navy-100
         dark:text-navy-400 dark:hover:text-navy-200 dark:hover:bg-navy-800
         transition-all duration-200;
}

.designer-body {
  @apply flex-1 flex overflow-hidden;
}

/* 侧边栏 */
.nodes-sidebar {
  @apply w-72 bg-white dark:bg-navy-900 border-r border-navy-200 dark:border-navy-800 flex flex-col;
}

.sidebar-header {
  @apply px-4 py-3 border-b border-navy-200 dark:border-navy-800;
}

.nodes-list {
  @apply flex-1 overflow-y-auto p-2 space-y-1;
}

.node-item {
  @apply flex items-center gap-3 px-3 py-3 rounded-xl cursor-pointer
         transition-all duration-200
         hover:bg-navy-50 dark:hover:bg-navy-800;
}

.node-item.is-selected {
  @apply bg-primary-50 dark:bg-primary-900/20 border-l-4 border-primary-500;
}

.node-item.type-start,
.node-item.type-end {
  @apply bg-navy-50/50 dark:bg-navy-800/50;
}

.node-number {
  @apply w-6 h-6 rounded-full bg-navy-100 dark:bg-navy-800
         text-xs font-bold text-navy-600 dark:text-navy-400
         flex items-center justify-center flex-shrink-0;
}

.node-icon {
  @apply w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200
         dark:from-primary-900/30 dark:to-primary-800/20
         flex items-center justify-center text-lg flex-shrink-0;
}

.node-info {
  @apply flex-1 min-w-0;
}

.node-name {
  @apply font-semibold text-navy-900 dark:text-white truncate text-sm;
}

.node-agent {
  @apply text-xs text-primary-600 dark:text-primary-400;
}

.node-agent.empty {
  @apply text-navy-400 dark:text-navy-500 italic;
}

.node-delete {
  @apply p-1.5 rounded-lg text-navy-400 opacity-0
         hover:text-danger-500 hover:bg-danger-50
         dark:hover:bg-danger-500/10
         transition-all duration-200;
}

.node-item:hover .node-delete {
  @apply opacity-100;
}

/* 配置区域 */
.config-area {
  @apply flex-1 overflow-y-auto p-6;
}

.empty-config {
  @apply flex flex-col items-center justify-center h-full;
}

.config-form {
  @apply max-w-3xl mx-auto space-y-6;
}

.config-section {
  @apply bg-white dark:bg-navy-900 rounded-2xl border border-navy-200 dark:border-navy-800 p-6;
}

.section-header {
  @apply flex items-center justify-between mb-4;
}

.section-title {
  @apply text-lg font-bold text-navy-900 dark:text-white;
}

.form-grid {
  @apply grid grid-cols-2 gap-4;
}

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

.input-sm {
  @apply px-3 py-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-lg
         text-sm text-navy-900 dark:text-white
         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500;
}

.code-area {
  @apply font-mono text-sm;
}

/* 输入输出列表 */
.io-list {
  @apply space-y-2;
}

.io-item {
  @apply flex items-center gap-2;
}

.io-empty {
  @apply text-sm text-navy-400 dark:text-navy-500 text-center py-4 bg-navy-50 dark:bg-navy-800/50 rounded-xl;
}

/* 节点类型选择 */
.node-type-grid {
  @apply grid grid-cols-3 gap-2;
}

.type-btn {
  @apply flex flex-col items-center gap-2 p-4 rounded-xl border border-navy-200 dark:border-navy-700
         transition-all duration-200
         hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/10;
}

.type-btn.active {
  @apply border-primary-500 bg-primary-50 dark:bg-primary-900/20;
}

.type-icon {
  @apply text-2xl;
}

.type-name {
  @apply text-sm font-medium text-navy-700 dark:text-navy-300;
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

.btn-text {
  @apply text-sm font-semibold text-primary-600 dark:text-primary-400
         hover:text-primary-700 dark:hover:text-primary-300 transition-colors;
}

.btn-icon {
  @apply p-2 rounded-lg transition-all duration-200;
}
</style>
