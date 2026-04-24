import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// 获取目标 URL 从请求头
function getTargetFromHeader(req: any): string | null {
  return req.headers['x-target-url'] || null
}

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'configure-server',
      configureServer(server) {
        // 自定义代理中间件，解决开发环境 CORS 问题
        server.middlewares.use('/proxy', async (req, res, next) => {
          const targetUrl = getTargetFromHeader(req)

          if (!targetUrl) {
            res.statusCode = 400
            res.end('Missing x-target-url header')
            return
          }

          try {
            const target = `${targetUrl}/chat/completions`
            console.log('[Proxy] Forwarding to:', target)
            console.log('[Proxy] Method:', req.method)
            console.log('[Proxy] Headers:', JSON.stringify(req.headers))

            // 构建转发请求
            const fetchHeaders: Record<string, string> = {
              'Content-Type': req.headers['content-type'] || 'application/json',
              'Authorization': req.headers['authorization'] || '',
            }

            // 获取请求体
            let body = ''
            req.on('data', (chunk: Buffer) => {
              body += chunk.toString()
            })

            await new Promise<void>((resolve) => {
              req.on('end', resolve)
            })

            console.log('[Proxy] Request body:', body)

            // 发送请求到目标服务器
            const response = await fetch(target, {
              method: req.method,
              headers: fetchHeaders,
              body: body || undefined,
            })

            console.log('[Proxy] Response status:', response.status)

            // 复制响应头
            res.statusCode = response.status
            response.headers.forEach((value, key) => {
              res.setHeader(key, value)
            })

            // 添加 CORS 头
            res.setHeader('Access-Control-Allow-Origin', '*')
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

            // 发送响应体
            const responseBody = await response.text()
            res.end(responseBody)

          } catch (error) {
            console.error('[Proxy Error]:', error)
            res.statusCode = 500
            res.end(JSON.stringify({
              error: 'Proxy Error',
              message: error instanceof Error ? error.message : String(error)
            }))
          }
        })
      },
    },
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
