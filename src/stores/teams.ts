import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Team, TeamInfo, Agent, OrgUnit } from '@/types'

const STORAGE_KEY = 'teamforge:teams'

/**
 * 创建默认组织架构（以公司名称为根节点）
 */
function createDefaultOrgStructure(teamName: string): OrgUnit[] {
  const now = new Date().toISOString()
  return [{
    id: `org_${Date.now()}`,
    name: teamName,
    type: 'company',
    parentId: null,
    description: '公司总部',
    sortOrder: 0,
    createdAt: now,
    updatedAt: now,
  }]
}

/**
 * 构建组织单元树
 */
function buildOrgTree(units: OrgUnit[], parentId: string | null = null): Array<OrgUnit & { children: OrgUnit[] }> {
  const result: Array<OrgUnit & { children: OrgUnit[] }> = []

  const directChildren = units
    .filter(u => u.parentId === parentId)
    .sort((a, b) => a.sortOrder - b.sortOrder)

  for (const unit of directChildren) {
    result.push({
      ...unit,
      children: buildOrgTree(units, unit.id),
    })
  }

  return result
}

/**
 * 团队状态管理
 */
export const useTeamsStore = defineStore('teams', () => {
  // ============ State ============
  const teams = ref<Team[]>(loadTeams())
  const currentTeamId = ref<string | null>(null)
  const currentAgentId = ref<string | null>(null)
  const currentOrgUnitId = ref<string | null>(null)

  // ============ Getters ============
  const currentTeam = computed(() => {
    return teams.value.find(t => t.info.id === currentTeamId.value) || null
  })

  const currentAgent = computed(() => {
    if (!currentTeam.value || !currentAgentId.value) return null
    return currentTeam.value.agents.find(a => a.id === currentAgentId.value) || null
  })

  const currentOrgUnit = computed(() => {
    if (!currentTeam.value || !currentOrgUnitId.value) return null
    return currentTeam.value.orgStructure.find(u => u.id === currentOrgUnitId.value) || null
  })

  const teamList = computed(() => teams.value.map(t => t.info))

  const totalAgents = computed(() => {
    return teams.value.reduce((sum, team) => sum + team.agents.length, 0)
  })

  /**
   * 当前团队的组织架构树
   */
  const orgTree = computed(() => {
    if (!currentTeam.value) return []
    return buildOrgTree(currentTeam.value.orgStructure)
  })

  /**
   * 获取当前选中组织单元的直属成员
   */
  const currentOrgUnitAgents = computed(() => {
    if (!currentTeam.value || !currentOrgUnitId.value) return []
    return currentTeam.value.agents
      .filter(a => a.orgUnitId === currentOrgUnitId.value)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
  })

  /**
   * 获取当前选中组织单元的所有子组织单元
   */
  const currentOrgUnitChildren = computed(() => {
    if (!currentTeam.value || !currentOrgUnitId.value) return []
    return currentTeam.value.orgStructure
      .filter(u => u.parentId === currentOrgUnitId.value)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  })

  // ============ Actions ============

  /**
   * 从 localStorage 加载团队数据
   */
  function loadTeams(): Team[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const teams = JSON.parse(stored) as Team[]
        // 数据兼容性处理：为旧数据添加 orgStructure
        teams.forEach(team => {
          if (!team.orgStructure || team.orgStructure.length === 0) {
            team.orgStructure = createDefaultOrgStructure(team.info.name)
          }
          // 确保所有 agents 都有 orgUnitId 和 sortOrder
          const orgAgentMap = new Map<string, Agent[]>()
          team.agents.forEach(agent => {
            if (!agent.orgUnitId) {
              agent.orgUnitId = team.orgStructure[0]?.id || null
            }
            const orgId = agent.orgUnitId || 'default'
            if (!orgAgentMap.has(orgId)) {
              orgAgentMap.set(orgId, [])
            }
            orgAgentMap.get(orgId)!.push(agent)
          })
          // 为每个组织内的 agent 分配 sortOrder
          orgAgentMap.forEach((agents) => {
            agents.forEach((agent, index) => {
              if (agent.sortOrder === undefined) {
                agent.sortOrder = index
              }
            })
          })
        })
        return teams
      }
    } catch (e) {
      console.error('Failed to load teams:', e)
    }
    return []
  }

  /**
   * 保存团队数据到 localStorage
   */
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(teams.value))
    } catch (e) {
      console.error('Failed to save teams:', e)
    }
  }

  /**
   * 创建新团队
   */
  function createTeam(teamInfo: Omit<TeamInfo, 'id' | 'agentCount' | 'createdAt' | 'updatedAt'>) {
    const now = new Date().toISOString()
    const teamId = `team_${Date.now()}`
    const orgStructure = createDefaultOrgStructure(teamInfo.name)
    const newTeam: Team = {
      info: {
        ...teamInfo,
        id: teamId,
        agentCount: 0,
        createdAt: now,
        updatedAt: now,
      },
      orgStructure,
      agents: [],
    }
    teams.value.unshift(newTeam)
    saveToStorage()
    return newTeam
  }

  /**
   * 更新团队信息
   */
  function updateTeam(teamId: string, updates: Partial<TeamInfo>) {
    const team = teams.value.find(t => t.info.id === teamId)
    if (team) {
      team.info = { ...team.info, ...updates, updatedAt: new Date().toISOString() }
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 删除团队
   */
  function deleteTeam(teamId: string) {
    const index = teams.value.findIndex(t => t.info.id === teamId)
    if (index > -1) {
      teams.value.splice(index, 1)
      if (currentTeamId.value === teamId) {
        currentTeamId.value = null
        currentAgentId.value = null
      }
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 设置当前团队
   */
  function setCurrentTeam(teamId: string | null) {
    currentTeamId.value = teamId
    currentAgentId.value = null
  }

  /**
   * 设置当前 Agent
   */
  function setCurrentAgent(agentId: string | null) {
    currentAgentId.value = agentId
  }

  /**
   * 设置当前组织单元
   */
  function setCurrentOrgUnit(orgUnitId: string | null) {
    currentOrgUnitId.value = orgUnitId
  }

  // ============ 组织单元管理 ============

  /**
   * 添加组织单元
   */
  function addOrgUnit(teamId: string, unit: Omit<OrgUnit, 'id' | 'createdAt' | 'updatedAt'>): OrgUnit | null {
    const team = teams.value.find(t => t.info.id === teamId)
    if (!team) return null

    const now = new Date().toISOString()
    const newUnit: OrgUnit = {
      ...unit,
      id: `org_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      createdAt: now,
      updatedAt: now,
    }

    team.orgStructure.push(newUnit)
    saveToStorage()
    return newUnit
  }

  /**
   * 更新组织单元
   */
  function updateOrgUnit(teamId: string, unitId: string, updates: Partial<OrgUnit>): boolean {
    const team = teams.value.find(t => t.info.id === teamId)
    if (!team) return false

    const unitIndex = team.orgStructure.findIndex(u => u.id === unitId)
    if (unitIndex > -1) {
      team.orgStructure[unitIndex] = {
        ...team.orgStructure[unitIndex],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 删除组织单元（如果有子组织或成员则不能删除）
   */
  function deleteOrgUnit(teamId: string, unitId: string): { success: boolean; message?: string } {
    const team = teams.value.find(t => t.info.id === teamId)
    if (!team) return { success: false, message: '团队不存在' }

    // 检查是否有子组织
    const hasChildren = team.orgStructure.some(u => u.parentId === unitId)
    if (hasChildren) {
      return { success: false, message: '请先删除下属组织' }
    }

    // 检查是否有成员
    const hasAgents = team.agents.some(a => a.orgUnitId === unitId)
    if (hasAgents) {
      return { success: false, message: '请先移除该组织下的成员' }
    }

    const index = team.orgStructure.findIndex(u => u.id === unitId)
    if (index > -1) {
      // 不能删除根组织
      if (team.orgStructure[index].parentId === null && team.orgStructure.length > 1) {
        return { success: false, message: '不能删除根组织' }
      }

      team.orgStructure.splice(index, 1)
      if (currentOrgUnitId.value === unitId) {
        currentOrgUnitId.value = null
      }
      saveToStorage()
      return { success: true }
    }
    return { success: false, message: '组织不存在' }
  }

  /**
   * 移动组织单元（更改父级）
   */
  function moveOrgUnit(teamId: string, unitId: string, newParentId: string | null): boolean {
    const team = teams.value.find(t => t.info.id === teamId)
    if (!team) return false

    // 不能移动到自己子树下
    if (newParentId) {
      let current: string | null = newParentId
      while (current) {
        const parent = team.orgStructure.find(u => u.id === current)
        if (!parent) break
        if (parent.parentId === unitId) return false
        current = parent.parentId
      }
    }

    return updateOrgUnit(teamId, unitId, { parentId: newParentId })
  }

  /**
   * 重新排序组织单元
   */
  function reorderOrgUnits(teamId: string, unitIds: string[]): boolean {
    const team = teams.value.find(t => t.info.id === teamId)
    if (!team) return false

    unitIds.forEach((id, index) => {
      const unit = team.orgStructure.find(u => u.id === id)
      if (unit) {
        unit.sortOrder = index
      }
    })
    saveToStorage()
    return true
  }

  /**
   * 获取组织单元路径
   */
  function getOrgUnitPath(teamId: string, unitId: string): OrgUnit[] {
    const team = teams.value.find(t => t.info.id === teamId)
    if (!team) return []

    const path: OrgUnit[] = []
    let currentId: string | null = unitId

    while (currentId) {
      const unit = team.orgStructure.find(u => u.id === currentId)
      if (!unit) break
      path.unshift(unit)
      currentId = unit.parentId
    }

    return path
  }

  /**
   * 获取组织单元的直接子组织
   */
  function getOrgUnitChildren(teamId: string, parentId: string | null): OrgUnit[] {
    const team = teams.value.find(t => t.info.id === teamId)
    if (!team) return []

    return team.orgStructure
      .filter(u => u.parentId === parentId)
      .sort((a, b) => a.sortOrder - b.sortOrder)
  }

  /**
   * 添加 Agent 到团队
   */
  function addAgent(teamId: string, agent: Agent) {
    const team = teams.value.find(t => t.info.id === teamId)
    if (team) {
      // 如果没有指定组织单元，默认挂载到根组织
      if (!agent.orgUnitId) {
        const rootOrg = team.orgStructure.find(u => u.parentId === null)
        if (rootOrg) {
          agent.orgUnitId = rootOrg.id
        }
      }
      // 设置默认 sortOrder 为当前组织内最大排序 + 1
      const orgAgents = team.agents.filter(a => a.orgUnitId === agent.orgUnitId)
      agent.sortOrder = orgAgents.length > 0
        ? Math.max(...orgAgents.map(a => a.sortOrder || 0)) + 1
        : 0
      team.agents.push(agent)
      team.info.agentCount = team.agents.length
      team.info.updatedAt = new Date().toISOString()
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 批量添加 Agents
   */
  function addAgents(teamId: string, agents: Agent[]) {
    const team = teams.value.find(t => t.info.id === teamId)
    if (team) {
      const rootOrg = team.orgStructure.find(u => u.parentId === null)
      agents.forEach((agent, index) => {
        if (!agent.orgUnitId && rootOrg) {
          agent.orgUnitId = rootOrg.id
        }
        // 设置 sortOrder
        const orgAgents = team.agents.filter(a => a.orgUnitId === agent.orgUnitId)
        agent.sortOrder = orgAgents.length > 0
          ? Math.max(...orgAgents.map(a => a.sortOrder || 0)) + 1 + index
          : index
      })
      team.agents.push(...agents)
      team.info.agentCount = team.agents.length
      team.info.updatedAt = new Date().toISOString()
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 更新 Agent
   */
  function updateAgent(teamId: string, agentId: string, updates: Partial<Agent>) {
    const team = teams.value.find(t => t.info.id === teamId)
    if (team) {
      const agentIndex = team.agents.findIndex(a => a.id === agentId)
      if (agentIndex > -1) {
        team.agents[agentIndex] = { ...team.agents[agentIndex], ...updates }
        team.info.updatedAt = new Date().toISOString()
        saveToStorage()
        return true
      }
    }
    return false
  }

  /**
   * 删除 Agent
   */
  function deleteAgent(teamId: string, agentId: string) {
    const team = teams.value.find(t => t.info.id === teamId)
    if (team) {
      const index = team.agents.findIndex(a => a.id === agentId)
      if (index > -1) {
        team.agents.splice(index, 1)
        team.info.agentCount = team.agents.length
        team.info.updatedAt = new Date().toISOString()
        if (currentAgentId.value === agentId) {
          currentAgentId.value = null
        }
        saveToStorage()
        return true
      }
    }
    return false
  }

  /**
   * 获取 Agent
   */
  function getAgent(teamId: string, agentId: string): Agent | null {
    const team = teams.value.find(t => t.info.id === teamId)
    return team?.agents.find(a => a.id === agentId) || null
  }

  /**
   * 根据 ID 获取团队
   */
  function getTeam(teamId: string): Team | null {
    return teams.value.find(t => t.info.id === teamId) || null
  }

  return {
    // State
    teams,
    currentTeamId,
    currentAgentId,
    currentOrgUnitId,
    // Getters
    currentTeam,
    currentAgent,
    currentOrgUnit,
    teamList,
    totalAgents,
    orgTree,
    currentOrgUnitAgents,
    currentOrgUnitChildren,
    // Actions
    createTeam,
    updateTeam,
    deleteTeam,
    setCurrentTeam,
    setCurrentAgent,
    setCurrentOrgUnit,
    addOrgUnit,
    updateOrgUnit,
    deleteOrgUnit,
    moveOrgUnit,
    reorderOrgUnits,
    getOrgUnitPath,
    getOrgUnitChildren,
    addAgent,
    addAgents,
    updateAgent,
    deleteAgent,
    getAgent,
    getTeam,
    saveToStorage,
  }
})
