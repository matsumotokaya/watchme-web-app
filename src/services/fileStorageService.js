import { handleApiError, ERROR_CATEGORIES } from '../utils/errorHandler';

// APIエンドポイントのベースURLを動的に取得
const getApiBaseUrl = () => {
  // 開発環境では現在のホスト名を使用
  if (import.meta.env.DEV) {
    const hostname = window.location.hostname;
    const apiUrl = `http://${hostname}:3001/api`;
    console.log('API Base URL:', apiUrl);
    return apiUrl;
  }
  // 本番環境では現在のホスト名を使用
  const hostname = window.location.hostname;
  const apiUrl = `http://${hostname}:3001/api`;
  console.log('API Base URL (Production):', apiUrl);
  return apiUrl;
};

const API_BASE_URL = getApiBaseUrl();

/**
 * ユーザーディレクトリを作成する
 * @param {string} userId ユーザーID
 * @returns {Promise<Object>} APIレスポンス
 */
export const createUserDirectory = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      const apiError = await handleApiError(response, `/users/${userId}/create`);
      throw apiError;
    }
    
    return await response.json();
  } catch (error) {
    if (error.name === 'WatchMeError') {
      throw error;
    }
    const handledError = await handleApiError(error, `/users/${userId}/create`);
    throw handledError;
  }
};

/**
 * 特定のデータタイプを指定して日ごとのデータを保存する
 * @param {string} userId ユーザーID
 * @param {string} date 日付文字列（YYYY-MM-DD形式）
 * @param {string} dataType データタイプ（emotion-timeline, event-logs, emotion-distribution）
 * @param {Object|Array} data 保存するデータ
 * @param {boolean} append 既存のデータに追記するかどうか
 * @returns {Promise<Object>} APIレスポンス
 */
export const saveLogData = async (userId, date, dataType, data, append = false) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/logs/${date}/${dataType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data, append }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('データ保存エラー:', error);
    throw error;
  }
};

/**
 * 指定した日付のすべてのデータを取得する
 * @param {string} userId ユーザーID
 * @param {string} date 日付文字列（YYYY-MM-DD形式）
 * @returns {Promise<Object>} 取得したデータ（全データタイプ含む）
 */
export const getAllLogData = async (userId, date) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/logs/${date}`);
    
    if (!response.ok) {
      const apiError = await handleApiError(response, `/users/${userId}/logs/${date}`);
      throw apiError;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      const apiError = await handleApiError(
        new Error(result.error || '指定されたログデータの取得に失敗しました'),
        `/users/${userId}/logs/${date}`
      );
      throw apiError;
    }
    
    return result.data;
  } catch (error) {
    if (error.name === 'WatchMeError') {
      throw error;
    }
    const handledError = await handleApiError(error, `/users/${userId}/logs/${date}`);
    throw handledError;
  }
};

/**
 * 指定した日付の特定データタイプのデータを取得する
 * @param {string} userId ユーザーID
 * @param {string} date 日付文字列（YYYY-MM-DD形式）
 * @param {string} dataType データタイプ
 * @returns {Promise<Object>} 取得したデータ
 */
export const getLogData = async (userId, date, dataType) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/logs/${date}/${dataType}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '指定されたログデータの取得に失敗しました');
    }
    
    return result.data;
  } catch (error) {
    console.error('データ取得エラー:', error);
    throw error;
  }
};

/**
 * ユーザーのログ一覧を取得する
 * @param {string} userId ユーザーID
 * @returns {Promise<Array<string>>} 日付文字列の配列
 */
export const getUserLogs = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/logs`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'ログ一覧の取得に失敗しました');
    }
    
    return result.logs;
  } catch (error) {
    console.error('ログ一覧取得エラー:', error);
    throw error;
  }
};

/**
 * 特定の日付のログに含まれるデータタイプ一覧を取得する
 * @param {string} userId ユーザーID
 * @param {string} date 日付文字列（YYYY-MM-DD形式）
 * @returns {Promise<Array<string>>} データタイプの配列
 */
export const getLogDataTypes = async (userId, date) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/logs/${date}/types`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'データタイプ一覧の取得に失敗しました');
    }
    
    return result.dataTypes;
  } catch (error) {
    console.error('データタイプ一覧取得エラー:', error);
    throw error;
  }
};

/**
 * 月次データを取得する
 * @param {string} userId ユーザーID
 * @param {number} year 年
 * @param {number} month 月
 * @returns {Promise<Object>} 月次データ（日付をキーとしたオブジェクト）
 */
export const getMonthlyData = async (userId, year, month) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/logs/monthly/${year}/${month}`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '月次データの取得に失敗しました');
    }
    
    return result.monthlyData;
  } catch (error) {
    console.error('月次データ取得エラー:', error);
    throw error;
  }
};

/**
 * 各グラフ専用のデータ取得関数
 */

/**
 * 感情タイムラインデータを取得する
 * @param {string} userId ユーザーID
 * @param {string} date 日付文字列（YYYY-MM-DD形式）
 * @returns {Promise<Object>} 感情タイムラインデータ
 */
export const getEmotionTimelineData = async (userId, date) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/logs/${date}/emotion-timeline`);
    
    if (!response.ok) {
      const apiError = await handleApiError(response, `/users/${userId}/logs/${date}/emotion-timeline`);
      throw apiError;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      const apiError = await handleApiError(
        new Error(result.error || '感情タイムラインデータの取得に失敗しました'),
        `/users/${userId}/logs/${date}/emotion-timeline`
      );
      throw apiError;
    }
    
    return result.data;
  } catch (error) {
    if (error.name === 'WatchMeError') {
      throw error;
    }
    const handledError = await handleApiError(error, `/users/${userId}/logs/${date}/emotion-timeline`);
    throw handledError;
  }
};

/**
 * 行動ログデータを取得する
 * @param {string} userId ユーザーID
 * @param {string} date 日付文字列（YYYY-MM-DD形式）
 * @returns {Promise<Object>} 行動ログデータ
 */
export const getEventLogsData = async (userId, date) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/logs/${date}/event-logs`);
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || '行動ログデータの取得に失敗しました');
    }
    
    return result.data;
  } catch (error) {
    console.error('行動ログデータ取得エラー:', error);
    throw error;
  }
};

/**
 * 感情分布データを取得する - 🗑️ 削除予定: 使用されていない感情分布API
 * @param {string} userId ユーザーID
 * @param {string} date 日付文字列（YYYY-MM-DD形式）
 * @returns {Promise<Object>} 感情分布データ
 */
// export const getEmotionDistributionData = async (userId, date) => {
//   try {
//     const response = await fetch(`${API_BASE_URL}/users/${userId}/logs/${date}/emotion-distribution`);
//     const result = await response.json();
//     
//     if (!result.success) {
//       throw new Error(result.error || '感情分布データの取得に失敗しました');
//     }
//     
//     return result.data;
//   } catch (error) {
//     console.error('感情分布データ取得エラー:', error);
//     throw error;
//   }
// };

/**
 * ===== ユーザー管理API =====
 */

/**
 * 全ユーザーの一覧を取得する
 * @returns {Promise<Array<Object>>} ユーザーの配列
 */
export const getAllUsers = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`);
    
    if (!response.ok) {
      const apiError = await handleApiError(response, '/users');
      throw apiError;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      const apiError = await handleApiError(
        new Error(result.error || 'ユーザー一覧の取得に失敗しました'),
        '/users'
      );
      throw apiError;
    }
    
    return result.users;
  } catch (error) {
    if (error.name === 'WatchMeError') {
      throw error;
    }
    const handledError = await handleApiError(error, '/users');
    throw handledError;
  }
};

/**
 * 個別ユーザー情報を取得する
 * @param {string} userId ユーザーID
 * @returns {Promise<Object>} ユーザー情報
 */
export const getUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`);
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

/**
 * 新規ユーザーを作成する
 * @param {Object} userData ユーザーデータ
 * @returns {Promise<Object>} 作成されたユーザー情報
 */
export const createUser = async (userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'ユーザーの作成に失敗しました');
    }
    
    return result.user;
  } catch (error) {
    console.error('ユーザー作成エラー:', error);
    throw error;
  }
};

/**
 * ユーザー情報を更新する
 * @param {string} userId ユーザーID
 * @param {Object} userData 更新するユーザーデータ
 * @returns {Promise<Object>} 更新されたユーザー情報
 */
export const updateUser = async (userId, userData) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'ユーザー情報の更新に失敗しました');
    }
    
    return result.user;
  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    throw error;
  }
};

/**
 * ユーザーを削除する
 * @param {string} userId ユーザーID
 * @returns {Promise<Object>} 削除されたユーザー情報
 */
export const deleteUser = async (userId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'ユーザーの削除に失敗しました');
    }
    
    return result.user;
  } catch (error) {
    console.error('ユーザー削除エラー:', error);
    throw error;
  }
};

/**
 * SEDサマリーデータを取得する
 * @param {string} userId ユーザーID
 * @param {string} date 日付文字列（YYYY-MM-DD形式）
 * @returns {Promise<Object>} SEDサマリーデータ
 */
export const getSedSummaryData = async (userId, date) => {
  try {
    console.log(`SEDサマリーデータ取得: userId=${userId}, date=${date}`);
    
    // サーバーから統合されたログデータを取得
    const response = await fetch(`${API_BASE_URL}/users/${userId}/logs/${date}`);
    const result = await response.json();
    
    if (result.success && result.data && result.data['sed-summary']) {
      console.log('✅ サーバーからSEDサマリーデータを取得しました');
      return result.data['sed-summary'];
    } else {
      throw new Error('SEDサマリーデータが見つかりません');
    }
  } catch (error) {
    console.error('SEDサマリーデータ取得エラー:', error);
    throw error;
  }
};

/**
 * ===== ログ管理API =====
 */ 