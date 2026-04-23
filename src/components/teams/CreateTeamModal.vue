<template>
  <Modal v-model="isVisible" title="新建团队" size="lg" @close="handleClose">
    <div class="space-y-4">
      <div v-if="!isGenerating">
        <div class="form-group">
          <label class="form-label">公司名称 <span class="text-red-500">*</span></label>
          <input v-model="form.name" type="text" class="input" placeholder="例如：创新科技有限公司" maxlength="50">
          <p v-if="errors.name" class="form-error">{{ errors.name }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">所属行业 <span class="text-red-500">*</span></label>
          <select v-model="form.industry" class="input">
            <option value="">请选择行业</option>
            <option v-for="industry in industries" :key="industry" :value="industry">{{ industry }}</option>
          </select>
          <p v-if="errors.industry" class="form-error">{{ errors.industry }}</p>
        </div>

        <div class="form-group">
          <label class="form-label">企业背景介绍 <span class="text-red-500">*</span></label>
          <textarea v-model="form.description" class="input min-h-[120px]" placeholder="请描述企业的业务领域、规模、发展阶段、主要挑战等信息，AI 将据此生成合适的团队架构..." maxlength="1000"></textarea>
          <div class="flex justify-between mt-1">
            <p v-if="errors.description" class="form-error">{{ errors.description }}</p>
            <span v-else></span>
            <span class="text-xs text-gray-400">{{ form.description.length }}/1000</span>
          </div>
        </div>
      </div>

      <div v-else class="generation-progress">
        <div class="progress-header">
          <div class="spinner"></div>
          <span class="progress-title">AI 正在生成团队...</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: `${progress}%`"></div>
        </div>
        <p class="progress-step">{{ currentStep }}</p>
      </div>
    </div>

    <template #footer>
      <button class="btn-secondary" @click="handleClose" :disabled="isGenerating">取消</button>
      <button class="btn-primary" @click="handleSubmit" :disabled="isGenerating || !settingsStore.hasValidConfig">
        <span v-if="isGenerating">生成中...</span>
        <span v-else>开始生成</span>
      </button>
    </template>
  </Modal>

  <!-- API 配置提示 -->
  <div v-if="!settingsStore.hasValidConfig && isVisible && !isGenerating" class="api-warning">
    <div class="warning-content">
      <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>请先前往设置页面配置 AI 模型</span>
      <router-link to="/settings" class="text-primary-600 hover:underline">去配置</router-link>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import Modal from '@/components/common/Modal.vue'
import { useTeamsStore } from '@/stores/teams'
import { useSettingsStore } from '@/stores/settings'
import { useAppStore } from '@/stores/app'
import { analyzeOrganization, generateTeamAgents } from '@/utils/generator'

const props = defineProps<{
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const router = useRouter()
const teamsStore = useTeamsStore()
const settingsStore = useSettingsStore()
const appStore = useAppStore()

const isVisible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value),
})

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
  currentStep.value = '正在分析企业架构...'

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

    // 重置表单并关闭
    form.name = ''
    form.industry = ''
    form.description = ''
    isVisible.value = false

    // 跳转到团队详情页
    router.push(`/teams/${team.info.id}`)
  } catch (error) {
    console.error('生成失败:', error)
    appStore.showToast(error instanceof Error ? error.message : '生成失败，请检查 AI 配置', 'error')
  } finally {
    isGenerating.value = false
  }
}

function handleClose() {
  if (!isGenerating.value) {
    isVisible.value = false
  }
}
</script>

<style scoped>
.form-group {
  @apply space-y-1.5;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-error {
  @apply text-sm text-red-500;
}

.generation-progress {
  @apply py-8 text-center space-y-4;
}

.progress-header {
  @apply flex items-center justify-center gap-3;
}

.spinner {
  @apply w-5 h-5 border-2 border-primary-500 border-t-transparent rounded-full animate-spin;
}

.progress-title {
  @apply font-medium text-gray-900 dark:text-white;
}

.progress-bar {
  @apply h-2 bg-gray-200 dark:bg-dark-700 rounded-full overflow-hidden;
}

.progress-fill {
  @apply h-full bg-gradient-to-r from-primary-500 to-purple-500 rounded-full transition-all duration-300;
}

.progress-step {
  @apply text-sm text-gray-500 dark:text-gray-400;
}

.api-warning {
  @apply fixed bottom-4 left-4 right-4 z-50;
}

.warning-content {
  @apply flex items-center justify-center gap-2 p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-lg border border-yellow-200 dark:border-yellow-800;
}
</style>
