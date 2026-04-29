/**
 * Agent Prompt 构建工具
 * 实现 Agent "大脑" 的分层构建：Persona + Work + Domain Biz-KB
 */

import type { Agent, ChatMessage, KnowledgeDoc } from '@/types'

/**
 * 从知识库中检索相关内容（简单关键词匹配，v3.3.0后升级为向量检索）
 */
export function retrieveKnowledge(
  knowledgeBase: KnowledgeDoc[],
  query: string,
  topK: number = 3
): string {
  if (!knowledgeBase || knowledgeBase.length === 0) {
    return ''
  }

  // 简单关键词匹配（临时方案）
  const keywords = query.toLowerCase().split(/\s+/).filter(k => k.length > 1)

  const scoredDocs = knowledgeBase.map(doc => {
    const content = doc.content.toLowerCase()
    let score = 0

    // 标题匹配权重更高
    if (doc.title.toLowerCase().includes(query.toLowerCase())) {
      score += 10
    }

    // 关键词匹配
    keywords.forEach(keyword => {
      const matches = content.split(keyword).length - 1
      score += matches
    })

    return { doc, score }
  })

  // 按分数排序，取前topK
  const topDocs = scoredDocs
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(item => item.doc)

  if (topDocs.length === 0) {
    return ''
  }

  return topDocs
    .map(doc => `【${doc.title}】\n${doc.content.slice(0, 1000)}`)
    .join('\n\n---\n\n')
}

/**
 * 构建 Persona 层 Prompt（"我是谁"）
 */
function buildPersonaLayer(agent: Agent): string {
  const { persona } = agent

  return `## 你的角色定位

**身份**：${persona.identity}

**性格特质**：${persona.personality}

**背景经历**：${persona.background}

**沟通风格**：${persona.communicationStyle}

**核心价值观**：${persona.values.join('、')}

**专业领域**：${persona.expertise.join('、')}

**请在所有回复中保持以上角色特征，用符合身份的方式思考和表达。**`
}

/**
 * 构建 Work 层 Prompt（"我要做什么"）
 */
function buildWorkLayer(agent: Agent): string {
  const { work } = agent

  return `## 你的工作职责

**核心职责**：
${work.responsibilities.map(r => `- ${r}`).join('\n')}

**工作流程**：
${work.workflow}

**协作规则**：
${work.collaborationRules.map(r => `- ${r}`).join('\n')}

**工作边界**（什么该做，什么不该做）：
${work.boundaries.map(b => `- ${b}`).join('\n')}

**关键绩效指标**：
${work.kpis.map(k => `- ${k}`).join('\n')}

**请严格在以上职责范围内工作，不越界、不缺位。**`
}

/**
 * 构建 Domain Biz-KB 层 Prompt（"我凭什么做"）
 */
function buildKnowledgeLayer(agent: Agent, query: string): string {
  const { knowledgeBase, ragSettings } = agent

  if (!knowledgeBase || knowledgeBase.length === 0 || !ragSettings?.enabled) {
    return ''
  }

  const relevantKnowledge = retrieveKnowledge(
    knowledgeBase,
    query,
    ragSettings.topK
  )

  if (!relevantKnowledge) {
    return ''
  }

  return `## 相关领域知识

以下是从你的知识库中检索到的与当前任务相关的专业知识，请结合这些知识进行分析和回答：

${relevantKnowledge}

**请充分利用以上专业知识，确保回答的专业性和准确性。**`
}

/**
 * 构建完整的 Agent System Prompt（三层叠加）
 */
export function buildAgentSystemPrompt(
  agent: Agent,
  context?: {
    task?: string        // 具体任务描述
    input?: string       // 用户输入或任务输入
    history?: ChatMessage[]  // 历史对话
  }
): string {
  const parts: string[] = []

  // Layer 1: Persona（角色画像）- 始终包含
  parts.push(buildPersonaLayer(agent))
  parts.push('')

  // Layer 2: Work（工作职责）- 始终包含
  parts.push(buildWorkLayer(agent))
  parts.push('')

  // Layer 3: Domain Biz-KB（领域知识）- 如果有查询内容则动态检索
  if (context?.input || context?.task) {
    const query = context.task || context.input || ''
    const knowledgePart = buildKnowledgeLayer(agent, query)
    if (knowledgePart) {
      parts.push(knowledgePart)
      parts.push('')
    }
  }

  // 添加任务上下文（如果有）
  if (context?.task) {
    parts.push(`## 当前任务\n\n${context.task}`)
    parts.push('')
  }

  // 添加历史对话（如果有）
  if (context?.history && context.history.length > 0) {
    const recentHistory = context.history.slice(-5) // 最近5条
    parts.push('## 历史对话\n')
    recentHistory.forEach(msg => {
      const role = msg.role === 'user' ? '用户' : agent.meta.name
      parts.push(`${role}：${msg.content}`)
    })
    parts.push('')
  }

  // 输出要求
  parts.push(`## 输出要求

1. **保持角色一致性**：始终以${agent.meta.name}的身份和风格回复
2. **专业且准确**：充分利用你的专业知识和工作经验
3. **结构化表达**：复杂内容使用标题、列表、表格等方式组织
4. **可操作性强**：给出具体的建议、步骤或方案，而非空泛的理论
5. **主动协作**：如果需要其他Agent协助，明确提出协作需求`)

  return parts.join('\n')
}

/**
 * 构建对话场景的 System Prompt（团队群聊）
 */
export function buildChatSystemPrompt(
  teamName: string,
  agents: Agent[],
  currentAgent: Agent
): string {
  const parts: string[] = []

  parts.push(`你是企业智能Agent团队"${teamName}"的成员之一。`)
  parts.push('')

  // 团队成员介绍
  parts.push('## 团队成员')
  agents.forEach(agent => {
    const isSelf = agent.id === currentAgent.id
    parts.push(`${isSelf ? '👉 ' : ''}**${agent.meta.name}** (${agent.meta.role}) - ${agent.meta.level} | ${agent.meta.tags.join(', ')}`)
  })
  parts.push('')

  // 当前Agent的完整大脑配置
  parts.push(`## 你的配置（${currentAgent.meta.name}）`)
  parts.push('')
  parts.push(buildAgentSystemPrompt(currentAgent))

  // 发言规则
  parts.push('')
  parts.push(`## 发言规则

1. **按需发言**：只有当问题与你的专业领域或职责相关时才发言
2. **协作精神**：如果问题涉及其他成员的专业领域，可以邀请他们协作
3. **格式要求**：以"【${currentAgent.meta.name}】"开头，然后是回复内容
4. **简洁专业**：避免冗长，直击要点，体现专业素养`)

  return parts.join('\n')
}

/**
 * 构建工作执行场景的 Prompt（项目/任务执行）
 */
export function buildWorkSystemPrompt(
  agent: Agent,
  task: {
    title: string
    description: string
    input?: Record<string, any>
  },
  dependencies?: string[]  // 依赖任务的结果
): string {
  const parts: string[] = []

  // Agent大脑配置
  parts.push(buildAgentSystemPrompt(agent, {
    task: task.description,
    input: JSON.stringify(task.input || {})
  }))

  // 任务信息
  parts.push('')
  parts.push(`## 执行任务：${task.title}`)
  parts.push('')
  parts.push(`**任务描述**：${task.description}`)

  // 输入数据
  if (task.input && Object.keys(task.input).length > 0) {
    parts.push('')
    parts.push('**输入数据**：')
    parts.push('```json')
    parts.push(JSON.stringify(task.input, null, 2))
    parts.push('```')
  }

  // 依赖任务结果
  if (dependencies && dependencies.length > 0) {
    parts.push('')
    parts.push('**前置任务结果**（请在此基础上继续）：')
    dependencies.forEach((dep, index) => {
      parts.push(`\n【前置任务${index + 1}】\n${dep}`)
    })
  }

  // 输出要求
  parts.push('')
  parts.push(`## 输出要求

1. **专业交付**：以${agent.meta.name}的专业标准完成此任务
2. **结构清晰**：使用标题、列表、表格等组织输出
3. **完整详尽**：确保任务要求的所有要点都已覆盖
4. **质量自检**：在输出末尾简要说明你对成果的满意度（1-5分）及理由`)

  return parts.join('\n')
}

/**
 * 解析 Agent 响应，提取名称和内容
 */
export function parseAgentResponse(
  content: string,
  teamAgents: Agent[]
): { content: string; agentName?: string; agentAvatar?: string } {
  // 尝试提取 【Agent名称】格式
  const bracketMatch = content.match(/^【(.+?)】/)
  if (bracketMatch) {
    const agentName = bracketMatch[1]
    const agent = teamAgents.find(a => a.meta.name === agentName)
    return {
      content: content.replace(/^【.+?】\s*/, ''),
      agentName,
      agentAvatar: agent?.meta.avatar,
    }
  }

  // 尝试提取 Agent名称: 格式
  const colonMatch = content.match(/^(.+?)[:：]/)
  if (colonMatch) {
    const possibleName = colonMatch[1].trim()
    const agent = teamAgents.find(a =>
      a.meta.name === possibleName || a.meta.role === possibleName
    )
    if (agent) {
      return {
        content: content.replace(/^.+?[:：]\s*/, ''),
        agentName: agent.meta.name,
        agentAvatar: agent.meta.avatar,
      }
    }
  }

  // 默认返回第一个 Agent
  const defaultAgent = teamAgents[0]
  return {
    content,
    agentName: defaultAgent?.meta.name || '团队助手',
    agentAvatar: defaultAgent?.meta.avatar,
  }
}
