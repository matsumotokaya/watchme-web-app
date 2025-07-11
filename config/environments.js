/**
 * 環境別設定の一元管理
 * vite.config.jsとserver.cjsで共有する設定
 */

// 環境変数からの設定読み込み
const getEnvConfig = () => {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const isDevelopment = nodeEnv === 'development';
  const isProduction = nodeEnv === 'production';
  const isTest = nodeEnv === 'test';

  return {
    // 環境情報
    NODE_ENV: nodeEnv,
    isDevelopment,
    isProduction,
    isTest,

    // ポート設定
    VITE_PORT: parseInt(process.env.VITE_PORT) || 5173,
    API_PORT: parseInt(process.env.PORT) || 3001,

    // パス設定（環境依存）
    PATHS: {
      // ベースパス（Vite用）
      base: isDevelopment ? '/' : (process.env.VITE_BASE_PATH || '/product/dist/'),
      
      // 静的ファイルディレクトリ
      staticDir: process.env.STATIC_DIST_DIR || 'dist',
      
      // アバターディレクトリ
      avatarsDir: process.env.AVATARS_DIR || 'public/avatars',
      
      // データディレクトリ
      dataDir: process.env.DATA_ROOT_DIR || 'data_accounts',
      
      // ユーザーファイル名
      usersFile: process.env.USERS_FILE_NAME || 'users.json',
    },

    // プロキシ設定
    PROXY: {
      target: `http://localhost:${parseInt(process.env.PORT) || 3001}`,
      apiPath: '/api',
      avatarsPath: '/avatars',
    },

    // サーバー設定
    SERVER: {
      jsonLimit: process.env.EXPRESS_JSON_LIMIT || '50mb',
      corsOrigin: isDevelopment 
        ? [`http://localhost:${parseInt(process.env.VITE_PORT) || 5173}`]
        : (process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['*']),
    },

    // Supabase設定
    SUPABASE: {
      url: process.env.VITE_SUPABASE_URL,
      anonKey: process.env.VITE_SUPABASE_ANON_KEY,
    },

    // データソース設定
    DATA_SOURCE: process.env.VITE_DATA_SOURCE || 'supabase',
  };
};

// 設定の検証
const validateEnvironmentConfig = (config) => {
  const errors = [];

  // 必須設定のチェック
  if (!config.SUPABASE.url) {
    errors.push('VITE_SUPABASE_URL が設定されていません');
  }
  if (!config.SUPABASE.anonKey) {
    errors.push('VITE_SUPABASE_ANON_KEY が設定されていません');
  }

  // ポート番号の検証
  if (isNaN(config.VITE_PORT) || config.VITE_PORT < 1 || config.VITE_PORT > 65535) {
    errors.push(`無効なViteポート番号: ${config.VITE_PORT}`);
  }
  if (isNaN(config.API_PORT) || config.API_PORT < 1 || config.API_PORT > 65535) {
    errors.push(`無効なAPIポート番号: ${config.API_PORT}`);
  }

  // データソース設定の検証
  if (!['supabase', 'vault'].includes(config.DATA_SOURCE)) {
    errors.push(`無効なデータソース: ${config.DATA_SOURCE} (supabase または vault である必要があります)`);
  }

  if (errors.length > 0) {
    console.error('❌ 環境設定エラーが検出されました:');
    errors.forEach(error => console.error(`  - ${error}`));
    console.error('\n.envファイルを確認してください。');
    throw new Error('環境設定の検証に失敗しました');
  }

  return config;
};

// 設定の取得と検証
export const getValidatedConfig = () => {
  const config = getEnvConfig();
  return validateEnvironmentConfig(config);
};

// 設定のログ出力（開発環境用）
export const logConfigInfo = (config) => {
  if (config.isDevelopment) {
    console.log('⚙️  環境別設定情報:');
    console.log(`  - 環境: ${config.NODE_ENV}`);
    console.log(`  - Viteポート: ${config.VITE_PORT}`);
    console.log(`  - APIポート: ${config.API_PORT}`);
    console.log(`  - ベースパス: ${config.PATHS.base}`);
    console.log(`  - データソース: ${config.DATA_SOURCE}`);
    console.log(`  - 静的ファイル: ${config.PATHS.staticDir}`);
    console.log(`  - アバター: ${config.PATHS.avatarsDir}`);
  }
};

// デフォルトエクスポート
export default getValidatedConfig;