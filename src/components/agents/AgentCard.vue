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
          <span v-for="tag in agent.meta.tags.slice(0, 3)" :key="tag" class="tag">
            {{ tag }}
          </span>
        </div>
      </div>
      <div class="agent-level">
        <span class="level-badge" :class="`level-${agent.meta.level}`">
          {{ levelText[agent.meta.level] }}
        </span>
        <!-- P等级选择器 -->
        <select
          class="p-level-select"
          :value="agent.meta.pLevel || ''"
          @click.prevent
          @change="handlePLevelChange($event)"
        >
          <option value="">等级</option>
          <option value="P1">P1</option>
          <option value="P2">P2</option>
          <option value="P3">P3</option>
          <option value="P4">P4</option>
          <option value="P5">P5</option>
        </select>
      </div>

      <!-- 对话按钮 -->
      <button class="chat-btn" title="开始对话" @click.prevent="handleChat">
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        对话
      </button>
    </router-link>
  </div>
</template>

<script setup lang="ts">
import type { Agent, AgentPLevel } from '@/types'
import { useTeamsStore } from '@/stores/teams'

interface Props {
  agent: Agent
  isLeader?: boolean
  draggable?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  isLeader: false,
  draggable: false,
})

const emit = defineEmits<{
  chat: [agent: Agent]
}>()

const teamsStore = useTeamsStore()

function handleChat() {
  emit('chat', props.agent)
}

function handlePLevelChange(event: Event) {
  const select = event.target as HTMLSelectElement
  const pLevel = select.value as AgentPLevel | ''

  // 更新 Agent 的 P 等级
  teamsStore.updateAgent(props.agent.teamId, props.agent.id, {
    meta: {
      ...props.agent.meta,
      pLevel: pLevel || undefined,
      updatedAt: new Date().toISOString()
    }
  })
}

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
  @apply absolute -top-1.5 left-12 z-20 flex items-center gap-1 px-2 py-0.5
         bg-gradient-to-r from-amber-500 to-orange-500
         text-white text-[10px] font-bold rounded-full shadow-lg;
}

.leader-badge svg {
  @apply w-2.5 h-2.5;
}

.drag-handle {
  @apply p-2 text-navy-400 hover:text-navy-600 dark:hover:text-navy-300 cursor-grab active:cursor-grabbing transition-colors;
}

.drag-handle:active {
  @apply cursor-grabbing;
}

.agent-card {
  @apply flex-1 flex items-center gap-4 p-5
         bg-white dark:bg-navy-900
         rounded-2xl border border-navy-200 dark:border-navy-700
         shadow-card
         hover:shadow-card-hover hover:border-primary-300 dark:hover:border-primary-700
         transition-all duration-300;
}

.agent-avatar {
  @apply w-14 h-14 text-3xl
         bg-gradient-to-br from-primary-500 to-primary-600
         rounded-xl flex items-center justify-center flex-shrink-0
         shadow-quantplay text-white;
}

.agent-info {
  @apply flex-1 min-w-0;
}

.agent-name {
  @apply font-bold text-navy-900 dark:text-white truncate text-lg;
}

.agent-role {
  @apply text-sm text-navy-500 dark:text-navy-400 mt-0.5 font-medium;
}

.agent-tags {
  @apply flex flex-wrap gap-1.5 mt-2;
}

.tag {
  @apply px-2 py-0.5 text-xs font-semibold rounded-full
         bg-primary-50 dark:bg-primary-900/30
         text-primary-600 dark:text-primary-400
         border border-primary-100 dark:border-primary-800;
}

.agent-level {
  @apply flex-shrink-0 flex flex-col items-end gap-2;
}

.p-level-select {
  @apply px-2 py-1 text-xs font-semibold rounded-lg
         bg-navy-50 dark:bg-navy-800
         border border-navy-200 dark:border-navy-700
         text-navy-700 dark:text-navy-300
         hover:border-primary-400 dark:hover:border-primary-500
         focus:outline-none focus:ring-2 focus:ring-primary-500/20
         cursor-pointer transition-all duration-200;
}

.level-badge {
  @apply px-3 py-1 text-xs font-bold rounded-full;
}

.level-junior {
  @apply bg-success-50 dark:bg-success-500/10 text-success-600 dark:text-success-400
         border border-success-200 dark:border-success-500/20;
}

.level-senior {
  @apply bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400
         border border-primary-200 dark:border-primary-800;
}

.level-lead {
  @apply bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400
         border border-purple-200 dark:border-purple-800;
}

.level-executive {
  @apply bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400
         border border-amber-200 dark:border-amber-800;
}

.chat-btn {
  @apply flex items-center gap-1.5 px-4 py-2 ml-2
         text-sm font-semibold
         bg-primary-50 dark:bg-primary-900/30
         text-primary-600 dark:text-primary-400
         rounded-xl
         hover:bg-primary-100 dark:hover:bg-primary-900/50
         hover:text-primary-700 dark:hover:text-primary-300
         transition-all duration-200;
}
</style>
