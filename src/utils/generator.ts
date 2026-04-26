/**
 * Agent 生成逻辑
 * 负责分析企业信息并生成完整的 Agent 团队
 */

import { generateText, generateJSON } from '@/api/ai'
import type { AIModelConfig, Agent, AgentMeta, AgentPersona, AgentWork } from '@/types'

export interface TeamAnalysis {
  roles: Array<{
    name: string
    department: string
    level: 'junior' | 'senior' | 'lead' | 'executive'
    responsibility: string
  }>
}

export interface GenerationProgress {
  step: string
  progress: number
}

/**
 * 分析企业信息，生成组织架构
 */
export async function analyzeOrganization(
  config: AIModelConfig,
  companyName: string,
  industry: string,
  description: string
): Promise<TeamAnalysis> {
  const systemPrompt = `你是一位企业组织架构设计专家。请分析输入的企业信息，设计合理的团队角色架构。

要求：
1. 根据企业规模和行业特点，设计 4-8 个核心岗位角色
2. 每个角色需要包含：岗位名称、所属部门、职级、主要职责
3. 职级仅限：junior(初级)、senior(资深)、lead(主管)、executive(高管)
4. 角色应该覆盖企业的核心职能
5. 返回严格的 JSON 格式

响应格式示例：
{
  "roles": [
    {
      "name": "产品经理",
      "department": "产品部",
      "level": "senior",
      "responsibility": "负责产品规划与需求分析"
    }
  ]
}`

  const prompt = `请为以下企业设计团队架构：

公司名称：${companyName}
所属行业：${industry}
企业背景：${description}

请返回 JSON 格式的角色列表。`

  return generateJSON<TeamAnalysis>(config, prompt, systemPrompt)
}

/**
 * 生成单个 Agent 的完整信息
 */
export async function generateAgent(
  config: AIModelConfig,
  teamId: string,
  companyName: string,
  industry: string,
  companyDescription: string,
  roleInfo: TeamAnalysis['roles'][0],
  progressCallback?: (progress: GenerationProgress) => void
): Promise<Agent> {
  const agentId = `agent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // 步骤1：生成 meta.json
  progressCallback?.({ step: `正在生成 ${roleInfo.name} 的元数据...`, progress: 10 })
  const metaContent = await generateAgentMeta(config, companyName, industry, roleInfo)

  // 步骤2：生成 persona.md
  progressCallback?.({ step: `正在构建 ${roleInfo.name} 的人设档案...`, progress: 40 })
  const personaContent = await generateAgentPersona(config, companyName, industry, companyDescription, roleInfo, metaContent)

  // 步骤3：生成 work.md
  progressCallback?.({ step: `正在编写 ${roleInfo.name} 的工作规范...`, progress: 70 })
  const workContent = await generateAgentWork(config, companyName, industry, companyDescription, roleInfo, metaContent, personaContent)

  // 步骤4：解析并构建 Agent 对象
  progressCallback?.({ step: `正在整合 ${roleInfo.name} 的完整档案...`, progress: 90 })

  const meta = parseMetaContent(metaContent, agentId)
  const persona = parsePersonaContent(personaContent)
  const work = parseWorkContent(workContent)

  return {
    id: agentId,
    teamId,
    orgUnitId: null,
    sortOrder: 0,
    meta,
    persona,
    work,
    metaContent: JSON.stringify(metaContent, null, 2),
    personaContent,
    workContent,
  }
}

/**
 * 生成 Agent 元数据 (meta.json)
 */
async function generateAgentMeta(
  config: AIModelConfig,
  companyName: string,
  industry: string,
  roleInfo: TeamAnalysis['roles'][0]
): Promise<AgentMeta> {
  const systemPrompt = `你是一位企业角色设计专家。请为指定岗位生成完整的元数据配置。

要求：
1. id：使用小写字母和下划线
2. name：角色显示名称（中文）
3. avatar：从以下列表中选择最相关的emoji：👤 👨‍💼 👩‍💼 👨‍💻 👩‍💻 👨‍🔧 👩‍🔧 👨‍🎨 👩‍🎨 👨‍📊 👩‍📊 👨‍🔬 👩‍🔬 👨‍🎓 👩‍🎓 👨‍✈️ 👩‍✈️ 👨‍⚖️ 👩‍⚖️ 👨‍💼 👨‍🏫 👩‍🏫 👨‍🌾 👩‍🌾
4. role：岗位职称
5. department：所属部门
6. level：职级 (${roleInfo.level})
7. tags：3-5个能力标签
8. permissions：2-4个权限标识
9. createdAt/updatedAt：当前时间

响应必须是有效的 JSON 对象。`

  const prompt = `请为以下岗位生成元数据：

公司：${companyName}
行业：${industry}
岗位名称：${roleInfo.name}
所属部门：${roleInfo.department}
职级：${roleInfo.level}
职责概述：${roleInfo.responsibility}

请返回 JSON 格式的完整元数据。`

  const meta = await generateJSON<Partial<AgentMeta>>(config, prompt, systemPrompt)

  return {
    id: meta.id || roleInfo.name.toLowerCase().replace(/\s+/g, '_'),
    name: meta.name || roleInfo.name,
    avatar: meta.avatar || '👤',
    role: meta.role || roleInfo.name,
    department: meta.department || roleInfo.department,
    level: roleInfo.level,
    tags: meta.tags || [],
    permissions: meta.permissions || [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
}

/**
 * 生成 Agent 人设 (persona.md)
 */
async function generateAgentPersona(
  config: AIModelConfig,
  companyName: string,
  industry: string,
  companyDescription: string,
  roleInfo: TeamAnalysis['roles'][0],
  meta: AgentMeta
): Promise<string> {
  const prompt = `请为以下企业员工编写详细的角色人设文档（persona.md）：

## 企业信息
- 公司名称：${companyName}
- 所属行业：${industry}
- 企业背景：${companyDescription}

## 角色信息
- 姓名：${meta.name}
- 岗位：${roleInfo.name}
- 部门：${roleInfo.department}
- 职级：${roleInfo.level}
- 职责：${roleInfo.responsibility}
- 标签：${meta.tags?.join(', ')}

请用 Markdown 格式编写，包含以下章节：

# ${meta.name} - 角色人设

## 身份背景
（300-500字，包含教育背景、职业履历、专业资质）

## 性格特质
（200-300字，描述性格特点、行事风格、沟通偏好）

## 核心价值观
（5-8条，列出该角色重视的工作价值观）

## 专业领域
（列出5-10个专业技能领域）

## 沟通风格
（200字左右，描述与他人沟通时的语气、方式、偏好）

请确保内容专业、具体、符合该岗位在企业中的定位。`

  return generateText(config, prompt)
}

/**
 * 生成 Agent 工作规范 (work.md)
 */
async function generateAgentWork(
  config: AIModelConfig,
  companyName: string,
  industry: string,
  companyDescription: string,
  roleInfo: TeamAnalysis['roles'][0],
  meta: AgentMeta,
  persona: string
): Promise<string> {
  const prompt = `请为以下企业员工编写详细的工作规范文档（work.md）：

## 企业信息
- 公司名称：${companyName}
- 所属行业：${industry}
- 企业背景：${companyDescription}

## 角色信息
- 姓名：${meta.name}
- 岗位：${roleInfo.name}
- 部门：${roleInfo.department}
- 职级：${roleInfo.level}
- 职责：${roleInfo.responsibility}

## 角色人设摘要
${persona.slice(0, 500)}...

请用 Markdown 格式编写，包含以下章节：

# ${meta.name} - 工作规范

## 岗位职责
（8-12条具体职责，按重要性排序）

## 工作流程
（描述该角色的日常工作流程，使用有序列表）

## 协作规范
（描述如何与团队其他成员协作，5-8条规则）

## 工作边界
（明确该角色的决策权限和责任边界，5-8条）

## 绩效指标
（3-5条可量化的关键绩效指标）

请确保内容实用、可操作、符合实际工作场景。`

  return generateText(config, prompt)
}

/**
 * 解析 meta 内容
 */
function parseMetaContent(content: AgentMeta, agentId: string): AgentMeta {
  return {
    ...content,
    id: agentId,
  }
}

/**
 * 解析 persona 内容
 */
function parsePersonaContent(content: string): AgentPersona {
  // 简单解析，从 Markdown 中提取信息
  const sections = content.split(/##\s+/)

  const getSection = (title: string): string => {
    const section = sections.find(s => s.toLowerCase().startsWith(title.toLowerCase()))
    return section ? section.replace(/^[^\n]+\n/, '').trim() : ''
  }

  const extractList = (text: string): string[] => {
    return text.split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
      .map(line => line.replace(/^[-\d.\s]+/, '').trim())
      .filter(Boolean)
  }

  return {
    identity: getSection('身份背景').slice(0, 500),
    personality: getSection('性格特质').slice(0, 300),
    background: getSection('身份背景').slice(0, 300),
    communicationStyle: getSection('沟通风格').slice(0, 200),
    values: extractList(getSection('核心价值观')),
    expertise: extractList(getSection('专业领域')),
  }
}

/**
 * 解析 work 内容
 */
function parseWorkContent(content: string): AgentWork {
  const sections = content.split(/##\s+/)

  const getSection = (title: string): string => {
    const section = sections.find(s => s.toLowerCase().startsWith(title.toLowerCase()))
    return section ? section.replace(/^[^\n]+\n/, '').trim() : ''
  }

  const extractList = (text: string): string[] => {
    return text.split('\n')
      .filter(line => line.trim().startsWith('-') || line.trim().match(/^\d+\./))
      .map(line => line.replace(/^[-\d.\s]+/, '').trim())
      .filter(Boolean)
  }

  return {
    responsibilities: extractList(getSection('岗位职责')),
    workflow: getSection('工作流程'),
    collaborationRules: extractList(getSection('协作规范')),
    boundaries: extractList(getSection('工作边界')),
    kpis: extractList(getSection('绩效指标')),
  }
}

/**
 * 批量生成团队所有 Agent
 */
export async function generateTeamAgents(
  config: AIModelConfig,
  teamId: string,
  companyName: string,
  industry: string,
  description: string,
  analysis: TeamAnalysis,
  progressCallback?: (progress: GenerationProgress) => void
): Promise<Agent[]> {
  const agents: Agent[] = []
  const total = analysis.roles.length

  for (let i = 0; i < total; i++) {
    const role = analysis.roles[i]
    const baseProgress = (i / total) * 100

    progressCallback?.({
      step: `正在生成第 ${i + 1}/${total} 个角色: ${role.name}...`,
      progress: baseProgress,
    })

    const agent = await generateAgent(
      config,
      teamId,
      companyName,
      industry,
      description,
      role,
      (p) => {
        progressCallback?.({
          step: p.step,
          progress: baseProgress + (p.progress / total) * (100 / total),
        })
      }
    )

    agents.push(agent)
  }

  progressCallback?.({ step: '所有角色生成完成！', progress: 100 })

  return agents
}
