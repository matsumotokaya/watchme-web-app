// データサービス統合モジュール
// 🚨 注意: fileStorageServiceは削除されました。
// 通知システムで使用される関数のみを提供します。

// APIエンドポイントのベースURLを動的に取得
const getApiBaseUrl = () => {
  if (import.meta.env.DEV) {
    const hostname = window.location.hostname;
    return `http://${hostname}:3001/api`;
  }
  const hostname = window.location.hostname;
  const port = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  const protocol = window.location.protocol;
  return port === '3001' ? `${protocol}//${hostname}:3001/api` : `${protocol}//${hostname}:3001/api`;
};

const API_BASE_URL = getApiBaseUrl();

// 🚨 通知システムで使用される関数のみを実装
// 他のグラフ関数は useVaultAPI フックで直接Supabaseを使用

// 全ユーザーの一覧を取得する（通知システムで使用）
export const getAllUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) {
      throw new Error('ユーザー一覧の取得に失敗しました');
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'ユーザー一覧の取得に失敗しました');
    }
    return result.users;
  } catch (error) {
    console.error('ユーザー一覧取得エラー:', error);
    throw error;
  }
};

// 個別ユーザー情報を取得する（通知システムで使用）
export const getUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
    if (!response.ok) {
      throw new Error('ユーザー情報の取得に失敗しました');
    }
    const result = await response.json();
    if (!result.success) {
      throw new Error(result.error || 'ユーザー情報の取得に失敗しました');
    }
    return result.user;
  } catch (error) {
    console.error('ユーザー取得エラー:', error);
    throw error;
  }
};

// 🚨 以下の関数は削除されました - useVaultAPI フックを使用してください
// - getAllLogData
// - getLogData  
// - getUserLogs
// - getLogDataTypes
// - getMonthlyData
// - getSedSummaryData
// - getEmotionTimelineData
// - getEventLogsData

 