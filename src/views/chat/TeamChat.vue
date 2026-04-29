<template>
  <div v-if="team" class="chat-page">
    <!-- 头部 -->
    <header class="chat-header">
      <div class="flex items-center gap-4">
        <button class="btn-ghost p-2" @click="$router.back()">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <div>
          <h1 class="font-semibold text-gray-900 dark:text-white">{{ team.info.name }} - 团队对话</h1>
          <p class="text-sm text-gray-500">{{ team.agents.length }} 个 Agent 参与</p>
        </div>
      </div>
    </header>

    <!-- 消息列表 -->
    <div ref="messagesContainer" class="messages-container">
      <div v-if="messages.length === 0" class="empty-chat">
        <div class="empty-icon">💬</div>
        <h3>开始团队对话</h3>
        <p>向整个团队提问，AI Agents 将协同回答</p>
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
              {{ message.agentAvatar || '🤖' }}
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
        <router-link to="/settings" class="text-primary-600 hover:underline">请先配置 AI 模型</router-link>
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

        <!-- 发送按钮 -->
        <button
          v-if="!isSending"
          class="send-btn"
          :disabled="!inputMessage.trim()"
          @click="handleSend"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>

        <!-- 暂停按钮 -->
        <button
          v-else
          class="pause-btn"
          @click="handlePause"
          title="暂停生成"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" />
            <rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" />
          </svg>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useChatStore } from '@/stores/chat'
import { useSettingsStore } from '@/stores/settings'
import { useAppStore } from '@/stores/app'
import MarkdownViewer from '@/components/common/MarkdownViewer.vue'
import { chatCompletion, type ChatCompletionMessage } from '@/api/ai'
import { formatDate } from '@/utils'
import { buildChatSystemPrompt, parseAgentResponse } from '@/utils/agentPrompt'

const route = useRoute()
const teamsStore = useTeamsStore()
const chatStore = useChatStore()
const settingsStore = useSettingsStore()
const appStore = useAppStore()

const teamId = computed(() => route.params.id as string)
const team = computed(() => teamsStore.getTeam(teamId.value))
const session = computed(() => chatStore.getOrCreateSession(teamId.value))
const messages = computed(() => session.value?.messages || [])

const inputMessage = ref('')
const isSending = ref(false)
const messagesContainer = ref<HTMLElement>()
const inputRef = ref<HTMLTextAreaElement>()
const abortController = ref<AbortController | null>(null)

const quickPrompts = [
  '请介绍一下各自的分工',
  '如何提升团队协作效率？',
  '分析我们目前面临的挑战',
  '制定下季度的工作计划',
]

onMounted(() => {
  scrollToBottom()
})

watch(messages, () => {
  nextTick(scrollToBottom)
}, { deep: true })

function getMessageAuthor(message: typeof messages.value[0]): string {
  if (message.role === 'user') return '我'
  if (message.role === 'system') return '系统'
  return message.agentName || 'Assistant'
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

async function sendMessage(content: string) {
  inputMessage.value = content
  await handleSend()
}

async function handleSend() {
  const content = inputMessage.value.trim()
  if (!content || isSending.value) return
  if (!settingsStore.hasValidConfig) {
    appStore.showToast('请先配置 AI 模型', 'warning')
    return
  }

  isSending.value = true
  inputMessage.value = ''

  // 重置输入框高度
  if (inputRef.value) {
    inputRef.value.style.height = 'auto'
  }

  // 添加用户消息
  chatStore.addMessage(session.value.id, {
    role: 'user',
    content,
  })

  // 构建系统提示词
  const systemPrompt = buildSystemPrompt()

  // 构建历史消息
  const historyMessages: ChatCompletionMessage[] = messages.value
    .slice(-10) // 只取最近10条
    .map(m => ({
      role: m.role === 'user' ? 'user' : 'assistant',
      content: m.content,
      name: m.agentName,
    }))

  // 添加系统提示词到开头
  historyMessages.unshift({ role: 'system', content: systemPrompt })

  // 创建 AI 消息占位
  const aiMessage = chatStore.addMessage(session.value.id, {
    role: 'agent',
    content: '',
    isTyping: true,
  })

  // 创建 AbortController 用于取消请求
  abortController.value = new AbortController()

  try {
    // 调用 AI
    const response = await chatCompletion(settingsStore.activeConfig, {
      messages: historyMessages,
      stream: true,
      signal: abortController.value.signal,
      onStream: (chunk) => {
        if (aiMessage) {
          aiMessage.content += chunk.content
          aiMessage.isTyping = !chunk.done
          chatStore.saveToStorage()
        }
      },
    })

    // 解析响应，提取发言者和内容
    if (aiMessage) {
      const parsed = handleParseAgentResponse(response.content)
      aiMessage.content = parsed.content
      aiMessage.agentName = parsed.agentName
      aiMessage.agentAvatar = parsed.agentAvatar
      aiMessage.isTyping = false
      chatStore.saveToStorage()
    }
  } catch (error: any) {
    if (error.name === 'AbortError') {
      // 用户取消，保留已生成的内容
      if (aiMessage) {
          aiMessage.isTyping = false
          aiMessage.content += '\n\n[已暂停]'
          chatStore.saveToStorage()
        }
      } else {
        console.error('发送失败:', error)
        appStore.showToast(error instanceof Error ? error.message : '发送失败', 'error')
        if (aiMessage) {
          aiMessage.isTyping = false
          chatStore.saveToStorage()
        }
      }
    } finally {
      isSending.value = false
      abortController.value = null
    }
}

function handlePause() {
  if (abortController.value) {
    abortController.value.abort()
  }
}

function buildSystemPrompt(): string {
  const agents = team.value?.agents || []
  const currentAgent = agents[0] // 默认由第一个Agent响应，实际应根据问题路由

  if (!currentAgent) {
    return '你是一个智能助手。'
  }

  // 使用新的分层Prompt构建
  return buildChatSystemPrompt(team.value?.info.name || '', agents, currentAgent)
}

function handleParseAgentResponse(content: string): { content: string; agentName?: string; agentAvatar?: string } {
  // 使用 agentPrompt.ts 中的解析函数
  return parseAgentResponse(content, team.value?.agents || [])
}
</script>

<style scoped>
.chat-page {
  @apply flex flex-col h-screen;
}

.chat-header {
  @apply flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-700 bg-white dark:bg-dark-800;
}

.messages-container {
  @apply flex-1 overflow-y-auto p-6 space-y-4;
}

.empty-chat {
  @apply flex flex-col items-center justify-center h-full text-center;
}

.empty-icon {
  @apply text-6xl mb-4;
}

.empty-chat h3 {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-2;
}

.empty-chat p {
  @apply text-gray-500 dark:text-gray-400 mb-6;
}

.quick-prompts {
  @apply flex flex-wrap justify-center gap-3;
}

.quick-prompt {
  @apply px-4 py-2 bg-gray-100 dark:bg-dark-700 hover:bg-gray-200 dark:hover:bg-dark-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition-colors;
}

.messages-list {
  @apply space-y-6 max-w-4xl mx-auto;
}

.message {
  @apply flex gap-4;
}

.message.user {
  @apply flex-row-reverse;
}

.message-avatar {
  @apply w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 dark:from-dark-700 dark:to-dark-600 flex items-center justify-center text-xl flex-shrink-0;
}

.message.user .message-avatar {
  @apply bg-gradient-to-br from-primary-500 to-purple-600;
}

.message-content {
  @apply flex-1 max-w-3xl;
}

.message-header {
  @apply flex items-center gap-2 mb-1;
}

.message.user .message-header {
  @apply justify-end;
}

.message-author {
  @apply font-medium text-sm text-gray-900 dark:text-white;
}

.message-time {
  @apply text-xs text-gray-400;
}

.typing-indicator {
  @apply flex items-center gap-1 p-3;
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

.input-container {
  @apply flex items-end gap-3 max-w-4xl mx-auto;
}

.message-input {
  @apply flex-1 input resize-none min-h-[44px] max-h-[200px] py-3;
}

.send-btn {
  @apply w-11 h-11 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg flex items-center justify-center transition-colors;
}

.send-btn .spinner {
  @apply w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin;
}

.pause-btn {
  @apply w-11 h-11 bg-amber-500 hover:bg-amber-600 text-white rounded-lg flex items-center justify-center transition-colors;
}
</style>
