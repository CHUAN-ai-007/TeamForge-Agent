<template>
  <div class="settings-page">
    <header class="page-header">
      <h1 class="page-title">设置</h1>
      <p class="page-subtitle">配置 AI 模型和系统偏好</p>
    </header>

    <!-- 主题设置 -->
    <section class="settings-section">
      <h2 class="section-title">外观</h2>
      <div class="card p-5">
        <div class="setting-item"
        >
          <div>
            <label class="setting-label">主题模式</label>
            <p class="setting-desc">选择您喜欢的界面主题</p>
          </div>
          <div class="theme-selector"
003e
            <button
              v-for="theme in themes"
              :key="theme.value"
              class="theme-option"
              :class="{ active: appStore.currentTheme === theme.value }"
              @click="appStore.setTheme(theme.value)"
            >
              {{ theme.label }}
            </button>
          </div>
        </div>
      </div>
    </section>

    <!-- AI 模型配置 -->
    <section class="settings-section">
      <div class="section-header">
        <h2 class="section-title">AI 模型配置</h2>
        <button class="btn-secondary text-sm" @click="addConfig">
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          添加配置
        </button>
      </div>

      <div class="configs-list">
        <div
          v-for="(config, index) in settingsStore.configs"
          :key="config.id"
          class="config-card"
          :class="{ active: settingsStore.activeConfigId === config.id }"
003e
          <div class="config-header">
            <div class="flex items-center gap-3">
              <input
                type="radio"
                :checked="settingsStore.activeConfigId === config.id"
                @change="settingsStore.setActiveConfig(config.id)"
                class="w-4 h-4 text-primary-600"
              >
              <span class="font-medium">{{ config.name || `配置 ${index + 1}` }}</span>
              <span
                v-if="settingsStore.activeConfigId === config.id"
                class="tag tag-green"
003e
                当前使用
              </span>
            </div>
            <button
              v-if="settingsStore.configs.length > 1"
              class="text-gray-400 hover:text-red-500"
              @click="deleteConfig(config.id)"
            >
              <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          <div class="config-form">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">配置名称</label>
                <input v-model="config.name" type="text" class="input" placeholder="例如：OpenAI"
                 @change="saveConfig">
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">API Key <span class="text-red-500">*</span></label>
                <input
                  v-model="config.apiKey"
                  type="password"
                  class="input"
                  placeholder="sk-..."
                  @change="saveConfig"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">接口地址 <span class="text-red-500">*</span></label>
                <input
                  v-model="config.baseURL"
                  type="text"
                  class="input"
                  placeholder="https://api.openai.com/v1"
                  @change="saveConfig"
                >
              </div>
              <div class="form-group">
                <label class="form-label">模型名称 <span class="text-red-500">*</span></label>
                <input
                  v-model="config.model"
                  type="text"
                  class="input"
                  placeholder="gpt-4o"
                  @change="saveConfig"
                >
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label class="form-label">温度 ({{ config.temperature }})</label>
                <input
                  v-model.number="config.temperature"
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  class="w-full"
                  @change="saveConfig"
                >
              </div>
              <div class="form-group">
                <label class="form-label">最大 Token</label>
                <input
                  v-model.number="config.maxTokens"
                  type="number"
                  class="input"
                  placeholder="4096"
                  @change="saveConfig"
                >
              </div>
            </div>

            <div class="config-actions">
              <button
                class="btn-secondary text-sm"
                :disabled="testingId === config.id"
                @click="testConnection(config)"
              >
                <span v-if="testingId === config.id">测试中...</span>
                <span v-else>测试连接</span>
              </button>

              <span
                v-if="testResults[config.id]"
                class="text-sm"
                :class="testResults[config.id].success ? 'text-green-500' : 'text-red-500'"
              >
                {{ testResults[config.id].message }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 关于 -->
    <section class="settings-section">
      <h2 class="section-title">关于</h2>
      <div class="card p-5">
        <div class="about-content">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-12 h-12 bg-gradient-to-br from-primary-500 to-purple-600 rounded-xl flex items-center justify-center text-white text-2xl">
              🚀
            </div>
            <div>
              <h3 class="font-semibold text-lg">TeamForge Agent</h3>
              <p class="text-gray-500">版本 1.0.0</p>
            </div>
          </div>
          <p class="text-gray-600 dark:text-gray-400">
            企业智能 Agent 团队生成系统，基于 Vue3 + Vite 构建。
          </p>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAppStore } from '@/stores/app'
import { useSettingsStore } from '@/stores/settings'
import type { AIModelConfig } from '@/types'

const appStore = useAppStore()
const settingsStore = useSettingsStore()

const themes = [
  { value: 'light' as const, label: '浅色' },
  { value: 'dark' as const, label: '深色' },
  { value: 'auto' as const, label: '跟随系统' },
]

const testingId = ref<string | null>(null)
const testResults = reactive<Record<string, { success: boolean; message: string }>>({})

function addConfig() {
  settingsStore.addConfig({
    name: `新配置 ${settingsStore.configs.length + 1}`,
    apiKey: '',
    baseURL: 'https://api.openai.com/v1',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 4096,
    topP: 1,
    enabled: true,
  })
}

function deleteConfig(id: string) {
  if (confirm('确定要删除这个配置吗？')) {
    settingsStore.deleteConfig(id)
  }
}

function saveConfig() {
  settingsStore.saveToStorage()
}

async function testConnection(config: AIModelConfig) {
  testingId.value = config.id
  testResults[config.id] = { success: false, message: '' }

  try {
    const result = await settingsStore.testConfig(config)
    testResults[config.id] = result
  } catch (e) {
    testResults[config.id] = { success: false, message: '测试失败' }
  } finally {
    testingId.value = null
  }
}
</script>

<style scoped>
.settings-page {
  @apply p-6 max-w-4xl mx-auto space-y-8;
}

.settings-section {
  @apply space-y-4;
}

.section-header {
  @apply flex items-center justify-between;
}

.section-title {
  @apply text-lg font-semibold text-gray-900 dark:text-white;
}

.setting-item {
  @apply flex items-center justify-between;
}

.setting-label {
  @apply block font-medium text-gray-900 dark:text-white;
}

.setting-desc {
  @apply text-sm text-gray-500 dark:text-gray-400 mt-0.5;
}

.theme-selector {
  @apply flex gap-2;
}

.theme-option {
  @apply px-4 py-2 rounded-lg border border-gray-200 dark:border-dark-600 text-sm transition-colors;
}

.theme-option.active {
  @apply bg-primary-600 text-white border-primary-600;
}

.configs-list {
  @apply space-y-4;
}

.config-card {
  @apply card;
}

.config-card.active {
  @apply ring-2 ring-primary-500;
}

.config-header {
  @apply flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-dark-700;
}

.config-form {
  @apply p-5 space-y-4;
}

.form-row {
  @apply grid grid-cols-1 md:grid-cols-2 gap-4;
}

.config-actions {
  @apply flex items-center gap-4 pt-4 border-t border-gray-200 dark:border-dark-700;
}

.about-content {
  @apply space-y-2;
}
</style>
