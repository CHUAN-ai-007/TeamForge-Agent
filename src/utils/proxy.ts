/**
 * API 代理工具
 * 用于解决浏览器 CORS 跨域限制
 */

import type { AIModelConfig } from '@/types'

/**
 * 构建请求 URL
 * 支持代理模式解决 CORS 问题
 */
export function buildRequestURL(config: AIModelConfig): string {
  const baseURL = config.baseURL.replace(/\/$/, '')

  // 如果配置了代理，使用代理地址
  if (config.proxyURL) {
    // 代理模式下，将目标 URL 编码后传递给代理
    const targetURL = encodeURIComponent(`${baseURL}/chat/completions`)
    return `${config.proxyURL}?target=${targetURL}`
  }

  return `${baseURL}/chat/completions`
}

/**
 * 构建请求头
 * 代理模式下需要特殊处理
 */
export function buildRequestHeaders(config: AIModelConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  // 如果配置了代理且代理需要转发 Authorization
  if (config.proxyURL && config.proxyAuthHeader) {
    headers[config.proxyAuthHeader] = `Bearer ${config.apiKey}`
  } else {
    headers['Authorization'] = `Bearer ${config.apiKey}`
  }

  return headers
}

/**
 * 检测是否为 CORS 错误
 */
export function isCORSError(error: Error): boolean {
  const msg = error.message.toLowerCase()
  return msg.includes('cors') ||
    msg.includes('cross-origin') ||
    msg.includes('failed to fetch') ||
    msg.includes('networkerror') ||
    msg.includes('access-control-allow-origin')
}

/**
 * 获取 CORS 解决方案提示
 */
export function getCORSSolutions(): string {
  return `解决 CORS 跨域限制的几种方案：

方案 1：使用浏览器扩展（最简单）
- Chrome 安装 "CORS Unblock" 或 "Allow CORS" 扩展
- 启用扩展后刷新页面再试

方案 2：配置代理服务器
- 在设置中启用代理模式
- 使用 Nginx/Node.js 搭建简单代理
- 或使用免费的 CORS 代理服务（仅测试使用）

方案 3：修改 API 服务商设置
- 部分服务商支持配置允许的域名
- 在服务商控制台添加当前域名到白名单

方案 4：使用桌面版/后端代理
- 使用 Electron 等桌面框架封装应用
- 或搭建后端服务转发请求`
}
