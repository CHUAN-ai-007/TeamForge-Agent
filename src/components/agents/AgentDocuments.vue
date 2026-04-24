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

      <!-- 编辑/预览切换 -->
      <div class="ml-auto flex items-center gap-2 px-4">
        <button
          class="btn-toggle"
          :class="{ active: !isEditing }"
          @click="isEditing = false"
        >
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          预览
        </button>
        <button
          class="btn-toggle"
          :class="{ active: isEditing }"
          @click="isEditing = true"
        >
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          编辑
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="doc-content">
      <!-- meta.json -->
      <div v-if="activeTab === 'meta'" class="doc-panel">
        <div v-if="isEditing" class="edit-mode">
          <div class="form-group">
            <label class="form-label">属性定义 (JSON 格式)</label>
            <textarea
              v-model="editForm.meta"
              class="code-textarea"
              rows="20"
              placeholder="请输入 JSON 格式的属性定义..."
            ></textarea>
            <p class="form-hint">提示：请输入合法的 JSON 格式，包含 id、name、avatar、role、department、level、tags、permissions 等字段</p>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" @click="cancelEdit">取消</button>
            <button class="btn-primary" :disabled="!hasChanges" @click="saveMeta">保存</button>
          </div>
        </div>
        <div v-else class="preview-mode">
          <CodeBlock language="json" :code="agent.metaContent" />
        </div>
      </div>

      <!-- persona.md -->
      <div v-else-if="activeTab === 'persona'" class="doc-panel">
        <div v-if="isEditing" class="edit-mode">
          <div class="form-group">
            <label class="form-label">用户定义 (Markdown 格式)</label>
            <textarea
              v-model="editForm.persona"
              class="markdown-textarea"
              rows="20"
              placeholder="请输入角色人设文档...&#10;&#10;建议包含以下章节：&#10;- 身份背景&#10;- 性格特质&#10;- 核心价值观&#10;- 专业领域&#10;- 沟通风格"
            ></textarea>
            <p class="form-hint">支持 Markdown 格式，用于定义角色的身份、性格、背景等人设信息</p>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" @click="cancelEdit">取消</button>
            <button class="btn-primary" :disabled="!hasChanges" @click="savePersona">保存</button>
          </div>
        </div>
        <div v-else class="preview-mode">
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
      </div>

      <!-- work.md -->
      <div v-else-if="activeTab === 'work'" class="doc-panel">
        <div v-if="isEditing" class="edit-mode">
          <div class="form-group">
            <label class="form-label">工作定义 (Markdown 格式)</label>
            <textarea
              v-model="editForm.work"
              class="markdown-textarea"
              rows="20"
              placeholder="请输入工作规范文档...&#10;&#10;建议包含以下章节：&#10;- 岗位职责&#10;- 工作流程&#10;- 协作规范&#10;- 工作边界&#10;- 绩效指标"
            ></textarea>
            <p class="form-hint">支持 Markdown 格式，用于定义角色的工作职责、流程、规范等信息</p>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" @click="cancelEdit">取消</button>
            <button class="btn-primary" :disabled="!hasChanges" @click="saveWork">保存</button>
          </div>
        </div>
        <div v-else class="preview-mode">
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
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Agent } from '@/types'
import CodeBlock from '@/components/common/CodeBlock.vue'
import MarkdownViewer from '@/components/common/MarkdownViewer.vue'
import { useAppStore } from '@/stores/app'
import { useTeamsStore } from '@/stores/teams'
import { copyToClipboard } from '@/utils'

const props = defineProps<{
  agent: Agent
}>()

const appStore = useAppStore()
const teamsStore = useTeamsStore()

const tabs = [
  { key: 'meta', label: 'meta.json' },
  { key: 'persona', label: 'persona.md' },
  { key: 'work', label: 'work.md' },
]

const activeTab = ref('persona')
const isEditing = ref(false)

// 编辑表单
const editForm = ref({
  meta: '',
  persona: '',
  work: '',
})

// 是否有修改
const hasChanges = computed(() => {
  return editForm.value.meta !== props.agent.metaContent ||
    editForm.value.persona !== props.agent.personaContent ||
    editForm.value.work !== props.agent.workContent
})

// 监听 agent 变化，重置表单
watch(() => props.agent, (newAgent) => {
  editForm.value = {
    meta: newAgent.metaContent,
    persona: newAgent.personaContent,
    work: newAgent.workContent,
  }
}, { immediate: true })

// 取消编辑
function cancelEdit() {
  editForm.value = {
    meta: props.agent.metaContent,
    persona: props.agent.personaContent,
    work: props.agent.workContent,
  }
  isEditing.value = false
}

// 保存 meta
async function saveMeta() {
  try {
    // 验证 JSON 格式
    const parsed = JSON.parse(editForm.value.meta)

    teamsStore.updateAgent(props.agent.teamId, props.agent.id, {
      metaContent: editForm.value.meta,
      meta: {
        ...props.agent.meta,
        ...parsed,
      },
    })

    appStore.showToast('属性定义已保存', 'success')
    isEditing.value = false
  } catch (e) {
    appStore.showToast('JSON 格式错误，请检查', 'error')
  }
}

// 保存 persona
function savePersona() {
  teamsStore.updateAgent(props.agent.teamId, props.agent.id, {
    personaContent: editForm.value.persona,
  })
  appStore.showToast('用户定义已保存', 'success')
  isEditing.value = false
}

// 保存 work
function saveWork() {
  teamsStore.updateAgent(props.agent.teamId, props.agent.id, {
    workContent: editForm.value.work,
  })
  appStore.showToast('工作定义已保存', 'success')
  isEditing.value = false
}

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
  @apply flex items-center border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/50;
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

.btn-toggle {
  @apply flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors;
  @apply text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700;
}

.btn-toggle.active {
  @apply bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300;
}

.doc-content {
  @apply p-6;
}

.doc-panel {
  @apply space-y-4;
}

.edit-mode {
  @apply space-y-4;
}

.preview-mode {
  @apply space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-hint {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.code-textarea {
  @apply w-full px-4 py-3 font-mono text-sm rounded-lg border border-gray-300 dark:border-dark-600;
  @apply bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100;
  @apply focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  @apply resize-y min-h-[400px];
}

.markdown-textarea {
  @apply w-full px-4 py-3 text-sm rounded-lg border border-gray-300 dark:border-dark-600;
  @apply bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100;
  @apply focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  @apply resize-y min-h-[400px];
}

.form-actions {
  @apply flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700;
}

.btn-secondary {
  @apply px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors;
}

.btn-primary {
  @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.doc-actions {
  @apply flex justify-end pb-4 border-b border-gray-200 dark:border-dark-700;
}

.btn-ghost {
  @apply inline-flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors;
}
</style>
