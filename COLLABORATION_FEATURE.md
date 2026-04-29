# 主从协作功能 (Leader-Follower Collaboration)

## 功能概述

TeamForge Agent v2.6.0 新增**主从协作模式**，实现智能化的任务拆解与协同执行。

## 核心特性

### 1. 智能识别主Agent
- 自动识别标记为"负责人"或职级最高的Agent作为主Agent
- 支持通过标签（"负责人"/"Leader"）或职级（executive > lead > senior > junior）识别
- 主Agent负责任务拆解、分配和最终汇总

### 2. 任务拆解与分配
- 主Agent分析用户需求，自动拆解为多个可并行执行的子任务
- 根据子Agent的专业方向智能匹配任务
- 支持任务依赖关系设置

### 3. 并行执行
- 子Agent同时执行各自分配的任务
- 实时显示每个子任务的执行状态
- 支持失败任务的重试机制

### 4. 结果汇总
- 主Agent检查所有子任务结果
- 整合输出为完整、连贯的最终交付物
- 统一格式和风格，确保一致性

## 工作流程

```
用户输入需求
    ↓
主Agent分析 → 生成执行计划
    ↓
自动拆解为子任务
    ↓
根据专业方向分配给子Agent
    ↓
子Agent并行执行任务
    ↓
主Agent检查并汇总结果
    ↓
输出最终交付物
```

## 使用方式

### 1. 进入协作页面
- 在团队详情页点击「主从协作」按钮
- 或通过路径 `/teams/:id/collaboration` 访问

### 2. 创建协作任务
1. 点击「新建协作任务」
2. 输入任务标题和描述
3. 系统自动识别主Agent和子Agent
4. 点击「开始协作」启动流程

### 3. 查看执行进度
- 左侧任务列表显示所有协作任务
- 右侧显示当前选中任务的详细信息
- 子任务卡片显示执行状态（待执行/执行中/已完成/失败）
- 消息时间线展示完整的协作过程

### 4. 获取结果
- 执行完成后查看「最终交付物」区域
- 支持复制结果到剪贴板
- 可查看每个子任务的详细输出

## 数据结构

### 协作任务 (CollaborationTask)
```typescript
interface CollaborationTask {
  id: string
  teamId: string
  title: string
  description: string
  status: 'pending' | 'analyzing' | 'assigning' | 'executing' | 'reviewing' | 'completed' | 'error'
  leaderAgentId: string
  leaderAgentName: string
  subTasks: SubTask[]
  executionPlan?: string
  finalOutput?: string
  messages: CollaborationMessage[]
  createdAt: string
  updatedAt: string
}
```

### 子任务 (SubTask)
```typescript
interface SubTask {
  id: string
  title: string
  description: string
  agentId: string
  agentName: string
  status: 'pending' | 'assigned' | 'executing' | 'completed' | 'failed'
  dependencies: string[]
  output?: string
  error?: string
}
```

## 技术实现

### 新增文件
- `src/stores/collaboration.ts` - 协作任务状态管理
- `src/utils/collaboration.ts` - 协作相关工具函数和提示词
- `src/views/collaboration/TeamCollaboration.vue` - 协作页面

### 修改文件
- `src/types/index.ts` - 添加协作相关类型定义
- `src/router/index.ts` - 添加协作页面路由
- `src/stores/index.ts` - 导出协作store
- `src/views/teams/TeamDetail.vue` - 添加协作入口按钮

### AI提示词设计

#### 主Agent系统提示词
- 明确主Agent的职责：任务拆解、分配、监控、汇总
- 提供团队成员信息便于合理分配
- 指定输出格式要求

#### 子Agent系统提示词
- 强调专业方向执行
- 明确汇报对象
- 要求结构化输出

#### 任务拆解提示词
- 引导AI分析用户需求
- 提供团队成员信息
- 要求按指定格式输出子任务列表

#### 汇总整合提示词
- 整合所有子任务结果
- 要求逻辑清晰、格式统一
- 协调冲突和不一致之处

## 界面预览

### 协作页面布局
- **左侧边栏**: 任务列表，显示所有历史协作任务及进度
- **主内容区**: 
  - 任务头部：标题、状态、进度统计
  - 子任务网格：可视化展示每个子任务的执行状态
  - 执行计划：主Agent制定的整体策略
  - 最终交付物：汇总后的完整结果
  - 消息时间线：完整的协作过程记录

### 状态标识
- 待执行 (灰色)
- 执行中 (紫色)
- 已完成 (绿色)
- 失败 (红色)

## 版本更新

**v2.6.0** (2024-04-29)
- ✨ 新增主从协作功能
- ✨ 智能任务拆解与分配
- ✨ 并行执行任务
- ✨ 自动汇总结果
- ✨ 可视化任务进度
- ✨ 支持任务重试

## 后续优化方向

1. **并行度优化**: 支持依赖任务的自动排序和并行执行
2. **人机协作**: 支持人工介入审核关键节点
3. **任务模板**: 提供常见任务的拆解模板
4. **历史学习**: 根据历史协作记录优化任务分配策略
5. **协作复盘**: 生成协作过程分析报告
