import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Team, TeamInfo, Agent } from '@/types'

const STORAGE_KEY = 'teamforge:teams'

/**
 * 团队状态管理
 */
export const useTeamsStore = defineStore('teams', () => {
  // ============ State ============
  const teams = ref<Team[]>(loadTeams())
  const currentTeamId = ref<string | null>(null)
  const currentAgentId = ref<string | null>(null)

  // ============ Getters ============
  const currentTeam = computed(() => {
    return teams.value.find(t => t.info.id === currentTeamId.value) || null
  })

  const currentAgent = computed(() => {
    if (!currentTeam.value || !currentAgentId.value) return null
    return currentTeam.value.agents.find(a => a.id === currentAgentId.value) || null
  })

  const teamList = computed(() => teams.value.map(t => t.info))

  const totalAgents = computed(() => {
    return teams.value.reduce((sum, team) => sum + team.agents.length, 0)
  })

  // ============ Actions ============

  /**
   * 从 localStorage 加载团队数据
   */
  function loadTeams(): Team[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
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
    const newTeam: Team = {
      info: {
        ...teamInfo,
        id: `team_${Date.now()}`,
        agentCount: 0,
        createdAt: now,
        updatedAt: now,
      },
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
   * 添加 Agent 到团队
   */
  function addAgent(teamId: string, agent: Agent) {
    const team = teams.value.find(t => t.info.id === teamId)
    if (team) {
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
    // Getters
    currentTeam,
    currentAgent,
    teamList,
    totalAgents,
    // Actions
    createTeam,
    updateTeam,
    deleteTeam,
    setCurrentTeam,
    setCurrentAgent,
    addAgent,
    addAgents,
    updateAgent,
    deleteAgent,
    getAgent,
    getTeam,
    saveToStorage,
  }
})
