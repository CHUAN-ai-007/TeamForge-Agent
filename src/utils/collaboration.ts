/**
 * 主从协作工具函数
 * TeamForge Agent - 企业智能Agent团队生成系统
 */

import type { Agent, SubTask, CollaborationTask, CollaborationMessage } from '@/types'

/**
 * 识别团队中的主Agent（带星标/负责人标记的Agent）
 */
export function identifyLeaderAgent(agents: Agent[]): Agent | null {
  // 优先查找标记为负责人的Agent
  const leader = agents.find(a =>
    a.meta.tags.includes('负责人') ||
    a.meta.tags.includes('Leader') ||
    a.meta.tags.includes('leader') ||
    a.meta.role.includes('负责人') ||
    a.meta.role.includes('总监') ||
    a.meta.role.includes('经理')
  )

  if (leader) return leader

  // 如果没有明确标记，找职级最高的
  const levelPriority: Record<string, number> = {
    'executive': 4,
    'lead': 3,
    'senior': 2,
    'junior': 1
  }

  const sorted = [...agents].sort((a, b) => {
    const levelDiff = (levelPriority[b.meta.level] || 0) - (levelPriority[a.meta.level] || 0)
    if (levelDiff !== 0) return levelDiff

    // 职级相同，按P级别排序
    const pLevelPriority: Record<string, number> = { 'P5': 5, 'P4': 4, 'P3': 3, 'P2': 2, 'P1': 1 }
    return (pLevelPriority[b.meta.pLevel || 'P1'] || 0) - (pLevelPriority[a.meta.pLevel || 'P1'] || 0)
  })

  return sorted[0] || null
}

/**
 * 获取所有子Agent（非负责人）
 */
export function getSubAgents(agents: Agent[], leaderId: string): Agent[] {
  return agents.filter(a => a.id !== leaderId)
}

/**
 * 根据专业方向匹配最适合的子Agent
 */
export function matchAgentForTask(agents: Agent[], taskDescription: string): Agent | null {
  if (agents.length === 0) return null

  // 提取任务关键词（简单实现）
  const keywords = taskDescription.toLowerCase().split(/\s+/)

  // 计算每个Agent的匹配分数
  const scored = agents.map(agent => {
    let score = 0
    const expertise = agent.persona.expertise || []
    const responsibilities = agent.work.responsibilities || []

    // 匹配专业领域
    expertise.forEach(exp => {
      keywords.forEach(keyword => {
        if (exp.toLowerCase().includes(keyword)) score += 3
      })
    })

    // 匹配职责
    responsibilities.forEach(resp => {
      keywords.forEach(keyword => {
        if (resp.toLowerCase().includes(keyword)) score += 2
      })
    })

    // 匹配角色名称
    keywords.forEach(keyword => {
      if (agent.meta.role.toLowerCase().includes(keyword)) score += 2
      if (agent.meta.name.toLowerCase().includes(keyword)) score += 1
    })

    return { agent, score }
  })

  // 按分数排序，返回最高分的
  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.agent || agents[0]
}

/**
 * 主Agent系统提示词 - 任务拆解与分配
 */
export function getLeaderSystemPrompt(leaderAgent: Agent, subAgents: Agent[]): string {
  const subAgentInfo = subAgents.map(a =>
    `- ${a.meta.name} (${a.meta.role}): 专业领域: ${a.persona.expertise?.join(', ') || '无'}; 职责: ${a.work.responsibilities?.join(', ') || '无'}`
  ).join('\n')

  return `你是 ${leaderAgent.meta.name}，${leaderAgent.meta.role}。

你的职责是：
1. 接收用户需求，理解并分析任务
2. 将复杂任务拆解为多个可并行执行的子任务
3. 根据团队成员的专业方向，合理分配任务
4. 监控任务执行进度
5. 整合各子任务结果，形成完整交付物

你的专业背景：
${leaderAgent.persona.identity}
${leaderAgent.persona.background}

你的团队成员：
${subAgentInfo}

工作流程：
1. 当用户提出需求时，分析需求并制定执行计划
2. 将任务拆解为明确的子任务，每个子任务包含：标题、详细描述、分配给哪位成员
3. 等待所有子任务完成后，检查结果并整合输出

输出格式要求：
- 制定计划时使用 markdown 格式
- 分配任务时使用 JSON 格式：{"tasks": [{"title": "任务名", "description": "任务描述", "assignTo": "Agent名称", "dependencies": []}]}
- 最终汇总时提供完整的、结构化的结果`
}

/**
 * 子Agent系统提示词 - 任务执行
 */
export function getSubAgentSystemPrompt(agent: Agent, leaderName: string): string {
  return `你是 ${agent.meta.name}，${agent.meta.role}。

你的汇报对象是：${leaderName}

你的专业背景：
${agent.persona.identity}
${agent.persona.background}

你的专业领域：${agent.persona.expertise?.join(', ') || '无'}

你的主要职责：
${agent.work.responsibilities?.join('\n') || '无'}

工作边界：
${agent.work.boundaries?.join('\n') || '无'}

当接收到任务时：
1. 专注于你专业领域内的部分
2. 以专业、高效的方式完成任务
3. 输出结构化的结果，便于leader整合
4. 如遇到超出职责范围的问题，明确说明

输出要求：
- 直接给出结果，不需要问候语
- 使用清晰的结构（标题、要点、代码块等）
- 保持专业、简洁的风格`
}

/**
 * 创建任务拆解提示词
 */
export function createTaskBreakdownPrompt(userRequest: string, _leaderAgent: Agent, subAgents: Agent[]): string {
  const agentList = subAgents.map(a =>
    `- ${a.meta.name}: ${a.meta.role}，擅长 ${a.persona.expertise?.join('、') || '无'}`
  ).join('\n')

  return `请分析以下用户需求，并制定执行计划：

用户需求：
${userRequest}

可用团队成员：
${agentList}

请按以下格式输出：

## 执行计划
[整体策略说明]

## 子任务清单
\`\`\`json
{
  "tasks": [
    {
      "title": "任务标题",
      "description": "详细任务描述，包含具体要求和预期输出",
      "assignTo": "Agent名称",
      "dependencies": [] // 依赖的其他任务标题，无依赖则为空数组
    }
  ]
}
\`\`\``
}

/**
 * 创建任务分配提示词
 */
export function createTaskAssignmentPrompt(subTask: SubTask, _leaderAgent: Agent, context?: string): string {
  return `我为你分配了以下任务：

任务名称：${subTask.title}
任务描述：${subTask.description}

${context ? `相关背景信息：\n${context}\n` : ''}

请按照你的专业方向完成此任务，并提供结构化的结果。`
}

/**
 * 创建汇总整合提示词
 */
export function createConsolidationPrompt(
  originalRequest: string,
  executionPlan: string,
  subTaskResults: { title: string; agentName: string; result: string }[]
): string {
  const resultsSection = subTaskResults.map(r =>
    `## ${r.title} (由 ${r.agentName} 完成)\n${r.result}`
  ).join('\n\n')

  return `原始需求：
${originalRequest}

执行计划：
${executionPlan}

各子任务执行结果：
${resultsSection}

请整合以上所有子任务的结果，形成一份完整、连贯、专业的最终交付物。要求：
1. 保持逻辑清晰，结构完整
2. 统一各部分的格式和风格
3. 确保各部分之间衔接自然
4. 突出关键结论和建议
5. 如有冲突或不一致之处，予以协调统一`
}

/**
 * 解析任务拆解结果
 */
export function parseTaskBreakdown(content: string): { plan: string; tasks: Partial<SubTask>[] } {
  // 提取计划部分
  const planMatch = content.match(/## 执行计划\s*\n?([\s\S]*?)(?=## 子任务清单|$)/)
  const plan = planMatch ? planMatch[1].trim() : ''

  // 提取JSON任务列表
  const jsonMatch = content.match(/```json\s*\n?([\s\S]*?)```/)
  let tasks: Partial<SubTask>[] = []

  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[1].trim())
      tasks = parsed.tasks || []
    } catch (e) {
      console.error('Failed to parse task breakdown JSON:', e)
    }
  }

  return { plan, tasks }
}

/**
 * 生成协作任务ID
 */
export function generateTaskId(): string {
  return `collab_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 生成子任务ID
 */
export function generateSubTaskId(): string {
  return `subtask_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * 创建新的协作任务
 */
export function createCollaborationTask(
  teamId: string,
  title: string,
  description: string,
  _leaderAgent: Agent
): CollaborationTask {
  const now = new Date().toISOString()
  return {
    id: generateTaskId(),
    teamId,
    title,
    description,
    status: 'pending',
    leaderAgentId: _leaderAgent.id,
    leaderAgentName: _leaderAgent.meta.name,
    subTasks: [],
    messages: [{
      id: `msg_${Date.now()}`,
      role: 'user',
      content: description,
      timestamp: Date.now(),
      type: 'chat'
    }],
    createdAt: now,
    updatedAt: now
  }
}

/**
 * 添加协作消息
 */
export function addCollaborationMessage(
  task: CollaborationTask,
  role: CollaborationMessage['role'],
  content: string,
  type: CollaborationMessage['type'] = 'chat',
  agentId?: string,
  agentName?: string,
  subTaskId?: string
): CollaborationMessage {
  const message: CollaborationMessage = {
    id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    role,
    content,
    timestamp: Date.now(),
    type,
    agentId,
    agentName,
    subTaskId
  }
  task.messages.push(message)
  task.updatedAt = new Date().toISOString()
  return message
}

/**
 * 检查是否可以执行（依赖任务是否完成）
 */
export function canExecuteSubTask(subTask: SubTask, allSubTasks: SubTask[]): boolean {
  if (!subTask.dependencies || subTask.dependencies.length === 0) return true

  return subTask.dependencies.every(depId => {
    const dep = allSubTasks.find(t => t.id === depId)
    return dep && dep.status === 'completed'
  })
}

/**
 * 获取可并行执行的子任务
 */
export function getExecutableSubTasks(subTasks: SubTask[]): SubTask[] {
  return subTasks.filter(t =>
    t.status === 'pending' && canExecuteSubTask(t, subTasks)
  )
}

/**
 * 计算任务进度百分比
 */
export function calculateProgress(task: CollaborationTask): number {
  if (task.subTasks.length === 0) {
    switch (task.status) {
      case 'pending': return 0
      case 'analyzing': return 10
      case 'assigning': return 20
      case 'executing': return 30
      case 'reviewing': return 80
      case 'completed': return 100
      default: return 0
    }
  }

  const completed = task.subTasks.filter(t => t.status === 'completed').length
  return Math.round((completed / task.subTasks.length) * 70) + 20 // 20-90% 区间分配给子任务执行
}
