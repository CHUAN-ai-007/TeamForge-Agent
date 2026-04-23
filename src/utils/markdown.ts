/**
 * Markdown 渲染工具
 * 基于 marked + highlight.js
 */

import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import 'highlight.js/styles/github-dark.css'

// 配置 marked
marked.use(
  markedHighlight({
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  })
)

/**
 * 渲染 Markdown 为 HTML
 */
export function renderMarkdown(content: string): string {
  if (!content) return ''
  return marked.parse(content, { async: false }) as string
}

/**
 * 安全渲染（转义 HTML）
 */
export function escapeHtml(text: string): string {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

/**
 * 提取纯文本（去除 Markdown 标记）
 */
export function extractPlainText(markdown: string): string {
  if (!markdown) return ''

  return markdown
    .replace(/#+\s+/g, '') // 标题
    .replace(/\*\*/g, '') // 粗体
    .replace(/\*/g, '') // 斜体
    .replace(/`{3}[\s\S]*?`{3}/g, '') // 代码块
    .replace(/`([^`]+)`/g, '$1') // 行内代码
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // 链接
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '') // 图片
    .replace(/\n+/g, ' ') // 换行
    .trim()
}

/**
 * 截断 Markdown（保持格式）
 */
export function truncateMarkdown(markdown: string, maxLength: number): string {
  const plainText = extractPlainText(markdown)
  if (plainText.length <= maxLength) return markdown

  // 简单截断，可能在代码块中间断开
  let truncated = plainText.slice(0, maxLength)
  return truncated + '...'
}
