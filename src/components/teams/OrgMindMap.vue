<template>
  <div class="mindmap-container">
    <div v-if="teams.length === 0" class="empty-state">
      <div class="empty-icon">🗺️</div>
      <h3>暂无团队数据</h3>
      <p>创建团队后，将在此处显示组织架构脑图</p>
    </div>

    <div v-else class="mindmap-wrapper">
      <div class="mindmap-toolbar">
        <button class="btn-icon" @click="expandAll" title="展开全部">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button class="btn-icon" @click="collapseAll" title="折叠全部">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <div class="mindmap-content" ref="mindmapRef">
        <div
          v-for="team in teams"
          :key="team.info.id"
          class="team-branch"
        >
          <MindMapNode
            :node="buildTeamNode(team)"
            :expanded-keys="expandedKeys"
            @toggle="toggleNode"
            @select="selectNode"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useTeamsStore } from '@/stores/teams'
import MindMapNode from './MindMapNode.vue'
import type { Team, OrgUnit, Agent } from '@/types'

interface MindMapNodeData {
  id: string
  type: 'team' | 'org' | 'agent'
  name: string
  description?: string
  icon: string
  count?: number
  children: MindMapNodeData[]
  data: Team | OrgUnit | Agent
}

const props = defineProps<{
  teams: Team[]
}>()

const router = useRouter()
const teamsStore = useTeamsStore()

const expandedKeys = ref<Set<string>>(new Set())
const mindmapRef = ref<HTMLElement>()

// 初始化展开所有团队
props.teams.forEach(team => {
  expandedKeys.value.add(team.info.id)
})

function buildTeamNode(team: Team): MindMapNodeData {
  const rootOrg = team.orgStructure.find(o => o.parentId === null)
  const children: MindMapNodeData[] = []

  // 添加组织架构
  if (rootOrg) {
    children.push(...buildOrgNodes(team, rootOrg.id))
  }

  return {
    id: team.info.id,
    type: 'team',
    name: team.info.name,
    description: team.info.industry,
    icon: '🏢',
    count: team.agents.length,
    children,
    data: team,
  }
}

function buildOrgNodes(team: Team, parentId: string | null): MindMapNodeData[] {
  return team.orgStructure
    .filter(o => o.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map(org => {
      const agentCount = team.agents.filter(a => a.orgUnitId === org.id).length
      const childOrgs = buildOrgNodes(team, org.id)
      const agents: MindMapNodeData[] = team.agents
        .filter(a => a.orgUnitId === org.id)
        .map(agent => ({
          id: agent.id,
          type: 'agent',
          name: agent.meta.name,
          description: agent.meta.role,
          icon: agent.meta.avatar || '👤',
          children: [],
          data: agent,
        }))

      return {
        id: org.id,
        type: 'org',
        name: org.name,
        description: org.description,
        icon: getOrgIcon(org.type),
        count: agentCount,
        children: [...childOrgs, ...agents],
        data: org,
      }
    })
}

function getOrgIcon(type: OrgUnit['type']): string {
  const icons: Record<string, string> = {
    company: '🏢',
    department: '📁',
    group: '👥',
    team: '👤',
  }
  return icons[type] || '📄'
}

function toggleNode(nodeId: string) {
  if (expandedKeys.value.has(nodeId)) {
    expandedKeys.value.delete(nodeId)
  } else {
    expandedKeys.value.add(nodeId)
  }
}

function selectNode(node: MindMapNodeData) {
  if (node.type === 'team') {
    const team = node.data as Team
    teamsStore.setCurrentTeam(team.info.id)
    router.push(`/teams/${team.info.id}`)
  } else if (node.type === 'org') {
    const org = node.data as OrgUnit
    const team = props.teams.find(t =>
      t.orgStructure.some(o => o.id === org.id)
    )
    if (team) {
      teamsStore.setCurrentTeam(team.info.id)
      teamsStore.setCurrentOrgUnit(org.id)
      router.push(`/teams/${team.info.id}`)
    }
  } else if (node.type === 'agent') {
    const agent = node.data as Agent
    router.push(`/teams/${agent.teamId}/agents/${agent.id}`)
  }
}

function expandAll() {
  const allIds = new Set<string>()
  props.teams.forEach(team => {
    allIds.add(team.info.id)
    team.orgStructure.forEach(org => allIds.add(org.id))
    team.agents.forEach(agent => allIds.add(agent.id))
  })
  expandedKeys.value = allIds
}

function collapseAll() {
  expandedKeys.value.clear()
  // 只保留团队根节点
  props.teams.forEach(team => {
    expandedKeys.value.add(team.info.id)
  })
}
</script>

<style scoped>
.mindmap-container {
  @apply w-full;
}

.mindmap-wrapper {
  @apply relative;
}

.mindmap-toolbar {
  @apply flex items-center gap-2 mb-4 px-4;
}

.btn-icon {
  @apply p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100
         dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-dark-700
         transition-colors;
}

.mindmap-content {
  @apply overflow-x-auto pb-4;
}

.team-branch {
  @apply mb-6;
}

.empty-state {
  @apply py-16 text-center;
}

.empty-icon {
  @apply text-5xl mb-4;
}

.empty-state h3 {
  @apply text-lg font-medium text-gray-900 dark:text-white mb-2;
}

.empty-state p {
  @apply text-gray-500 dark:text-gray-400;
}
</style>
