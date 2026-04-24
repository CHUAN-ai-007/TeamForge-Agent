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
      <OrgTreeNode
        v-for="child in node.children"
        :key="child.id"
        :node="child"
        :selected-id="selectedId"
        :level="level + 1"
        @select="$emit('select', $event)"
        @add="$emit('add', $event)"
        @edit="$emit('edit', $event)"
        @delete="$emit('delete', $event)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useTeamsStore } from '@/stores/teams'
import type { OrgUnit } from '@/types'

interface TreeNode extends OrgUnit {
  children: TreeNode[]
}

const props = defineProps<{
  node: TreeNode
  selectedId: string | null
  level: number
}>()

const emit = defineEmits<{
  (e: 'select', id: string): void
  (e: 'add', id: string): void
  (e: 'edit', node: TreeNode): void
  (e: 'delete', node: TreeNode): void
}>()

const teamsStore = useTeamsStore()

const isExpanded = ref(true)

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
</script>

<style scoped>
.org-tree-node {
  @apply select-none;
}

.node-item {
  @apply flex items-center gap-1.5 py-2 pr-2 rounded-lg cursor-pointer
         text-sm text-gray-700 dark:text-gray-300
         hover:bg-gray-100 dark:hover:bg-dark-700
         transition-colors;
}

.node-item.is-selected {
  @apply bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300
         hover:bg-primary-100 dark:hover:bg-primary-900/30;
}

.expand-btn {
  @apply p-0.5 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-300
         transition-transform duration-200;
}

.expand-btn.is-expanded {
  @apply rotate-90;
}

.expand-placeholder {
  @apply w-5;
}

.node-icon {
  @apply text-base;
}

.node-name {
  @apply flex-1 truncate;
}

.node-badge {
  @apply text-xs px-1.5 py-0.5 bg-gray-200 dark:bg-dark-600 text-gray-600 dark:text-gray-400 rounded-full;
}

.node-actions {
  @apply flex items-center gap-0.5 opacity-0 transition-opacity;
}

.node-item:hover .node-actions,
.node-item.is-selected .node-actions {
  @apply opacity-100;
}

.action-btn {
  @apply p-1 rounded hover:bg-gray-200 dark:hover:bg-dark-600
         text-gray-500 dark:text-gray-400 transition-colors;
}
</style>
