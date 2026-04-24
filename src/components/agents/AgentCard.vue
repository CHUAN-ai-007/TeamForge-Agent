<template>
  <div class="agent-card-wrapper">
    <!-- 拖拽手柄 -->
    <div v-if="draggable" class="drag-handle" title="拖拽排序">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8h16M4 16h16" />
      </svg>
    </div>

    <!-- 负责人角标 - 卡片左上角 -->
    <div v-if="isLeader" class="leader-badge">
      <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
      </svg>
      <span>负责人</span>
    </div>

    <router-link :to="`/teams/${agent.teamId}/agents/${agent.id}`" class="agent-card">
      <div class="agent-avatar">{{ agent.meta.avatar }}</div>
      <div class="agent-info">
        <h4 class="agent-name">{{ agent.meta.name }}</h4>
        <p class="agent-role">{{ agent.meta.role }}</p>
        <div class="agent-tags">
          <span v-for="tag in agent.meta.tags.slice(0, 3)" :key="tag" class="tag tag-blue">
            {{ tag }}
          </span>
        </div>
      </div>
      <div class="agent-level">
        <span class="level-badge" :class="`level-${agent.meta.level}`">
          {{ levelText[agent.meta.level] }}
        </span>
      </div>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import type { Agent } from '@/types'

interface Props {
  agent: Agent
  isLeader?: boolean
  draggable?: boolean
}

withDefaults(defineProps<Props>(), {
  isLeader: false,
  draggable: false,
})

const levelText = {
  junior: '初级',
  senior: '资深',
  lead: '主管',
  executive: '高管',
}
</script>

<style scoped>
.agent-card-wrapper {
  @apply relative flex items-center gap-2;
}

.leader-badge {
  @apply absolute -top-1.5 left-10 flex items-center gap-0.5 px-1.5 py-0.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-medium rounded-full shadow-md z-20;
}

.leader-badge svg {
  @apply w-2.5 h-2.5;
}

.drag-handle {
  @apply p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 cursor-grab active:cursor-grabbing;
}

.drag-handle:active {
  @apply cursor-grabbing;
}

.agent-card {
  @apply flex-1 flex items-center gap-4 p-4 bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 hover:border-primary-500 dark:hover:border-primary-500 transition-all duration-200 hover:shadow-md;
}

.agent-avatar {
  @apply w-14 h-14 text-3xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-dark-700 dark:to-dark-600 rounded-xl flex items-center justify-center flex-shrink-0;
}

.agent-info {
  @apply flex-1 min-w-0;
}

.agent-name {
  @apply font-semibold text-gray-900 dark:text-white truncate;
}

.agent-role {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-0.5;
}

.agent-tags {
  @apply flex flex-wrap gap-1.5 mt-2;
}

.agent-level {
  @apply flex-shrink-0;
}

.level-badge {
  @apply px-2 py-1 text-xs font-medium rounded;
}

.level-junior {
  @apply bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400;
}

.level-senior {
  @apply bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400;
}

.level-lead {
  @apply bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400;
}

.level-executive {
  @apply bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400;
}
</style>
