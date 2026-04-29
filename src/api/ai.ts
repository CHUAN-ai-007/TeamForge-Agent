/**
 * AI API 统一封装
 * 支持 OpenAI 格式接口
 */

import type { AIModelConfig, AIResponse, StreamChunk } from '@/types'

/**
 * 构建请求配置
 * 开发环境下使用 Vite 代理解决 CORS 问题
 */
function buildRequest(config: AIModelConfig): { url: string; headers: Record<string, string> } {
  // 处理 baseURL，移除末尾斜杠
  const baseURL = config.baseURL.replace(/\/$/, '')
  const requestURL = `${baseURL}/chat/completions`

  // 开发环境下，如果访问的是外部 API，使用代理
  // @ts-ignore
  if (typeof import.meta.env !== 'undefined' && import.meta.env.DEV && baseURL.startsWith('http')) {
    console.log('[AI] Using proxy for:', baseURL)
    return {
      url: '/api/proxy',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`,
        'x-target-url': baseURL,
      },
    }
  }

  return {
    url: requestURL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
  }
}

export interface ChatCompletionMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
  name?: string
}

export interface ChatCompletionOptions {
  messages: ChatCompletionMessage[]
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
  onStream?: (chunk: StreamChunk) => void
  signal?: AbortSignal
}

/**
 * 发送聊天完成请求
 */
export async function chatCompletion(
  config: AIModelConfig,
  options: ChatCompletionOptions
): Promise<AIResponse> {
  const { messages, temperature, maxTokens, topP, stream, onStream } = options

  const requestBody: Record<string, unknown> = {
    model: config.model,
    messages,
    temperature: temperature ?? config.temperature,
    max_tokens: maxTokens ?? config.maxTokens,
    top_p: topP ?? config.topP,
    stream: stream ?? false,
  }

  try {
    const { url, headers } = buildRequest(config)
    console.log('[AI Request] URL:', url)

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
      signal: options.signal,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`API 错误 (${response.status}): ${errorText}`)
    }

    // 处理流式响应
    if (stream && onStream) {
      return handleStreamResponse(response, onStream)
    }

    // 处理普通响应
    const data = await response.json()
    return {
      content: data.choices[0]?.message?.content || '',
      usage: data.usage,
    }
  } catch (error) {
    console.error('AI 请求失败:', error)
    throw error
  }
}

/**
 * 处理流式响应
 */
async function handleStreamResponse(
  response: Response,
  onStream: (chunk: StreamChunk) => void
): Promise<AIResponse> {
  const reader = response.body?.getReader()
  if (!reader) {
    throw new Error('无法读取响应流')
  }

  const decoder = new TextDecoder()
  let content = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value, { stream: true })
      const lines = chunk.split('\n')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') {
            onStream({ content: '', done: true })
            return { content }
          }

          try {
            const parsed = JSON.parse(data)
            const delta = parsed.choices[0]?.delta?.content || ''
            content += delta
            onStream({ content: delta, done: false })
          } catch (e) {
            // 忽略解析错误
          }
        }
      }
    }
  } finally {
    reader.releaseLock()
  }

  return { content }
}

/**
 * 简单文本生成（非流式）
 */
export async function generateText(
  config: AIModelConfig,
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const messages: ChatCompletionMessage[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

  const response = await chatCompletion(config, { messages })
  return response.content
}

/**
 * 流式文本生成
 */
export async function generateTextStream(
  config: AIModelConfig,
  prompt: string,
  onChunk: (chunk: string, done: boolean) => void,
  systemPrompt?: string
): Promise<void> {
  const messages: ChatCompletionMessage[] = []

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt })
  }

  messages.push({ role: 'user', content: prompt })

  await chatCompletion(config, {
    messages,
    stream: true,
    onStream: (chunk) => {
      onChunk(chunk.content, chunk.done)
    },
  })
}

/**
 * 解析 JSON 响应
 */
export async function generateJSON<T>(
  config: AIModelConfig,
  prompt: string,
  systemPrompt?: string
): Promise<T> {
  const content = await generateText(config, prompt, systemPrompt)

  // 尝试提取 JSON 内容
  const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                    content.match(/\{[\s\S]*\}/)

  const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : content

  try {
    return JSON.parse(jsonStr.trim())
  } catch (e) {
    console.error('JSON 解析失败:', e)
    console.error('原始内容:', content)
    throw new Error('无法解析 AI 返回的 JSON 数据')
  }
}
