# Quantplay 风格设计文档

## 概述
基于 https://www.quantplay.tech 的现代金融科技设计风格

---

## 1. 设计系统基础

### 色彩体系

**主色调（Primary）**
- 主色: `#1A1A2E` - 深蓝黑，专业稳重
- 强调色: `#4F46E5` - 靛蓝，科技感
- 渐变: `linear-gradient(135deg, #1A1A2E 0%, #4F46E5 100%)`

**辅助色（Secondary）**
- 成功: `#10B981` - 翠绿，正向反馈
- 警告: `#F59E0B` - 琥珀橙
- 危险: `#EF4444` - 红色
- 信息: `#3B82F6` - 蓝色

**中性色（Neutral）**
- 背景主: `#FFFFFF`
- 背景次: `#F8FAFC` - 极浅灰蓝
- 背景暗: `#0F172A` - 深蓝黑（深色模式）
- 边框: `#E2E8F0`
- 文字主: `#1E293B`
- 文字次: `#64748B`
- 文字反: `#FFFFFF`

**数据可视化色板**
- 上涨: `#10B981`
- 下跌: `#EF4444`
- 中性: `#6B7280`
- 高亮: `#F59E0B`

### 字体系统

**字体家族**
- 主字体: `Outfit, -apple-system, BlinkMacSystemFont, sans-serif`
- 等宽: `JetBrains Mono, Fira Code, monospace`（用于代码/数据）

**字号层级**
| 层级 | 大小 | 字重 | 用途 |
|------|------|------|------|
| H1 | 48px | 700 | 页面标题 |
| H2 | 36px | 600 | 区块标题 |
| H3 | 24px | 600 | 卡片标题 |
| H4 | 20px | 500 | 子标题 |
| Body | 16px | 400 | 正文 |
| Small | 14px | 400 | 辅助文字 |
| XS | 12px | 500 | 标签/徽章 |

### 间距系统

**基础单位: 4px**

| 名称 | 值 | 用途 |
|------|-----|------|
| xs | 4px | 图标间距 |
| sm | 8px | 紧凑元素 |
| md | 16px | 标准间距 |
| lg | 24px | 区块间距 |
| xl | 32px | 大区块 |
| 2xl | 48px | 页面间距 |
| 3xl | 64px | 大间隔 |

### 圆角系统

| 名称 | 值 | 用途 |
|------|-----|------|
| none | 0 | 直角 |
| sm | 4px | 小按钮/标签 |
| md | 8px | 卡片/输入框 |
| lg | 12px | 大卡片 |
| xl | 16px | 模态框 |
| full | 9999px | 完全圆形（头像/徽章）|

---

## 2. 组件规范

### 按钮

**主要按钮（Primary）**
```css
background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
color: #FFFFFF;
padding: 12px 24px;
border-radius: 8px;
font-weight: 600;
box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.2);
transition: all 0.2s ease;
```
悬停: `transform: translateY(-1px); box-shadow: 0 6px 8px -1px rgba(79, 70, 229, 0.3);`

**次要按钮（Secondary）**
```css
background: transparent;
border: 1.5px solid #E2E8F0;
color: #1E293B;
padding: 12px 24px;
border-radius: 8px;
```

**幽灵按钮（Ghost）**
```css
background: transparent;
color: #4F46E5;
padding: 12px 24px;
```

### 卡片

**标准卡片**
```css
background: #FFFFFF;
border: 1px solid #E2E8F0;
border-radius: 12px;
padding: 24px;
box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
transition: box-shadow 0.2s ease;
```
悬停: `box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);`

**强调卡片（Featured）**
```css
background: linear-gradient(135deg, #1A1A2E 0%, #2D2D44 100%);
color: #FFFFFF;
border-radius: 16px;
padding: 32px;
```

**数据卡片**
```css
background: #FFFFFF;
border-left: 4px solid #4F46E5;
border-radius: 8px;
padding: 20px;
```

### 输入框

**文本输入**
```css
background: #FFFFFF;
border: 1.5px solid #E2E8F0;
border-radius: 8px;
padding: 12px 16px;
font-size: 16px;
color: #1E293B;
```
聚焦: `border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);`

### 标签/徽章

**状态徽章**
```css
padding: 4px 12px;
border-radius: 9999px;
font-size: 12px;
font-weight: 600;
text-transform: uppercase;
letter-spacing: 0.5px;
```

- 成功: `background: rgba(16, 185, 129, 0.1); color: #10B981;`
- 警告: `background: rgba(245, 158, 11, 0.1); color: #F59E0B;`
- 危险: `background: rgba(239, 68, 68, 0.1); color: #EF4444;`
- 信息: `background: rgba(59, 130, 246, 0.1); color: #3B82F6;`

---

## 3. 布局规范

### 网格系统

**容器**
```css
max-width: 1280px;
margin: 0 auto;
padding: 0 24px;
```

**网格**
- 12列网格
- 列间距: 24px
- 行间距: 24px

### 导航栏

**顶部导航**
```css
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(10px);
border-bottom: 1px solid #E2E8F0;
padding: 16px 24px;
position: sticky;
top: 0;
z-index: 50;
```

**侧边栏**
```css
background: #FFFFFF;
border-right: 1px solid #E2E8F0;
width: 280px;
padding: 24px;
```

---

## 4. 动效规范

### 过渡动画

**标准过渡**
```css
transition: all 0.2s ease;
```

**慢速过渡（页面级）**
```css
transition: all 0.3s ease-out;
```

### 悬停效果

**按钮悬停**
- 上移: `transform: translateY(-1px)`
- 阴影增强
- 背景色微调

**卡片悬停**
- 阴影: `box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1)`
- 边框: `border-color: #CBD5E1`

### 入场动画

**淡入上移**
```css
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
animation: fadeInUp 0.5s ease-out;
```

### 加载动画

**脉冲**
```css
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

**旋转**
```css
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
animation: spin 1s linear infinite;
```

---

## 5. 页面特定规范

### Agent 卡片

```css
.agent-card {
  background: #FFFFFF;
  border: 1px solid #E2E8F0;
  border-radius: 12px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.2s ease;
}

.agent-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: #4F46E5;
}

.agent-avatar {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
}

.agent-name {
  font-size: 18px;
  font-weight: 600;
  color: #1E293B;
}

.agent-role {
  font-size: 14px;
  color: #64748B;
}
```

### 组织架构树

```css
.org-tree-node {
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 12px;
}

.org-tree-node:hover {
  background: #F1F5F9;
}

.org-tree-node.active {
  background: rgba(79, 70, 229, 0.1);
  color: #4F46E5;
}
```

### 对话界面

```css
.chat-container {
  background: #FFFFFF;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.chat-message {
  padding: 16px 20px;
  border-radius: 12px;
  max-width: 80%;
}

.chat-message.user {
  background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%);
  color: #FFFFFF;
  margin-left: auto;
  border-bottom-right-radius: 4px;
}

.chat-message.agent {
  background: #F1F5F9;
  color: #1E293B;
  border-bottom-left-radius: 4px;
}
```

---

## 6. 响应式断点

| 断点 | 宽度 | 说明 |
|------|------|------|
| sm | 640px | 手机横屏 |
| md | 768px | 平板 |
| lg | 1024px | 小笔记本 |
| xl | 1280px | 桌面 |
| 2xl | 1536px | 大屏 |

### 响应式规则

**导航栏**
- < 768px: 汉堡菜单
- >= 768px: 完整导航

**侧边栏**
- < 1024px: 可折叠抽屉
- >= 1024px: 固定显示

**卡片网格**
- < 640px: 1列
- 640-1024px: 2列
- >= 1024px: 3-4列

---

## 7. 深色模式

### 深色模式色彩映射

| 浅色 | 深色 |
|------|------|
| #FFFFFF | #0F172A |
| #F8FAFC | #1E293B |
| #E2E8F0 | #334155 |
| #1E293B | #F8FAFC |
| #64748B | #94A3B8 |

### 深色模式组件

```css
[data-theme="dark"] {
  --bg-primary: #0F172A;
  --bg-secondary: #1E293B;
  --bg-tertiary: #334155;
  --text-primary: #F8FAFC;
  --text-secondary: #94A3B8;
  --border-color: #334155;
}
```

---

## 8. 图标系统

**图标风格**: Lucide Icons (线性、简洁)
**图标尺寸**:
- xs: 14px
- sm: 16px
- md: 20px
- lg: 24px
- xl: 32px

**使用原则**:
- 与文字对齐基线
- 颜色继承文字颜色或作为主色
- 按钮内图标与文字间距 8px

---

## 9. 空状态设计

```css
.empty-state {
  text-align: center;
  padding: 64px 24px;
}

.empty-state-icon {
  font-size: 64px;
  margin-bottom: 24px;
  opacity: 0.5;
}

.empty-state-title {
  font-size: 20px;
  font-weight: 600;
  color: #1E293B;
  margin-bottom: 8px;
}

.empty-state-description {
  font-size: 16px;
  color: #64748B;
  margin-bottom: 24px;
}
```

---

## 10. 修改检查清单

将设计应用到项目时需要修改的文件：

- [ ] `tailwind.config.js` - 更新色彩配置
- [ ] `src/assets/styles/main.css` - 更新 CSS 变量
- [ ] `src/components/layout/AppNavbar.vue` - 更新导航栏样式
- [ ] `src/components/agents/AgentCard.vue` - 更新卡片样式
- [ ] `src/views/teams/TeamDetail.vue` - 更新页面布局
- [ ] `src/components/teams/OrgTree.vue` - 更新树形组件
- [ ] `src/components/agents/AgentChatModal.vue` - 更新对话界面

---

*Generated for TeamForge-Agent based on Quantplay.tech design analysis*
