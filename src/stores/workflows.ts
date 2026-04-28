import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  Workflow,
  WorkflowNode,
  WorkflowEdge,
  NodeInput,
  NodeOutput,
  WorkflowRun,
  NodeRuntimeState,
  NodeLog
} from '@/types'

const STORAGE_KEY = 'teamforge:workflows'
const RUNS_STORAGE_KEY = 'teamforge:workflow_runs'

/**
 * 工作流状态管理
 */
export const useWorkflowsStore = defineStore('workflows', () => {
  // ============ State ============
  const workflows = ref<Workflow[]>(loadWorkflows())
  const workflowRuns = ref<WorkflowRun[]>(loadWorkflowRuns())
  const currentWorkflowId = ref<string | null>(null)
  const currentRunId = ref<string | null>(null)

  // ============ Getters ============
  const currentWorkflow = computed(() => {
    return workflows.value.find(w => w.id === currentWorkflowId.value) || null
  })

  const currentRun = computed(() => {
    return workflowRuns.value.find(r => r.id === currentRunId.value) || null
  })

  const workflowList = computed(() => {
    return workflows.value.map(w => ({
      id: w.id,
      name: w.name,
      description: w.description,
      status: w.status,
      nodeCount: w.nodes.length,
      teamId: w.teamId,
      updatedAt: w.updatedAt
    }))
  })

  const getTeamWorkflows = computed(() => {
    return (teamId: string) => workflows.value.filter(w => w.teamId === teamId)
  })

  const getWorkflowRuns = computed(() => {
    return (workflowId: string) => workflowRuns.value.filter(r => r.workflowId === workflowId)
  })

  // ============ Actions ============

  /**
   * 从 localStorage 加载工作流数据
   */
  function loadWorkflows(): Workflow[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored) as Workflow[]
      }
    } catch (e) {
      console.error('Failed to load workflows:', e)
    }
    return []
  }

  /**
   * 从 localStorage 加载工作流运行实例
   */
  function loadWorkflowRuns(): WorkflowRun[] {
    try {
      const stored = localStorage.getItem(RUNS_STORAGE_KEY)
      if (stored) {
        return JSON.parse(stored) as WorkflowRun[]
      }
    } catch (e) {
      console.error('Failed to load workflow runs:', e)
    }
    return []
  }

  /**
   * 保存工作流数据到 localStorage
   */
  function saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(workflows.value))
    } catch (e) {
      console.error('Failed to save workflows:', e)
    }
  }

  /**
   * 保存工作流运行实例到 localStorage
   */
  function saveRunsToStorage() {
    try {
      localStorage.setItem(RUNS_STORAGE_KEY, JSON.stringify(workflowRuns.value))
    } catch (e) {
      console.error('Failed to save workflow runs:', e)
    }
  }

  /**
   * 创建工作流
   */
  function createWorkflow(teamId: string, name: string, description: string = ''): Workflow {
    const now = new Date().toISOString()
    const workflowId = `wf_${Date.now()}`

    // 自动创建开始和结束节点
    const startNode: WorkflowNode = {
      id: `node_${Date.now()}_start`,
      workflowId,
      name: '开始',
      description: '工作流起点',
      type: 'start',
      position: { x: 100, y: 200 },
      agentId: null,
      inputs: [],
      outputs: [],
      promptTemplate: ''
    }

    const endNode: WorkflowNode = {
      id: `node_${Date.now()}_end`,
      workflowId,
      name: '结束',
      description: '工作流终点',
      type: 'end',
      position: { x: 500, y: 200 },
      agentId: null,
      inputs: [],
      outputs: [],
      promptTemplate: ''
    }

    const newWorkflow: Workflow = {
      id: workflowId,
      teamId,
      name,
      description,
      status: 'draft',
      createdAt: now,
      updatedAt: now,
      nodes: [startNode, endNode],
      edges: []
    }

    workflows.value.unshift(newWorkflow)
    saveToStorage()
    return newWorkflow
  }

  /**
   * 更新工作流基本信息
   */
  function updateWorkflow(workflowId: string, updates: Partial<Workflow>): boolean {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (workflow) {
      Object.assign(workflow, { ...updates, updatedAt: new Date().toISOString() })
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 删除工作流
   */
  function deleteWorkflow(workflowId: string): boolean {
    const index = workflows.value.findIndex(w => w.id === workflowId)
    if (index > -1) {
      workflows.value.splice(index, 1)
      if (currentWorkflowId.value === workflowId) {
        currentWorkflowId.value = null
      }
      // 同时删除相关运行实例
      workflowRuns.value = workflowRuns.value.filter(r => r.workflowId !== workflowId)
      saveToStorage()
      saveRunsToStorage()
      return true
    }
    return false
  }

  /**
   * 设置当前工作流
   */
  function setCurrentWorkflow(workflowId: string | null) {
    currentWorkflowId.value = workflowId
  }

  /**
   * 设置当前运行实例
   */
  function setCurrentRun(runId: string | null) {
    currentRunId.value = runId
  }

  // ============ 节点管理 ============

  /**
   * 添加节点
   */
  function addNode(workflowId: string, node: Partial<WorkflowNode>): WorkflowNode | null {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) return null

    const newNode: WorkflowNode = {
      id: `node_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      workflowId,
      name: node.name || '新节点',
      description: node.description || '',
      type: node.type || 'task',
      position: node.position || { x: 300, y: 200 },
      agentId: node.agentId || null,
      inputs: node.inputs || [],
      outputs: node.outputs || [],
      promptTemplate: node.promptTemplate || ''
    }

    workflow.nodes.push(newNode)
    workflow.updatedAt = new Date().toISOString()
    saveToStorage()
    return newNode
  }

  /**
   * 更新节点
   */
  function updateNode(workflowId: string, nodeId: string, updates: Partial<WorkflowNode>): boolean {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) return false

    const nodeIndex = workflow.nodes.findIndex(n => n.id === nodeId)
    if (nodeIndex > -1) {
      workflow.nodes[nodeIndex] = { ...workflow.nodes[nodeIndex], ...updates }
      workflow.updatedAt = new Date().toISOString()
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 删除节点
   */
  function deleteNode(workflowId: string, nodeId: string): boolean {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) return false

    const index = workflow.nodes.findIndex(n => n.id === nodeId)
    if (index > -1) {
      // 不能删除开始和结束节点
      const node = workflow.nodes[index]
      if (node.type === 'start' || node.type === 'end') {
        return false
      }

      workflow.nodes.splice(index, 1)
      // 同时删除相关的边
      workflow.edges = workflow.edges.filter(e => e.source !== nodeId && e.target !== nodeId)
      workflow.updatedAt = new Date().toISOString()
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 更新节点位置（用于拖拽）
   */
  function updateNodePosition(workflowId: string, nodeId: string, position: { x: number; y: number }): boolean {
    return updateNode(workflowId, nodeId, { position })
  }

  // ============ 边（连接）管理 ============

  /**
   * 添加边
   */
  function addEdge(workflowId: string, source: string, target: string, condition?: string): WorkflowEdge | null {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) return null

    // 检查是否已存在相同的边
    const exists = workflow.edges.some(e => e.source === source && e.target === target)
    if (exists) return null

    const newEdge: WorkflowEdge = {
      id: `edge_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      workflowId,
      source,
      target,
      condition
    }

    workflow.edges.push(newEdge)
    workflow.updatedAt = new Date().toISOString()
    saveToStorage()
    return newEdge
  }

  /**
   * 删除边
   */
  function deleteEdge(workflowId: string, edgeId: string): boolean {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) return false

    const index = workflow.edges.findIndex(e => e.id === edgeId)
    if (index > -1) {
      workflow.edges.splice(index, 1)
      workflow.updatedAt = new Date().toISOString()
      saveToStorage()
      return true
    }
    return false
  }

  // ============ 输入输出管理 ============

  /**
   * 添加节点输入
   */
  function addNodeInput(workflowId: string, nodeId: string, input: Partial<NodeInput>): boolean {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) return false

    const node = workflow.nodes.find(n => n.id === nodeId)
    if (!node) return false

    const newInput: NodeInput = {
      id: `input_${Date.now()}`,
      name: input.name || 'input',
      type: input.type || 'text',
      required: input.required ?? true,
      description: input.description || '',
      defaultValue: input.defaultValue,
      sourceNodeId: input.sourceNodeId,
      sourceOutputName: input.sourceOutputName
    }

    node.inputs.push(newInput)
    workflow.updatedAt = new Date().toISOString()
    saveToStorage()
    return true
  }

  /**
   * 删除节点输入
   */
  function removeNodeInput(workflowId: string, nodeId: string, inputId: string): boolean {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) return false

    const node = workflow.nodes.find(n => n.id === nodeId)
    if (!node) return false

    const index = node.inputs.findIndex(i => i.id === inputId)
    if (index > -1) {
      node.inputs.splice(index, 1)
      workflow.updatedAt = new Date().toISOString()
      saveToStorage()
      return true
    }
    return false
  }

  /**
   * 添加节点输出
   */
  function addNodeOutput(workflowId: string, nodeId: string, output: Partial<NodeOutput>): boolean {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) return false

    const node = workflow.nodes.find(n => n.id === nodeId)
    if (!node) return false

    const newOutput: NodeOutput = {
      id: `output_${Date.now()}`,
      name: output.name || 'output',
      type: output.type || 'text',
      description: output.description || ''
    }

    node.outputs.push(newOutput)
    workflow.updatedAt = new Date().toISOString()
    saveToStorage()
    return true
  }

  /**
   * 删除节点输出
   */
  function removeNodeOutput(workflowId: string, nodeId: string, outputId: string): boolean {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) return false

    const node = workflow.nodes.find(n => n.id === nodeId)
    if (!node) return false

    const index = node.outputs.findIndex(o => o.id === outputId)
    if (index > -1) {
      node.outputs.splice(index, 1)
      workflow.updatedAt = new Date().toISOString()
      saveToStorage()
      return true
    }
    return false
  }

  // ============ 工作流运行 ============

  /**
   * 创建运行实例
   */
  function createRun(workflowId: string, teamId: string, name?: string): WorkflowRun | null {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) return null

    const now = new Date().toISOString()
    const newRun: WorkflowRun = {
      id: `run_${Date.now()}`,
      workflowId,
      teamId,
      name: name || `${workflow.name} - ${new Date().toLocaleString()}`,
      status: 'running',
      triggerType: 'manual',
      startTime: now,
      nodeStates: {},
      context: {}
    }

    // 初始化所有节点的状态
    workflow.nodes.forEach(node => {
      newRun.nodeStates[node.id] = {
        status: 'pending',
        logs: []
      }
    })

    workflowRuns.value.unshift(newRun)
    saveRunsToStorage()
    return newRun
  }

  /**
   * 更新运行实例状态
   */
  function updateRunStatus(runId: string, status: WorkflowRun['status']): boolean {
    const run = workflowRuns.value.find(r => r.id === runId)
    if (run) {
      run.status = status
      if (status === 'completed' || status === 'failed') {
        run.endTime = new Date().toISOString()
      }
      saveRunsToStorage()
      return true
    }
    return false
  }

  /**
   * 更新节点运行时状态
   */
  function updateNodeRuntimeState(
    runId: string,
    nodeId: string,
    updates: Partial<NodeRuntimeState>
  ): boolean {
    const run = workflowRuns.value.find(r => r.id === runId)
    if (!run) return false

    if (!run.nodeStates[nodeId]) {
      run.nodeStates[nodeId] = {
        status: 'pending',
        logs: []
      }
    }

    Object.assign(run.nodeStates[nodeId], updates)
    saveRunsToStorage()
    return true
  }

  /**
   * 添加节点执行日志
   */
  function addNodeLog(runId: string, nodeId: string, level: NodeLog['level'], message: string): boolean {
    const run = workflowRuns.value.find(r => r.id === runId)
    if (!run) return false

    if (!run.nodeStates[nodeId]) {
      run.nodeStates[nodeId] = {
        status: 'pending',
        logs: []
      }
    }

    const log: NodeLog = {
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      level,
      message
    }

    run.nodeStates[nodeId].logs.push(log)
    saveRunsToStorage()
    return true
  }

  /**
   * 删除运行实例
   */
  function deleteRun(runId: string): boolean {
    const index = workflowRuns.value.findIndex(r => r.id === runId)
    if (index > -1) {
      workflowRuns.value.splice(index, 1)
      saveRunsToStorage()
      return true
    }
    return false
  }

  /**
   * 获取工作流的拓扑排序（用于执行顺序）
   */
  function getTopologicalOrder(workflowId: string): WorkflowNode[] {
    const workflow = workflows.value.find(w => w.id === workflowId)
    if (!workflow) return []

    const visited = new Set<string>()
    const result: WorkflowNode[] = []
    const currentWorkflow = workflow

    function visit(nodeId: string) {
      if (visited.has(nodeId)) return
      visited.add(nodeId)

      // 找到所有依赖当前节点的节点（即当前节点指向的节点）
      const outgoingEdges = currentWorkflow.edges.filter(e => e.source === nodeId)
      for (const edge of outgoingEdges) {
        visit(edge.target)
      }

      const node = currentWorkflow.nodes.find(n => n.id === nodeId)
      if (node) {
        result.unshift(node)
      }
    }

    // 从开始节点开始遍历
    const startNode = currentWorkflow.nodes.find(n => n.type === 'start')
    if (startNode) {
      visit(startNode.id)
    }

    return result
  }

  return {
    // State
    workflows,
    workflowRuns,
    currentWorkflowId,
    currentRunId,
    // Getters
    currentWorkflow,
    currentRun,
    workflowList,
    getTeamWorkflows,
    getWorkflowRuns,
    // Actions
    createWorkflow,
    updateWorkflow,
    deleteWorkflow,
    setCurrentWorkflow,
    setCurrentRun,
    addNode,
    updateNode,
    deleteNode,
    updateNodePosition,
    addEdge,
    deleteEdge,
    addNodeInput,
    removeNodeInput,
    addNodeOutput,
    removeNodeOutput,
    createRun,
    updateRunStatus,
    updateNodeRuntimeState,
    addNodeLog,
    deleteRun,
    getTopologicalOrder,
    saveToStorage,
    saveRunsToStorage
  }
})
