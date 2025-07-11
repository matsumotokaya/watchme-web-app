/**
 * 統一エラーハンドリングシステム
 * サーバー側で発生する様々なエラーを分類・処理・ログ出力する
 */

// エラーカテゴリの定義
const ERROR_CATEGORIES = {
  NETWORK: 'NETWORK',           // ネットワーク関連エラー
  DATABASE: 'DATABASE',         // データベース関連エラー
  VALIDATION: 'VALIDATION',     // バリデーションエラー
  AUTHENTICATION: 'AUTH',       // 認証関連エラー
  AUTHORIZATION: 'AUTHZ',       // 認可関連エラー
  EXTERNAL_API: 'EXTERNAL_API', // 外部API関連エラー
  FILE_SYSTEM: 'FILE_SYSTEM',   // ファイルシステム関連エラー
  PARSING: 'PARSING',           // データ解析エラー
  BUSINESS_LOGIC: 'BUSINESS',   // ビジネスロジックエラー
  SYSTEM: 'SYSTEM'              // システムエラー
};

// エラーレベルの定義
const ERROR_LEVELS = {
  CRITICAL: 'CRITICAL',  // システム停止レベル
  ERROR: 'ERROR',        // エラーレベル
  WARNING: 'WARNING',    // 警告レベル
  INFO: 'INFO'          // 情報レベル
};

// HTTPステータスコードとエラー情報のマッピング
const HTTP_ERROR_MAP = {
  400: {
    category: ERROR_CATEGORIES.VALIDATION,
    level: ERROR_LEVELS.WARNING,
    clientMessage: 'リクエストの内容に問題があります。入力内容を確認してください。',
    logMessage: 'Bad Request - クライアントからの不正なリクエスト'
  },
  401: {
    category: ERROR_CATEGORIES.AUTHENTICATION,
    level: ERROR_LEVELS.WARNING,
    clientMessage: '認証が必要です。ログインしてください。',
    logMessage: 'Unauthorized - 認証が必要'
  },
  403: {
    category: ERROR_CATEGORIES.AUTHORIZATION,
    level: ERROR_LEVELS.WARNING,
    clientMessage: 'このリソースにアクセスする権限がありません。',
    logMessage: 'Forbidden - アクセス権限なし'
  },
  404: {
    category: ERROR_CATEGORIES.EXTERNAL_API,
    level: ERROR_LEVELS.INFO,
    clientMessage: 'お探しのデータが見つかりませんでした。',
    logMessage: 'Not Found - リソースが存在しません'
  },
  422: {
    category: ERROR_CATEGORIES.VALIDATION,
    level: ERROR_LEVELS.WARNING,
    clientMessage: 'データの形式が正しくありません。',
    logMessage: 'Unprocessable Entity - データ形式エラー'
  },
  429: {
    category: ERROR_CATEGORIES.EXTERNAL_API,
    level: ERROR_LEVELS.WARNING,
    clientMessage: 'リクエストが多すぎます。しばらく時間をおいてからお試しください。',
    logMessage: 'Too Many Requests - レート制限'
  },
  500: {
    category: ERROR_CATEGORIES.SYSTEM,
    level: ERROR_LEVELS.ERROR,
    clientMessage: 'サーバー内部でエラーが発生しました。しばらく時間をおいてからお試しください。',
    logMessage: 'Internal Server Error - サーバー内部エラー'
  },
  502: {
    category: ERROR_CATEGORIES.EXTERNAL_API,
    level: ERROR_LEVELS.ERROR,
    clientMessage: '外部サービスとの通信でエラーが発生しました。',
    logMessage: 'Bad Gateway - 外部サービスエラー'
  },
  503: {
    category: ERROR_CATEGORIES.EXTERNAL_API,
    level: ERROR_LEVELS.ERROR,
    clientMessage: 'サービスが一時的に利用できません。しばらく時間をおいてからお試しください。',
    logMessage: 'Service Unavailable - サービス利用不可'
  },
  504: {
    category: ERROR_CATEGORIES.NETWORK,
    level: ERROR_LEVELS.ERROR,
    clientMessage: 'リクエストがタイムアウトしました。',
    logMessage: 'Gateway Timeout - タイムアウト'
  }
};

// エラーの詳細分析
const analyzeError = (error, context = {}) => {
  const analysis = {
    category: ERROR_CATEGORIES.SYSTEM,
    level: ERROR_LEVELS.ERROR,
    statusCode: 500,
    clientMessage: 'エラーが発生しました。',
    logMessage: 'Unknown error',
    originalError: error,
    context,
    timestamp: new Date().toISOString(),
    stack: error?.stack
  };

  // HTTPエラーの場合
  if (error.response?.status) {
    const statusCode = error.response.status;
    const errorInfo = HTTP_ERROR_MAP[statusCode];
    if (errorInfo) {
      analysis.category = errorInfo.category;
      analysis.level = errorInfo.level;
      analysis.statusCode = statusCode;
      analysis.clientMessage = errorInfo.clientMessage;
      analysis.logMessage = errorInfo.logMessage;
    }
  }

  // Supabaseエラーの場合
  if (error.code) {
    analysis.category = ERROR_CATEGORIES.DATABASE;
    if (error.code === 'PGRST116') {
      analysis.statusCode = 404;
      analysis.level = ERROR_LEVELS.INFO;
      analysis.clientMessage = 'データが見つかりませんでした。';
      analysis.logMessage = 'Supabase - データなし (PGRST116)';
    } else if (error.code.startsWith('23')) { // PostgreSQL制約エラー
      analysis.statusCode = 422;
      analysis.level = ERROR_LEVELS.WARNING;
      analysis.clientMessage = 'データの制約に違反しています。';
      analysis.logMessage = `Supabase - 制約エラー (${error.code})`;
    }
  }

  // ネットワークエラーの場合
  if (error.message?.includes('fetch') || error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
    analysis.category = ERROR_CATEGORIES.NETWORK;
    analysis.statusCode = 503;
    analysis.level = ERROR_LEVELS.ERROR;
    analysis.clientMessage = 'ネットワークエラーが発生しました。接続を確認してください。';
    analysis.logMessage = `ネットワークエラー: ${error.message}`;
  }

  // ファイルシステムエラーの場合
  if (error.code === 'ENOENT' || error.code === 'EACCES' || error.code === 'EMFILE') {
    analysis.category = ERROR_CATEGORIES.FILE_SYSTEM;
    analysis.statusCode = 500;
    analysis.level = ERROR_LEVELS.ERROR;
    analysis.clientMessage = 'ファイル処理でエラーが発生しました。';
    analysis.logMessage = `ファイルシステムエラー: ${error.code} - ${error.message}`;
  }

  // JSONパースエラーの場合
  if (error instanceof SyntaxError && error.message.includes('JSON')) {
    analysis.category = ERROR_CATEGORIES.PARSING;
    analysis.statusCode = 422;
    analysis.level = ERROR_LEVELS.WARNING;
    analysis.clientMessage = 'データの形式が正しくありません。';
    analysis.logMessage = `JSON解析エラー: ${error.message}`;
  }

  return analysis;
};

// ログレベル別の出力関数
const logError = (analysis) => {
  const { category, level, logMessage, context, timestamp, originalError } = analysis;
  
  const logData = {
    timestamp,
    level,
    category,
    message: logMessage,
    context,
    ...(level === ERROR_LEVELS.CRITICAL || level === ERROR_LEVELS.ERROR ? { stack: originalError?.stack } : {})
  };

  switch (level) {
    case ERROR_LEVELS.CRITICAL:
      console.error('🚨 [CRITICAL]', JSON.stringify(logData, null, 2));
      break;
    case ERROR_LEVELS.ERROR:
      console.error('❌ [ERROR]', JSON.stringify(logData, null, 2));
      break;
    case ERROR_LEVELS.WARNING:
      console.warn('⚠️  [WARNING]', JSON.stringify(logData, null, 2));
      break;
    case ERROR_LEVELS.INFO:
      console.log('ℹ️  [INFO]', JSON.stringify(logData, null, 2));
      break;
    default:
      console.log('📝 [LOG]', JSON.stringify(logData, null, 2));
  }
};

// クライアント向けレスポンス生成
const createClientResponse = (analysis) => {
  const { statusCode, clientMessage, category, timestamp } = analysis;
  
  const baseResponse = {
    success: false,
    error: clientMessage,
    category,
    timestamp
  };

  // 開発環境では詳細情報を追加
  if (process.env.NODE_ENV === 'development') {
    baseResponse.debug = {
      originalMessage: analysis.originalError?.message,
      context: analysis.context
    };
  }

  return { statusCode, response: baseResponse };
};

// 統一エラーハンドラー
const handleError = (error, context = {}) => {
  const analysis = analyzeError(error, context);
  logError(analysis);
  return createClientResponse(analysis);
};

// Express用エラーハンドラーミドルウェア
const expressErrorHandler = (error, req, res, next) => {
  const context = {
    method: req.method,
    url: req.url,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  };
  
  const { statusCode, response } = handleError(error, context);
  res.status(statusCode).json(response);
};

// 非同期ラッパー（try-catchを自動化）
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  ERROR_CATEGORIES,
  ERROR_LEVELS,
  analyzeError,
  logError,
  handleError,
  createClientResponse,
  expressErrorHandler,
  asyncHandler
};