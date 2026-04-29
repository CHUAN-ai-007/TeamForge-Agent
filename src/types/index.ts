/**
 * 全局类型定义
 * TeamForge Agent - 企业智能Agent团队生成系统
 */

// ============ AI 模型配置 ============

export interface AIModelConfig {
  id: string
  name: string
  apiKey: string
  baseURL: string
  model: string
  temperature: number
  maxTokens: number
  topP: number
  enabled: boolean
}

export const DEFAULT_MODEL_CONFIG: AIModelConfig = {
  id: 'default',
  name: '默认配置',
  apiKey: '',
  baseURL: 'https://api.openai.com/v1',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 4096,
  topP: 1,
  enabled: true,
}

// ============ Agent 类型定义 ============

export type AgentLevel = 'junior' | 'senior' | 'lead' | 'executive'
export type AgentPLevel = 'P1' | 'P2' | 'P3' | 'P4' | 'P5'

export interface AgentMeta {
  id: string
  name: string
  avatar: string
  role: string
  department: string
  level: AgentLevel
  pLevel?: AgentPLevel // P1-P5 等级
  tags: string[]
  permissions: string[]
  createdAt: string
  updatedAt: string
}

export interface AgentPersona {
  identity: string
  personality: string
  background: string
  communicationStyle: string
  values: string[]
  expertise: string[]
}

export interface AgentWork {
  responsibilities: string[]
  workflow: string
  collaborationRules: string[]
  boundaries: string[]
  kpis: string[]
}

// ============ 知识库类型定义 ============

export type KnowledgeDocType = 'file' | 'text'

export interface KnowledgeDoc {
  id: string
  agentId: string
  teamId: string
  type: KnowledgeDocType
  title: string
  content: string // 文档内容或文本内容
  fileName?: string // 如果是文件上传，保存原始文件名
  fileSize?: number // 文件大小（字节）
  chunkCount: number // 文档分块数量
  createdAt: string
  updatedAt: string
}

export interface KnowledgeChunk {
  id: string
  docId: string
  agentId: string
  content: string // 知识片段内容
  embedding?: number[] // 向量嵌入（可选，用于高级RAG）
  metadata: {
    startIndex: number // 在原文档中的起始位置
    endIndex: number // 在原文档中的结束位置
    title?: string // 来源文档标题
  }
  createdAt: string
}

export interface Agent {
  id: string
  teamId: string
  orgUnitId: string | null
  sortOrder: number
  meta: AgentMeta
  persona: AgentPersona
  work: AgentWork
  // 原始文档内容
  metaContent: string
  personaContent: string
  workContent: string
  // 知识库
  knowledgeBase?: KnowledgeDoc[]
  // RAG设置
  ragSettings?: {
    enabled: boolean // 是否启用RAG
    topK: number // 检索 top K 个相关知识片段
    similarityThreshold: number // 相似度阈值（0-1）
    maxContextLength: number // 最大上下文长度
  }
}

// ============ 组织单元类型定义 ============

export interface OrgUnit {
  id: string
  name: string
  type: 'company' | 'department' | 'group' | 'team'
  parentId: string | null
  description: string
  sortOrder: number
  createdAt: string
  updatedAt: string
}

// ============ 团队类型定义 ============

export interface TeamInfo {
  id: string
  name: string
  industry: string
  description: string
  background: string
  agentCount: number
  createdAt: string
  updatedAt: string
}

export interface Team {
  info: TeamInfo
  orgStructure: OrgUnit[]
  agents: Agent[]
}

// ============ 对话类型定义 ============

export type MessageRole = 'user' | 'agent' | 'system'

export interface ChatMessage {
  id: string
  role: MessageRole
  agentId?: string
  agentName?: string
  agentAvatar?: string
  content: string
  timestamp: number
  isTyping?: boolean
}

export interface ChatSession {
  id: string
  teamId: string
  agentId?: string // 如果指定，表示与单个Agent的对话；否则是团队群聊
  messages: ChatMessage[]
  createdAt: string
  updatedAt: string
}

// ============ 应用状态 ============

export type Theme = 'light' | 'dark' | 'auto'

export interface AppSettings {
  theme: Theme
  language: string
  sidebarCollapsed: boolean
}

export interface AppState {
  settings: AppSettings
  modelConfigs: AIModelConfig[]
  teams: Team[]
  chatSessions: ChatSession[]
  currentTeamId: string | null
  currentAgentId: string | null
  currentChatId: string | null
}

// RAG 默认设置
export const DEFAULT_RAG_SETTINGS = {
  enabled: true,
  topK: 3,
  similarityThreshold: 0.7,
  maxContextLength: 2000,
}

// ============ API 响应类型 ============

export interface AIResponse {
  content: string
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
}

export interface StreamChunk {
  content: string
  done: boolean
}

// ============ 生成任务 ============

export interface GenerationTask {
  id: string
  teamId: string
  status: 'pending' | 'analyzing' | 'generating' | 'completed' | 'error'
  progress: number
  currentStep: string
  error?: string
}

// ============ 主从协作任务 ============

export type CollaborationTaskStatus = 'pending' | 'analyzing' | 'assigning' | 'executing' | 'reviewing' | 'completed' | 'error'
export type SubTaskStatus = 'pending' | 'assigned' | 'executing' | 'completed' | 'failed'

export interface SubTask {
  id: string
  title: string
  description: string
  agentId: string
  agentName: string
  status: SubTaskStatus
  dependencies: string[] // 依赖的其他子任务ID
  output?: string // 子任务执行结果
  startedAt?: string
  completedAt?: string
  error?: string
}

export interface CollaborationTask {
  id: string
  teamId: string
  title: string
  description: string // 用户的原始需求
  status: CollaborationTaskStatus
  leaderAgentId: string
  leaderAgentName: string
  subTasks: SubTask[]
  executionPlan?: string // 主Agent制定的执行计划
  finalOutput?: string // 最终汇总结果
  messages: CollaborationMessage[]
  createdAt: string
  updatedAt: string
  startedAt?: string
  completedAt?: string
}

export interface CollaborationMessage {
  id: string
  role: 'user' | 'leader' | 'sub' | 'system'
  agentId?: string
  agentName?: string
  content: string
  timestamp: number
  type: 'chat' | 'task_assignment' | 'task_result' | 'plan' | 'summary'
  subTaskId?: string
}

// ============ UI 类型 ============

export interface NavItem {
  name: string
  path: string
  icon: string
  badge?: number
}

export interface ToastMessage {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  message: string
  duration?: number
}

// ============ 工作流类型定义 ============

export type WorkflowNodeType = 'start' | 'end' | 'task' | 'approval' | 'condition'
export type WorkflowStatus = 'draft' | 'active' | 'archived'
export type NodeRuntimeStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

// 节点输入定义
export interface NodeInput {
  id: string
  name: string
  type: 'text' | 'file' | 'reference' // reference 引用上游节点输出
  required: boolean
  description: string
  defaultValue?: string
  sourceNodeId?: string // 如果是 reference，指定来源节点
  sourceOutputName?: string // 引用来源节点的哪个输出
}

// 节点输出定义
export interface NodeOutput {
  id: string
  name: string
  type: 'text' | 'file' | 'json'
  description: string
}

// 节点执行日志
export interface NodeLog {
  id: string
  timestamp: string
  level: 'info' | 'warning' | 'error'
  message: string
}

// 节点运行时状态
export interface NodeRuntimeState {
  status: NodeRuntimeStatus
  startTime?: string
  endTime?: string
  outputData?: Record<string, any> // 实际输出数据
  logs: NodeLog[]
  error?: string
}

// 工作流节点
export interface WorkflowNode {
  id: string
  workflowId: string
  name: string // 节点名称：如"需求分析"
  description: string // 节点描述
  type: WorkflowNodeType
  position: { x: number; y: number } // 流程图位置

  // 执行配置
  agentId: string | null // 执行Agent的ID

  // 输入输出定义
  inputs: NodeInput[] // 输入参数定义
  outputs: NodeOutput[] // 输出物定义

  // 执行提示词模板
  promptTemplate: string // 给Agent的提示词模板，可使用 {{input.xxx}} 和 {{nodes.nodeId.outputs.xxx}} 变量

  // 运行时状态（仅在执行时存在）
  runtimeState?: NodeRuntimeState
}

// 工作流边（连接）
export interface WorkflowEdge {
  id: string
  workflowId: string
  source: string // 源节点ID
  target: string // 目标节点ID
  condition?: string // 条件表达式（用于条件分支）
}

// 工作流运行实例
export interface WorkflowRun {
  id: string
  workflowId: string
  teamId: string
  name: string // 运行实例名称
  status: 'running' | 'completed' | 'failed' | 'paused'
  triggerType: 'manual' | 'schedule' | 'webhook'
  startTime: string
  endTime?: string
  nodeStates: Record<string, NodeRuntimeState> // key: nodeId
  context: Record<string, any> // 全局上下文数据
}

// 工作流定义
export interface Workflow {
  id: string
  teamId: string
  name: string
  description: string
  status: WorkflowStatus
  createdAt: string
  updatedAt: string
  nodes: WorkflowNode[]
  edges: WorkflowEdge[] // 节点连接关系
}
