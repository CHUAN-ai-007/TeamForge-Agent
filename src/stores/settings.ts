import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { AIModelConfig } from '@/types'
import { DEFAULT_MODEL_CONFIG } from '@/types'

/**
 * 构建测试请求配置
 * 开发环境下使用 Vite 代理解决 CORS 问题
 */
function buildTestRequest(config: AIModelConfig): { url: string; headers: Record<string, string>; body: string } {
  // 处理 baseURL，移除末尾斜杠
  const baseURL = config.baseURL.replace(/\/$/, '')

  const requestBody = JSON.stringify({
    model: config.model,
    messages: [{ role: 'user', content: 'Hello' }],
    max_tokens: 5,
  })

  // 开发环境下，如果访问的是外部 API，使用代理
  // @ts-ignore
  if (typeof import.meta.env !== 'undefined' && import.meta.env.DEV && baseURL.startsWith('http')) {
    console.log('[Test] Using proxy for:', baseURL)
    return {
      url: '/api/proxy',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'x-target-url': baseURL,
      },
      body: requestBody,
    }
  }

  return {
    url: `${baseURL}/chat/completions`,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: requestBody,
  }
}

const STORAGE_KEY = 'teamforge:settings'

/**
 * AI 模型配置状态管理
 */
export const useSettingsStore = defineStore('settings', () => {
  // ============ State ============
  const configs = ref<AIModelConfig[]>([loadDefaultConfig()])
  const activeConfigId = ref<string>(DEFAULT_MODEL_CONFIG.id)

  // ============ Getters ============
  const activeConfig = computed(() => {
    return configs.value.find(c => c.id === activeConfigId.value) || configs.value[0]
  })

  const hasValidConfig = computed(() => {
    const config = activeConfig.value
    return !!config.apiKey && !!config.baseURL && !!config.model
  })

  const enabledConfigs = computed(() => configs.value.filter(c => c.enabled))

  // ============ Actions ============

  /**
   * 加载默认配置
   */
  function loadDefaultConfig(): AIModelConfig {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        configs.value = parsed.configs || [DEFAULT_MODEL_CONFIG]
        activeConfigId.value = parsed.activeConfigId || DEFAULT_MODEL_CONFIG.id
        return configs.value[0]
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    }
    return { ...DEFAULT_MODEL_CONFIG }
  }

  /**
   * 保存配置到 localStorage
   */
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        configs: configs.value,
        activeConfigId: activeConfigId.value,
      }))
    } catch (e) {
      console.error('Failed to save settings:', e)
    }
  }

  /**
   * 添加新配置
   */
  function addConfig(config: Omit<AIModelConfig, 'id'>) {
    const newConfig: AIModelConfig = {
      ...config,
      id: `config_${Date.now()}`,
    }
    configs.value.push(newConfig)
    saveToStorage()
    return newConfig
  }

  /**
   * 更新配置
   */
  function updateConfig(id: string, updates: Partial<AIModelConfig>) {
    const index = configs.value.findIndex(c => c.id === id)
    if (index > -1) {
      configs.value[index] = { ...configs.value[index], ...updates }
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 删除配置
   */
  function deleteConfig(id: string) {
    if (configs.value.length <= 1) {
      return false // 至少保留一个配置
    }
    const index = configs.value.findIndex(c => c.id === id)
    if (index > -1) {
      configs.value.splice(index, 1)
      if (activeConfigId.value === id) {
        activeConfigId.value = configs.value[0].id
      }
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 设置活跃配置
   */
  function setActiveConfig(id: string) {
    if (configs.value.some(c => c.id === id)) {
      activeConfigId.value = id
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 测试配置是否有效
   */
  async function testConfig(config: AIModelConfig): Promise<{ success: boolean; message: string }> {
    // 验证配置
    if (!config.baseURL.trim()) {
      return { success: false, message: '错误: 接口地址不能为空' }
    }
    if (!config.apiKey.trim()) {
      return { success: false, message: '错误: API Key 不能为空' }
    }
    if (!config.model.trim()) {
      return { success: false, message: '错误: 模型名称不能为空' }
    }

    const { url, headers, body } = buildTestRequest(config)

    console.log('[TestConfig] URL:', url)
    console.log('[TestConfig] Model:', config.model)

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body,
      })

      console.log('[TestConfig] Response status:', response.status)

      if (response.ok) {
        return { success: true, message: '连接成功' }
      } else {
        const errorData = await response.json().catch(() => null)
        console.error('[TestConfig] API Error:', errorData)
        const errorMsg = errorData?.error?.message || errorData?.message || `HTTP ${response.status}`
        return { success: false, message: `连接失败: ${errorMsg}` }
      }
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e)
      console.error('[TestConfig] Fetch Error:', errorMsg)
      return { success: false, message: `请求错误: ${errorMsg}` }
    }
  }

  // 初始化
  loadDefaultConfig()

  return {
    // State
    configs,
    activeConfigId,
    // Getters
    activeConfig,
    hasValidConfig,
    enabledConfigs,
    // Actions
    addConfig,
    updateConfig,
    deleteConfig,
    setActiveConfig,
    saveToStorage,
    testConfig,
  }
})
