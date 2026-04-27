<template>
  <div class="documents-container">
    <!-- 标签切换 -->
    <div class="doc-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="doc-tab"
        :class="{ active: activeTab === tab.key }"
        @click="activeTab = tab.key"
      >
        {{ tab.label }}
      </button>

      <!-- 编辑/预览切换 -->
      <div class="ml-auto flex items-center gap-2 px-4">
        <button
          class="btn-toggle"
          :class="{ active: !isEditing }"
          @click="isEditing = false"
        >
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          预览
        </button>
        <button
          class="btn-toggle"
          :class="{ active: isEditing }"
          @click="isEditing = true"
        >
          <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
          编辑
        </button>
      </div>
    </div>

    <!-- 内容区域 -->
    <div class="doc-content">
      <!-- meta.json -->
      <div v-if="activeTab === 'meta'" class="doc-panel">
        <div v-if="isEditing" class="edit-mode">
          <div class="form-group">
            <label class="form-label">属性定义 (JSON 格式)</label>
            <textarea
              v-model="editForm.meta"
              class="code-textarea"
              rows="20"
              placeholder='{
  "id": "agent_001",
  "name": "产品经理",
  "avatar": "🎯",
  "role": "高级产品经理",
  "department": "产品部",
  "level": "senior",
  "tags": ["产品规划", "需求分析", "用户研究"],
  "permissions": ["read", "write"],
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}

// HRBP 示例：
{
  "name": "佳秀（示例）",
  "slug": "example_jiaxiu",
  "profile": {
    "company": "AI Lab",
    "level": "None",
    "role": "HRBP",
    "department": "AI Lab",
    "gender": "女",
    "mbti": "ENFJ"
  },
  "tags": {
    "personality": ["认真负责", "热情", "爱聊天", "星座达人", "综艺迷"],
    "culture": ["氛围组", "靠谱BP"]
  },
  "impression": "招聘靠谱效率高，闲下来能跟你从星座聊到塔罗再聊到新说唱，团队里的快乐源泉"
}'
            ></textarea>
            <p class="form-hint">提示：请输入合法的 JSON 格式，可直接修改上方示例内容（包含产品经理和HRBP示例）</p>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" @click="cancelEdit">取消</button>
            <button class="btn-primary" :disabled="!hasChanges" @click="saveMeta">保存</button>
          </div>
        </div>
        <div v-else class="preview-mode">
          <CodeBlock language="json" :code="agent.metaContent" />
        </div>
      </div>

      <!-- persona.md -->
      <div v-else-if="activeTab === 'persona'" class="doc-panel">
        <div v-if="isEditing" class="edit-mode">
          <div class="form-group">
            <label class="form-label">用户定义 (Markdown 格式)</label>
            <textarea
              v-model="editForm.persona"
              class="markdown-textarea"
              rows="20"
              placeholder='# 身份背景

我是产品经理，负责产品的全生命周期管理。拥有5年以上互联网产品经验，曾主导多个千万级用户产品的规划与落地。

毕业于知名高校计算机专业，具备技术背景，能与开发团队高效沟通。曾在多家互联网大厂任职，积累了丰富的产品方法论。

## 性格特质

- **理性务实**：做决策基于数据和用户反馈，不凭感觉
- **好奇心强**：持续关注行业动态和新技术
- **用户导向**：始终将用户体验放在首位
- **抗压能力强**：能在紧张的时间节点保持冷静

## 核心价值观

- 用户价值第一
- 数据驱动决策
- 快速迭代验证
- 团队协作共赢

## 专业领域

- 产品规划与策略
- 需求分析与管理
- 用户体验设计
- 数据分析与增长
- 敏捷开发管理

## 沟通风格

专业、直接、有逻辑。善于倾听不同意见，能用简单语言解释复杂概念。与开发沟通注重可行性，与业务沟通关注价值点。'
            ></textarea>
            <p class="form-hint">支持 Markdown 格式，可直接修改上方示例内容，定义角色的身份、性格、背景等人设信息</p>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" @click="cancelEdit">取消</button>
            <button class="btn-primary" :disabled="!hasChanges" @click="savePersona">保存</button>
          </div>
        </div>
        <div v-else class="preview-mode">
          <div class="doc-actions">
            <button class="btn-ghost text-sm" @click="copyContent(agent.personaContent)">
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              复制 Markdown
            </button>
          </div>
          <MarkdownViewer :content="agent.personaContent" />
        </div>
      </div>

      <!-- work.md -->
      <div v-else-if="activeTab === 'work'" class="doc-panel">
        <div v-if="isEditing" class="edit-mode">
          <div class="form-group">
            <label class="form-label">工作定义 (Markdown 格式)</label>
            <textarea
              v-model="editForm.work"
              class="markdown-textarea"
              rows="20"
              placeholder='# 岗位职责

## 核心职责
1. 负责产品规划与版本迭代，制定产品路线图
2. 收集和分析用户需求，撰写产品需求文档(PRD)
3. 与设计、开发团队紧密协作，推动产品落地
4. 监控产品数据指标，持续优化产品体验
5. 竞品分析与行业研究，保持产品竞争力

## 日常工作
- 每日站会同步进度
- 每周用户访谈不少于3次
- 每月输出产品数据分析报告

# 工作流程

## 需求阶段
需求收集 → 用户调研 → 可行性评估 → 需求评审 → PRD撰写

## 开发阶段
原型设计 → 交互评审 → 开发排期 → 进度跟踪 → 测试验收

## 上线阶段
上线检查 → 数据监控 → 用户反馈 → 迭代优化

# 协作规范

## 与开发团队
- 提前沟通技术可行性
- 明确需求优先级
- 及时响应开发疑问
- 参与技术方案评审

## 与设计团队
- 提供清晰的产品目标
- 尊重专业设计意见
- 关注用户体验细节

## 与业务团队
- 理解业务目标
- 用数据支撑决策
- 平衡业务需求与用户体验

# 工作边界

## 职责范围
✓ 产品规划与需求定义
✓ 用户体验设计把控
✓ 产品数据分析

## 不越界
✗ 不直接指挥开发排期
✗ 不擅自更改技术方案
✗ 不绕过设计做界面决定

# 绩效指标

## 核心KPI
- 功能按时交付率 ≥ 90%
- 用户满意度 ≥ 4.5分
- 产品缺陷率 ≤ 5%

## 过程指标
- 需求文档质量评分
- 跨部门协作满意度
- 产品需求变更次数'
            ></textarea>
            <p class="form-hint">支持 Markdown 格式，可直接修改上方示例内容，定义角色的工作职责、流程、规范等信息</p>
          </div>
          <div class="form-actions">
            <button class="btn-secondary" @click="cancelEdit">取消</button>
            <button class="btn-primary" :disabled="!hasChanges" @click="saveWork">保存</button>
          </div>
        </div>
        <div v-else class="preview-mode">
          <div class="doc-actions">
            <button class="btn-ghost text-sm" @click="copyContent(agent.workContent)">
              <svg class="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              复制 Markdown
            </button>
          </div>
          <MarkdownViewer :content="agent.workContent" />
        </div>
      </div>

      <!-- Domain Biz-KB 知识库 -->
      <div v-else-if="activeTab === 'kb'" class="doc-panel">
        <KnowledgeBasePanel :agent="agent" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import type { Agent } from '@/types'
import CodeBlock from '@/components/common/CodeBlock.vue'
import MarkdownViewer from '@/components/common/MarkdownViewer.vue'
import KnowledgeBasePanel from '@/components/agents/KnowledgeBasePanel.vue'
import { useAppStore } from '@/stores/app'
import { useTeamsStore } from '@/stores/teams'
import { copyToClipboard } from '@/utils'

const props = defineProps<{
  agent: Agent
}>()

const appStore = useAppStore()
const teamsStore = useTeamsStore()

const tabs = [
  { key: 'meta', label: 'meta（基础信息）' },
  { key: 'persona', label: 'persona（角色画像）' },
  { key: 'work', label: 'work（工作职责）' },
  { key: 'kb', label: 'Domain Biz-KB（角色领域知识库）' },
]

const activeTab = ref('persona')
const isEditing = ref(false)

// 编辑表单
const editForm = ref({
  meta: '',
  persona: '',
  work: '',
})

// 是否有修改
const hasChanges = computed(() => {
  return editForm.value.meta !== props.agent.metaContent ||
    editForm.value.persona !== props.agent.personaContent ||
    editForm.value.work !== props.agent.workContent
})

// 监听 agent 变化，重置表单
watch(() => props.agent, (newAgent) => {
  editForm.value = {
    meta: newAgent.metaContent,
    persona: newAgent.personaContent,
    work: newAgent.workContent,
  }
}, { immediate: true })

// 取消编辑
function cancelEdit() {
  editForm.value = {
    meta: props.agent.metaContent,
    persona: props.agent.personaContent,
    work: props.agent.workContent,
  }
  isEditing.value = false
}

// 保存 meta
async function saveMeta() {
  try {
    // 验证 JSON 格式
    const parsed = JSON.parse(editForm.value.meta)

    teamsStore.updateAgent(props.agent.teamId, props.agent.id, {
      metaContent: editForm.value.meta,
      meta: {
        ...props.agent.meta,
        ...parsed,
      },
    })

    appStore.showToast('属性定义已保存', 'success')
    isEditing.value = false
  } catch (e) {
    appStore.showToast('JSON 格式错误，请检查', 'error')
  }
}

// 保存 persona
function savePersona() {
  teamsStore.updateAgent(props.agent.teamId, props.agent.id, {
    personaContent: editForm.value.persona,
  })
  appStore.showToast('用户定义已保存', 'success')
  isEditing.value = false
}

// 保存 work
function saveWork() {
  teamsStore.updateAgent(props.agent.teamId, props.agent.id, {
    workContent: editForm.value.work,
  })
  appStore.showToast('工作定义已保存', 'success')
  isEditing.value = false
}

async function copyContent(content: string) {
  const success = await copyToClipboard(content)
  if (success) {
    appStore.showToast('已复制到剪贴板', 'success')
  } else {
    appStore.showToast('复制失败', 'error')
  }
}
</script>

<style scoped>
.documents-container {
  @apply bg-white dark:bg-dark-800 rounded-xl border border-gray-200 dark:border-dark-700 overflow-hidden;
}

.doc-tabs {
  @apply flex items-center border-b border-gray-200 dark:border-dark-700 bg-gray-50 dark:bg-dark-900/50;
}

.doc-tab {
  @apply px-6 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors relative;
}

.doc-tab.active {
  @apply text-primary-600 dark:text-primary-400;
}

.doc-tab.active::after {
  content: '';
  @apply absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500;
}

.btn-toggle {
  @apply flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-colors;
  @apply text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-dark-700;
}

.btn-toggle.active {
  @apply bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300;
}

.doc-content {
  @apply p-6;
}

.doc-panel {
  @apply space-y-4;
}

.edit-mode {
  @apply space-y-4;
}

.preview-mode {
  @apply space-y-4;
}

.form-group {
  @apply space-y-2;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}

.form-hint {
  @apply text-xs text-gray-500 dark:text-gray-400;
}

.code-textarea {
  @apply w-full px-4 py-3 font-mono text-sm rounded-lg border border-gray-300 dark:border-dark-600;
  @apply bg-gray-50 dark:bg-dark-900 text-gray-900 dark:text-gray-100;
  @apply focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  @apply resize-y min-h-[400px];
}

.markdown-textarea {
  @apply w-full px-4 py-3 text-sm rounded-lg border border-gray-300 dark:border-dark-600;
  @apply bg-white dark:bg-dark-900 text-gray-900 dark:text-gray-100;
  @apply focus:ring-2 focus:ring-primary-500 focus:border-transparent;
  @apply resize-y min-h-[400px];
}

.form-actions {
  @apply flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-dark-700;
}

.btn-secondary {
  @apply px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-800 border border-gray-300 dark:border-dark-600 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-colors;
}

.btn-primary {
  @apply px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors;
}

.doc-actions {
  @apply flex justify-end pb-4 border-b border-gray-200 dark:border-dark-700;
}

.btn-ghost {
  @apply inline-flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700 rounded-lg transition-colors;
}
</style>
