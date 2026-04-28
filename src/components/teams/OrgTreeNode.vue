<template>
  <div class="org-tree-node">
    <div
      class="node-item"
      :class="{
        'is-selected': isSelected,
        'is-expanded': isExpanded,
      }"
      :style="{ paddingLeft: `${level * 16 + 8}px` }"
      @click="handleClick"
    >
      <!-- 拖拽手柄 -->
      <div v-if="draggable" class="org-drag-handle" title="拖拽排序">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
        </svg>
      </div>

      <!-- 展开/折叠图标 -->
      <button
        v-if="hasChildren"
        class="expand-btn"
        :class="{ 'is-expanded': isExpanded }"
        @click.stop="toggleExpand"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <span v-else class="expand-placeholder"></span>

      <!-- 组织类型图标 -->
      <span class="node-icon">{{ typeIcon }}</span>

      <!-- 组织名称 -->
      <span class="node-name">{{ node.name }}</span>

      <!-- 成员数量 -->
      <span v-if="agentCount > 0" class="node-badge">{{ agentCount }}</span>

      <!-- 操作菜单 -->
      <div class="node-actions" @click.stop>
        <button
          class="action-btn"
          title="添加子组织"
          @click="$emit('add', node.id)"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </button>
        <button
          class="action-btn"
          title="编辑"
          @click="$emit('edit', node)"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          v-if="canDelete"
          class="action-btn text-red-500 hover:text-red-600"
          title="删除"
          @click="$emit('delete', node)"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- 子节点 -->
    <div
      v-if="hasChildren && isExpanded"
      class="node-children"
    >
      <draggable
        v-model="sortedChildren"
        item-key="id"
        handle=".org-drag-handle"
        animation="200"
        ghost-class="ghost-org"
        drag-class="dragging-org"
        @end="handleChildDragEnd"
      >
        <template #item="{ element }">
          <OrgTreeNode
            :node="element"
            :selected-id="selectedId"
            :level="level + 1"
            :draggable="true"
            @select="$emit('select', $event)"
            @add="$emit('add', $event)"
            @edit="$emit('edit', $event)"
            @delete="$emit('delete', $event)"
            @reorder="$emit('reorder', $event)"
          />
        </template>
      </draggable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import draggable from 'vuedraggable'
import { useTeamsStore } from '@/stores/teams'
import type { OrgUnit } from '@/types'

interface TreeNode extends OrgUnit {
  children: TreeNode[]
}

const props = defineProps<{
  node: TreeNode
  selectedId: string | null
  level: number
  draggable?: boolean
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'add', id: string): void
  (e: 'edit', node: TreeNode): void
  (e: 'delete', node: TreeNode): void
  (e: 'reorder', data: { parentId: string | null; unitIds: string[] }): void
}>()

const teamsStore = useTeamsStore()

const isExpanded = ref(true)

// 用于子节点拖拽排序的副本
const sortedChildren = ref<TreeNode[]>([])

// 监听子节点变化
watch(() => props.node.children, (newChildren) => {
  sortedChildren.value = [...newChildren]
}, { immediate: true })

const isSelected = computed(() => props.node.id === props.selectedId)
const hasChildren = computed(() => props.node.children.length > 0)
const canDelete = computed(() => props.node.parentId !== null)

const agentCount = computed(() => {
  const team = teamsStore.currentTeam
  if (!team) return 0
  return team.agents.filter(a => a.orgUnitId === props.node.id).length
})

const typeIcon = computed(() => {
  const icons: Record<string, string> = {
    company: '🏢',
    department: '📁',
    group: '👥',
    team: '👤',
  }
  return icons[props.node.type] || '📄'
})

function toggleExpand() {
  isExpanded.value = !isExpanded.value
}

function handleClick() {
  emit('select', props.node.id)
}

// 处理子节点拖拽排序结束
function handleChildDragEnd() {
  const unitIds = sortedChildren.value.map(child => child.id)
  emit('reorder', {
    parentId: props.node.id,
    unitIds
  })
}
</script>

<style scoped>
.org-tree-node {
  @apply select-none;
}

.node-item {
  @apply flex items-center gap-1.5 py-1 pr-1 rounded-lg cursor-pointer
         text-xs text-navy-700 dark:text-navy-300 font-medium
         hover:bg-navy-100 dark:hover:bg-navy-800
         transition-all duration-200;
}

.node-item.is-selected {
  @apply bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400
         hover:bg-primary-100 dark:hover:bg-primary-900/30
         border-l-4 border-primary-500;
}

.expand-btn {
  @apply p-0.5 rounded text-navy-400 hover:text-navy-600 dark:hover:text-navy-300
         hover:bg-navy-200 dark:hover:bg-navy-700
         transition-all duration-200;
}

.expand-btn svg {
  @apply w-2.5 h-2.5;
}

.expand-btn.is-expanded {
  @apply rotate-90;
}

.expand-placeholder {
  @apply w-4;
}

.node-icon {
  @apply text-sm;
}

.node-name {
  @apply flex-1 font-semibold min-w-0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-badge {
  @apply text-xs font-bold px-2 py-0.5
         bg-navy-100 dark:bg-navy-700
         text-navy-600 dark:text-navy-300
         rounded-full;
}

.node-actions {
  @apply flex items-center gap-1 opacity-0 transition-opacity duration-200;
}

.node-item:hover .node-actions,
.node-item.is-selected .node-actions {
  @apply opacity-100;
}

.action-btn {
  @apply p-1 rounded-md hover:bg-navy-200 dark:hover:bg-navy-600
         text-navy-500 dark:text-navy-400 transition-all duration-200;
}

.action-btn svg {
  @apply w-2.5 h-2.5;
}

.action-btn:hover {
  @apply text-primary-600 dark:text-primary-400;
}

/* 拖拽相关样式 */
.org-drag-handle {
  @apply p-0.5 mr-1 rounded text-navy-400 hover:text-navy-600 dark:hover:text-navy-300
         hover:bg-navy-200 dark:hover:bg-navy-700 cursor-grab active:cursor-grabbing
         transition-all duration-200 opacity-0;
}

.org-drag-handle svg {
  @apply w-2.5 h-2.5;
}

.node-item:hover .org-drag-handle,
.org-drag-handle:hover {
  @apply opacity-100;
}

.ghost-org {
  @apply opacity-50 bg-primary-50 dark:bg-primary-900/20 border-2 border-dashed border-primary-500;
}

.dragging-org {
  @apply opacity-90 shadow-lg;
}
</style>
