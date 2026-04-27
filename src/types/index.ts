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

export interface AgentMeta {
  id: string
  name: string
  avatar: string
  role: string
  department: string
  level: AgentLevel
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
