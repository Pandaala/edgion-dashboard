import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    // 代理配置 - 解决开发环境跨域问题
    // Controller 模式: target → http://localhost:5800 (Controller Admin API)
    // Center 模式开发: 将 target 改为 http://localhost:5810 (Center API)
    // /api/v1/proxy/* 路径由 Center 服务处理，无需额外代理规则（前缀 /api 已覆盖）
    proxy: {
      '/api': {
        target: 'http://localhost:5810',
        changeOrigin: true,
      },
      '/health': {
        target: 'http://localhost:5810',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    // 生产环境构建优化
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'antd-vendor': ['antd'],
          'utils': ['axios', '@tanstack/react-query', 'zustand'],
          'reactflow': ['reactflow'],
        },
      },
    },
  },
})

