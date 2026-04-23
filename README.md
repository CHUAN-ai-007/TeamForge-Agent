# TeamForge Agent

企业智能 Agent 团队生成系统 - 基于 Vue3 + Vite + Tailwind CSS 的纯前端应用。

## 🚀 功能特性

- **团队生成**：输入企业信息，AI 自动生成完整组织架构
- **Agent 创建**：批量生成多个 Agent，每个包含 meta.json / persona.md / work.md 三份文档
- **团队对话**：与整个 AI 团队进行协作对话，支持多 Agent 协同应答
- **模型配置**：支持自定义 AI 模型 API，兼容 OpenAI 格式接口
- **本地存储**：所有数据保存在浏览器 LocalStorage，无需后端
- **暗黑模式**：支持浅色/深色/跟随系统三种主题

## 📸 界面预览

- 首页：团队网格展示，快速创建入口
- 团队详情：企业背景展示，Agent 列表管理
- Agent 详情：角色档案，三份文档切换查看
- 团队对话：类 ChatGPT 的多轮对话界面
- 设置页：AI 模型参数配置，主题切换

## 🛠️ 技术栈

- **框架**：Vue 3.4 + Composition API
- **构建**：Vite 5
- **状态管理**：Pinia
- **样式**：Tailwind CSS 3.4
- **路由**：Vue Router 4
- **Markdown 渲染**：marked + highlight.js
- **图标**：内联 SVG

## 📦 安装使用

```bash
# 克隆项目
git clone https://github.com/yourusername/TeamForge-Agent.git
cd TeamForge-Agent

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build
```

## 🔧 AI 配置

首次使用前，请前往「设置」页配置 AI 模型：

| 参数 | 说明 | 示例 |
|------|------|------|
| API Key | 你的 API 密钥 | sk-... |
| 接口地址 | API 基础 URL | https://api.openai.com/v1 |
| 模型名称 | 使用的模型 | gpt-4o |
| 温度 | 输出随机性 | 0.7 |
| 最大 Token | 单次响应上限 | 4096 |

**支持的模型供应商**：
- OpenAI
- Azure OpenAI
- 智谱 AI
- Moonshot (Kimi)
- 通义千问
- 自定义兼容 OpenAI 格式的接口

## 📝 项目结构

```
TeamForge-Agent/
├── src/
│   ├── api/           # AI API 封装
│   ├── components/    # Vue 组件
│   │   ├── agents/    # Agent 相关组件
│   │   ├── common/    # 通用组件
│   │   ├── layout/    # 布局组件
│   │   └── teams/     # 团队相关组件
│   ├── router/        # 路由配置
│   ├── stores/        # Pinia 状态管理
│   ├── styles/        # 全局样式
│   ├── types/         # TypeScript 类型定义
│   ├── utils/         # 工具函数
│   ├── views/         # 页面视图
│   │   ├── agents/    # Agent 详情页
│   │   ├── chat/      # 对话页
│   │   ├── settings/  # 设置页
│   │   └── teams/     # 团队相关页
│   ├── App.vue        # 根组件
│   └── main.ts        # 入口文件
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## 🤝 使用流程

1. **配置 AI**：在设置页添加你的 AI API 配置
2. **创建团队**：点击「新建团队」，填写企业信息
3. **等待生成**：AI 自动分析并生成组织架构和 Agents
4. **查看详情**：浏览每个 Agent 的三份文档
5. **开始对话**：进入团队对话，与 AI 团队协作

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Vue.js](https://vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Pinia](https://pinia.vuejs.org/)
- [marked](https://marked.js.org/)
- [highlight.js](https://highlightjs.org/)

---

**TeamForge Agent** © 2024 - 智能化企业团队生成系统
