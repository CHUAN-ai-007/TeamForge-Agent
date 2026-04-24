<template>
  <div class="org-tree">
    <div class="org-tree-header">
      <h3 class="text-sm font-medium text-gray-700 dark:text-gray-300">组织架构</h3>
      <button
        v-if="currentTeamId"
        class="btn-icon text-xs"
        @click="showAddModal = true"
        title="添加组织"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      </button>
    </div>

    <div class="org-tree-content">
      <OrgTreeNode
        v-for="node in tree"
        :key="node.id"
        :node="node"
        :selected-id="selectedId"
        :level="0"
        @select="handleSelect"
        @add="handleAddChild"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </div>

    <!-- 添加/编辑组织弹窗 -->
    <Modal v-model="showAddModal" :title="isEditing ? '编辑组织' : '添加组织'" size="sm">
      <div class="space-y-4">
        <div class="form-group">
          <label class="form-label">组织名称 <span class="text-red-500">*</span></label>
          <input v-model="form.name" type="text" class="input" placeholder="例如：产品部">
        </div>
        <div class="form-group">
          <label class="form-label">组织类型</label>
          <select v-model="form.type" class="input">
            <option value="company">公司</option>
            <option value="department">部门</option>
            <option value="group">小组</option>
            <option value="team">团队</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">描述</label>
          <input v-model="form.description" type="text" class="input" placeholder="简短描述该组织职能">
        </div>
        <div v-if="parentNodeName" class="form-group">
          <label class="form-label">上级组织</label>
          <input :value="parentNodeName" type="text" class="input bg-gray-100 dark:bg-dark-700" disabled>
        </div>
      </div>
      <template #footer>
        <button class="btn-secondary" @click="showAddModal = false">取消</button>
        <button class="btn-primary" @click="handleSubmit">{{ isEditing ? '保存' : '添加' }}</button>
      </template>
    </Modal>

    <!-- 删除确认弹窗 -->
    <Modal v-model="showDeleteModal" title="确认删除" size="sm">
      <p class="text-gray-600 dark:text-gray-300">
        确定要删除 "{{ deleteTarget?.name }}" 吗？
      </p>
      <template #footer>
        <button class="btn-secondary" @click="showDeleteModal = false">取消</button>
        <button class="btn-danger" @click="confirmDelete">删除</button>
      </template>
    </Modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTeamsStore } from '@/stores/teams'
import { useAppStore } from '@/stores/app'
import OrgTreeNode from './OrgTreeNode.vue'
import Modal from '@/components/common/Modal.vue'
import type { OrgUnit } from '@/types'

interface TreeNode extends OrgUnit {
  children: TreeNode[]
}

const props = defineProps<{
  teamId: string
}>()

const emit = defineEmits<{
  (e: 'select', unitId: string): void
}>()

const teamsStore = useTeamsStore()
const appStore = useAppStore()

const showAddModal = ref(false)
const showDeleteModal = ref(false)
const isEditing = ref(false)
const editingId = ref<string | null>(null)
const parentId = ref<string | null>(null)
const deleteTarget = ref<OrgUnit | null>(null)
const selectedId = ref<string | null>(null)

const currentTeamId = computed(() => props.teamId)
const tree = computed(() => teamsStore.orgTree as TreeNode[])

const form = ref({
  name: '',
  type: 'department' as OrgUnit['type'],
  description: '',
})

const parentNodeName = computed(() => {
  if (!parentId.value) return ''
  const team = teamsStore.currentTeam
  const parent = team?.orgStructure.find(u => u.id === parentId.value)
  return parent?.name || ''
})

// 监听当前团队，自动选中根组织
watch(() => teamsStore.currentTeam, (team) => {
  if (team && !selectedId.value) {
    const root = team.orgStructure.find(u => u.parentId === null)
    if (root) {
      selectedId.value = root.id
      emit('select', root.id)
    }
  }
}, { immediate: true })

function handleSelect(unitId: string) {
  selectedId.value = unitId
  emit('select', unitId)
}

function handleAddChild(parentUnitId: string) {
  isEditing.value = false
  editingId.value = null
  parentId.value = parentUnitId
  form.value = {
    name: '',
    type: 'department',
    description: '',
  }
  showAddModal.value = true
}

function handleEdit(unit: OrgUnit) {
  isEditing.value = true
  editingId.value = unit.id
  parentId.value = unit.parentId
  form.value = {
    name: unit.name,
    type: unit.type,
    description: unit.description,
  }
  showAddModal.value = true
}

function handleDelete(unit: OrgUnit) {
  deleteTarget.value = unit
  showDeleteModal.value = true
}

function confirmDelete() {
  if (!deleteTarget.value) return

  const result = teamsStore.deleteOrgUnit(props.teamId, deleteTarget.value.id)
  if (result.success) {
    appStore.showToast('删除成功', 'success')
    if (selectedId.value === deleteTarget.value.id) {
      // 如果删除的是当前选中，切换到父级或根级
      const parentId = deleteTarget.value.parentId
      if (parentId) {
        selectedId.value = parentId
        emit('select', parentId)
      }
    }
  } else {
    appStore.showToast(result.message || '删除失败', 'error')
  }
  showDeleteModal.value = false
  deleteTarget.value = null
}

function handleSubmit() {
  if (!form.value.name.trim()) {
    appStore.showToast('请输入组织名称', 'warning')
    return
  }

  if (isEditing.value && editingId.value) {
    teamsStore.updateOrgUnit(props.teamId, editingId.value, {
      name: form.value.name,
      type: form.value.type,
      description: form.value.description,
    })
    appStore.showToast('更新成功', 'success')
  } else {
    teamsStore.addOrgUnit(props.teamId, {
      name: form.value.name,
      type: form.value.type,
      parentId: parentId.value,
      description: form.value.description,
      sortOrder: 0,
    })
    appStore.showToast('添加成功', 'success')
  }

  showAddModal.value = false
}
</script>

<style scoped>
.org-tree {
  @apply h-full flex flex-col;
}

.org-tree-header {
  @apply flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-dark-700;
}

.org-tree-content {
  @apply flex-1 overflow-y-auto p-2;
}

.btn-icon {
  @apply p-1.5 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-dark-700 transition-colors;
}

.form-group {
  @apply space-y-1.5;
}

.form-label {
  @apply block text-sm font-medium text-gray-700 dark:text-gray-300;
}
</style>
