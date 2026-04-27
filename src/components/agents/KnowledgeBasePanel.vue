<template>
  <div class="kb-panel">
    <!-- 头部工具栏 -->
    <div class="kb-toolbar">
      <div class="kb-title">
        <svg class="w-5 h-5 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <span>知识库文档 ({{ documents.length }})</span>
      </div>
      <div class="kb-actions">
        <label class="btn-upload">
          <input
            type="file"
            accept=".txt,.md,.pdf,.doc,.docx"
            multiple
            @change="handleFileUpload"
          />
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          上传文档
        </label>
        <button class="btn-add" @click="showTextModal = true">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          添加文本
        </button>
      </div>
    </div>

    <!-- RAG 设置 -->
    <div class="rag-settings">
      <div class="setting-item">
        <label class="setting-label">
          <input
            v-model="localSettings.enabled"
            type="checkbox"
            @change="updateSettings"
          />
          <span>启用知识库检索 (RAG)</span>
        </label>
        <span class="setting-desc">回复问题前自动查询相关知识</span>
      </div>
      <div v-if="localSettings.enabled" class="setting-details">
        <div class="setting-row">
          <label>检索数量 (Top-K)</label>
          <input
            v-model.number="localSettings.topK"
            type="number"
            min="1"
            max="10"
            @change="updateSettings"
          />
        </div>
        <div class="setting-row">
          <label>最大上下文长度</label>
          <select v-model.number="localSettings.maxContextLength" @change="updateSettings">
            <option :value="1000">1000 字符</option>
            <option :value="2000">2000 字符</option>
            <option :value="3000">3000 字符</option>
            <option :value="5000">5000 字符</option>
          </select>
        </div>
      </div>
    </div>

    <!-- 文档列表 -->
    <div class="kb-list">
      <div v-if="documents.length === 0" class="kb-empty">
        <div class="empty-icon">📚</div>
        <p>暂无知识库文档</p>
        <span>上传文档或添加文本，Agent 将在回复前查询这些知识</span>
      </div>

      <div
        v-for="doc in documents"
        :key="doc.id"
        class="kb-item"
      >
        <div class="kb-item-icon">
          <template v-if="doc.type === 'file'">
            📄
          </template>
          <template v-else>
            📝
          </template>
        </div>
        <div class="kb-item-info">
          <div class="kb-item-title">{{ doc.title }}</div>
          <div class="kb-item-meta">
            <span>{{ doc.type === 'file' ? '文件' : '文本' }}</span>
            <span v-if="doc.fileSize">{{ formatFileSize(doc.fileSize) }}</span>
            <span>{{ doc.chunkCount }} 个知识片段</span>
            <span>{{ formatDate(doc.updatedAt) }}</span>
          </div>
        </div>
        <div class="kb-item-actions">
          <button class="btn-icon" title="查看内容" @click="viewDoc(doc)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </button>
          <button class="btn-icon btn-danger" title="删除" @click="deleteDoc(doc.id)">
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 添加文本弹窗 -->
    <Modal v-model="showTextModal" title="添加知识文本" size="lg">
      <div class="text-form">
        <div class="form-group">
          <label class="form-label">标题 <span class="text-red-500">*</span></label>
          <input
            v-model="textForm.title"
            type="text"
            class="input"
            placeholder="例如：产品需求文档、常见问题解答..."
          />
        </div>
        <div class="form-group">
          <label class="form-label">内容 <span class="text-red-500">*</span></label>
          <textarea
            v-model="textForm.content"
            class="content-textarea"
            rows="15"
            placeholder="请输入知识内容...&#10;&#10;支持 Markdown 格式，例如：&#10;# 标题&#10;- 要点1&#10;- 要点2&#10;&#10;Agent 将根据这些内容回答相关问题。"
          />
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showTextModal = false">取消</button>
        <button
          class="btn-primary"
          :disabled="!textForm.title.trim() || !textForm.content.trim()"
          @click="addTextDoc"
        >
          添加
        </button>
      </template>
    </Modal>

    <!-- 查看文档弹窗 -->
    <Modal v-model="showViewModal" :title="viewingDoc?.title || '文档内容'" size="lg">
      <div class="view-doc-content">
        <div v-if="viewingDoc?.type === 'file'" class="doc-meta">
          <span>文件名: {{ viewingDoc.fileName }}</span>
          <span>大小: {{ formatFileSize(viewingDoc.fileSize || 0) }}</span>
        </div>
        <pre class="doc-content">{{ viewingDoc?.content }}</pre>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showViewModal = false">关闭</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Agent, KnowledgeDoc, KnowledgeChunk } from '@/types'
import { DEFAULT_RAG_SETTINGS } from '@/types'
import Modal from '@/components/common/Modal.vue'
import { useTeamsStore } from '@/stores/teams'
import { useAppStore } from '@/stores/app'

const props = defineProps<{
  agent: Agent
}>()

const teamsStore = useTeamsStore()
const appStore = useAppStore()

// 文档列表
const documents = computed(() => props.agent.knowledgeBase || [])

// RAG 设置
const localSettings = ref({
  ...DEFAULT_RAG_SETTINGS,
  ...props.agent.ragSettings,
})

watch(() => props.agent.ragSettings, (settings) => {
  if (settings) {
    localSettings.value = { ...DEFAULT_RAG_SETTINGS, ...settings }
  }
}, { immediate: true })

function updateSettings() {
  teamsStore.updateAgent(props.agent.teamId, props.agent.id, {
    ragSettings: { ...localSettings.value },
  })
}

// 文本表单
const showTextModal = ref(false)
const textForm = ref({
  title: '',
  content: '',
})

// 查看文档
const showViewModal = ref(false)
const viewingDoc = ref<KnowledgeDoc | null>(null)

function viewDoc(doc: KnowledgeDoc) {
  viewingDoc.value = doc
  showViewModal.value = true
}

// 文件上传处理
async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const files = input.files
  if (!files || files.length === 0) return

  for (const file of Array.from(files)) {
    try {
      const content = await readFileAsText(file)
      const doc: KnowledgeDoc = {
        id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        agentId: props.agent.id,
        teamId: props.agent.teamId,
        type: 'file',
        title: file.name.replace(/\.[^/.]+$/, ''), // 去掉扩展名
        content,
        fileName: file.name,
        fileSize: file.size,
        chunkCount: splitIntoChunks(content).length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      addDocToAgent(doc)
      appStore.showToast(`文档 "${file.name}" 上传成功`, 'success')
    } catch (error) {
      appStore.showToast(`文档 "${file.name}" 上传失败`, 'error')
    }
  }

  // 清空 input
  input.value = ''
}

// 读取文件内容
function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

// 添加文本文档
function addTextDoc() {
  if (!textForm.value.title.trim() || !textForm.value.content.trim()) return

  const doc: KnowledgeDoc = {
    id: `kb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    agentId: props.agent.id,
    teamId: props.agent.teamId,
    type: 'text',
    title: textForm.value.title.trim(),
    content: textForm.value.content.trim(),
    chunkCount: splitIntoChunks(textForm.value.content).length,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  addDocToAgent(doc)
  appStore.showToast('文本添加成功', 'success')

  // 重置表单
  textForm.value = { title: '', content: '' }
  showTextModal.value = false
}

// 添加文档到 Agent
function addDocToAgent(newDoc: KnowledgeDoc) {
  const currentDocs = props.agent.knowledgeBase || []
  teamsStore.updateAgent(props.agent.teamId, props.agent.id, {
    knowledgeBase: [...currentDocs, newDoc],
  })
}

// 删除文档
function deleteDoc(docId: string) {
  if (!confirm('确定要删除这个知识库文档吗？')) return

  const currentDocs = props.agent.knowledgeBase || []
  teamsStore.updateAgent(props.agent.teamId, props.agent.id, {
    knowledgeBase: currentDocs.filter(d => d.id !== docId),
  })
  appStore.showToast('文档已删除', 'success')
}

// 将内容分块（简单的文本分割）
function splitIntoChunks(content: string, maxChunkSize: number = 500): KnowledgeChunk[] {
  const chunks: KnowledgeChunk[] = []
  const paragraphs = content.split(/\n\n+/)

  let currentChunk = ''
  let startIndex = 0

  for (const paragraph of paragraphs) {
    if ((currentChunk + paragraph).length > maxChunkSize && currentChunk.length > 0) {
      chunks.push(createChunk(currentChunk, startIndex))
      startIndex += currentChunk.length
      currentChunk = paragraph
    } else {
      currentChunk += (currentChunk ? '\n\n' : '') + paragraph
    }
  }

  if (currentChunk) {
    chunks.push(createChunk(currentChunk, startIndex))
  }

  return chunks
}

function createChunk(content: string, startIndex: number): KnowledgeChunk {
  return {
    id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    docId: '', // 会在保存时填充
    agentId: props.agent.id,
    content: content.trim(),
    metadata: {
      startIndex,
      endIndex: startIndex + content.length,
    },
    createdAt: new Date().toISOString(),
  }
}

// 工具函数
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
</script>

<style scoped>
.kb-panel {
  @apply space-y-4;
}

.kb-toolbar {
  @apply flex items-center justify-between flex-wrap gap-3;
}

.kb-title {
  @apply flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300;
}

.kb-actions {
  @apply flex items-center gap-2;
}

.btn-upload,
.btn-add {
  @apply flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors;
}

.btn-upload {
  @apply bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400
         hover:bg-primary-100 dark:hover:bg-primary-900/50 cursor-pointer;
}

.btn-upload input {
  @apply hidden;
}

.btn-add {
  @apply bg-gray-100 dark:bg-dark-700 text-gray-700 dark:text-gray-300
         hover:bg-gray-200 dark:hover:bg-dark-600;
}

.rag-settings {
  @apply p-4 bg-gray-50 dark:bg-dark-900/50 rounded-lg border border-gray-200 dark:border-dark-700;
}

.setting-item {
  @apply flex items-center gap-4 flex-wrap;
}

.setting-label {
  @apply flex items-center gap-2 font-medium text-gray-700 dark:text-gray-300 cursor-pointer;
}

.setting-label input[type="checkbox"] {
  @apply w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500;
}

.setting-desc {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.setting-details {
  @apply mt-3 pt-3 border-t border-gray-200 dark:border-dark-700 flex gap-6 flex-wrap;
}

.setting-row {
  @apply flex items-center gap-2;
}

.setting-row label {
  @apply text-sm text-gray-600 dark:text-gray-400;
}

.setting-row input,
.setting-row select {
  @apply w-20 px-2 py-1 text-sm border border-gray-300 dark:border-dark-600 rounded
         bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100;
}

.kb-list {
  @apply space-y-2;
}

.kb-empty {
  @apply py-12 text-center text-gray-500 dark:text-gray-400;
}

.empty-icon {
  @apply text-5xl mb-3;
}

.kb-empty p {
  @apply text-base font-medium text-gray-700 dark:text-gray-300 mb-1;
}

.kb-empty span {
  @apply text-sm;
}

.kb-item {
  @apply flex items-center gap-3 p-3 bg-white dark:bg-dark-800 rounded-lg border border-gray-200 dark:border-dark-700
         hover:border-primary-300 dark:hover:border-primary-700 transition-colors;
}

.kb-item-icon {
  @apply text-2xl;
}

.kb-item-info {
  @apply flex-1 min-w-0;
}

.kb-item-title {
  @apply font-medium text-gray-900 dark:text-white truncate;
}

.kb-item-meta {
  @apply flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-0.5;
}

.kb-item-meta span {
  @apply flex items-center gap-1;
}

.kb-item-meta span::before {
  content: '•';
  @apply text-gray-300 dark:text-gray-600;
}

.kb-item-meta span:first-child::before {
  @apply hidden;
}

.kb-item-actions {
  @apply flex items-center gap-1;
}

.btn-icon {
  @apply p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors;
}

.btn-icon.btn-danger:hover {
  @apply text-red-500;
}

/* 弹窗样式 */
.text-form {
  @apply space-y-4;
}

.form-group {
  @apply space-y-1.5;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.input {
  @apply w-full px-3 py-2 text-sm border border-gray-300 dark:border-dark-600 rounded-lg
         bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100
         focus:ring-2 focus:ring-primary-500 focus:border-transparent;
}

.content-textarea {
  @apply w-full px-4 py-3 text-sm rounded-lg border border-gray-300 dark:border-dark-600
         bg-white dark:bg-dark-800 text-gray-900 dark:text-gray-100
         focus:ring-2 focus:ring-primary-500 focus:border-transparent
         resize-y min-h-[300px] font-mono;
}

.view-doc-content {
  @apply space-y-4;
}

.doc-meta {
  @apply flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400 pb-3 border-b border-gray-200 dark:border-dark-700;
}

.doc-content {
  @apply p-4 bg-gray-50 dark:bg-dark-900 rounded-lg text-sm text-gray-700 dark:text-gray-300
         whitespace-pre-wrap break-words max-h-[500px] overflow-y-auto;
}

.btn-secondary {
  @apply px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800
         border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700
         transition-colors;
}

.btn-primary {
  @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg
         hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
         transition-colors;
}
</style>
