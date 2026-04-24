import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import { createProxyMiddleware } from 'http-proxy-middleware'

export default defineConfig({
  plugins: [
    vue(),
    {
      name: 'configure-server',
      configureServer(server) {
        // 自定义代理中间件，解决开发环境 CORS 问题
        server.middlewares.use('/proxy', (req, res, next) => {
          const targetUrl = req.headers['x-target-url'] as string

          if (!targetUrl) {
            res.statusCode = 400
            res.end('Missing x-target-url header')
            return
          }

          console.log('[Proxy] Forwarding to:', targetUrl)

          const proxy = createProxyMiddleware({
            target: targetUrl,
            changeOrigin: true,
            pathRewrite: { '^/proxy': '' },
            onError: (err, req, res) => {
              console.error('[Proxy Error]:', err.message)
              res.statusCode = 500
              res.end(`Proxy Error: ${err.message}`)
            },
          })

          proxy(req, res, next)
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
