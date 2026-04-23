import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { ChatSession, ChatMessage } from '@/types'

const STORAGE_KEY = 'teamforge:chat'

/**
 * 对话状态管理
 */
export const useChatStore = defineStore('chat', () => {
  // ============ State ============
  const sessions = ref<ChatSession[]>(loadSessions())
  const currentSessionId = ref<string | null>(null)

  // ============ Getters ============
  const currentSession = computed(() => {
    return sessions.value.find(s => s.id === currentSessionId.value) || null
  })

  const currentMessages = computed(() => {
    return currentSession.value?.messages || []
  })

  const sessionList = computed(() => {
    return sessions.value.map(s => ({
      id: s.id,
      teamId: s.teamId,
      messageCount: s.messages.length,
      updatedAt: s.updatedAt,
    }))
  })

  // ============ Actions ============

  /**
   * 从 localStorage 加载会话
   */
  function loadSessions(): ChatSession[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load chat sessions:', e)
    }
    return []
  }

  /**
   * 保存会话到 localStorage
   */
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions.value))
    } catch (e) {
      console.error('Failed to save chat sessions:', e)
    }
  }

  /**
   * 创建新会话
   */
  function createSession(teamId: string): ChatSession {
    const now = new Date().toISOString()
    const newSession: ChatSession = {
      id: `chat_${Date.now()}`,
      teamId,
      messages: [],
      createdAt: now,
      updatedAt: now,
    }
    sessions.value.unshift(newSession)
    currentSessionId.value = newSession.id
    saveToStorage()
    return newSession
  }

  /**
   * 获取或创建团队会话
   */
  function getOrCreateSession(teamId: string): ChatSession {
    const existing = sessions.value.find(s => s.teamId === teamId)
    if (existing) {
      currentSessionId.value = existing.id
      return existing
    }
    return createSession(teamId)
  }

  /**
   * 设置当前会话
   */
  function setCurrentSession(sessionId: string | null) {
    currentSessionId.value = sessionId
  }

  /**
   * 添加消息
   */
  function addMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      const newMessage: ChatMessage = {
        ...message,
        id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
      }
      session.messages.push(newMessage)
      session.updatedAt = new Date().toISOString()
      saveToStorage()
      return newMessage
    }
    return null
  }

  /**
   * 更新消息
   */
  function updateMessage(sessionId: string, messageId: string, updates: Partial<ChatMessage>) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      const message = session.messages.find(m => m.id === messageId)
      if (message) {
        Object.assign(message, updates)
        saveToStorage()
        return true
      }
    }
    return false
  }

  /**
   * 删除消息
   */
  function deleteMessage(sessionId: string, messageId: string) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      const index = session.messages.findIndex(m => m.id === messageId)
      if (index > -1) {
        session.messages.splice(index, 1)
        session.updatedAt = new Date().toISOString()
        saveToStorage()
        return true
      }
    }
    return false
  }

  /**
   * 清空会话消息
   */
  function clearSession(sessionId: string) {
    const session = sessions.value.find(s => s.id === sessionId)
    if (session) {
      session.messages = []
      session.updatedAt = new Date().toISOString()
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 删除会话
   */
  function deleteSession(sessionId: string) {
    const index = sessions.value.findIndex(s => s.id === sessionId)
    if (index > -1) {
      sessions.value.splice(index, 1)
      if (currentSessionId.value === sessionId) {
        currentSessionId.value = null
      }
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 获取团队的所有会话
   */
  function getSessionsByTeam(teamId: string) {
    return sessions.value.filter(s => s.teamId === teamId)
  }

  return {
    // State
    sessions,
    currentSessionId,
    // Getters
    currentSession,
    currentMessages,
    sessionList,
    // Actions
    createSession,
    getOrCreateSession,
    setCurrentSession,
    addMessage,
    updateMessage,
    deleteMessage,
    clearSession,
    deleteSession,
    getSessionsByTeam,
    saveToStorage,
  }
})
