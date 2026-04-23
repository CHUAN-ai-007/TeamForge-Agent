<template>
  <div class="new-team-page">
    <header class="page-header">
      <div class="flex items-center gap-4">
        <button class="btn-ghost p-2" @click="$router.back()">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </button>
        <h1 class="page-title">新建团队</h1>
      </div>
    </header>

    <div class="form-container">
      <div v-if="!isGenerating" class="form-card card p-6 space-y-6">
        <div class="form-group">
          <label class="form-label">公司名称 <span class="text-red-500">*</span></label>
          <input
            v-model="form.name"
            type="text"
            class="input"
            placeholder="例如：创新科技有限公司"
            maxlength="50"
          >
          <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">所属行业 <span class="text-red-500">*</span></label>
          <select v-model="form.industry" class="input">
            <option value="">请选择行业</option>
            <option v-for="industry in industries" :key="industry" :value="industry">
              {{ industry }}
            </option>
          </select>
          <p v-if="errors.industry" class="form-error">{{ errors.industry }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">企业背景介绍 <span class="text-red-500">*</span></label>
          <textarea
            v-model="form.description"
            class="input"
            rows="6"
            placeholder="请描述企业的业务领域、规模、发展阶段、主要挑战等信息，AI 将据此生成合适的团队架构..."
            maxlength="1000"
          ></textarea>
          <div class="flex justify-between mt-2">
            <p v-if="errors.description" class="form-error">{{ errors.description }}</p>
            <span v-else></span>
            <span class="text-sm text-gray-400">{{ form.description.length }}/1000</span>
          </div>
        </div>

        <div v-if="!settingsStore.hasValidConfig" class="api-warning">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div class="text-sm text-yellow-700 dark:text-yellow-400">
              <p class="font-medium">请先配置 AI 模型</p>
              <p class="mt-1">您需要先在设置页面配置 API Key 才能生成团队。{{ ' ' }}
                <router-link to="/settings" class="underline">去配置</router-link>
              </p>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-secondary" @click="$router.back()">取消</button>
          <button
            class="btn-primary"
            :disabled="!settingsStore.hasValidConfig"
            @click="handleSubmit"
          >
            开始生成
          </button>
        </div>
      </div>

      <div v-else class="progress-card card p-12 text-center">
        <div class="progress-animation">
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
          <div class="spinner-ring"></div>
        </div>

        <h3 class="text-xl font-semibold text-gray-900 dark:text-white mt-6">
          AI 正在生成团队...
        </h3>

        <div class="progress-bar-container mt-6">
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${progress}%` }"></div>
          </div>
          <span class="progress-text">{{ Math.round(progress) }}%</span>
        </div>

        <p class="progress-step mt-4">{{ currentStep }}</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import { useSettingsStore } from '@/stores/settings'
import { useAppStore } from '@/stores/app'
import { analyzeOrganization, generateTeamAgents } from '@/utils/generator'

const router = useRouter()
const teamsStore = useTeamsStore()
const settingsStore = useSettingsStore()
const appStore = useAppStore()

const industries = [
  '互联网/科技', '金融/银行', '电商/零售', '教育/培训',
  '医疗/健康', '制造/工业', '媒体/广告', '咨询/服务',
  '房地产/建筑', '物流/供应链', '能源/环保', '其他',
]

const form = reactive({
  name: '',
  industry: '',
  description: '',
})

const errors = reactive<Record<string, string>>({})
const isGenerating = ref(false)
const progress = ref(0)
const currentStep = ref('')

function validateForm(): boolean {
  Object.keys(errors).forEach(key => delete errors[key])

  if (!form.name.trim()) {
    errors.name = '请输入公司名称'
  }
  if (!form.industry) {
    errors.industry = '请选择所属行业'
  }
  if (!form.description.trim() || form.description.length < 20) {
    errors.description = '请输入至少 20 字的背景介绍'
  }

  return Object.keys(errors).length === 0
}

async function handleSubmit() {
  if (!validateForm()) return
  if (!settingsStore.hasValidConfig) {
    appStore.showToast('请先配置 AI 模型', 'warning')
    return
  }

  isGenerating.value = true
  progress.value = 0
  currentStep.value = '正在初始化...'

  try {
    // 1. 创建团队
    const team = teamsStore.createTeam({
      name: form.name,
      industry: form.industry,
      description: form.description,
      background: form.description,
    })

    // 2. 分析组织架构
    progress.value = 10
    currentStep.value = 'AI 正在分析企业需求...'

    const analysis = await analyzeOrganization(
      settingsStore.activeConfig,
      form.name,
      form.industry,
      form.description
    )

    // 3. 生成所有 Agent
    const agents = await generateTeamAgents(
      settingsStore.activeConfig,
      team.info.id,
      form.name,
      form.industry,
      form.description,
      analysis,
      (p) => {
        progress.value = p.progress
        currentStep.value = p.step
      }
    )

    // 4. 保存 Agents
    teamsStore.addAgents(team.info.id, agents)

    appStore.showToast(`成功创建团队并生成 ${agents.length} 个 Agent！`, 'success')

    // 跳转到团队详情页
    router.push(`/teams/${team.info.id}`)
  } catch (error) {
    console.error('生成失败:', error)
    appStore.showToast(error instanceof Error ? error.message : '生成失败，请检查 AI 配置', 'error')
    isGenerating.value = false
  }
}
</script>

<style scoped>
.new-team-page {
  @apply p-6 max-w-3xl mx-auto;
}

.form-container {
  @apply mt-8;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-error {
  @apply text-sm text-red-500;
}

.form-actions {
  @apply flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700;
}

.api-warning {
  @apply p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg;
}

.progress-card {
  @apply max-w-xl mx-auto;
}

.progress-animation {
  @apply relative w-20 h-20 mx-auto;
}

.spinner-ring {
  @apply absolute inset-0 rounded-full border-4 border-transparent border-t-primary-500;
  animation: spin 1s linear infinite;
}

.spinner-ring:nth-child(1) {
  animation-delay: 0s;
}

.spinner-ring:nth-child(2) {
  animation-delay: 0.2s;
  @apply border-t-purple-500 scale-75;
}

.spinner-ring:nth-child(3) {
  animation-delay: 0.4s;
  @apply border-t-blue-500 scale-50;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.progress-bar-container {
  @apply flex items-center gap-4;
}

.progress-bar {
  @apply flex-1 h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-gradient-to-r from-primary-500 via-purple-500 to-blue-500 rounded-full transition-all duration-300;
}

.progress-text {
  @apply text-sm font-medium text-gray-700 dark:text-gray-300 w-12 text-right;
}

.progress-step {
  @apply text-sm text-gray-500 dark:text-gray-400;
}
</style>
