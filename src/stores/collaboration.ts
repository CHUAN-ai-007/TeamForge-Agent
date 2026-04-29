import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { CollaborationTask, SubTask, CollaborationMessage, Agent, Team } from '@/types'
import * as collaborationUtils from '@/utils/collaboration'
import { chatCompletion } from '@/api/ai'
import { useSettingsStore } from './settings'

const STORAGE_KEY = 'teamforge:collaboration'

/**
 * 协作任务状态管理
 * 实现主从Agent协作模式：
 * 1. 主Agent（Leader）拆解任务并分配
 * 2. 子Agent并行执行任务
 * 3. 主Agent检查并汇总结果
 */
export const useCollaborationStore = defineStore('collaboration', () => {
  // ============ State ============
  const tasks = ref<CollaborationTask[]>(loadTasks())
  const currentTaskId = ref<string | null>(null)
  const isProcessing = ref(false)
  const abortController = ref<AbortController | null>(null)

  // ============ Getters ============
  const currentTask = computed(() => {
    return tasks.value.find(t => t.id === currentTaskId.value) || null
  })

  const taskList = computed(() => {
    return tasks.value.map(t => ({
      id: t.id,
      teamId: t.teamId,
      title: t.title,
      status: t.status,
      progress: collaborationUtils.calculateProgress(t),
      updatedAt: t.updatedAt
    }))
  })

  const teamTasks = computed(() => (teamId: string) => {
    return tasks.value
      .filter(t => t.teamId === teamId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  })

  // ============ Actions ============

  /**
   * 从 localStorage 加载任务
   */
  function loadTasks(): CollaborationTask[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored)
      }
    } catch (e) {
      console.error('Failed to load collaboration tasks:', e)
    }
    return []
  }

  /**
   * 保存任务到 localStorage
   */
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value))
    } catch (e) {
      console.error('Failed to save collaboration tasks:', e)
    }
  }

  /**
   * 设置当前任务
   */
  function setCurrentTask(taskId: string | null) {
    currentTaskId.value = taskId
  }

  /**
   * 创建新协作任务
   */
  function createTask(teamId: string, title: string, description: string, leaderAgent: Agent): CollaborationTask {
    const task = collaborationUtils.createCollaborationTask(teamId, title, description, leaderAgent)
    tasks.value.unshift(task)
    saveToStorage()
    return task
  }

  /**
   * 删除任务
   */
  function deleteTask(taskId: string): boolean {
    const index = tasks.value.findIndex(t => t.id === taskId)
    if (index > -1) {
      tasks.value.splice(index, 1)
      if (currentTaskId.value === taskId) {
        currentTaskId.value = null
      }
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 更新任务状态
   */
  function updateTaskStatus(taskId: string, status: CollaborationTask['status']) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.status = status
      task.updatedAt = new Date().toISOString()

      if (status === 'executing' && !task.startedAt) {
        task.startedAt = new Date().toISOString()
      }
      if (status === 'completed' || status === 'error') {
        task.completedAt = new Date().toISOString()
      }

      saveToStorage()
    }
  }

  /**
   * 更新子任务状态
   */
  function updateSubTaskStatus(
    taskId: string,
    subTaskId: string,
    status: SubTask['status'],
    output?: string,
    error?: string
  ) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      const subTask = task.subTasks.find(st => st.id === subTaskId)
      if (subTask) {
        subTask.status = status
        if (output !== undefined) subTask.output = output
        if (error !== undefined) subTask.error = error
        if (status === 'executing' && !subTask.startedAt) {
          subTask.startedAt = new Date().toISOString()
        }
        if (status === 'completed' || status === 'failed') {
          subTask.completedAt = new Date().toISOString()
        }
        task.updatedAt = new Date().toISOString()
        saveToStorage()
      }
    }
  }

  /**
   * 添加消息到任务
   */
  function addMessage(
    taskId: string,
    role: CollaborationMessage['role'],
    content: string,
    type: CollaborationMessage['type'] = 'chat',
    agentId?: string,
    agentName?: string,
    subTaskId?: string
  ) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      collaborationUtils.addCollaborationMessage(task, role, content, type, agentId, agentName, subTaskId)
      saveToStorage()
    }
  }

  /**
   * 设置子任务列表
   */
  function setSubTasks(taskId: string, subTasks: SubTask[]) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.subTasks = subTasks
      task.updatedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  /**
   * 设置执行计划
   */
  function setExecutionPlan(taskId: string, plan: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.executionPlan = plan
      task.updatedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  /**
   * 设置最终结果
   */
  function setFinalOutput(taskId: string, output: string) {
    const task = tasks.value.find(t => t.id === taskId)
    if (task) {
      task.finalOutput = output
      task.updatedAt = new Date().toISOString()
      saveToStorage()
    }
  }

  /**
   * 停止当前任务
   */
  function stopTask() {
    if (abortController.value) {
      abortController.value.abort()
      abortController.value = null
    }
    isProcessing.value = false
  }

  /**
   * 执行主从协作任务
   * 完整流程：分析 -> 拆解 -> 分配 -> 执行 -> 汇总
   */
  async function executeCollaboration(
    taskId: string,
    team: Team,
    onProgress?: (message: string) => void
  ): Promise<boolean> {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return false

    const settingsStore = useSettingsStore()
    const modelConfig = settingsStore.enabledConfigs[0] || settingsStore.activeConfig
    if (!modelConfig) {
      throw new Error('未配置AI模型，请先在设置中配置')
    }

    abortController.value = new AbortController()
    isProcessing.value = true

    try {
      // 1. 识别主Agent和子Agent
      const leaderAgent = team.agents.find(a => a.id === task.leaderAgentId)
      if (!leaderAgent) {
        throw new Error('主Agent不存在')
      }

      const subAgents = team.agents.filter(a => a.id !== leaderAgent.id)
      if (subAgents.length === 0) {
        throw new Error('团队中至少需要两个Agent才能进行协作')
      }

      // 2. 任务分析阶段
      updateTaskStatus(taskId, 'analyzing')
      onProgress?.('主Agent正在分析任务...')

      const breakdownPrompt = collaborationUtils.createTaskBreakdownPrompt(
        task.description,
        leaderAgent,
        subAgents
      )

      const breakdownResponse = await chatCompletion(modelConfig, {
        messages: [
          { role: 'system', content: collaborationUtils.getLeaderSystemPrompt(leaderAgent, subAgents) },
          { role: 'user', content: breakdownPrompt }
        ],
        signal: abortController.value.signal
      })

      const { plan, tasks: parsedTasks } = collaborationUtils.parseTaskBreakdown(breakdownResponse.content)

      // 添加计划消息
      addMessage(taskId, 'leader', breakdownResponse.content, 'plan', leaderAgent.id, leaderAgent.meta.name)
      setExecutionPlan(taskId, plan)

      // 3. 创建子任务
      updateTaskStatus(taskId, 'assigning')
      onProgress?.('正在分配子任务...')

      const subTasks: SubTask[] = parsedTasks.map((t, index) => {
        const taskAny = t as any
        const matchedAgent = subAgents.find(a => a.meta.name === taskAny.assignTo) || subAgents[index % subAgents.length]
        return {
          id: collaborationUtils.generateSubTaskId(),
          title: (t.title as string) || '未命名任务',
          description: (t.description as string) || '',
          agentId: matchedAgent.id,
          agentName: matchedAgent.meta.name,
          status: 'pending',
          dependencies: (t.dependencies as string[]) || []
        }
      })

      setSubTasks(taskId, subTasks)

      // 添加任务分配消息
      subTasks.forEach(st => {
        addMessage(taskId, 'system', `任务「${st.title}」已分配给 ${st.agentName}`, 'task_assignment', st.agentId, st.agentName, st.id)
      })

      // 4. 执行子任务
      updateTaskStatus(taskId, 'executing')

      const executableTasks = collaborationUtils.getExecutableSubTasks(subTasks)

      for (const subTask of executableTasks) {
        if (abortController.value?.signal.aborted) {
          throw new Error('任务已取消')
        }

        onProgress?.(`正在执行：${subTask.title}...`)
        updateSubTaskStatus(taskId, subTask.id, 'executing')

        const subAgent = subAgents.find(a => a.id === subTask.agentId)
        if (!subAgent) continue

        const assignmentPrompt = collaborationUtils.createTaskAssignmentPrompt(
          subTask,
          leaderAgent,
          task.executionPlan
        )

        try {
          const response = await chatCompletion(modelConfig, {
            messages: [
              { role: 'system', content: collaborationUtils.getSubAgentSystemPrompt(subAgent, leaderAgent.meta.name) },
              { role: 'user', content: assignmentPrompt }
            ],
            signal: abortController.value.signal
          })

          updateSubTaskStatus(taskId, subTask.id, 'completed', response.content)
          addMessage(taskId, 'sub', response.content, 'task_result', subAgent.id, subAgent.meta.name, subTask.id)
        } catch (error) {
          const errorMsg = error instanceof Error ? error.message : '执行失败'
          updateSubTaskStatus(taskId, subTask.id, 'failed', undefined, errorMsg)
        }
      }

      // 检查是否所有任务完成
      const allCompleted = task.subTasks.every(st => st.status === 'completed' || st.status === 'failed')

      if (allCompleted && task.subTasks.some(st => st.status === 'completed')) {
        // 5. 汇总阶段
        updateTaskStatus(taskId, 'reviewing')
        onProgress?.('主Agent正在汇总结果...')

        const completedResults = task.subTasks
          .filter(st => st.status === 'completed' && st.output)
          .map(st => ({
            title: st.title,
            agentName: st.agentName,
            result: st.output!
          }))

        const consolidationPrompt = collaborationUtils.createConsolidationPrompt(
          task.description,
          task.executionPlan || '',
          completedResults
        )

        const consolidationResponse = await chatCompletion(modelConfig, {
          messages: [
            { role: 'system', content: collaborationUtils.getLeaderSystemPrompt(leaderAgent, subAgents) },
            { role: 'user', content: consolidationPrompt }
          ],
          signal: abortController.value.signal
        })

        setFinalOutput(taskId, consolidationResponse.content)
        addMessage(taskId, 'leader', consolidationResponse.content, 'summary', leaderAgent.id, leaderAgent.meta.name)
      }

      updateTaskStatus(taskId, 'completed')
      onProgress?.('任务完成')
      return true

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '未知错误'
      console.error('Collaboration task failed:', error)
      updateTaskStatus(taskId, 'error')
      addMessage(taskId, 'system', `任务执行失败: ${errorMsg}`, 'chat')
      throw error
    } finally {
      isProcessing.value = false
      abortController.value = null
    }
  }

  /**
   * 重新执行单个失败的子任务
   */
  async function retrySubTask(
    taskId: string,
    subTaskId: string,
    team: Team
  ): Promise<boolean> {
    const task = tasks.value.find(t => t.id === taskId)
    if (!task) return false

    const subTask = task.subTasks.find(st => st.id === subTaskId)
    if (!subTask) return false

    const settingsStore = useSettingsStore()
    const modelConfig = settingsStore.enabledConfigs[0] || settingsStore.activeConfig
    if (!modelConfig) return false

    const leaderAgent = team.agents.find(a => a.id === task.leaderAgentId)
    const subAgent = team.agents.find(a => a.id === subTask.agentId)
    if (!leaderAgent || !subAgent) return false

    try {
      updateSubTaskStatus(taskId, subTaskId, 'executing')

      const assignmentPrompt = collaborationUtils.createTaskAssignmentPrompt(
        subTask,
        leaderAgent,
        task.executionPlan
      )

      const response = await chatCompletion(modelConfig, {
        messages: [
          { role: 'system', content: collaborationUtils.getSubAgentSystemPrompt(subAgent, leaderAgent.meta.name) },
          { role: 'user', content: assignmentPrompt }
        ]
      })

      updateSubTaskStatus(taskId, subTaskId, 'completed', response.content)
      addMessage(taskId, 'sub', response.content, 'task_result', subAgent.id, subAgent.meta.name, subTask.id)

      // 检查是否需要重新汇总
      const allCompleted = task.subTasks.every(st => st.status === 'completed' || st.status === 'failed')
      if (allCompleted) {
        // 触发重新汇总逻辑
        const completedResults = task.subTasks
          .filter(st => st.status === 'completed' && st.output)
          .map(st => ({
            title: st.title,
            agentName: st.agentName,
            result: st.output!
          }))

        const consolidationPrompt = collaborationUtils.createConsolidationPrompt(
          task.description,
          task.executionPlan || '',
          completedResults
        )

        const consolidationResponse = await chatCompletion(modelConfig, {
          messages: [
            { role: 'system', content: collaborationUtils.getLeaderSystemPrompt(leaderAgent, team.agents.filter(a => a.id !== leaderAgent.id)) },
            { role: 'user', content: consolidationPrompt }
          ]
        })

        setFinalOutput(taskId, consolidationResponse.content)
        addMessage(taskId, 'leader', consolidationResponse.content, 'summary', leaderAgent.id, leaderAgent.meta.name)
      }

      return true
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '执行失败'
      updateSubTaskStatus(taskId, subTaskId, 'failed', undefined, errorMsg)
      return false
    }
  }

  return {
    // State
    tasks,
    currentTaskId,
    isProcessing,
    // Getters
    currentTask,
    taskList,
    teamTasks,
    // Actions
    setCurrentTask,
    createTask,
    deleteTask,
    updateTaskStatus,
    updateSubTaskStatus,
    addMessage,
    setSubTasks,
    setExecutionPlan,
    setFinalOutput,
    executeCollaboration,
    retrySubTask,
    stopTask,
    saveToStorage
  }
})
