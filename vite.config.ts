import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { readFileSync } from 'fs'

// 读取 package.json 版本号
const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'))

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
  },
  plugins: [
    vue(),
    {
      name: 'api-proxy',
      configureServer(server) {
        server.middlewares.use('/api/proxy', async (req, res) => {
          const targetUrl = req.headers['x-target-url'] as string
          const authHeader = req.headers['authorization'] as string

          if (!targetUrl) {
            res.statusCode = 400
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Missing x-target-url header' }))
            return
          }

          try {
            const url = `${targetUrl}/chat/completions`
            console.log('[Proxy]', req.method, '->', url)
            console.log('[Proxy] Auth present:', authHeader ? 'Yes' : 'No')

            // 读取请求体
            let body = ''
            for await (const chunk of req) {
              body += chunk
            }

            // 解析并打印请求体用于调试
            try {
              const bodyObj = JSON.parse(body)
              console.log('[Proxy] Request body:', { model: bodyObj.model, messages_count: bodyObj.messages?.length })
            } catch {
              console.log('[Proxy] Request body (raw):', body)
            }

            // 转发请求
            const fetchOptions: RequestInit = {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader || '',
              },
              body: body,
            }

            console.log('[Proxy] Fetching...')
            const response = await fetch(url, fetchOptions)
            console.log('[Proxy] Response status:', response.status)

            // 设置响应头
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = response.status

            // 返回响应
            const responseBody = await response.text()
            console.log('[Proxy] Response body length:', responseBody.length)
            res.end(responseBody)

          } catch (error) {
            console.error('[Proxy Error]', error)
            res.setHeader('Content-Type', 'application/json')
            res.statusCode = 500
            res.end(JSON.stringify({
              error: 'Proxy Error',
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined
            }))
          }
        })
      }
    }
  ],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
