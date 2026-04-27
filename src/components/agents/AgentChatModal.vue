<template>
  <Modal v-model="visible" :title="agent?.meta.name || '对话'" size="lg" class="agent-chat-modal">
    <div class="chat-container">
      <!-- 头部Agent信息 -->
      <div class="agent-header">
        <div class="agent-avatar">{{ agent?.meta.avatar }}</div>
        <div class="agent-info">
          <div class="agent-name">{{ agent?.meta.name }}</div>
          <div class="agent-role">{{ agent?.meta.role }}</div>
        </div>
        <!-- RAG 状态指示器 -->
        <div v-if="hasKnowledgeBase" class="rag-status" :class="{ active: ragEnabled }">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          <span>{{ ragEnabled ? '知识库已启用' : '知识库' }}</span>
          <span class="kb-count">{{ kbDocCount }} 文档</span>
        </div>
      </div>

      <!-- 消息列表 -->
      <div ref="messagesContainer" class="messages-container">
        <div v-if="messages.length === 0" class="empty-chat">
          <div class="empty-icon">💬</div>
          <h3>与 {{ agent?.meta.name }} 对话</h3>
          <p>直接询问 {{ agent?.meta.name }}，获得专业解答</p>
          <div class="quick-prompts">
            <button
              v-for="prompt in quickPrompts"
              :key="prompt"
              class="quick-prompt"
              @click="sendMessage(prompt)"
            >
              {{ prompt }}
            </button>
          </div>
        </div>

        <div v-else class="messages-list">
          <div
            v-for="message in messages"
            :key="message.id"
            class="message"
            :class="message.role"
          >
            <div class="message-avatar">
              <template v-if="message.role === 'user'">
                👤
              </template>
              <template v-else-if="message.role === 'system'">
                ⚙️
              </template>
              <template v-else>
                {{ agent?.meta.avatar }}
              </template>
            </div>

            <div class="message-content">
              <div class="message-header">
                <span class="message-author">{{ getMessageAuthor(message) }}</span>
                <span class="message-time">{{ formatTime(message.timestamp) }}</span>
              </div>

              <div v-if="message.isTyping" class="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>

              <MarkdownViewer v-else :content="message.content" />
            </div>
          </div>
        </div>
      </div>

      <!-- 输入区域 -->
      <div class="input-area">
        <div v-if="!settingsStore.hasValidConfig" class="api-notice">
          <router-link to="/settings" @click="visible = false">
            请先配置 AI 模型
          </router-link>
        </div>

        <div class="input-container">
          <textarea
            v-model="inputMessage"
            class="message-input"
            placeholder="输入消息，按 Enter 发送，Shift+Enter 换行..."
            rows="1"
            :disabled="isSending || !settingsStore.hasValidConfig"
            @keydown="handleKeydown"
            @input="autoResize"
            ref="inputRef"
          />

          <button
            class="send-btn"
            :disabled="!inputMessage.trim() || isSending"
            @click="handleSend"
          >
            <svg v-if="!isSending" class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
            <span v-else class="spinner"></span>
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import { useAppStore } from '@/stores/app'
import Modal from '@/components/common/Modal.vue'
import MarkdownViewer from '@/components/common/MarkdownViewer.vue'
import { chatCompletion, type ChatCompletionMessage } from '@/api/ai'
import { formatDate } from '@/utils'
import type { Agent, ChatMessage } from '@/types'

interface Props {
  modelValue: boolean
  agent: Agent | null
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const appStore = useAppStore()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const session = computed(() => {
  if (!props.agent) return null
  return chatStore.getOrCreateAgentSession(props.agent.teamId, props.agent.id)
})

const messages = computed(() => session.value?.messages || [])

const inputMessage = ref('')
const isSending = ref(false)
const messagesContainer = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()

const quickPrompts = computed(() => {
  if (!props.agent) return []
  return [
    `请介绍一下你的工作职责`,
    `你擅长什么领域？`,
    `你能帮我解决什么问题？`,
    `介绍一下你的专业背景`,
  ]
})

// RAG 相关计算属性
const hasKnowledgeBase = computed(() => {
  return (props.agent?.knowledgeBase?.length || 0) > 0
})

const kbDocCount = computed(() => {
  return props.agent?.knowledgeBase?.length || 0
})

const ragEnabled = computed(() => {
  return props.agent?.ragSettings?.enabled && hasKnowledgeBase.value
})

// 从知识库检索相关内容
function retrieveKnowledge(query: string): string {
  if (!ragEnabled.value || !props.agent?.knowledgeBase) return ''

  const docs = props.agent.knowledgeBase
  const topK = props.agent.ragSettings?.topK || 3
  const maxLength = props.agent.ragSettings?.maxContextLength || 2000

  // 简单的关键词匹配检索
  const scored = docs.map(doc => {
    const score = calculateRelevance(query, doc.content)
    return { doc, score }
  })

  // 按相关度排序并取前 topK
  scored.sort((a, b) => b.score - a.score)
  const topDocs = scored.slice(0, topK)

  // 构建知识上下文
  let context = ''
  let totalLength = 0

  for (const { doc } of topDocs) {
    const content = `## ${doc.title}\n${doc.content.substring(0, 1000)}\n\n`
    if (totalLength + content.length > maxLength) break
    context += content
    totalLength += content.length
  }

  return context.trim()
}

// 计算查询与文档内容的相关度（简单的关键词匹配）
function calculateRelevance(query: string, content: string): number {
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1)
  const contentLower = content.toLowerCase()

  if (queryWords.length === 0) return 0

  let matchCount = 0
  for (const word of queryWords) {
    if (contentLower.includes(word)) {
      matchCount++
    }
  }

  // 基础匹配分数 + 匹配词频加权
  const baseScore = matchCount / queryWords.length
  const frequencyBonus = queryWords.reduce((sum, word) => {
    const matches = (contentLower.match(new RegExp(word, 'g')) || []).length
    return sum + Math.min(matches, 3) * 0.05
  }, 0)

  return Math.min(baseScore + frequencyBonus, 1)
}

onMounted(() => {
  scrollToBottom()
})

watch(() => props.modelValue, (show) => {
  if (show) {
    nextTick(() => {
      scrollToBottom()
      inputRef.value?.focus()
    })
  }
})

watch(messages, () => {
  nextTick(scrollToBottom)
}, { deep: true })

function getMessageAuthor(message: ChatMessage): string {
  if (message.role === 'user') return '我'
  if (message.role === 'system') return '系统'
  return props.agent?.meta.name || 'Assistant'
}

function formatTime(timestamp: number): string {
  return formatDate(timestamp, 'HH:mm')
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function autoResize() {
  const textarea = inputRef.value
  if (textarea) {
    textarea.style.height = 'auto'
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSend()
  }
}

function sendMessage(content: string) {
  inputMessage.value = content
  handleSend()
}

async function handleSend() {
  const content = inputMessage.value.trim()
  if (!content || isSending.value || !session.value || !props.agent) return
  if (!settingsStore.hasValidConfig) {
    appStore.showToast('请先配置 AI 模型', 'warning')
    return
  }

  isSending.value = true
  inputMessage.value = ''

  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  try {
    // 添加用户消息
    chatStore.addMessage(session.value.id, {
      role: 'user',
      content,
    })

    // RAG: 从知识库检索相关内容
    const relevantKnowledge = retrieveKnowledge(content)

    // 构建系统提示词
    const systemPrompt = buildSystemPrompt(props.agent, relevantKnowledge)

    // 构建历史消息
    const historyMessages: ChatCompletionMessage[] = messages.value
      .slice(-10)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: m.content,
      }))

    historyMessages.unshift({ role: 'system', content: systemPrompt })

    // 创建 AI 消息占位
    const aiMessage = chatStore.addMessage(session.value.id, {
      role: 'agent',
      content: '',
      agentId: props.agent.id,
      agentName: props.agent.meta.name,
      agentAvatar: props.agent.meta.avatar,
      isTyping: true,
    })

    // 调用 AI
    const response = await chatCompletion(settingsStore.activeConfig, {
      messages: historyMessages,
      stream: true,
      onStream: (chunk) => {
        if (aiMessage) {
          aiMessage.content += chunk.content
          aiMessage.isTyping = !chunk.done
          chatStore.saveToStorage()
        }
      },
    })

    if (aiMessage) {
      aiMessage.content = response.content
      aiMessage.isTyping = false
      chatStore.saveToStorage()
    }
  } catch (error) {
    console.error('发送失败:', error)
    appStore.showToast(error instanceof Error ? error.message : '发送失败', 'error')
  } finally {
    isSending.value = false
  }
}

function buildSystemPrompt(agent: Agent, knowledgeContext: string = ''): string {
  let prompt = `你是 ${agent.meta.name}，${agent.meta.role}。

## 你的基本信息
- 职级：${agent.meta.level}
- 部门：${agent.meta.department}
- 专业领域：${agent.meta.tags.join(', ')}

## 你的人设
${agent.persona.identity}

## 你的性格
${agent.persona.personality}

## 你的背景
${agent.persona.background}

## 你的沟通风格
${agent.persona.communicationStyle}

## 你的职责
${agent.work.responsibilities.join('\n')}

## 你的工作流程
${agent.work.workflow}`

  // 如果有知识库上下文，添加到提示词中
  if (knowledgeContext) {
    prompt += `\n\n## 相关知识库内容\n以下是与用户问题相关的内部知识库信息，请优先参考这些内容回答：\n\n${knowledgeContext}\n\n请基于上述知识库内容回答问题。如果知识库中没有相关信息，请基于你的人设和专业知识回答。`
  }

  prompt += `\n\n请完全代入这个角色与用户对话，以第一人称回答用户的问题。保持专业、友好、有帮助的态度。`

  return prompt
}
</script>

<style scoped>
:deep(.modal-body) {
  @apply max-h-none p-0;
}

.chat-container {
  @apply flex flex-col h-[600px];
}

.agent-header {
  @apply flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-700/50;
}

.agent-avatar {
  @apply w-12 h-12 text-2xl bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center;
}

.agent-info {
  @apply flex-1;
}

.agent-name {
  @apply font-semibold text-gray-900 dark:text-white;
}

.agent-role {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.rag-status {
  @apply flex items-center gap-1.5 ml-auto px-2.5 py-1 text-xs rounded-full
         bg-gray-100 dark:bg-dark-700 text-gray-500 dark:text-gray-400;
}

.rag-status.active {
  @apply bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400;
}

.rag-status .kb-count {
  @apply text-gray-400 dark:text-gray-500;
}

.rag-status.active .kb-count {
  @apply text-green-600 dark:text-green-500;
}

.messages-container {
  @apply flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50 dark:bg-dark-900/50;
}

.empty-chat {
  @apply flex flex-col items-center justify-center h-full text-center;
}

.empty-icon {
  @apply text-5xl mb-4;
}

.empty-chat h3 {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-2;
}

.empty-chat p {
  @apply text-sm text-gray-500 dark:text-gray-400 mb-4;
}

.quick-prompts {
  @apply flex flex-wrap justify-center gap-2;
}

.quick-prompt {
  @apply px-3 py-1.5 bg-white dark:bg-dark-700 border border-gray-200 dark:border-dark-600
         hover:border-primary-400 dark:hover:border-primary-500
         text-gray-600 dark:text-gray-300 text-sm rounded-lg transition-colors;
}

.messages-list {
  @apply space-y-4;
}

.message {
  @apply flex gap-3;
}

.message.user {
  @apply flex-row-reverse;
}

.message-avatar {
  @apply w-9 h-9 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-700 dark:to-dark-600
         flex items-center justify-center text-lg flex-shrink-0;
}

.message.user .message-avatar {
  @apply bg-gradient-to-br from-primary-500 to-purple-600;
}

.message-content {
  @apply flex-1 max-w-[85%];
}

.message-header {
  @apply flex items-center gap-2 mb-1;
}

.message.user .message-header {
  @apply justify-end;
}

.message-author {
  @apply text-sm font-medium text-gray-900 dark:text-white;
}

.message-time {
  @apply text-xs text-gray-400;
}

:deep(.message-content .markdown-body) {
  @apply bg-white dark:bg-dark-800 p-3 rounded-xl rounded-tl-none
         border border-gray-200 dark:border-dark-700 text-sm;
}

.message.user :deep(.markdown-body) {
  @apply bg-primary-50 dark:bg-primary-900/30 border-primary-200 dark:border-primary-800 rounded-tl-xl rounded-tr-none;
}

.typing-indicator {
  @apply flex items-center gap-1 p-3 bg-white dark:bg-dark-800 rounded-xl rounded-tl-none
         border border-gray-200 dark:border-dark-700 w-fit;
}

.typing-indicator span {
  @apply w-2 h-2 bg-gray-400 rounded-full animate-bounce;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

.input-area {
  @apply border-t border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800 p-4;
}

.api-notice {
  @apply text-center py-2 mb-2 text-sm;
}

.api-notice a {
  @apply text-primary-600 hover:underline;
}

.input-container {
  @apply flex items-end gap-2;
}

.message-input {
  @apply flex-1 input resize-none min-h-[44px] max-h-[120px] py-3 bg-gray-100 dark:bg-dark-700 border-0;
}

.send-btn {
  @apply w-10 h-10 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed
         text-white rounded-lg flex items-center justify-center transition-colors flex-shrink-0;
}

.send-btn .spinner {
  @apply w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin;
}
</style>
