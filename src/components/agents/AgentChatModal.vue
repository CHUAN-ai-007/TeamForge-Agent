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
            :class="{ 'user': message.role === 'user', 'agent': message.role === 'agent' }"
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
  @apply flex items-center gap-3 px-5 py-4 border-b border-navy-200 dark:border-navy-800 bg-navy-50/80 dark:bg-navy-900/80 backdrop-blur-sm;
}

.agent-avatar {
  @apply w-12 h-12 text-2xl bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-quantplay text-white;
}

.agent-info {
  @apply flex-1;
}

.agent-name {
  @apply font-bold text-navy-900 dark:text-white;
}

.agent-role {
  @apply text-sm text-navy-500 dark:text-navy-400 font-medium;
}

.rag-status {
  @apply flex items-center gap-1.5 ml-auto px-3 py-1.5 text-xs font-semibold rounded-full
         bg-navy-100 dark:bg-navy-800 text-navy-600 dark:text-navy-400 border border-navy-200 dark:border-navy-700;
}

.rag-status.active {
  @apply bg-success-50 dark:bg-success-500/10 border-success-200 dark:border-success-500/20 text-success-600 dark:text-success-400;
}

.rag-status .kb-count {
  @apply text-navy-400 dark:text-navy-500;
}

.rag-status.active .kb-count {
  @apply text-success-600 dark:text-success-500;
}

.messages-container {
  @apply flex-1 overflow-y-auto p-4 space-y-4 bg-navy-50/50 dark:bg-navy-950/50;
}

.empty-chat {
  @apply flex flex-col items-center justify-center h-full text-center;
}

.empty-icon {
  @apply text-5xl mb-4;
}

.empty-chat h3 {
  @apply text-lg font-bold text-navy-900 dark:text-white mb-2;
}

.empty-chat p {
  @apply text-sm text-navy-500 dark:text-navy-400 mb-4;
}

.quick-prompts {
  @apply flex flex-wrap justify-center gap-2;
}

.quick-prompt {
  @apply px-4 py-2 bg-white dark:bg-navy-800 border border-navy-200 dark:border-navy-700
         hover:border-primary-400 dark:hover:border-primary-500 hover:shadow-quantplay
         text-navy-600 dark:text-navy-300 text-sm font-medium rounded-xl transition-all duration-200;
}

.messages-list {
  @apply space-y-5 px-2;
}

/* 消息基础布局 */
.message {
  @apply flex gap-3 w-full;
}

/* Agent 消息 - 靠左 */
.message.agent,
.message:not(.user) {
  @apply justify-start;
}

/* 用户消息 - 靠右 */
.message.user {
  @apply flex-row-reverse justify-start;
}

/* 头像样式 */
.message-avatar {
  @apply w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0
         bg-gradient-to-br from-navy-200 to-navy-300 dark:from-navy-700 dark:to-navy-600
         shadow-sm;
}

.message.user .message-avatar {
  @apply bg-gradient-to-br from-primary-500 to-primary-600 text-white
         shadow-quantplay;
}

/* 消息内容容器 */
.message-content {
  @apply max-w-[75%] flex flex-col;
}

.message.agent .message-content,
.message:not(.user) .message-content {
  @apply items-start;
}

.message.user .message-content {
  @apply items-end;
}

/* 消息头部 */
.message-header {
  @apply flex items-center gap-2 mb-1.5 px-1;
}

.message.user .message-header {
  @apply justify-end;
}

.message-author {
  @apply text-sm font-bold;
}

.message.agent .message-author,
.message:not(.user) .message-author {
  @apply text-navy-700 dark:text-navy-200;
}

.message.user .message-author {
  @apply text-primary-600 dark:text-primary-400;
}

.message-time {
  @apply text-xs text-navy-400;
}

/* Agent 气泡 - 白色背景，左边尖角 */
.message.agent :deep(.markdown-body),
.message:not(.user) :deep(.markdown-body) {
  @apply bg-white dark:bg-navy-800
         text-navy-800 dark:text-navy-100
         p-4 rounded-2xl rounded-bl-none
         border border-navy-200 dark:border-navy-700
         text-sm shadow-card;
}

/* 用户气泡 - 渐变蓝色，右边尖角 */
.message.user :deep(.markdown-body) {
  @apply bg-gradient-to-br from-primary-500 to-primary-600
         text-white
         p-4 rounded-2xl rounded-br-none
         border-0
         text-sm shadow-quantplay;
}

/* 用户气泡内链接颜色 */
.message.user :deep(.markdown-body a) {
  @apply text-white/90 underline hover:text-white;
}

/* 用户气泡内代码样式 */
.message.user :deep(.markdown-body code) {
  @apply bg-white/20 text-white;
}

/* 打字指示器 - 靠左 */
.typing-indicator {
  @apply flex items-center gap-1.5 p-4
         bg-white dark:bg-navy-800
         rounded-2xl rounded-bl-none
         border border-navy-200 dark:border-navy-700
         w-fit shadow-card;
}

.typing-indicator span {
  @apply w-2 h-2 bg-navy-400 rounded-full animate-bounce;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

.input-area {
  @apply border-t border-navy-200 dark:border-navy-800 bg-white dark:bg-navy-900 p-4;
}

.api-notice {
  @apply text-center py-2 mb-2 text-sm;
}

.api-notice a {
  @apply text-primary-600 hover:text-primary-700 font-semibold;
}

.input-container {
  @apply flex items-end gap-3;
}

.message-input {
  @apply flex-1 resize-none min-h-[48px] max-h-[120px] py-3 px-4
         bg-navy-50 dark:bg-navy-800 border border-navy-200 dark:border-navy-700 rounded-xl
         text-navy-900 dark:text-white placeholder-navy-400
         focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500
         transition-all duration-200;
}

.send-btn {
  @apply w-11 h-11 bg-gradient-to-br from-primary-500 to-primary-600
         hover:from-primary-600 hover:to-primary-700
         disabled:opacity-50 disabled:cursor-not-allowed
         text-white rounded-xl flex items-center justify-center transition-all duration-200
         shadow-quantplay hover:shadow-quantplay-lg hover:-translate-y-0.5 flex-shrink-0;
}

.send-btn .spinner {
  @apply w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin;
}
</style>
