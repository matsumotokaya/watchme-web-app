/**
 * 統一エラーハンドリングユーティリティ
 * プロジェクト全体で一貫したエラー処理を提供
 */

/**
 * エラーレベル定義
 */
export const ERROR_LEVELS = {
  DEBUG: 'DEBUG',
  INFO: 'INFO', 
  WARN: 'WARN',
  ERROR: 'ERROR',
  FATAL: 'FATAL'
};

/**
 * エラーカテゴリ定義
 */
export const ERROR_CATEGORIES = {
  API: 'API',
  VALIDATION: 'VALIDATION',
  NETWORK: 'NETWORK',
  FILE_SYSTEM: 'FILE_SYSTEM',
  DATA_PROCESSING: 'DATA_PROCESSING',
  COMPONENT: 'COMPONENT',
  AUTHENTICATION: 'AUTHENTICATION'
};

/**
 * 共通エラークラス
 */
export class WatchMeError extends Error {
  constructor(message, category = ERROR_CATEGORIES.COMPONENT, level = ERROR_LEVELS.ERROR, context = {}) {
    super(message);
    this.name = 'WatchMeError';
    this.category = category;
    this.level = level;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
}

/**
 * 統一エラーハンドラー
 * @param {Error|string} error - エラーオブジェクトまたはメッセージ
 * @param {string} category - エラーカテゴリ
 * @param {string} context - エラー発生コンテキスト
 * @param {Object} options - オプション設定
 * @returns {WatchMeError} - 標準化されたエラーオブジェクト
 */
export const handleError = (error, category = ERROR_CATEGORIES.COMPONENT, context = '', options = {}) => {
  const {
    level = ERROR_LEVELS.ERROR,
    shouldLog = true,
    shouldThrow = false,
    userMessage = null,
    additionalContext = {}
  } = options;

  // エラーオブジェクトの標準化
  let standardError;
  if (error instanceof WatchMeError) {
    standardError = error;
  } else if (error instanceof Error) {
    standardError = new WatchMeError(
      error.message,
      category,
      level,
      { originalError: error, context, ...additionalContext }
    );
  } else {
    standardError = new WatchMeError(
      String(error),
      category,
      level,
      { context, ...additionalContext }
    );
  }

  // ログ出力（環境に応じて制御）
  if (shouldLog && shouldLogLevel(level)) {
    logError(standardError, context);
  }

  // ユーザー向けメッセージの設定
  if (userMessage) {
    standardError.userMessage = userMessage;
  }

  // エラーをスローするかどうか
  if (shouldThrow) {
    throw standardError;
  }

  return standardError;
};

/**
 * ログレベルに応じた出力判定
 * @param {string} level - エラーレベル
 * @returns {boolean} - ログ出力すべきかどうか
 */
const shouldLogLevel = (level) => {
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    return true; // 開発環境では全てのレベルを出力
  }
  
  // 本番環境ではWARN以上のみ出力
  return [ERROR_LEVELS.WARN, ERROR_LEVELS.ERROR, ERROR_LEVELS.FATAL].includes(level);
};

/**
 * エラーログ出力
 * @param {WatchMeError} error - エラーオブジェクト
 * @param {string} context - コンテキスト
 */
const logError = (error, context) => {
  const logMessage = `[${error.category}] ${context ? `(${context}) ` : ''}${error.message}`;
  
  switch (error.level) {
    case ERROR_LEVELS.DEBUG:
      console.debug('🐛', logMessage, error.context);
      break;
    case ERROR_LEVELS.INFO:
      console.info('ℹ️', logMessage, error.context);
      break;
    case ERROR_LEVELS.WARN:
      console.warn('⚠️', logMessage, error.context);
      break;
    case ERROR_LEVELS.ERROR:
      console.error('❌', logMessage, error.context);
      break;
    case ERROR_LEVELS.FATAL:
      console.error('💀', logMessage, error.context);
      break;
    default:
      console.log('📝', logMessage, error.context);
  }
};

/**
 * APIエラー専用ハンドラー
 * @param {Response|Error} error - APIエラーまたはFetchエラー
 * @param {string} endpoint - APIエンドポイント
 * @param {Object} options - オプション設定
 * @returns {WatchMeError} - 標準化されたAPIエラー
 */
export const handleApiError = async (error, endpoint = '', options = {}) => {
  let errorMessage = 'APIエラーが発生しました';
  let statusCode = null;
  let responseData = null;

  try {
    if (error instanceof Response) {
      statusCode = error.status;
      
      // HTTPステータスコードに応じたメッセージ
      switch (statusCode) {
        case 400:
          errorMessage = 'リクエストが無効です';
          break;
        case 401:
          errorMessage = '認証が必要です';
          break;
        case 403:
          errorMessage = 'アクセス権限がありません';
          break;
        case 404:
          errorMessage = 'データが見つかりません';
          break;
        case 500:
          errorMessage = 'サーバー内部エラーが発生しました';
          break;
        case 503:
          errorMessage = 'サービスが一時的に利用できません';
          break;
        default:
          errorMessage = `HTTPエラー (${statusCode})`;
      }

      // レスポンスボディの取得を試行
      try {
        const contentType = error.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          responseData = await error.json();
          if (responseData.detail) {
            errorMessage = responseData.detail;
          }
        } else {
          responseData = await error.text();
        }
      } catch (parseError) {
        // レスポンス解析に失敗した場合は無視
      }
    } else if (error instanceof Error) {
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        errorMessage = 'ネットワーク接続エラーが発生しました';
      } else {
        errorMessage = error.message;
      }
    }
  } catch (processingError) {
    errorMessage = 'エラー処理中に問題が発生しました';
  }

  return handleError(
    errorMessage,
    ERROR_CATEGORIES.API,
    `API: ${endpoint}`,
    {
      level: statusCode === 404 ? ERROR_LEVELS.WARN : ERROR_LEVELS.ERROR,
      shouldLog: true,
      shouldThrow: false,
      additionalContext: {
        endpoint,
        statusCode,
        responseData,
        originalError: error
      },
      ...options
    }
  );
};

/**
 * データ検証エラー専用ハンドラー
 * @param {string} field - 検証に失敗したフィールド名
 * @param {*} value - 検証に失敗した値
 * @param {string} reason - 失敗理由
 * @param {Object} options - オプション設定
 * @returns {WatchMeError} - 標準化された検証エラー
 */
export const handleValidationError = (field, value, reason, options = {}) => {
  const errorMessage = `データ検証エラー: ${field} (${reason})`;
  
  return handleError(
    errorMessage,
    ERROR_CATEGORIES.VALIDATION,
    'データ検証',
    {
      level: ERROR_LEVELS.WARN,
      shouldLog: true,
      shouldThrow: false,
      additionalContext: {
        field,
        value,
        reason
      },
      ...options
    }
  );
};

/**
 * 非同期関数のエラーハンドリングラッパー
 * @param {Function} asyncFunction - ラップする非同期関数
 * @param {string} context - 実行コンテキスト
 * @param {Object} options - エラーハンドリングオプション
 * @returns {Function} - エラーハンドリングが追加された関数
 */
export const withErrorHandling = (asyncFunction, context, options = {}) => {
  return async (...args) => {
    try {
      return await asyncFunction(...args);
    } catch (error) {
      const handledError = handleError(error, ERROR_CATEGORIES.COMPONENT, context, {
        shouldLog: true,
        shouldThrow: false,
        ...options
      });
      
      // エラー状態を返すか、デフォルト値を返すかを選択
      if (options.returnDefaultOnError) {
        return options.defaultValue || null;
      }
      
      throw handledError;
    }
  };
};

/**
 * React用エラーハンドリングフック
 * @param {string} componentName - コンポーネント名
 * @returns {Function} - エラーハンドラー関数
 */
export const useErrorHandler = (componentName) => {
  return (error, errorInfo = {}) => {
    return handleError(
      error,
      ERROR_CATEGORIES.COMPONENT,
      `React: ${componentName}`,
      {
        level: ERROR_LEVELS.ERROR,
        shouldLog: true,
        shouldThrow: false,
        additionalContext: errorInfo
      }
    );
  };
};

/**
 * ユーザー向けエラーメッセージ生成
 * @param {WatchMeError} error - エラーオブジェクト
 * @returns {string} - ユーザー向けメッセージ
 */
export const getUserFriendlyMessage = (error) => {
  if (error.userMessage) {
    return error.userMessage;
  }

  // カテゴリに応じたデフォルトメッセージ
  switch (error.category) {
    case ERROR_CATEGORIES.API:
      return 'データの取得に失敗しました。しばらく時間をおいて再試行してください。';
    case ERROR_CATEGORIES.VALIDATION:
      return 'データの形式に問題があります。';
    case ERROR_CATEGORIES.NETWORK:
      return 'ネットワーク接続に問題があります。接続を確認してください。';
    case ERROR_CATEGORIES.FILE_SYSTEM:
      return 'ファイルの操作に失敗しました。';
    case ERROR_CATEGORIES.DATA_PROCESSING:
      return 'データの処理中にエラーが発生しました。';
    default:
      return 'エラーが発生しました。しばらく時間をおいて再試行してください。';
  }
};

/**
 * エラー統計の収集（将来の分析用）
 */
export class ErrorCollector {
  constructor() {
    this.errors = [];
    this.maxErrors = 100; // メモリ使用量制限
  }

  collect(error) {
    if (error instanceof WatchMeError) {
      this.errors.unshift({
        category: error.category,
        level: error.level,
        message: error.message,
        timestamp: error.timestamp,
        context: error.context
      });

      // 古いエラーを削除
      if (this.errors.length > this.maxErrors) {
        this.errors = this.errors.slice(0, this.maxErrors);
      }
    }
  }

  getStats() {
    const stats = {
      total: this.errors.length,
      byCategory: {},
      byLevel: {},
      recent: this.errors.slice(0, 10)
    };

    this.errors.forEach(error => {
      stats.byCategory[error.category] = (stats.byCategory[error.category] || 0) + 1;
      stats.byLevel[error.level] = (stats.byLevel[error.level] || 0) + 1;
    });

    return stats;
  }

  clear() {
    this.errors = [];
  }
}

// グローバルエラーコレクター（オプション）
export const globalErrorCollector = new ErrorCollector();