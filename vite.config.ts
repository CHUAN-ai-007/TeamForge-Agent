import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'api-proxy',
      configureServer(server) {
        server.middlewares.use('/api/proxy', async (req, res, next) => {
          const targetUrl = req.headers['x-target-url'] as string

          if (!targetUrl) {
            res.statusCode = 400
            res.end(JSON.stringify({ error: 'Missing x-target-url header' }))
            return
          }

          try {
            const url = `${targetUrl}/chat/completions`
            console.log('[Proxy]', req.method, '->', url)

            // 读取请求体
            let body = ''
            for await (const chunk of req) {
              body += chunk
            }

            // 转发请求
            const response = await fetch(url, {
              method: req.method,
              headers: {
                'Content-Type': req.headers['content-type'] || 'application/json',
                'Authorization': req.headers['authorization'] || '',
              },
              body: body || undefined,
            })

            // 返回响应
            res.statusCode = response.status
            const responseBody = await response.text()
            res.end(responseBody)

          } catch (error) {
            console.error('[Proxy Error]', error)
            res.statusCode = 500
            res.end(JSON.stringify({
              error: 'Proxy Error',
              message: error instanceof Error ? error.message : String(error)
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
