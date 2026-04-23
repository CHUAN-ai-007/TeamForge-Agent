<template>
  <div class="documents-container">
    <!-- 标签切换 -->
    <div class="doc-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="doc-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>
    </div>

    <!-- 内容区域 -->
    <div class="doc-content">
      <!-- meta.json -->
      <div v-if="activeTab === 'meta'" class="doc-panel">
        <CodeBlock language="json" :code="agent.metaContent" />
      </div>

      <!-- persona.md -->
      <div v-else-if="activeTab === 'persona'" class="doc-panel">
        <div class="doc-actions">
          <button class="btn-ghost text-sm" @click="copyContent(agent.personaContent)">
            <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            复制 Markdown
          </button>
        </div>
        <MarkdownViewer :content="agent.personaContent" />
      </div>

      <!-- work.md -->
      <div v-else-if="activeTab === 'work'" class="doc-panel">
        <div class="doc-actions">
          <button class="btn-ghost text-sm" @click="copyContent(agent.workContent)">
            <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            复制 Markdown
          </button>
        </div>
        <MarkdownViewer :content="agent.workContent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Agent } from '@/types'
import CodeBlock from '@/components/common/CodeBlock.vue'
import MarkdownViewer from '@/components/common/MarkdownViewer.vue'
import { useAppStore } from '@/stores/app'
import { copyToClipboard } from '@/utils'

const props = defineProps<{
  agent: Agent
}>()

const appStore = useAppStore()

const tabs = [
  { key: 'meta', label: 'meta.json' },
  { key: 'persona', label: 'persona.md' },
  { key: 'work', label: 'work.md' },
]

const activeTab = ref('persona')

async function copyContent(content: string) {
  const success = await copyToClipboard(content)
  if (success) {
    appStore.showToast('已复制到剪贴板', 'success')
  } else {
    appStore.showToast('复制失败', 'error')
  }
}
</script>

<style scoped>
.documents-container {
  @apply bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden;
}

.doc-tabs {
  @apply flex border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/50;
}

.doc-tab {
  @apply px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors relative;
}

.doc-tab.active {
  @apply text-primary-600 dark:text-primary-400;
}

.doc-tab.active::after {
  content: '';
  @apply absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500;
}

.doc-content {
  @apply p-6;
}

.doc-panel {
  @apply space-y-4;
}

.doc-actions {
  @apply flex justify-end pb-4 border-b border-gray-200 dark:border-dark-700;
}
</style>
