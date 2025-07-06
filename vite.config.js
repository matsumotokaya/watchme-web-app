import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // 開発環境では '/'、プロダクション環境では '/product/dist/' を使用
  const base = command === 'serve' ? '/' : '/product/dist/';
  
  return {
    base,
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/api': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        },
        '/avatars': {
          target: 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      rollupOptions: {
        // アバター画像を明示的にビルドに含める
        external: [],
      }
    }
  }
})
