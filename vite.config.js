import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { getValidatedConfig, logConfigInfo } from './config/environments.js'

// https://vite.dev/config/
export default defineConfig(({ command, mode }) => {
  // 環境変数を読み込み
  const env = loadEnv(mode, process.cwd(), '');
  process.env = { ...process.env, ...env };
  
  // 環境別設定を取得
  const config = getValidatedConfig();
  
  // 開発環境での設定情報表示
  if (command === 'serve') {
    logConfigInfo(config);
  }
  
  return {
    base: config.PATHS.base,
    plugins: [react()],
    server: {
      port: config.VITE_PORT,
      host: true, // 外部からのアクセスを許可
      proxy: {
        [config.PROXY.apiPath]: {
          target: config.PROXY.target,
          changeOrigin: true,
          secure: false,
          configure: (proxy, _options) => {
            proxy.on('error', (err, _req, _res) => {
              console.log('プロキシエラー:', err);
            });
          }
        },
        [config.PROXY.avatarsPath]: {
          target: config.PROXY.target,
          changeOrigin: true,
          secure: false,
        }
      }
    },
    build: {
      outDir: config.PATHS.staticDir,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          // 本番環境での最適化
          manualChunks: {
            vendor: ['react', 'react-dom'],
            charts: ['chart.js', 'react-chartjs-2'],
            ui: ['lucide-react', 'react-swipeable-views']
          }
        }
      }
    },
    // 環境変数を定義（フロントエンドで使用可能）
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '1.0.0'),
      __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
      __NODE_ENV__: JSON.stringify(config.NODE_ENV)
    }
  }
})
