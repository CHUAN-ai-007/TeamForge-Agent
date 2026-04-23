import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AppSettings, Theme, ToastMessage } from '@/types'

const STORAGE_KEY = 'teamforge:app'

const defaultSettings: AppSettings = {
  theme: 'auto',
  language: 'zh-CN',
  sidebarCollapsed: false,
}

/**
 * 应用全局状态管理
 */
export const useAppStore = defineStore('app', () => {
  // ============ State ============
  const settings = ref<AppSettings>(loadSettings())
  const isLoading = ref(false)
  const toasts = ref<ToastMessage[]>([])

  // ============ Getters ============
  const isDark = computed(() => {
    if (settings.value.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches
    }
    return settings.value.theme === 'dark'
  })

  const currentTheme = computed(() => settings.value.theme)

  // ============ Actions ============

  /**
   * 从 localStorage 加载设置
   */
  function loadSettings(): AppSettings {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return { ...defaultSettings, ...JSON.parse(stored) }
      }
    } catch (e) {
      console.error('Failed to load app settings:', e)
    }
    return { ...defaultSettings }
  }

  /**
   * 保存设置到 localStorage
   */
  function saveSettings() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings.value))
    } catch (e) {
      console.error('Failed to save app settings:', e)
    }
  }

  /**
   * 设置主题
   */
  function setTheme(theme: Theme) {
    settings.value.theme = theme
    applyTheme()
    saveSettings()
  }

  /**
   * 应用主题到 DOM
   */
  function applyTheme() {
    const html = document.documentElement
    if (isDark.value) {
      html.classList.add('dark')
    } else {
      html.classList.remove('dark')
    }
  }

  /**
   * 切换侧边栏
   */
  function toggleSidebar() {
    settings.value.sidebarCollapsed = !settings.value.sidebarCollapsed
    saveSettings()
  }

  /**
   * 显示 Toast 消息
   */
  function showToast(message: string, type: ToastMessage['type'] = 'info', duration = 3000) {
    const id = Date.now().toString()
    toasts.value.push({ id, message, type, duration })

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  /**
   * 移除 Toast 消息
   */
  function removeToast(id: string) {
    const index = toasts.value.findIndex(t => t.id === id)
    if (index > -1) {
      toasts.value.splice(index, 1)
    }
  }

  /**
   * 设置全局加载状态
   */
  function setLoading(loading: boolean) {
    isLoading.value = loading
  }

  // 初始化时应用主题
  applyTheme()

  // 监听系统主题变化
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if (settings.value.theme === 'auto') {
        applyTheme()
      }
    })
  }

  return {
    // State
    settings,
    isLoading,
    toasts,
    // Getters
    isDark,
    currentTheme,
    // Actions
    setTheme,
    toggleSidebar,
    showToast,
    removeToast,
    setLoading,
    saveSettings,
  }
})
