<template>
  <div class="mindmap-node" :class="{ 'is-root': level === 0 }">
    <!-- 节点卡片 -->
    <div
      class="node-card"
      :class="{
        'is-team': node.type === 'team',
        'is-org': node.type === 'org',
        'is-agent': node.type === 'agent',
        'has-children': hasChildren,
      }"
      @click="handleClick"
    >
      <!-- 展开/折叠按钮 -->
      <button
        v-if="hasChildren"
        class="expand-btn"
        :class="{ 'is-expanded': isExpanded }"
        @click.stop="toggle"
      >
        <svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <span v-else class="expand-placeholder"></span>

      <!-- 图标 -->
      <span class="node-icon">{{ node.icon }}</span>

      <!-- 内容 -->
      <div class="node-content">
        <span class="node-name" :title="node.name">{{ node.name }}</span>
        <span v-if="node.description" class="node-desc" :title="node.description">{{ node.description }}</span>
      </div>

      <!-- 数量徽章 -->
      <span v-if="node.count !== undefined && node.count > 0" class="node-badge">
        {{ node.count }}
      </span>

      <!-- 箭头指示器 -->
      <svg v-if="node.type !== 'agent'" class="arrow-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>

    <!-- 子节点 -->
    <div
      v-if="hasChildren && isExpanded"
      class="children-container"
      :class="{ 'is-nested': level > 0 }"
    >
      <!-- 连接线 -->
      <div class="connection-line"></div>

      <div class="children-list">
        <MindMapNode
          v-for="child in node.children"
          :key="child.id"
          :node="child"
          :level="level + 1"
          :expanded-keys="expandedKeys"
          @toggle="$emit('toggle', $event)"
          @select="$emit('select', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

interface MindMapNodeData {
  id: string
  type: 'team' | 'org' | 'agent'
  name: string
  description?: string
  icon: string
  count?: number
  children: MindMapNodeData[]
  data: any
}

const props = defineProps<{
  node: MindMapNodeData
  level?: number
  expandedKeys: Set<string>
}>()

const emit = defineEmits<{
  (e: 'toggle', nodeId: string): void
  (e: 'select', node: MindMapNodeData): void
}>()

const level = computed(() => props.level ?? 0)
const hasChildren = computed(() => props.node.children.length > 0)
const isExpanded = computed(() => props.expandedKeys.has(props.node.id))

function toggle() {
  emit('toggle', props.node.id)
}

function handleClick() {
  emit('select', props.node)
}
</script>

<style scoped>
.mindmap-node {
  @apply flex flex-col;
}

.node-card {
  @apply flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer
         border transition-all duration-200
         hover:shadow-md hover:-translate-y-0.5;
  @apply bg-white dark:bg-dark-800 border-gray-200 dark:border-dark-700
         hover:border-primary-300 dark:hover:border-primary-700;
  min-width: 180px;
  max-width: 280px;
}

.node-card.is-team {
  @apply bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20
         border-blue-200 dark:border-blue-800;
}

.node-card.is-org {
  @apply bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20
         border-purple-200 dark:border-purple-800;
}

.node-card.is-agent {
  @apply bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20
         border-green-200 dark:border-green-800;
}

.expand-btn {
  @apply w-5 h-5 flex items-center justify-center rounded
         text-gray-400 hover:text-gray-600 hover:bg-gray-100
         dark:text-gray-500 dark:hover:text-gray-300 dark:hover:bg-dark-700
         transition-transform duration-200;
}

.expand-btn.is-expanded {
  @apply rotate-90;
}

.expand-placeholder {
  @apply w-5;
}

.node-icon {
  @apply text-xl flex-shrink-0;
}

.node-content {
  @apply flex flex-col flex-1 min-w-0;
}

.node-name {
  @apply font-medium text-sm text-gray-900 dark:text-white truncate;
}

.node-desc {
  @apply text-xs text-gray-500 dark:text-gray-400 truncate;
}

.node-badge {
  @apply px-1.5 py-0.5 text-xs font-medium rounded-full
         bg-gray-100 dark:bg-dark-700 text-gray-600 dark:text-gray-400;
}

.arrow-icon {
  @apply w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0;
}

/* 子节点容器 */
.children-container {
  @apply flex mt-3 ml-6 relative;
}

.children-container.is-nested {
  @apply ml-5;
}

/* 连接线 */
.connection-line {
  @apply absolute left-0 top-0 bottom-1/2 w-px bg-gradient-to-b from-gray-300 to-transparent
         dark:from-gray-600;
  margin-left: -12px;
}

.children-list {
  @apply flex flex-col gap-2;
}

.children-list::before {
  content: '';
  @apply absolute left-0 top-4 w-3 h-px bg-gray-300 dark:bg-gray-600;
  margin-left: -12px;
}

/* 根节点特殊样式 */
.is-root > .node-card {
  @apply shadow-md;
}
</style>
